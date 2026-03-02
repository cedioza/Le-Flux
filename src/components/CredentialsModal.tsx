import { X, Lock, Save, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { PixelMistralLogo } from './icons/PixelIcons';

interface Credentials {
    mistralKey: string;
    huggingFaceKey: string;
    elevenLabsKey: string;
}

interface CredentialsModalProps {
    isOpen: boolean;
    onClose: () => void;
    credentials: Credentials;
    onSave: (creds: Credentials) => void;
}

export const CredentialsModal = ({ isOpen, onClose, credentials, onSave }: CredentialsModalProps) => {
    const [localCreds, setLocalCreds] = useState<Credentials>({
        mistralKey: '',
        huggingFaceKey: '',
        elevenLabsKey: ''
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setLocalCreds({
                mistralKey: credentials.mistralKey || '',
                huggingFaceKey: credentials.huggingFaceKey || '',
                elevenLabsKey: credentials.elevenLabsKey || ''
            });
        }
    }, [isOpen, credentials]);

    if (!isOpen) return null;

    const handleSave = () => {
        setIsSaving(true);
        // Simulate a tiny delay for UX feedback
        setTimeout(() => {
            onSave(localCreds);
            setIsSaving(false);
            onClose();
        }, 400);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-[#111827] border border-mistral-border rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-mistral-border bg-[#1a2234]">
                    <div className="flex items-center gap-3">
                        <Lock className="w-5 h-5 text-mistral-orange" />
                        <h2 className="text-white font-bold text-lg">API Credentials</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors hover:bg-white/10 p-1 rounded-md"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-5">

                    {/* Mistral AI */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-200">
                            <PixelMistralLogo size={16} className="text-mistral-orange" />
                            Mistral API Key
                        </label>
                        <input
                            type="password"
                            className="w-full bg-[#1a2234] border border-mistral-border rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-mistral-orange focus:ring-1 focus:ring-mistral-orange transition-all font-mono placeholder:text-gray-600"
                            placeholder="sk-..."
                            value={localCreds.mistralKey}
                            onChange={(e) => setLocalCreds(prev => ({ ...prev, mistralKey: e.target.value }))}
                        />
                    </div>

                    {/* Hugging Face */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-200">
                            <span className="text-lg leading-none">🤗</span>
                            Hugging Face Token
                        </label>
                        <input
                            type="password"
                            className="w-full bg-[#1a2234] border border-mistral-border rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-mistral-orange focus:ring-1 focus:ring-mistral-orange transition-all font-mono placeholder:text-gray-600"
                            placeholder="hf_..."
                            value={localCreds.huggingFaceKey}
                            onChange={(e) => setLocalCreds(prev => ({ ...prev, huggingFaceKey: e.target.value }))}
                        />
                        <p className="text-[10px] text-gray-500">Required for Serverless Inference Endpoints.</p>
                    </div>

                    {/* ElevenLabs */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-200">
                            🎙️ ElevenLabs API Key
                        </label>
                        <input
                            type="password"
                            className="w-full bg-[#1a2234] border border-mistral-border rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-mistral-orange focus:ring-1 focus:ring-mistral-orange transition-all font-mono placeholder:text-gray-600"
                            placeholder="sk_..."
                            value={localCreds.elevenLabsKey}
                            onChange={(e) => setLocalCreds(prev => ({ ...prev, elevenLabsKey: e.target.value }))}
                        />
                        <p className="text-[10px] text-gray-500">Required for Text-to-Speech nodes.</p>
                    </div>

                    {/* Telegram Placeholder */}
                    <div className="space-y-2 opacity-50 grayscale pointer-events-none">
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-200">
                            ✈️ Telegram Bot Token
                        </label>
                        <input
                            type="password"
                            className="w-full bg-[#1a2234] border border-mistral-border rounded-md px-3 py-2 text-sm text-white font-mono placeholder:text-gray-600"
                            placeholder="123456:ABC-DEF1234... (Coming Soon)"
                            disabled
                        />
                    </div>

                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-mistral-border bg-[#1a2234] flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 bg-mistral-orange hover:bg-mistral-hover text-black px-6 py-2 rounded-md font-bold text-sm transition-all active:scale-95 disabled:opacity-70 disabled:pointer-events-none shadow-[0_0_15px_rgba(252,211,77,0.2)]"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                Save Credentials
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
