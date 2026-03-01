import { Play, Square, Link as LinkIcon, Menu, Save, Plus, ChevronDown } from 'lucide-react';
import { PixelMistralLogo } from './icons/PixelIcons';

interface HeaderProps {
    flows: { id: string, name: string }[];
    currentFlowId: string;
    onSelectFlow: (id: string) => void;
    onNewFlow: () => void;
    onSaveFlow: () => void;
    apiKey: string;
    onApiKeyChange: (key: string) => void;
    onPlay: () => void;
    onStop: () => void;
    isExecuting: boolean;
}

export const Header = ({ flows, currentFlowId, onSelectFlow, onNewFlow, onSaveFlow, apiKey, onApiKeyChange, onPlay, onStop, isExecuting }: HeaderProps) => {
    return (
        <header className="h-16 bg-mistral-bg border-b border-mistral-border flex items-center justify-between px-6 shrink-0 z-50">
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                    {/* Official Mistral Logo */}
                    <div className="flex items-center justify-center text-mistral-orange drop-shadow-md">
                        <PixelMistralLogo size={32} />
                    </div>
                    <span className="text-mistral-orange font-bold text-xl tracking-wide shrink-0">Mistral AI Studio</span>
                </div>

                <div className="hidden md:flex items-center gap-4 ml-8 relative group">
                    <button className="flex items-center gap-2 bg-[#1a2234] border border-mistral-border px-3 py-1.5 rounded text-sm text-white hover:border-mistral-orange transition-colors">
                        <span className="truncate max-w-[150px]">
                            {flows.find(f => f.id === currentFlowId)?.name || 'Untitled Flow'}
                        </span>
                        <ChevronDown className="w-4 h-4 text-mistral-muted" />
                    </button>

                    <div className="absolute top-full left-0 mt-1 w-48 bg-mistral-panel border border-mistral-border rounded shadow-xl hidden group-hover:block">
                        <div className="py-1 max-h-48 overflow-y-auto">
                            {flows.map(f => (
                                <button
                                    key={f.id}
                                    onClick={() => onSelectFlow(f.id)}
                                    className={`w-full text-left px-4 py-2 text-sm hover:bg-[#2d3748] ${f.id === currentFlowId ? 'text-mistral-orange font-bold' : 'text-mistral-muted hover:text-white'}`}
                                >
                                    {f.name}
                                </button>
                            ))}
                        </div>
                        <div className="border-t border-mistral-border py-1">
                            <button onClick={onNewFlow} className="w-full text-left px-4 py-2 text-sm text-green-400 hover:bg-[#2d3748] flex items-center gap-2">
                                <Plus className="w-4 h-4" /> Nuevo Flujo
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative">
                    <input
                        type="password"
                        placeholder="Mistral API Key..."
                        value={apiKey}
                        onChange={(e) => onApiKeyChange(e.target.value)}
                        className="bg-mistral-panel border border-mistral-border rounded-md px-3 py-1.5 text-sm text-white focus:outline-none focus:border-mistral-orange w-48 transition-colors"
                    />
                    {!apiKey && <div className="absolute right-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-red-500 animate-pulse" title="API Key Required" />}
                    {apiKey && <div className="absolute right-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-green-500" title="API Key Set" />}
                </div>

                <button onClick={onSaveFlow} className="flex items-center gap-2 bg-[#1a2234] hover:bg-[#2d3748] border border-mistral-border text-mistral-muted hover:text-white transition-colors px-4 py-1.5 rounded-md text-sm">
                    <Save className="w-4 h-4" />
                    Guardar
                </button>

                <button className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-mistral-panel text-mistral-muted hover:text-white transition-colors">
                    <LinkIcon className="w-4 h-4" />
                </button>

                {isExecuting ? (
                    <button
                        onClick={onStop}
                        className="font-semibold px-6 py-2 rounded-md flex items-center gap-2 transition-transform shadow-[0_0_15px_rgba(239,68,68,0.3)] bg-red-500 hover:bg-red-400 text-white active:scale-95"
                    >
                        <Square className="w-4 h-4 fill-current" />
                        Detener
                    </button>
                ) : (
                    <button
                        onClick={onPlay}
                        className="font-semibold px-6 py-2 rounded-md flex items-center gap-2 transition-transform shadow-[0_0_15px_rgba(252,211,77,0.3)] bg-mistral-orange hover:bg-mistral-hover text-black active:scale-95"
                    >
                        <Play className="w-4 h-4 fill-current" />
                        Play
                    </button>
                )}

                <button className="md:hidden text-mistral-muted ml-2">
                    <Menu className="w-6 h-6" />
                </button>
            </div>
        </header>
    );
};
