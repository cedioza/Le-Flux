import fetch from 'node-fetch'; // Requiere 'npm install node-fetch' en ciertos entornos o usa Node 18+ nativo
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SETTINGS_FILE = path.join(__dirname, 'data', 'settings.json');

// Helper Recursivo de Parseo de Plantillas {{ node_id.data.field }}
const evaluateTemplate = (template, flowContext) => {
    if (typeof template !== 'string') return template;
    const regex = /{{\s*([a-zA-Z0-9_-]+)\.data\.([a-zA-Z0-9_.-]+)\s*}}/g;
    return template.replace(regex, (match, nodeId, path) => {
        const nodeData = flowContext[nodeId];
        if (!nodeData) return match;

        const keys = path.split('.');
        let value = nodeData;
        for (const key of keys) {
            value = value?.[key];
            if (value === undefined) break;
        }

        if (typeof value === 'object') return JSON.stringify(value);
        return value !== undefined ? String(value) : match;
    });
};

export const executeHeadlessFlow = async (webhookId, initialPayload, nodes, edges) => {
    console.log(`[Engine] Ejecutando Flujo Headless para Webhook: ${webhookId}`);
    const startTime = Date.now();
    let hasError = false;

    // Contexto de Ejecucion
    const flowContext = {};

    // Cargar Credenciales una vez
    let settingsData = { mistralKey: '', huggingFaceKey: '', elevenLabsKey: '' };
    try {
        const fileContent = fs.readFileSync(SETTINGS_FILE, 'utf8');
        settingsData = JSON.parse(fileContent);
    } catch (e) { }
    const mistralKey = process.env.MISTRAL_API_KEY || settingsData.mistralKey || settingsData.MISTRAL_API_KEY;
    const huggingFaceKey = process.env.HUGGINGFACE_API_KEY || settingsData.huggingFaceKey;
    const elevenLabsKey = process.env.ELEVENLABS_API_KEY || settingsData.elevenLabsKey;

    // 1. Encontrar y popular el Webhook Trigger
    const webhookNode = nodes.find(n => n.type === 'webhookNode' && (
        n.id === webhookId ||
        (n.data?.url && n.data.url.endsWith(webhookId))
    ));

    if (!webhookNode) {
        throw new Error(`No se encontro el Webhook Node para el ID ${webhookId}`);
    }

    // Inyectar payload
    flowContext[webhookNode.id] = initialPayload;
    console.log(`[Engine] Webhook Payload inyectado en ${webhookNode.id}`);

    // 2. Sorting Topologico Recursivo
    const executeNode = async (nodeId) => {
        const node = nodes.find(n => n.id === nodeId);
        if (!node) return;

        console.log(`[Engine] Evaluando Nodo: ${node.type} (${node.id})`);

        // Extraer todos los inputs de los nodos conectados previamente (Upstream)
        const incomingEdges = edges.filter(e => e.target === nodeId);

        switch (node.type) {
            case 'mapperNode': {
                const mappedResult = {};
                if (node.data?.mappings && Array.isArray(node.data.mappings)) {
                    node.data.mappings.forEach(m => {
                        if (m.key && m.value) {
                            mappedResult[m.key] = evaluateTemplate(m.value, flowContext);
                        }
                    });
                }
                flowContext[nodeId] = mappedResult;
                console.log(`[Engine] Mapper Executed:`, mappedResult);
                break;
            }

            case 'mistralNode': {
                const systemPrompt = evaluateTemplate(node.data?.systemPrompt || '', flowContext);
                const userMessage = evaluateTemplate(node.data?.userMessage || '', flowContext);
                const model = node.data?.model || 'mistral-large-latest';

                console.log(`[Engine] Mistral LLM Request: ${model}`);

                if (!mistralKey) {
                    console.error('[Engine] Mistral API Key undefined. Abortando Mistral Node.');
                    flowContext[nodeId] = { error: 'Missing API Key in environment or Credentials DB' };
                    hasError = true;
                    break;
                }

                try {
                    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${mistralKey}`
                        },
                        body: JSON.stringify({
                            model: model,
                            messages: [
                                { role: 'system', content: systemPrompt },
                                { role: 'user', content: userMessage }
                            ]
                        })
                    });

                    if (!response.ok) throw new Error(`Mistral API Error: ${response.status}`);

                    const data = await response.json();
                    flowContext[nodeId] = data;
                    console.log(`[Engine] Mistral Responded OK`);
                } catch (err) {
                    flowContext[nodeId] = { error: err.message };
                    console.error('[Engine] Mistral Fetch Error:', err.message);
                    hasError = true;
                }
                break;
            }

            case 'huggingFaceNode': {
                console.log(`[Engine] HuggingFace Request`);

                if (!huggingFaceKey) {
                    console.error('[Engine] Hugging Face API Key undefined.');
                    flowContext[nodeId] = { error: 'Missing HF API Key' };
                    hasError = true;
                    break;
                }

                const model = node.data?.model || 'meta-llama/Meta-Llama-3-8B-Instruct';
                let prompt = "Responde brevemente a lo siguiente:";

                if (incomingEdges.length > 0) {
                    const prevData = flowContext[incomingEdges[0].source];
                    if (prevData) prompt = typeof prevData === 'object' ? JSON.stringify(prevData) : String(prevData);
                }

                try {
                    const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${huggingFaceKey}`
                        },
                        body: JSON.stringify({ inputs: prompt })
                    });

                    if (!response.ok) {
                        const err = await response.json();
                        throw new Error(err.error || response.statusText);
                    }

                    const data = await response.json();
                    flowContext[nodeId] = Array.isArray(data) ? data[0]?.generated_text : data;
                    console.log(`[Engine] HuggingFace Responded OK`);
                } catch (err) {
                    flowContext[nodeId] = { error: err.message };
                    console.error('[Engine] HF Fetch Error:', err.message);
                    hasError = true;
                }
                break;
            }

            case 'elevenLabsNode': {
                console.log(`[Engine] ElevenLabs TTS Request`);

                if (!elevenLabsKey) {
                    console.error('[Engine] ElevenLabs API Key undefined.');
                    flowContext[nodeId] = { error: 'Missing ElevenLabs API Key' };
                    hasError = true;
                    break;
                }

                const voiceId = node.data?.voiceId || 'JBFqnCBcs611NsnJI8XM';
                const textToSpeech = evaluateTemplate(node.data?.text || 'Hola mundo', flowContext);

                try {
                    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'xi-api-key': elevenLabsKey
                        },
                        body: JSON.stringify({ text: textToSpeech })
                    });

                    if (!response.ok) {
                        const err = await response.json();
                        throw new Error(err.detail?.message || response.statusText);
                    }

                    flowContext[nodeId] = "Audio Blob generado en background. OK.";
                    console.log(`[Engine] ElevenLabs Responded OK. Blob resolved.`);
                } catch (err) {
                    flowContext[nodeId] = { error: err.message };
                    console.error('[Engine] ElevenLabs Fetch Error:', err.message);
                    hasError = true;
                }
                break;
            }

            case 'httpNode': {
                const method = node.data?.method || 'GET';
                const url = evaluateTemplate(node.data?.url || '', flowContext);
                let headersParsed = {};

                try {
                    const evaluatedHeaders = evaluateTemplate(node.data?.headers || '{}', flowContext);
                    headersParsed = JSON.parse(evaluatedHeaders);
                } catch (e) {
                    console.warn('[Engine] Invalid JSON Headers fallback to {}');
                }

                console.log(`[Engine] HTTP Request: ${method} ${url}`);

                try {
                    const response = await fetch(url, {
                        method,
                        headers: headersParsed
                    });

                    const contentType = response.headers.get("content-type");
                    let data;
                    if (contentType && contentType.indexOf("application/json") !== -1) {
                        data = await response.json();
                    } else {
                        data = await response.text();
                    }
                    flowContext[nodeId] = data;
                } catch (err) {
                    flowContext[nodeId] = { error: err.message };
                    hasError = true;
                }
                break;
            }

            case 'responseNode': {
                console.log(`[Engine] Response Node Executed`);
                try {
                    if (node.data?.responseMode === 'custom') {
                        const bodyStr = String(node.data?.responseBody || '');
                        const parsedStr = evaluateTemplate(bodyStr, flowContext);
                        try {
                            flowContext[nodeId] = JSON.parse(parsedStr);
                        } catch (e) {
                            flowContext[nodeId] = parsedStr; // Tratar como string plano
                        }
                    } else {
                        // Clonar el flowContext actual
                        flowContext[nodeId] = JSON.parse(JSON.stringify(flowContext));
                    }
                } catch (e) {
                    flowContext[nodeId] = { error: 'No se pudo serializar el estado del flujo.' };
                }
                break;
            }

            case 'pixtralNode':
            case 'codestralNode':
            case 'documentAINode':
            case 'audioNode':
            case 'batchNode':
            case 'contextNode':
                console.log(`[Engine] Nodo de Integracion Mockeada: ${node.type}`);
                flowContext[nodeId] = { success: true, mock: `Ejecutado ${node.type} en Headless` };
                break;
        }

        // Seguir la cadena
        const outgoingEdges = edges.filter(e => e.source === nodeId);
        for (const edge of outgoingEdges) {
            await executeNode(edge.target);
        }
    };

    // Comenzar la ejecucion recursiva desde los nodos conectados al Webhook
    const initialEdges = edges.filter(e => e.source === webhookNode.id);
    for (const edge of initialEdges) {
        await executeNode(edge.target);
    }

    const endTime = Date.now();
    const latency = endTime - startTime;
    console.log(`[Engine] Flujo Headless Completado en ${latency}ms.`);

    return {
        success: !hasError,
        latency,
        nodesContext: flowContext
    };
};
