import { Handle, Position } from '@xyflow/react';
import { Eye, UploadCloud } from 'lucide-react';

export const PixtralNode = ({ selected }: { data: any, selected: boolean }) => {
    return (
        <div className={`w-[240px] bg-mistral-panel rounded-lg shadow-xl overflow-hidden border ${selected ? 'border-mistral-yellow ring-2 ring-mistral-yellow/30' : 'border-mistral-border'} transition-all`}>
            <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-mistral-yellow !border-mistral-bg" />

            {/* Header */}
            <div className="bg-mistral-yellow px-3 py-2 flex items-center gap-2">
                <Eye className="w-4 h-4 text-black" />
                <span className="text-black font-bold text-sm">Pixtral 12B</span>
            </div>

            {/* Body */}
            <div className="p-4 space-y-4">
                {/* Dropzone */}
                <div className="border border-dashed border-mistral-border rounded-md p-4 flex flex-col items-center justify-center gap-2 hover:border-mistral-yellow cursor-pointer transition-colors bg-[#111827]">
                    <UploadCloud className="w-5 h-5 text-mistral-muted" />
                    <span className="text-xs text-mistral-muted text-center">Sube imagen/PDF</span>
                </div>

                {/* Checkboxes */}
                <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-mistral-yellow focus:ring-mistral-yellow focus:ring-offset-gray-800" defaultChecked />
                        <span className="text-xs text-mistral-muted">OCR Extracción</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-mistral-yellow focus:ring-mistral-yellow focus:ring-offset-gray-800" />
                        <span className="text-xs text-mistral-muted">Chart analyze</span>
                    </label>
                </div>
            </div>

            <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-mistral-yellow !border-mistral-bg" />
        </div>
    );
};

export const DefaultNode = ({ data, selected }: { data: any, selected: boolean }) => {
    return (
        <div className={`w-[200px] bg-mistral-panel rounded-lg shadow-xl overflow-hidden border ${selected ? 'border-mistral-yellow ring-2 ring-mistral-yellow/30' : 'border-mistral-border'} transition-all`}>
            <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-mistral-yellow !border-mistral-bg" />
            <div className="px-3 py-2 bg-[#2d3748] border-b border-mistral-border flex items-center gap-2">
                <span className="text-white font-semibold text-sm">{data.label}</span>
            </div>
            <div className="p-3">
                <span className="text-xs text-mistral-muted">{data.description || 'Configurar en panel...'}</span>
            </div>
            <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-mistral-yellow !border-mistral-bg" />
        </div>
    );
};
