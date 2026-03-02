import { Handle, Position } from '@xyflow/react';
import { UploadCloud, Layers, Database, Send, MessageCircle } from 'lucide-react';
import { PixelMistralLogo, PixelRobot, PixelEye, PixelTerminal, PixelDocument } from '../icons/PixelIcons';

export const PixtralNode = ({ data, selected }: { data: any, selected: boolean }) => {
    return (
        <div className={`w-[240px] bg-mistral-panel rounded-lg shadow-xl overflow-hidden border ${selected ? 'border-mistral-orange ring-2 ring-mistral-orange/30' : 'border-mistral-border'} ${data.isExecuting ? 'ring-4 ring-green-500 shadow-[0_0_20px_rgba(34,197,94,0.6)]' : ''} transition-all duration-300`}>
            <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-mistral-orange !border-mistral-bg" />

            {/* Header */}
            <div className="bg-mistral-orange px-3 py-2 flex items-center gap-2">
                <PixelEye className="w-5 h-5 text-black drop-shadow-sm" />
                <span className="text-black font-bold text-sm">Pixtral 12B</span>
            </div>

            {/* Body */}
            <div className="p-4 space-y-4">
                {/* Dropzone */}
                <div className="border border-dashed border-mistral-border rounded-md p-4 flex flex-col items-center justify-center gap-2 hover:border-mistral-orange cursor-pointer transition-colors bg-[#111827]">
                    <UploadCloud className="w-5 h-5 text-mistral-muted" />
                    <span className="text-xs text-mistral-muted text-center">Upload image/PDF</span>
                </div>

                {/* Checkboxes */}
                <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-mistral-orange focus:ring-mistral-orange focus:ring-offset-gray-800" defaultChecked />
                        <span className="text-xs text-mistral-muted">OCR Extraction</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-mistral-orange focus:ring-mistral-orange focus:ring-offset-gray-800" />
                        <span className="text-xs text-mistral-muted">Chart analyze</span>
                    </label>
                </div>
            </div>

            <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-mistral-orange !border-mistral-bg" />
        </div>
    );
};

export const TestNode = ({ data, selected }: { data: any, selected: boolean }) => {
    return (
        <div className={`w-[200px] bg-mistral-panel rounded-lg shadow-xl overflow-hidden border ${selected ? 'border-mistral-orange ring-2 ring-mistral-orange/30' : 'border-mistral-border'} ${data.isExecuting ? 'ring-4 ring-green-500 shadow-[0_0_20px_rgba(34,197,94,0.6)]' : ''} transition-all duration-300`}>
            <div className="px-3 py-2 bg-mistral-bg border-b border-mistral-border flex items-center justify-between">
                <span className="text-white font-semibold text-sm">{data.label || 'Test Trigger'}</span>
                <div className="w-2 h-2 rounded-full bg-blue-400" />
            </div>
            <div className="p-3 flex justify-center">
                <button className="bg-mistral-orange text-black text-xs font-bold py-1 px-4 rounded w-full hover:bg-mistral-hover transition-colors">
                    Run Test ▶
                </button>
            </div>
            <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-mistral-orange !border-mistral-bg" />
        </div>
    );
};

export const WebhookNode = ({ data, selected }: { data: any, selected: boolean }) => {
    return (
        <div className={`w-[220px] bg-mistral-panel rounded-lg shadow-xl overflow-hidden border ${selected ? 'border-mistral-orange ring-2 ring-mistral-orange/30' : 'border-mistral-border'} ${data.isExecuting ? 'ring-4 ring-green-500 shadow-[0_0_20px_rgba(34,197,94,0.6)]' : ''} transition-all duration-300`}>
            <div className="px-3 py-2 bg-[#1a2234] border-b border-mistral-border flex items-center gap-2">
                <span className="text-white font-semibold text-sm">Webhook</span>
                <span className="ml-auto text-[10px] text-green-400 font-mono animate-pulse">Listening...</span>
            </div>
            <div className="p-3">
                <div className="bg-mistral-bg text-gray-400 text-xs p-2 rounded border border-mistral-border font-mono break-all line-clamp-2">
                    {data.url || 'https://leflux.ai/w/1a2b3c'}
                </div>
            </div>
            <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-mistral-orange !border-mistral-bg" />
        </div>
    );
};

export const HttpNode = ({ data, selected }: { data: any, selected: boolean }) => {
    // Default to GET if not provided
    const method = data.method || 'GET';
    const methodColors: Record<string, string> = {
        'GET': 'text-green-400 bg-green-400/10',
        'POST': 'text-blue-400 bg-blue-400/10',
        'PUT': 'text-yellow-400 bg-yellow-400/10',
        'DELETE': 'text-red-400 bg-red-400/10',
    };

    return (
        <div className={`w-[240px] bg-mistral-panel rounded-lg shadow-xl overflow-hidden border ${selected ? 'border-mistral-orange ring-2 ring-mistral-orange/30' : 'border-mistral-border'} ${data.isExecuting ? 'ring-4 ring-green-500 shadow-[0_0_20px_rgba(34,197,94,0.6)]' : ''} transition-all duration-300`}>
            <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-mistral-orange !border-mistral-bg" />
            <div className="px-3 py-2 bg-[#2d3748] border-b border-mistral-border flex items-center gap-2">
                <span className="text-white font-semibold text-sm">HTTP Request</span>
            </div>
            <div className="p-3 flex items-center gap-2">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${methodColors[method] || methodColors['GET']}`}>
                    {method}
                </span>
                <span className="text-xs text-mistral-muted truncate">{data.url || 'https://api.example.com...'}</span>
            </div>
            <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-mistral-orange !border-mistral-bg" />
        </div>
    );
};

export const MapperNode = ({ data, selected }: { data: any, selected: boolean }) => {
    return (
        <div className={`w-[200px] bg-mistral-panel rounded-lg shadow-xl overflow-hidden border ${selected ? 'border-mistral-orange ring-2 ring-mistral-orange/30' : 'border-mistral-border'} ${data.isExecuting ? 'ring-4 ring-green-500 shadow-[0_0_20px_rgba(34,197,94,0.6)]' : ''} transition-all duration-300`}>
            <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-mistral-orange !border-mistral-bg" />
            <div className="px-3 py-2 bg-mistral-bg border-b border-mistral-border flex items-center gap-2">
                <span className="text-mistral-orange font-semibold text-sm">Data Mapper</span>
            </div>
            <div className="p-3">
                <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                        <span>Key</span><span>Value</span>
                    </div>
                    {data.mappings && data.mappings.length > 0 ? (
                        data.mappings.map((m: any, i: number) => (
                            <div key={i} className="flex justify-between text-xs text-white bg-[#1a2234] p-1 rounded">
                                <span>{m.key}</span>
                                <span className="text-mistral-muted truncate max-w-[80px]">{m.value}</span>
                            </div>
                        ))
                    ) : (
                        <span className="text-xs text-mistral-muted italic">Configure params...</span>
                    )}
                </div>
            </div>
            <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-mistral-orange !border-mistral-bg" />
        </div>
    );
};

export const ResponseNode = ({ data, selected }: { data: any, selected: boolean }) => {
    return (
        <div className={`w-[200px] bg-mistral-panel rounded-lg shadow-xl overflow-hidden border ${selected ? 'border-mistral-orange ring-2 ring-mistral-orange/30' : 'border-mistral-border'} ${data.isExecuting ? 'ring-4 ring-green-500 shadow-[0_0_20px_rgba(34,197,94,0.6)]' : ''} transition-all duration-300`}>
            <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-mistral-orange !border-mistral-bg" />
            <div className="px-3 py-2 bg-green-900 border-b border-green-800 flex items-center gap-2">
                <span className="text-white font-semibold text-sm">Response</span>
                <span className="ml-auto text-[10px] text-green-300 font-mono bg-green-800 px-1 rounded">200 OK</span>
            </div>
            <div className="p-3">
                <span className="text-xs text-mistral-muted">{data.description || 'Devuelve JSON al cliente'}</span>
            </div>
        </div>
    );
};

export const DefaultNode = ({ data, selected }: { data: any, selected: boolean }) => {
    return (
        <div className={`w-[200px] bg-mistral-panel rounded-lg shadow-xl overflow-hidden border ${selected ? 'border-mistral-orange ring-2 ring-mistral-orange/30' : 'border-mistral-border'} ${data.isExecuting ? 'ring-4 ring-green-500 shadow-[0_0_20px_rgba(34,197,94,0.6)]' : ''} transition-all duration-300`}>
            <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-mistral-orange !border-mistral-bg" />
            <div className="px-3 py-2 bg-[#2d3748] border-b border-mistral-border flex items-center gap-2">
                <span className="text-white font-semibold text-sm">{data.label}</span>
            </div>
            <div className="p-3">
                <span className="text-xs text-mistral-muted">{data.description || 'Configurar en panel...'}</span>
            </div>
            <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-mistral-orange !border-mistral-bg" />
        </div>
    );
};

export const CodestralNode = ({ data, selected }: { data: any, selected: boolean }) => {
    return (
        <div className={`w-[220px] bg-mistral-panel rounded-lg shadow-xl overflow-hidden border ${selected ? 'border-mistral-orange ring-2 ring-mistral-orange/30' : 'border-mistral-border'} ${data.isExecuting ? 'ring-4 ring-green-500 shadow-[0_0_20px_rgba(34,197,94,0.6)]' : ''} transition-all duration-300`}>
            <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-mistral-orange !border-mistral-bg" />
            <div className="bg-[#1a2234] px-3 py-2 flex items-center gap-2 border-b border-mistral-border">
                <PixelTerminal className="w-5 h-5 text-blue-400" />
                <span className="text-white font-bold text-sm">Codestral</span>
            </div>
            <div className="p-3 bg-black/50">
                <div className="font-mono text-xs text-green-400">&gt; Generating code...</div>
                <div className="text-[10px] text-mistral-muted mt-2">{data.model || 'codestral-latest'}</div>
            </div>
            <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-mistral-orange !border-mistral-bg" />
        </div>
    );
};

export const DocumentAINode = ({ data, selected }: { data: any, selected: boolean }) => {
    return (
        <div className={`w-[220px] bg-mistral-panel rounded-lg shadow-xl overflow-hidden border ${selected ? 'border-mistral-orange ring-2 ring-mistral-orange/30' : 'border-mistral-border'} ${data.isExecuting ? 'ring-4 ring-green-500 shadow-[0_0_20px_rgba(34,197,94,0.6)]' : ''} transition-all duration-300`}>
            <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-mistral-orange !border-mistral-bg" />
            <div className="bg-[#1a2234] px-3 py-2 flex items-center gap-2 border-b border-mistral-border">
                <PixelDocument className="w-5 h-5 text-purple-400" />
                <span className="text-white font-bold text-sm">Document AI</span>
            </div>
            <div className="p-3">
                <div className="text-xs text-mistral-muted mb-2">Extracting structured JSON from complex PDFs.</div>
                <div className="bg-[#2d3748] rounded px-2 py-1 text-[10px] text-white flex justify-between">
                    <span>Format</span>
                    <span className="text-mistral-orange">JSON Schema</span>
                </div>
            </div>
            <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-mistral-orange !border-mistral-bg" />
        </div>
    );
};

export const AudioNode = ({ data, selected }: { data: any, selected: boolean }) => {
    return (
        <div className={`w-[200px] bg-mistral-panel rounded-lg shadow-xl overflow-hidden border ${selected ? 'border-mistral-orange ring-2 ring-mistral-orange/30' : 'border-mistral-border'} ${data.isExecuting ? 'ring-4 ring-green-500 shadow-[0_0_20px_rgba(34,197,94,0.6)]' : ''} transition-all duration-300`}>
            <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-mistral-orange !border-mistral-bg" />
            <div className="bg-[#1a2234] px-3 py-2 flex items-center gap-2 border-b border-mistral-border">
                <PixelMistralLogo className="w-5 h-5 text-pink-400" />
                <span className="text-white font-bold text-sm">Mistral Audio</span>
            </div>
            <div className="p-3">
                <div className="h-4 bg-[#2d3748] rounded animate-pulse w-full flex items-center justify-evenly overflow-hidden">
                    <div className="w-1 h-3 bg-pink-400 rounded-full"></div>
                    <div className="w-1 h-2 bg-pink-400 rounded-full"></div>
                    <div className="w-1 h-4 bg-pink-400 rounded-full"></div>
                    <div className="w-1 h-1 bg-pink-400 rounded-full"></div>
                </div>
                <div className="text-[10px] text-mistral-muted mt-2 text-center">Speech to Text</div>
            </div>
            <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-mistral-orange !border-mistral-bg" />
        </div>
    );
};

export const BatchNode = ({ data, selected }: { data: any, selected: boolean }) => {
    return (
        <div className={`w-[200px] bg-mistral-panel rounded-lg shadow-xl overflow-hidden border ${selected ? 'border-mistral-orange ring-2 ring-mistral-orange/30' : 'border-mistral-border'} ${data.isExecuting ? 'ring-4 ring-green-500 shadow-[0_0_20px_rgba(34,197,94,0.6)]' : ''} transition-all duration-300`}>
            <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-mistral-orange !border-mistral-bg" />
            <div className="bg-orange-900/30 px-3 py-2 flex items-center gap-2 border-b border-orange-900/50">
                <Layers className="w-4 h-4 text-orange-400" />
                <span className="text-white font-bold text-sm">Batch (Lotes)</span>
            </div>
            <div className="p-3">
                <div className="text-xs text-mistral-muted text-center">Inferencia paralela 50% discount</div>
            </div>
            <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-mistral-orange !border-mistral-bg" />
        </div>
    );
};

export const ContextNode = ({ data, selected }: { data: any, selected: boolean }) => {
    return (
        <div className={`w-[200px] bg-mistral-panel rounded-lg shadow-xl overflow-hidden border ${selected ? 'border-mistral-orange ring-2 ring-mistral-orange/30' : 'border-mistral-border'} ${data.isExecuting ? 'ring-4 ring-green-500 shadow-[0_0_20px_rgba(34,197,94,0.6)]' : ''} transition-all duration-300`}>
            <div className="bg-[#1a2234] px-3 py-2 flex items-center gap-2 border-b border-mistral-border">
                <Database className="w-4 h-4 text-teal-400" />
                <span className="text-white font-bold text-sm">Archivos/Context</span>
            </div>
            <div className="p-3">
                <div className="text-xs text-mistral-muted mb-2">Knowledge Base</div>
                <div className="bg-[#2d3748] text-[10px] text-white px-2 py-1 rounded truncate">
                    {data.filename || 'dataset_v2.jsonl'}
                </div>
            </div>
            <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-mistral-orange !border-mistral-bg" />
        </div>
    );
};

export const MistralNode = ({ data, selected }: { data: any, selected: boolean }) => {
    return (
        <div className={`w-[240px] bg-mistral-panel rounded-lg shadow-xl overflow-hidden border ${selected ? 'border-mistral-orange ring-2 ring-mistral-orange/30' : 'border-mistral-border'} ${data.isExecuting ? 'ring-4 ring-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.6)]' : ''} transition-all duration-300`}>
            <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-mistral-orange !border-mistral-bg" />
            <div className="bg-[#1a2234] px-3 py-2 flex items-center gap-2 border-b border-mistral-border">
                <PixelRobot size={22} className="text-mistral-orange drop-shadow-sm" />
                <span className="text-white font-bold text-sm">Mistral LLM</span>
            </div>
            <div className="p-3 space-y-2">
                <div className="text-[10px] text-mistral-muted">Model: <span className="text-white font-mono">{data.model || 'mistral-large-latest'}</span></div>
                <div className="bg-[#0b101e] border border-gray-700/50 p-2 rounded text-[9px] text-gray-400 line-clamp-2">
                    {data.systemPrompt || 'System prompt no configurado...'}
                </div>
            </div>
            <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-mistral-orange !border-mistral-bg" />
        </div>
    );
};

export const HuggingFaceNode = ({ data, selected }: { data: any, selected: boolean }) => {
    return (
        <div className={`w-[240px] bg-mistral-panel rounded-lg shadow-xl overflow-hidden border ${selected ? 'border-yellow-400 ring-2 ring-yellow-400/30' : 'border-mistral-border'} ${data.isExecuting ? 'ring-4 ring-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.6)]' : ''} transition-all duration-300`}>
            <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-yellow-400 !border-mistral-bg" />
            <div className="bg-[#1a2234] px-3 py-2 flex items-center gap-2 border-b border-mistral-border">
                <span className="text-xl leading-none">🤗</span>
                <span className="text-white font-bold text-sm">HuggingFace</span>
            </div>
            <div className="p-3 space-y-2">
                <div className="text-[10px] text-mistral-muted">Model: <span className="text-white font-mono break-all">{data.model || 'meta-llama/Meta-Llama-3-8B-Instruct'}</span></div>
            </div>
            <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-yellow-400 !border-mistral-bg" />
        </div>
    );
};

export const ElevenLabsNode = ({ data, selected }: { data: any, selected: boolean }) => {
    return (
        <div className={`w-[240px] bg-mistral-panel rounded-lg shadow-xl overflow-hidden border ${selected ? 'border-indigo-400 ring-2 ring-indigo-400/30' : 'border-mistral-border'} ${data.isExecuting ? 'ring-4 ring-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.6)]' : ''} transition-all duration-300`}>
            <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-indigo-400 !border-mistral-bg" />
            <div className="bg-[#1a2234] px-3 py-2 flex items-center gap-2 border-b border-mistral-border">
                <span className="text-xl leading-none">🎙️</span>
                <span className="text-white font-bold text-sm">ElevenLabs TTS</span>
            </div>
            <div className="p-3 space-y-2">
                <div className="text-[10px] text-mistral-muted">Voice: <span className="text-white font-mono">{data.voiceId || 'JBFqnCBcs611...'}</span></div>
                <div className="bg-[#0b101e] border border-gray-700/50 p-2 rounded text-[9px] text-gray-400 line-clamp-2">
                    {data.text || 'Texto a convertir...'}
                </div>
            </div>
            <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-indigo-400 !border-mistral-bg" />
        </div>
    );
};

export const TelegramTriggerNode = ({ data, selected }: { data: any, selected: boolean }) => {
    return (
        <div className={`w-[220px] bg-mistral-panel rounded-lg shadow-xl overflow-hidden border ${selected ? 'border-[#0088cc] ring-2 ring-[#0088cc]/50' : 'border-mistral-border'} ${data.isExecuting ? 'ring-4 ring-green-500 shadow-[0_0_20px_rgba(34,197,94,0.6)]' : ''} transition-all duration-300`}>
            <div className="bg-[#0088cc]/20 px-3 py-2 flex items-center gap-2 border-b border-[#0088cc]/30">
                <MessageCircle className="w-4 h-4 text-[#0088cc]" />
                <span className="text-white font-bold text-sm">Telegram Bot</span>
                <span className="ml-auto text-[10px] text-green-400 font-mono animate-pulse">Listening...</span>
            </div>
            <div className="p-3">
                <div className="bg-[#111827] text-[#0088cc] text-[10px] p-2 rounded border border-[#0088cc]/30 font-mono break-all line-clamp-2">
                    {data.url || 'https://leflux.ai/api/telegram-webhook/123'}
                </div>
            </div>
            <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-mistral-orange !border-mistral-bg" />
        </div>
    );
};

export const TelegramMessageNode = ({ data, selected }: { data: any, selected: boolean }) => {
    return (
        <div className={`w-[220px] bg-mistral-panel rounded-lg shadow-xl overflow-hidden border ${selected ? 'border-[#0088cc] ring-2 ring-[#0088cc]/50' : 'border-mistral-border'} ${data.isExecuting ? 'ring-4 ring-green-500 shadow-[0_0_20px_rgba(34,197,94,0.6)]' : ''} transition-all duration-300`}>
            <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-mistral-orange !border-mistral-bg" />
            <div className="bg-[#0088cc] px-3 py-2 flex items-center gap-2 border-b border-[#004f7a]">
                <Send className="w-4 h-4 text-white" />
                <span className="text-white font-bold text-sm drop-shadow-md">Send Telegram</span>
            </div>
            <div className="p-3 bg-[#111827]">
                <div className="text-[10px] text-mistral-muted truncate hidden">Chat ID: {data.chatId || '{{ telegramNode.data.chat_id }}'}</div>
                <div className="text-[10px] text-gray-300 truncate max-w-[180px] bg-white/5 p-1 rounded mt-1">"{data.message || 'Escribe un mensaje'}"</div>
            </div>
            <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-mistral-orange !border-mistral-bg" />
        </div>
    );
};
