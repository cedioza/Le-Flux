import { X, Settings, Terminal, FileText, CheckCircle2, Copy } from 'lucide-react';
import { useRef, useEffect, useState } from 'react';
import { socket } from '../App';

const DraggablePanel = ({ title, icon: Icon, children, defaultPosition, colorClass = "text-mistral-orange", onDoubleClickHeader }: any) => {
    const [position, setPosition] = useState(defaultPosition);
    const [isDragging, setIsDragging] = useState(false);
    const dragRef = useRef<{ x: number, y: number } | null>(null);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging && dragRef.current) {
                setPosition({
                    x: Math.max(0, e.clientX - dragRef.current.x),
                    y: Math.max(0, e.clientY - dragRef.current.y)
                });
            }
        };
        const handleMouseUp = () => setIsDragging(false);

        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

    return (
        <div
            style={{ left: position.x, top: position.y }}
            className={`fixed z-50 w-[300px] bg-[#0A0A0A] border-4 border-mistral-border flex flex-col max-h-[400px] transition-opacity ${isDragging ? 'opacity-80' : 'opacity-100 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)]'}`}
        >
            <div
                className="p-2 border-b-4 border-mistral-border bg-[#171717] flex items-center justify-between cursor-move select-none active:cursor-grabbing"
                onMouseDown={(e) => { setIsDragging(true); dragRef.current = { x: e.clientX - position.x, y: e.clientY - position.y }; }}
                onDoubleClick={onDoubleClickHeader}
                title="Arrastrar panel (Click) / Ocultar cont. (Doble Click en el título)"
            >
                <div className={`flex items-center gap-2 ${colorClass} text-[10px] font-bold uppercase tracking-widest pointer-events-none`}>
                    {Icon && <Icon className="w-4 h-4" />} {title}
                </div>
                <div className="flex gap-1 opacity-50 pointer-events-none">
                    <div className="w-2 h-2 rounded-full bg-mistral-border"></div>
                    <div className="w-2 h-2 rounded-full bg-mistral-border"></div>
                    <div className="w-2 h-2 rounded-full bg-mistral-border"></div>
                </div>
            </div>
            {children && (
                <div className="flex-1 overflow-y-auto p-2 bg-[#0A0A0A]">
                    {children}
                </div>
            )}
        </div>
    );
};

export const SettingsPanel = ({ selectedNode, onClose, onDelete, onUpdateData, onTestNode, upstreamNodes = [], credentials }: { selectedNode: any, onClose: () => void, onDelete: (id: string) => void, onUpdateData: (newData: any) => void, onTestNode: () => void, upstreamNodes?: any[], credentials?: any }) => {
    if (!selectedNode) return null;

    const isPixtral = selectedNode.type === 'pixtralNode';
    const [copiedPath, setCopiedPath] = useState<string | null>(null);
    const [isListening, setIsListening] = useState(false);
    const [timeLeft, setTimeLeft] = useState(120);

    const [isInputCollapsed, setIsInputCollapsed] = useState(false);
    const [isOutputCollapsed, setIsOutputCollapsed] = useState(false);

    useEffect(() => {
        if (!isListening) return;
        const interval = setInterval(() => {
            setTimeLeft((t) => {
                if (t <= 1) {
                    setIsListening(false);
                    return 120;
                }
                return t - 1;
            });
        }, 1000);

        socket.on('webhook_received', () => {
            setIsListening(false);
            setTimeLeft(120);
        });

        socket.on('test_timeout', () => {
            setIsListening(false);
            setTimeLeft(120);
        });

        return () => {
            clearInterval(interval);
            socket.off('webhook_received');
            socket.off('test_timeout');
        };
    }, [isListening]);

    const handleTestWebhook = () => {
        setIsListening(true);
        setTimeLeft(120);
        socket.emit('test_webhook', { webhookId: selectedNode.id });
    };

    const renderJsonTree = (obj: any, parentPath: string, nodeId: string) => {
        if (!obj || typeof obj !== 'object') return null;

        return (
            <div className="pl-2 border-l border-gray-700/50 mt-1 space-y-1">
                {Object.keys(obj).map(key => {
                    const value = obj[key];
                    const isObject = value && typeof value === 'object';
                    const currentPath = `${parentPath}.${key}`;
                    const varTag = `{{ ${nodeId}.data${currentPath} }}`;

                    return (
                        <div key={currentPath} className="text-[10px]">
                            <div
                                className="flex items-center justify-between group py-0.5"
                                draggable
                                onDragStart={(e) => {
                                    e.dataTransfer.setData('text/plain', varTag);
                                }}
                            >
                                <span className="text-blue-300 font-mono flex items-center gap-1 cursor-grab active:cursor-grabbing" title="Arrastra hacia una variable">
                                    <span className="text-gray-500">{isObject ? '{ }' : ' T '}</span> {key}
                                </span>
                                {!isObject && (
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(varTag);
                                            setCopiedPath(varTag);
                                            setTimeout(() => setCopiedPath(null), 2000);
                                        }}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-gray-400 hover:text-white bg-gray-800 px-1 rounded cursor-pointer"
                                        title="Copiar (Click) o Arrastrar"
                                    >
                                        {copiedPath === varTag ? <CheckCircle2 className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                                    </button>
                                )}
                            </div>
                            {isObject && renderJsonTree(value, currentPath, nodeId)}
                        </div>
                    );
                })}
            </div>
        );
    };

    const UpstreamDataViewer = ({ unode }: { unode: any }) => {
        // Auto-open if there is data, but only initialize once based on the first render, 
        // or just let it be fully controlled by whether there is responsePreview data.
        const hasData = unode.data?.responsePreview !== undefined && unode.data?.responsePreview !== null;
        const [isOpen, setIsOpen] = useState(hasData);

        return (
            <div className="text-xs bg-[#1a2234] border border-mistral-border rounded-md p-1.5 m-1">
                <div
                    className="flex items-center gap-2 text-gray-300 font-medium cursor-pointer hover:bg-white/5 p-1 rounded transition-colors"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <div className={`w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[6px] border-l-gray-400 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                    <div className="w-2 h-2 rounded-full bg-mistral-orange" />
                    <span className="truncate flex-1">{unode.data?.label || unode.type}</span>
                    <span className="ml-auto text-[9px] text-gray-500 font-mono px-1 bg-black rounded shrink-0">{unode.id}</span>
                </div>
                {isOpen && (
                    <div className="pl-4 mt-2 border-l border-gray-700/50 pb-2">
                        {unode.data?.responsePreview ? (
                            typeof unode.data.responsePreview === 'object' ? (
                                renderJsonTree(unode.data.responsePreview, '', unode.id)
                            ) : (
                                <div className="text-[10px] text-gray-400 font-mono truncate bg-black/40 p-2 rounded">
                                    {String(unode.data.responsePreview)}
                                </div>
                            )
                        ) : (
                            <div className="text-[10px] text-gray-600 italic px-2">No data yet. Execute workflow.</div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    // Live Evaluation Engine for Mapper
    // Removed evaluateTemplate, now handled in App.tsx via onTestNode

    return (
        <>
            <DraggablePanel
                title="INPUT DATA"
                icon={FileText}
                defaultPosition={{ x: 300, y: 80 }}
                colorClass="text-mistral-orange"
                onDoubleClickHeader={() => setIsInputCollapsed(!isInputCollapsed)}
            >
                <div className="space-y-2 select-none">
                    {!isInputCollapsed && (
                        upstreamNodes && upstreamNodes.length > 0 ? (
                            upstreamNodes.map((unode) => (
                                <UpstreamDataViewer key={`${unode.id}-${unode.data?.responsePreview ? 'loaded' : 'null'}`} unode={unode} />
                            ))
                        ) : (
                            <div className="text-[10px] text-mistral-muted font-mono italic p-2 text-center mt-4 cursor-default">Sin datos de entrada</div>
                        )
                    )}
                </div>
            </DraggablePanel>

            <DraggablePanel
                title="PREVIEW RESPUESTA"
                icon={Terminal}
                defaultPosition={{ x: 300, y: 460 }}
                colorClass="text-green-400"
                onDoubleClickHeader={() => setIsOutputCollapsed(!isOutputCollapsed)}
            >
                <div className="select-none min-h-[30px]">
                    {!isOutputCollapsed && (
                        selectedNode.data?.responsePreview ? (
                            <div className="bg-[#171717] border-2 border-green-900/50 p-2 overflow-x-auto cursor-text">
                                <pre className="text-[10px] text-mistral-muted font-mono whitespace-pre-wrap break-words">
                                    {typeof selectedNode.data.responsePreview === 'object'
                                        ? JSON.stringify(selectedNode.data.responsePreview, null, 2)
                                        : String(selectedNode.data.responsePreview)}
                                </pre>
                            </div>
                        ) : (
                            <div className="text-[10px] text-mistral-muted font-mono italic p-2 text-center mt-4">
                                Ejecuta o Testea el nodo para ver su respuesta.
                            </div>
                        )
                    )}
                </div>
            </DraggablePanel>

            <aside className="w-[320px] bg-[#1a2234] border-l border-mistral-border h-full flex flex-col backdrop-blur-md bg-opacity-90 shrink-0 z-10 shadow-2xl">
                <div className="p-4 border-b border-mistral-border flex items-center justify-between bg-mistral-panel shrink-0">
                    <div className="flex items-center gap-2 text-white">
                        <Settings className="w-4 h-4 text-mistral-orange" />
                        <h2 className="text-sm font-semibold">Configuración de Nodo</h2>
                    </div>
                    <button onClick={onClose} className="text-mistral-muted hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-5 flex-1 overflow-y-auto space-y-6">
                    <div>
                        <div className="bg-mistral-bg px-2 py-1.5 rounded border border-mistral-border flex items-center justify-between mb-4 mt-2">
                            <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">ID</span>
                            <span className="text-xs text-mistral-muted font-mono bg-black/50 px-2 py-0.5 rounded select-all">{selectedNode.id}</span>
                            <span className="text-[10px] bg-blue-900/30 text-blue-400 px-2 py-0.5 rounded uppercase">{selectedNode.type}</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-mistral-muted mb-2 uppercase tracking-wide">Nombre del Nodo</label>
                        <input
                            type="text"
                            className="w-full bg-mistral-bg border border-mistral-border rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-mistral-orange"
                            value={selectedNode.data?.label || selectedNode.type}
                            onChange={(e) => onUpdateData({ label: e.target.value })}
                            placeholder="Mi Nodo"
                        />
                    </div>

                    {isPixtral && (
                        <>
                            <div>
                                <label className="block text-xs font-medium text-mistral-muted mb-2 uppercase tracking-wide">Model Selection</label>
                                <select className="w-full bg-mistral-bg border border-mistral-border rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-mistral-orange">
                                    <option>pixtral-12b-2409</option>
                                    <option>pixtral-large-latest</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-mistral-muted mb-3 uppercase tracking-wide">Tools Activadas</label>
                                <div className="space-y-3">
                                    {[
                                        { id: 'web', label: 'Web Search API' },
                                        { id: 'code', label: 'Code Execution' },
                                    ].map((tool) => (
                                        <label key={tool.id} className="flex items-center gap-3 cursor-pointer group">
                                            <div className="relative flex items-center">
                                                <input type="checkbox" className="peer w-5 h-5 appearance-none border border-mistral-border rounded bg-mistral-bg checked:bg-mistral-orange checked:border-mistral-orange transition-colors" />
                                                <svg className="absolute w-3 h-3 text-black pointer-events-none opacity-0 peer-checked:opacity-100 left-1" viewBox="0 0 14 10" fill="none">
                                                    <path d="M1 5L4.5 8.5L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </div>
                                            <span className="text-sm text-mistral-muted group-hover:text-white transition-colors">{tool.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-mistral-muted mb-2 uppercase tracking-wide">System Prompt</label>
                                <textarea
                                    className="w-full h-32 bg-mistral-bg border border-mistral-border rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-mistral-orange resize-none font-mono placeholder-gray-600"
                                    defaultValue="Eres un asistente de visión diseñado para analizar facturas y recibos con precisión..."
                                />
                            </div>
                        </>
                    )}

                    {selectedNode.type === 'httpNode' && (
                        <>
                            <div className="bg-blue-400/10 border border-blue-400/30 p-3 rounded mb-4">
                                <label className="block text-xs font-medium text-blue-300 mb-2 uppercase tracking-wide">Import cURL</label>
                                <textarea
                                    className="w-full h-16 bg-[#000] border border-blue-400/50 rounded-md px-3 py-2 text-[10px] text-blue-200 focus:outline-none focus:border-mistral-orange resize-none font-mono placeholder-blue-800"
                                    placeholder="Pega tu comando cURL aquí... se autocompletará abajo."
                                    onPaste={(e) => {
                                        const text = e.clipboardData.getData('text');
                                        if (text.trim().startsWith('curl')) {
                                            e.preventDefault();

                                            const methodMatch = text.match(/-X\s+([A-Z]+)/) || text.match(/--request\s+([A-Z]+)/);
                                            const method = methodMatch ? methodMatch[1] : (text.includes('--data') || text.includes('-d') ? 'POST' : 'GET');

                                            const urlMatch = text.match(/curl\s+(?:-X\s+[A-Z]+\s+)?['"]?([^'"\s]+)['"]?/);
                                            const url = urlMatch ? urlMatch[1] : '';

                                            const headerRegex = /-H\s+['"]([^'"]+)['"]/g;
                                            let match;
                                            const headers: Record<string, string> = {};
                                            while ((match = headerRegex.exec(text)) !== null) {
                                                const parts = match[1].split(':');
                                                const key = parts.shift();
                                                if (key) {
                                                    headers[key.trim()] = parts.join(':').trim();
                                                }
                                            }

                                            onUpdateData({
                                                method,
                                                url: url.startsWith('http') ? url : '',
                                                headers: Object.keys(headers).length > 0 ? JSON.stringify(headers, null, 2) : ''
                                            });

                                            e.currentTarget.value = 'Importado correctamente!';
                                            setTimeout(() => { e.currentTarget.value = '' }, 2000);
                                        }
                                    }}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-mistral-muted mb-2 uppercase tracking-wide">Método HTTP</label>
                                <select
                                    className="w-full bg-mistral-bg border border-mistral-border rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-mistral-orange"
                                    value={selectedNode.data?.method || 'GET'}
                                    onChange={(e) => onUpdateData({ method: e.target.value })}
                                >
                                    <option value="GET">GET</option>
                                    <option value="POST">POST</option>
                                    <option value="PUT">PUT</option>
                                    <option value="DELETE">DELETE</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-mistral-muted mb-2 uppercase tracking-wide">URL</label>
                                <input
                                    type="text"
                                    className="w-full bg-mistral-bg border border-mistral-border rounded px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-mistral-orange"
                                    placeholder="https://api.example.com/v1/..."
                                    value={selectedNode.data?.url || ''}
                                    onChange={(e) => onUpdateData({ url: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-mistral-muted mb-2 uppercase tracking-wide">Headers (JSON)</label>
                                <textarea
                                    className="w-full h-24 bg-mistral-bg border border-mistral-border rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-mistral-orange resize-none font-mono"
                                    value={selectedNode.data?.headers || ''}
                                    onChange={(e) => onUpdateData({ headers: e.target.value })}
                                    placeholder={'{\n  "Authorization": "Bearer ..."\n}'}
                                />
                            </div>

                            {/* Preview movido a la columna izquierda */}
                        </>
                    )}

                    {selectedNode.type === 'mapperNode' && (
                        <>
                            <div className="bg-blue-400/10 border border-blue-400/30 p-3 rounded text-[11px] text-blue-200">
                                Arrastra variables del menú izquierdo o usa <code className="bg-black/40 px-1 py-0.5 rounded text-mistral-orange">{'{{ node_xx.data.field }}'}</code>.
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-mistral-muted mb-2 uppercase tracking-wide flex justify-between">
                                    Mapeo de Datos
                                    <button
                                        onClick={() => {
                                            const currentMappings = selectedNode.data?.mappings || [];
                                            onUpdateData({ mappings: [...currentMappings, { id: Date.now(), key: '', value: '' }] });
                                        }}
                                        className="text-blue-400 hover:text-blue-300 font-medium lowercase"
                                    >
                                        + añadir
                                    </button>
                                </label>

                                <div className="space-y-3 bg-[#0b101e] p-3 rounded-lg border border-mistral-border">
                                    {(!selectedNode.data?.mappings || selectedNode.data.mappings.length === 0) && (
                                        <div className="text-center text-[10px] text-gray-500 py-3 italic">
                                            No hay llaves mapeadas. Haz click en añadir.
                                        </div>
                                    )}

                                    {selectedNode.data?.mappings?.map((map: any, idx: number) => (
                                        <div key={map.id} className="flex gap-2 items-start group relative">
                                            <input
                                                type="text"
                                                placeholder="Key (ej. titulo)"
                                                value={map.key}
                                                onChange={(e) => {
                                                    const newMappings = [...selectedNode.data.mappings];
                                                    newMappings[idx].key = e.target.value;
                                                    onUpdateData({ mappings: newMappings });
                                                }}
                                                className="w-2/5 bg-mistral-bg border border-mistral-border rounded px-2 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-mistral-orange"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Value ({{ ... }})"
                                                value={map.value}
                                                onChange={(e) => {
                                                    const newMappings = [...selectedNode.data.mappings];
                                                    newMappings[idx].value = e.target.value;
                                                    onUpdateData({ mappings: newMappings });
                                                }}
                                                className="flex-1 bg-mistral-bg border border-mistral-border rounded px-2 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-mistral-orange font-mono text-[10px]"
                                            />
                                            <button
                                                onClick={() => {
                                                    const newMappings = selectedNode.data.mappings.filter((m: any) => m.id !== map.id);
                                                    onUpdateData({ mappings: newMappings });
                                                }}
                                                className="opacity-0 group-hover:opacity-100 absolute -right-2 -top-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-400 transition-opacity"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Live Output Preview es interno al mapper, lo mantenemos o lo quitamos?
                                El mapper evalúa en local, vamos a dejarlo en la barra izquierda si hacen test.
                                Ah, pero el mapper tenía Live Output Preview. Lo quitamos también. */}
                        </>
                    )}

                    {selectedNode.type === 'webhookNode' && (
                        <>
                            <div className={`border p-3 rounded text-xs mb-4 flex flex-col items-center justify-center transition-colors ${isListening ? 'bg-orange-400/10 border-orange-400/30 text-mistral-orange' : 'bg-mistral-panel border-mistral-border text-mistral-muted'}`}>
                                {isListening ? (
                                    <>
                                        <div className="flex items-center gap-2 font-bold mb-1 animate-pulse">
                                            <div className="w-2 h-2 bg-mistral-orange rounded-full"></div> ESCUCHANDO PETICIÓN EXTERNA...
                                        </div>
                                        <span className="font-mono">{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
                                    </>
                                ) : (
                                    <div className="text-center">
                                        Modo Testing desactivado. Envía payloads y aparecerán aquí.<br />
                                        <span className="text-mistral-orange font-bold mt-2 block">⚠️ Recuerda presionar "Guardar" arriba en el Header cada vez que cambies el Webhook u otros nodos, para que el servidor Background lo registre.</span>
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-mistral-muted mb-2 uppercase tracking-wide">Webhook Local URL</label>
                                <div className="flex gap-2 mb-4">
                                    <input
                                        type="text"
                                        readOnly
                                        className="flex-1 bg-mistral-bg border border-mistral-border rounded px-3 py-2 text-xs text-gray-400 font-mono"
                                        value={`http://localhost:3000/api/webhook/${selectedNode.id}`}
                                    />
                                    <button
                                        onClick={() => navigator.clipboard.writeText(`http://localhost:3000/api/webhook/${selectedNode.id}`)}
                                        className="bg-mistral-panel hover:bg-[#2d3748] text-white px-3 text-xs rounded border border-mistral-border transition-colors truncate"
                                    >Copiar</button>
                                </div>
                                <button
                                    onClick={handleTestWebhook}
                                    disabled={isListening}
                                    className={`w-full font-bold uppercase tracking-widest text-[10px] py-3 rounded transition-colors ${isListening ? 'bg-mistral-bg text-gray-500 cursor-not-allowed border border-gray-800' : 'bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/50'}`}
                                >
                                    {isListening ? 'Detener Test' : '▶ Activar Escucha (2 Mins)'}
                                </button>
                            </div>
                        </>
                    )}

                    {selectedNode.type === 'telegramTriggerNode' && (
                        <>
                            <div className={`border p-3 rounded text-xs mb-4 flex flex-col items-center justify-center transition-colors ${isListening ? 'bg-[#0088cc]/10 border-[#0088cc]/30 text-[#0088cc]' : 'bg-mistral-panel border-mistral-border text-mistral-muted'}`}>
                                {isListening ? (
                                    <>
                                        <div className="flex items-center gap-2 font-bold mb-1 animate-pulse text-[#0088cc]">
                                            <div className="w-2 h-2 bg-[#0088cc] rounded-full"></div> ESPERANDO MENSAJES TELEGRAM...
                                        </div>
                                        <span className="font-mono">{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
                                    </>
                                ) : (
                                    <div className="text-center text-xs">
                                        Modo Testing desactivado. Envía algo por Telegram y aparecerá aquí.<br />
                                        <span className="text-[#0088cc] font-bold mt-2 block">Copia esta URL y fíjala con setWebhook en la API de Telegram.</span>
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-mistral-muted mb-2 uppercase tracking-wide">Telegram Webhook URL</label>
                                <div className="flex gap-2 mb-4">
                                    <input
                                        type="text"
                                        readOnly
                                        className="flex-1 bg-mistral-bg border border-mistral-border rounded px-3 py-2 text-[10px] text-gray-400 font-mono"
                                        value={`${window.location.origin}/api/telegram-webhook/${selectedNode.id}`}
                                    />
                                    <button
                                        onClick={() => navigator.clipboard.writeText(`${window.location.origin}/api/telegram-webhook/${selectedNode.id}`)}
                                        className="bg-mistral-panel hover:bg-[#2d3748] text-white px-3 text-xs rounded border border-mistral-border transition-colors truncate"
                                    >Copiar</button>
                                </div>
                                <div className="text-[10px] text-gray-500 mb-4 bg-white/5 p-2 rounded">
                                    Esta ruta extraerá automáticamente el <code>chat.id</code>, el <code>text</code> y el <code>username</code> del usuario.
                                </div>
                                <button
                                    onClick={async () => {
                                        if (!credentials?.telegramToken) {
                                            alert("Primero configura tu Telegram Bot Token en el panel de Credenciales (arriba a la derecha).");
                                            return;
                                        }
                                        const url = `${window.location.origin}/api/telegram-webhook/${selectedNode.id}`;
                                        try {
                                            const res = await fetch(`https://api.telegram.org/bot${credentials.telegramToken}/setWebhook?url=${encodeURIComponent(url)}`);
                                            const data = await res.json();
                                            if (data.ok) {
                                                alert("Webhook registrado exitosamente en Telegram!\nTodo el chat llegará a este nodo automáticamente.");
                                            } else {
                                                alert(`Error de Telegram: ${data.description}`);
                                            }
                                        } catch (e: any) {
                                            alert("Error de red: " + e.message);
                                        }
                                    }}
                                    className="w-full font-bold uppercase tracking-widest text-[10px] py-2 mb-2 rounded transition-colors bg-[#0088cc] hover:bg-[#0077b3] text-white border border-[#005f99] shadow-lg"
                                >
                                    Vincular Bot Automáticamente
                                </button>
                                <button
                                    onClick={handleTestWebhook}
                                    disabled={isListening}
                                    className={`w-full font-bold uppercase tracking-widest text-[10px] py-3 rounded transition-colors ${isListening ? 'bg-mistral-bg text-gray-500 cursor-not-allowed border border-gray-800' : 'bg-[#0088cc]/20 text-[#0088cc] hover:bg-[#0088cc]/30 border border-[#0088cc]/50'}`}
                                >
                                    {isListening ? 'Detener Test' : '▶ Activar Escucha (2 Mins)'}
                                </button>
                            </div>
                        </>
                    )}

                    {selectedNode.type === 'telegramMessageNode' && (
                        <>
                            <div>
                                <label className="block text-xs font-medium text-mistral-muted mb-2 uppercase tracking-wide flex justify-between">
                                    Target Chat ID
                                </label>
                                <input
                                    type="text"
                                    className="w-full bg-mistral-bg border border-mistral-border rounded px-3 py-2 text-sm text-white font-mono placeholder-gray-600 focus:outline-none focus:border-[#0088cc]"
                                    placeholder="{{ telegramTriggerNode.data.chat_id }}"
                                    value={selectedNode.data?.chatId || ''}
                                    onChange={(e) => onUpdateData({ chatId: e.target.value })}
                                />
                                <div className="text-[10px] text-gray-500 mt-1">Chat ID de Telegram de destino (ej. 123456789 o {'{{ nodo... }}'}).</div>
                            </div>
                            <div className="mt-4">
                                <label className="block text-xs font-medium text-mistral-muted mb-2 uppercase tracking-wide flex justify-between">
                                    Message Text
                                </label>
                                <textarea
                                    className="w-full h-32 bg-mistral-bg border border-mistral-border rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-[#0088cc] resize-none font-mono placeholder-gray-600"
                                    placeholder="Respuesta autogenerada de: {{ pixtralNode.data.responsePreview }}"
                                    value={selectedNode.data?.message || ''}
                                    onChange={(e) => onUpdateData({ message: e.target.value })}
                                />
                            </div>
                        </>
                    )}

                    {selectedNode.type === 'codestralNode' && (
                        <>
                            <div>
                                <label className="block text-xs font-medium text-mistral-muted mb-2 uppercase tracking-wide">Model Selection</label>
                                <select className="w-full bg-mistral-bg border border-mistral-border rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-mistral-orange">
                                    <option>codestral-latest</option>
                                    <option>codestral-mamba</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-mistral-muted mb-2 uppercase tracking-wide">Code Task</label>
                                <textarea
                                    className="w-full h-24 bg-mistral-bg border border-mistral-border rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-mistral-orange resize-none font-mono"
                                    defaultValue="Genera una función en Python para iterar listas."
                                />
                            </div>
                        </>
                    )}

                    {selectedNode.type === 'mistralNode' && (
                        <>
                            <div>
                                <label className="block text-xs font-medium text-mistral-muted mb-2 uppercase tracking-wide">Model Selection</label>
                                <select
                                    className="w-full bg-mistral-bg border border-mistral-border rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-mistral-orange"
                                    value={selectedNode.data?.model || 'mistral-large-latest'}
                                    onChange={(e) => onUpdateData({ model: e.target.value })}
                                >
                                    <option value="mistral-large-latest">Mistral Large 2 (mistral-large-latest)</option>
                                    <option value="mistral-small-latest">Mistral Small (mistral-small-latest)</option>
                                    <option value="open-mistral-nemo">Mistral Nemo (open-mistral-nemo)</option>
                                    <option value="open-mixtral-8x22b">Mixtral 8x22B (open-mixtral-8x22b)</option>
                                    <option value="open-mixtral-8x7b">Mixtral 8x7B (open-mixtral-8x7b)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-mistral-muted mb-2 uppercase tracking-wide flex justify-between">
                                    System Prompt
                                </label>
                                <textarea
                                    className="w-full h-24 bg-mistral-bg border border-mistral-border rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-mistral-orange resize-none font-mono placeholder-gray-600"
                                    placeholder="Eres un asistente útil que responde siempre en español..."
                                    value={selectedNode.data?.systemPrompt || ''}
                                    onChange={(e) => onUpdateData({ systemPrompt: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-mistral-muted mb-2 uppercase tracking-wide flex justify-between">
                                    User Message / Input
                                </label>
                                <textarea
                                    className="w-full h-24 bg-mistral-bg border border-mistral-border rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-mistral-orange resize-none font-mono placeholder-gray-600"
                                    placeholder="Resume el siguiente texto: {{ mapperNode.data.resumen }}..."
                                    value={selectedNode.data?.userMessage || ''}
                                    onChange={(e) => onUpdateData({ userMessage: e.target.value })}
                                />
                            </div>
                        </>
                    )}

                    {selectedNode.type === 'huggingFaceNode' && (
                        <>
                            <div>
                                <label className="block text-xs font-medium text-mistral-muted mb-2 uppercase tracking-wide">Model Selection</label>
                                <input
                                    type="text"
                                    className="w-full bg-mistral-bg border border-mistral-border rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-mistral-orange"
                                    value={selectedNode.data?.model || 'meta-llama/Meta-Llama-3-8B-Instruct'}
                                    onChange={(e) => onUpdateData({ model: e.target.value })}
                                />
                            </div>
                        </>
                    )}

                    {selectedNode.type === 'elevenLabsNode' && (
                        <>
                            <div>
                                <label className="block text-xs font-medium text-mistral-muted mb-2 uppercase tracking-wide">Voice ID</label>
                                <input
                                    type="text"
                                    className="w-full bg-mistral-bg border border-mistral-border rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-mistral-orange"
                                    value={selectedNode.data?.voiceId || 'JBFqnCBcs611NsnJI8XM'}
                                    onChange={(e) => onUpdateData({ voiceId: e.target.value })}
                                    placeholder="e.g. 21m00Tcm4TlvDq8ikWAM"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-mistral-muted mb-2 uppercase tracking-wide flex justify-between">
                                    Text to Speech
                                </label>
                                <textarea
                                    className="w-full h-24 bg-mistral-bg border border-mistral-border rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-mistral-orange resize-none font-mono placeholder-gray-600"
                                    placeholder="Enter text or variables {{ mapperNode.data.text }}..."
                                    value={selectedNode.data?.text || ''}
                                    onChange={(e) => onUpdateData({ text: e.target.value })}
                                />
                            </div>
                        </>
                    )}

                    {selectedNode.type === 'pixtralNode' && (
                        <>
                            <div>
                                <label className="block text-xs font-medium text-mistral-muted mb-2 uppercase tracking-wide">Image Source (URL or Base64 Variable)</label>
                                <input
                                    type="text"
                                    className="w-full bg-mistral-bg border border-mistral-border rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-mistral-orange font-mono"
                                    value={selectedNode.data?.imageSource || '{{ webhookNode.data.files.imagen }}'}
                                    onChange={(e) => onUpdateData({ imageSource: e.target.value })}
                                    placeholder="{{ webhook.data.files.image }}"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-mistral-muted mb-2 uppercase tracking-wide flex justify-between">
                                    Vision Prompt
                                </label>
                                <textarea
                                    className="w-full h-24 bg-mistral-bg border border-mistral-border rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-mistral-orange resize-none font-mono placeholder-gray-600"
                                    placeholder="What is in this image?"
                                    value={selectedNode.data?.prompt || 'Describe this image in detail.'}
                                    onChange={(e) => onUpdateData({ prompt: e.target.value })}
                                />
                            </div>
                        </>
                    )}

                    {selectedNode.type === 'documentAINode' && (
                        <>
                            <div>
                                <label className="block text-xs font-medium text-mistral-muted mb-2 uppercase tracking-wide">Output Format</label>
                                <select className="w-full bg-mistral-bg border border-mistral-border rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-mistral-orange">
                                    <option>Structured JSON (Schema)</option>
                                    <option>Markdown Text</option>
                                </select>
                            </div>
                            <div className="mt-4 border border-dashed border-mistral-border rounded-md p-4 flex flex-col items-center justify-center gap-2 hover:border-purple-400 cursor-pointer transition-colors bg-[#111827]">
                                <FileText className="w-5 h-5 text-mistral-muted" />
                                <span className="text-xs text-mistral-muted text-center">PDF / DOCX File</span>
                            </div>
                        </>
                    )}

                    {selectedNode.type === 'audioNode' && (
                        <>
                            <div>
                                <label className="block text-xs font-medium text-mistral-muted mb-2 uppercase tracking-wide">Language</label>
                                <select className="w-full bg-mistral-bg border border-mistral-border rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-mistral-orange">
                                    <option>Auto-detect</option>
                                    <option>English</option>
                                    <option>Spanish</option>
                                    <option>French</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-mistral-muted mb-2 uppercase tracking-wide">Audio Source</label>
                                <input
                                    type="text"
                                    className="w-full bg-mistral-bg border border-mistral-border rounded px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-mistral-orange"
                                    placeholder="https://.../audio.mp3"
                                />
                            </div>
                        </>
                    )}

                    {selectedNode.type === 'batchNode' && (
                        <>
                            <div>
                                <label className="block text-xs font-medium text-mistral-muted mb-2 uppercase tracking-wide">Batch Endpoint</label>
                                <select className="w-full bg-mistral-bg border border-mistral-border rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-mistral-orange">
                                    <option>/v1/chat/completions</option>
                                    <option>/v1/embeddings</option>
                                </select>
                            </div>
                            <div className="bg-orange-400/10 border border-orange-400/30 p-3 rounded text-xs text-orange-200 mt-4">
                                Los procesos Batch tienen hasta 50% de descuento pero mayor latencia.
                            </div>
                        </>
                    )}

                    {selectedNode.type === 'contextNode' && (
                        <>
                            <div>
                                <label className="block text-xs font-medium text-mistral-muted mb-2 uppercase tracking-wide">Knowledge Base ID</label>
                                <input
                                    type="text"
                                    className="w-full bg-mistral-bg border border-mistral-border rounded px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-mistral-orange"
                                    defaultValue="db_mistral_files_9x2a"
                                />
                            </div>
                            <button className="w-full bg-[#2d3748] hover:bg-[#3d4b63] border border-mistral-border text-white text-xs font-medium py-2 rounded transition-colors mt-4">
                                Sincronizar Dataset
                            </button>
                        </>
                    )}

                    {selectedNode.type === 'responseNode' && (
                        <>
                            <div className="mb-4">
                                <label className="block text-xs font-medium text-mistral-muted mb-2 uppercase tracking-wide">Modo de Respuesta</label>
                                <select
                                    className="w-full bg-mistral-bg border border-mistral-border rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-mistral-orange"
                                    value={selectedNode.data?.responseMode || 'all'}
                                    onChange={(e) => onUpdateData({ responseMode: e.target.value })}
                                >
                                    <option value="all">Devolver todo el Contexto (Global)</option>
                                    <option value="custom">Respuesta Personalizada (JSON)</option>
                                </select>
                            </div>

                            {selectedNode.data?.responseMode === 'custom' && (
                                <div className="mb-4">
                                    <label className="block text-xs font-medium text-mistral-muted mb-2 uppercase tracking-wide flex justify-between">
                                        Cuerpo Pers. (Usa variables)
                                    </label>
                                    <textarea
                                        className="w-full h-32 bg-mistral-bg border border-mistral-border rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-mistral-orange resize-none font-mono"
                                        placeholder={'{\n  "status": "ok",\n  "result": "{{ mapperNode_1.data }}"\n}'}
                                        value={selectedNode.data?.responseBody || ''}
                                        onChange={(e) => onUpdateData({ responseBody: e.target.value })}
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-medium text-mistral-muted mb-2 uppercase tracking-wide">Descripción Interna</label>
                                <input
                                    type="text"
                                    className="w-full bg-mistral-bg border border-mistral-border rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-mistral-orange"
                                    defaultValue={selectedNode.data?.description || '200 OK'}
                                    onChange={(e) => onUpdateData({ description: e.target.value })}
                                />
                            </div>

                            {selectedNode.data?.responsePreview && (
                                <div className="mt-4 border-t border-mistral-border pt-4">
                                    <label className="block text-xs font-medium text-green-400 mb-2 uppercase tracking-wide flex items-center gap-1">
                                        <Terminal className="w-3 h-3" /> Payload Final Recibido
                                    </label>
                                    <div className="bg-[#0b101e] border border-mistral-border rounded-md p-3 max-h-48 overflow-y-auto">
                                        <div className="text-[10px] text-gray-400 italic mb-2">
                                            Revisa el panel izquierdo "PREVIEW RESPUESTA" para ver el payload procesado.
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {selectedNode.type === 'default' && !isPixtral && (
                        <>
                            <div>
                                <label className="block text-xs font-medium text-mistral-muted mb-2 uppercase tracking-wide">Descripción</label>
                                <textarea
                                    className="w-full h-20 bg-mistral-bg border border-mistral-border rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-mistral-orange resize-none"
                                    defaultValue={selectedNode.data?.description || ''}
                                />
                            </div>
                        </>
                    )}
                </div>

                <div className="p-4 bg-mistral-panel border-t border-mistral-border flex flex-col gap-2">
                    <button
                        onClick={onTestNode}
                        className="w-full bg-[#2d3748] hover:bg-[#3d4b63] border border-mistral-border text-white text-xs font-medium py-2 rounded transition-colors mt-4"
                    >
                        Test Node (Dry Run)
                    </button>
                    <button onClick={() => onDelete(selectedNode.id)} className="w-full bg-red-900/30 hover:bg-red-900/60 text-red-500 border border-red-900/50 font-medium py-2 rounded transition-colors text-sm flex items-center justify-center gap-2">
                        <X className="w-4 h-4" /> Eliminar Nodo
                    </button>
                </div>
            </aside>
        </>
    );
};

export const LogsPanel = ({ logs, isExecuting }: { logs: Array<{ time: string, message: string, type: string }>, isExecuting: boolean }) => {
    return (
        <aside className="w-[320px] bg-[#1a2234] border-l border-mistral-border h-full flex flex-col z-10 shrink-0 shadow-2xl">
            <div className="p-4 border-b border-mistral-border flex items-center gap-2 bg-mistral-panel">
                <Terminal className="w-4 h-4 text-green-400" />
                <h2 className="text-sm font-semibold text-white">Ejecución en vivo</h2>
            </div>

            <div className="flex-1 bg-mistral-bg p-4 font-mono text-xs overflow-y-auto space-y-3">
                {logs.map((log, index) => {
                    let color = 'text-gray-300';
                    if (log.type === 'error') color = 'text-red-400';
                    if (log.type === 'success') color = 'text-green-400';
                    if (log.type === 'warning') color = 'text-mistral-orange';
                    if (log.type === 'info') color = 'text-blue-400';

                    return (
                        <div key={index} className={color}>
                            <span className="opacity-50">[{log.time}]</span> {log.message}
                        </div>
                    );
                })}
                {isExecuting && (
                    <div className="text-white mt-4 border-t border-gray-700 pt-2 opacity-50 block animate-pulse">
                        Esperando siguiente evento...
                    </div>
                )}
            </div>

            <div className="p-4 bg-mistral-panel border-t border-mistral-border text-xs text-mistral-muted space-y-1">
                <div className="flex justify-between"><span>Status:</span> <span className={isExecuting ? 'text-mistral-orange animate-pulse' : 'text-green-400 font-medium'}>{isExecuting ? 'Running...' : 'Completado'}</span></div>
                <div className="flex justify-between"><span>Tokens in/out:</span> <span>0 / 0</span></div>
            </div>
        </aside>
    );
};
