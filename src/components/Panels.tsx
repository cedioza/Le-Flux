import { X, Settings, Terminal } from 'lucide-react';

export const SettingsPanel = ({ selectedNode, onClose }: { selectedNode: any, onClose: () => void }) => {
    if (!selectedNode) return null;

    const isPixtral = selectedNode.type === 'pixtralNode';

    return (
        <aside className="w-[320px] bg-[#1a2234] border-l border-mistral-border h-full flex flex-col z-10 shrink-0 backdrop-blur-md bg-opacity-90 shadow-2xl">
            <div className="p-4 border-b border-mistral-border flex items-center justify-between bg-mistral-panel">
                <div className="flex items-center gap-2 text-white">
                    <Settings className="w-4 h-4 text-mistral-yellow" />
                    <h2 className="text-sm font-semibold">Configuración de Nodo</h2>
                </div>
                <button onClick={onClose} className="text-mistral-muted hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto space-y-6">
                <div>
                    <label className="block text-xs font-medium text-mistral-muted mb-2 uppercase tracking-wide">ID de Nodo</label>
                    <div className="bg-mistral-bg px-3 py-2 rounded border border-mistral-border text-sm text-gray-400 font-mono">
                        {selectedNode.id}
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-medium text-mistral-muted mb-2 uppercase tracking-wide">Model Selection</label>
                    <select className="w-full bg-mistral-bg border border-mistral-border rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-mistral-yellow">
                        <option>mistral-large-latest</option>
                        <option>mistral-small-latest</option>
                        <option>pixtral-12b-2409</option>
                        <option>open-mixtral-8x22b</option>
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-medium text-mistral-muted mb-3 uppercase tracking-wide">Tools Activadas</label>
                    <div className="space-y-3">
                        {[
                            { id: 'web', label: 'Web Search API' },
                            { id: 'code', label: 'Code Execution' },
                            { id: 'doc', label: 'Doc Library (RAG)' }
                        ].map((tool) => (
                            <label key={tool.id} className="flex items-center gap-3 cursor-pointer group">
                                <div className="relative flex items-center">
                                    <input type="checkbox" className="peer w-5 h-5 appearance-none border border-mistral-border rounded bg-mistral-bg checked:bg-mistral-yellow checked:border-mistral-yellow transition-colors" />
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
                        className="w-full h-32 bg-mistral-bg border border-mistral-border rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-mistral-yellow resize-none font-mono placeholder-gray-600"
                        placeholder="Eres un agente especializado en extraer datos tabulares de facturas PDF..."
                        defaultValue={isPixtral ? "Eres un asistente de visión diseñado para analizar facturas y recibos con precisión..." : ""}
                    />
                </div>
            </div>

            <div className="p-4 bg-mistral-panel border-t border-mistral-border">
                <button className="w-full bg-[#2d3748] hover:bg-[#3d4b63] text-white font-medium py-2 rounded transition-colors text-sm">
                    Test Node (Dry Run)
                </button>
            </div>
        </aside>
    );
};

export const LogsPanel = () => {
    return (
        <aside className="w-[320px] bg-[#1a2234] border-l border-mistral-border h-full flex flex-col z-10 shrink-0 shadow-2xl">
            <div className="p-4 border-b border-mistral-border flex items-center gap-2 bg-mistral-panel">
                <Terminal className="w-4 h-4 text-green-400" />
                <h2 className="text-sm font-semibold text-white">Ejecución en vivo</h2>
            </div>

            <div className="flex-1 bg-mistral-bg p-4 font-mono text-xs overflow-y-auto space-y-3">
                <div className="text-blue-400">[10:14:02] Trigger: InvoiceImage received.</div>
                <div className="text-mistral-yellow">[10:14:03] Pixtral 12B: analyzing image (OCR)...</div>
                <div className="text-green-400">[10:14:05] Pixtral: Texto extraído OK.</div>
                <div className="text-gray-400">  └ Extracted 342 words, confidence 98%</div>
                <div className="text-mistral-yellow">[10:14:05] Agent Analysis: Formatting JSON...</div>
                <div className="text-green-400">[10:14:06] Output Email: Invoice data sent to admin@domain.com.</div>
                <div className="text-white mt-4 border-t border-gray-700 pt-2 opacity-50 block animate-pulse">Waiting for next event...</div>
            </div>

            <div className="p-4 bg-mistral-panel border-t border-mistral-border text-xs text-mistral-muted space-y-1">
                <div className="flex justify-between"><span>Status:</span> <span className="text-green-400 font-medium">Completado</span></div>
                <div className="flex justify-between"><span>Tokens in/out:</span> <span>1.2K / 450</span></div>
                <div className="flex justify-between"><span>Latencia total:</span> <span>4.2s</span></div>
            </div>
        </aside>
    );
};
