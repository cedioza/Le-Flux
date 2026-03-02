import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { executeHeadlessFlow } from './engine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, 'data', 'flows.json');
const EXECUTIONS_FILE = path.join(__dirname, 'data', 'executions.json');
const SETTINGS_FILE = path.join(__dirname, 'data', 'settings.json');

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const upload = multer({ storage: multer.memoryStorage() });

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: { origin: '*' }
});

// Create data directory if it doesn't exist
if (!fs.existsSync(path.dirname(DATA_FILE))) {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
}
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ nodes: [], edges: [] }));
}
if (!fs.existsSync(EXECUTIONS_FILE)) {
    fs.writeFileSync(EXECUTIONS_FILE, JSON.stringify([]));
}
if (!fs.existsSync(SETTINGS_FILE)) {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify({}));
}

let isTestModeActive = false;
let testModeTimeout = null;
let activeTestWebhookId = null;

io.on('connection', (socket) => {
    console.log('[Socket] Client connected:', socket.id);

    socket.on('test_webhook', (data) => {
        const { webhookId } = data;
        console.log(`[Socket] Activando Modo Test para Webhook: ${webhookId}`);
        isTestModeActive = true;
        activeTestWebhookId = webhookId;

        if (testModeTimeout) clearTimeout(testModeTimeout);

        // 2 Minutes Timeout
        testModeTimeout = setTimeout(() => {
            console.log(`[Socket] Timeout alcanzado. Desactivando Modo Test para: ${webhookId}`);
            isTestModeActive = false;
            activeTestWebhookId = null;
            socket.emit('test_timeout', { webhookId });
        }, 120000);
    });

    socket.on('save_flow', (data) => {
        try {
            const { nodes, edges, credentials } = data;
            fs.writeFileSync(DATA_FILE, JSON.stringify({ nodes, edges }, null, 2));
            if (credentials) {
                fs.writeFileSync(SETTINGS_FILE, JSON.stringify(credentials, null, 2));
                console.log('[Storage] Settings/Credentials locales guardados (NoSQL File DB).');
            }
            console.log('[Storage] Flujo guardado correctamente para Producción Headless.');
            socket.emit('save_flow_success');
        } catch (error) {
            console.error('[Storage] Error al guardar flujo:', error);
            socket.emit('save_flow_error', { message: error.message });
        }
    });

    socket.on('disconnect', () => {
        console.log('[Socket] Client disconnected');
    });
});

// API Webhook Route
app.post('/api/webhook/:id', upload.any(), async (req, res) => {
    const { id } = req.params;
    let payload = req.body || {};

    // Subir Archivos a Cloudinary de forma asíncrona
    if (req.files && req.files.length > 0) {
        if (!payload.files) payload.files = {};

        const uploadPromises = req.files.map(file => {
            return new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    { resource_type: 'auto' },
                    (error, result) => {
                        if (error) {
                            console.error('[Cloudinary] Error subiendo archivo:', error);
                            // Fallback to base64 if cloudinary fails setup
                            const base64Str = file.buffer.toString('base64');
                            const dataUri = `data:${file.mimetype};base64,${base64Str}`;
                            resolve({ fieldname: file.fieldname, url: dataUri });
                        } else {
                            console.log(`[Webhook] Subido a Cloudinary: ${result.secure_url}`);
                            resolve({ fieldname: file.fieldname, url: result.secure_url });
                        }
                    }
                );
                stream.end(file.buffer);
            });
        });

        const uploadedFiles = await Promise.all(uploadPromises);
        uploadedFiles.forEach(f => {
            payload.files[f.fieldname] = f.url;
        });

        console.log(`[Webhook] Form-data procesado. ${req.files.length} archivo(s) subidos a Cloudinary.`);
    }

    console.log(`[Webhook] Peticion entrante para ID: ${id}`);

    // Si estamos en MODO TEST visual
    if (isTestModeActive && activeTestWebhookId === id) {
        console.log(`[Webhook] Modo Test Activo. Emitiendo a Frontend...`);
        io.emit('webhook_received', { webhookId: id, payload });
        return res.status(200).json({ status: 'success', mode: 'test', message: 'Payload transmitido a UI.' });
    }

    // Si NO estamos en test mode, ejecutamos en entorno Headless
    console.log(`[Webhook] Modo Produccion. Ejecutando Engine Headless...`);
    try {
        const rawData = fs.readFileSync(DATA_FILE, 'utf8');
        const { nodes, edges } = JSON.parse(rawData);

        // Invocamos al motor headless
        const execResult = await executeHeadlessFlow(id, payload, nodes, edges);

        // Guardar la Ejecucion en Historial
        const newExecution = {
            id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            webhookId: id,
            timestamp: new Date().toISOString(),
            success: execResult.success,
            latency: execResult.latency,
            nodesContext: execResult.nodesContext
        };

        const execData = fs.readFileSync(EXECUTIONS_FILE, 'utf8');
        const executions = JSON.parse(execData);
        executions.unshift(newExecution); // add to top
        // Limitar a últimos 200 logs
        const limitedExecutions = executions.slice(0, 200);
        fs.writeFileSync(EXECUTIONS_FILE, JSON.stringify(limitedExecutions, null, 2));

        // Notificar via WebSocket
        io.emit('new_execution', newExecution);

        // Si el motor guardó estado para un "responseNode", devolvemos esa info como API Response literal.
        const responseNode = nodes.find(n => n.type === 'responseNode');
        if (responseNode && execResult.nodesContext[responseNode.id]) {
            res.status(200).json(execResult.nodesContext[responseNode.id]);
        } else {
            res.status(200).json({ status: 'success', mode: 'headless', message: 'Flow ejecutado en background sin nodo Response activo.' });
        }
    } catch (error) {
        console.error('[Webhook] Error en Headless:', error);

        // Guardar el error también en Historial
        try {
            const errorExecution = {
                id: `exec_err_${Date.now()}`,
                webhookId: id,
                timestamp: new Date().toISOString(),
                success: false,
                latency: 0,
                nodesContext: { error: error.message }
            };
            const execData = fs.readFileSync(EXECUTIONS_FILE, 'utf8');
            const executions = JSON.parse(execData);
            executions.unshift(errorExecution);
            fs.writeFileSync(EXECUTIONS_FILE, JSON.stringify(executions.slice(0, 200), null, 2));
            io.emit('new_execution', errorExecution);
        } catch (e) { }

        res.status(500).json({ error: error.message });
    }
});

// API Get Executions Route
app.get('/api/executions', (req, res) => {
    try {
        const data = fs.readFileSync(EXECUTIONS_FILE, 'utf8');
        res.json(JSON.parse(data));
    } catch (err) {
        res.status(500).json({ error: 'Failed to read executions' });
    }
});

// En Producción (Dokploy): Servir estáticos de Vite
const distPath = path.join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    // Fallback estático para React Router si usas client-side routing
    app.get(/^(?!\/api).*/, (req, res) => {
        res.sendFile(path.join(__dirname, '../dist/index.html'));
    });
}

// Telegram Webhook Route
app.post('/api/telegram-webhook/:id', async (req, res) => {
    const { id } = req.params;
    const body = req.body || {};

    // Telegram usually sends updates in `message` or `edited_message`
    const msg = body.message || body.edited_message;

    // Create a normalized payload
    let payload = { raw: body };
    if (msg) {
        payload = {
            ...payload,
            chat_id: msg.chat?.id,
            text: msg.text || '',
            username: msg.from?.username || msg.from?.first_name || 'User',
            date: msg.date
        };
    }

    console.log(`[Telegram] Update recibido para ID: ${id} del chat ${payload.chat_id || 'unknown'}`);

    if (isTestModeActive && activeTestWebhookId === id) {
        console.log(`[Telegram] Modo Test Activo. Emitiendo a Frontend...`);
        io.emit('webhook_received', { webhookId: id, payload });
        return res.status(200).json({ status: 'ok', mode: 'test', emit: true });
    }

    try {
        const fileContent = fs.readFileSync(FLOW_FILE, 'utf8');
        const flows = JSON.parse(fileContent);

        let targetFlow = null;
        for (const flow of flows) {
            const hasHook = flow.nodes?.find(n => n.type === 'telegramTriggerNode' && n.id === id);
            if (hasHook) {
                targetFlow = flow;
                break;
            }
        }

        if (!targetFlow) {
            console.warn(`[Telegram] No se encontro flujo activo para Trigger ID: ${id}`);
            return res.status(404).json({ error: 'Webhook Endpoint Not Found or Inactive.' });
        }

        console.log(`[Telegram] Iniciando Background Engine para Flujo: ${targetFlow.name}`);

        executeHeadlessFlow(id, payload, targetFlow.nodes, targetFlow.edges)
            .then(result => console.log(`[Telegram] Ejecucion Background Finalizada OK.`))
            .catch(err => console.error(`[Telegram] Fallo en Ejecucion Background:`, err));

        return res.status(200).send('OK');

    } catch (err) {
        console.error('[Telegram] Error leyendo flujos localmente:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
    console.log(`🚀 Le Flux Backend Master corriendo en puerto ${PORT}`);
});
