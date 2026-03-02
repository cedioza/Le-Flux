import React from 'react';
import {
    Play, Zap, Share2,
    Database, Layers, Globe, Send, MessageCircle
} from 'lucide-react';
import { PixelMistralLogo, PixelRobot, PixelEye, PixelTerminal, PixelDocument } from './icons/PixelIcons';

const categories = [
    {
        name: 'Triggers (Disparadores)',
        color: 'text-green-400',
        nodes: [
            { name: 'Webhook', icon: Zap, type: 'webhookNode' },
            { name: 'Test Trigger', icon: Play, type: 'testNode' }
        ]
    },
    {
        name: 'Mistral Ecosystem',
        nodes: [
            { name: 'Mistral LLM', icon: PixelRobot, type: 'mistralNode' },
            { name: 'Mistral Chat (UI)', icon: PixelRobot, type: 'default' },
            { name: 'Pixtral Vision/OCR', icon: PixelEye, type: 'pixtralNode' },
            { name: 'Codestral', icon: PixelTerminal, type: 'codestralNode' },
            { name: 'Document AI', icon: PixelDocument, type: 'documentAINode' },
            { name: 'Mistral Audio', icon: PixelMistralLogo, type: 'audioNode' }
        ]
    },
    {
        name: 'Core & Data',
        color: 'text-purple-400',
        nodes: [
            { name: 'Data Mapper', icon: Share2, type: 'mapperNode' },
            { name: 'Batch Processing', icon: Layers, type: 'batchNode' },
            { name: 'Archivos / BBDD', icon: Database, type: 'contextNode' }
        ]
    },
    {
        name: 'Integrations',
        color: 'text-blue-400',
        nodes: [
            { name: 'HTTP Request', icon: Globe, type: 'httpNode' },
            { name: 'Telegram Trigger', icon: MessageCircle, type: 'telegramTriggerNode' }
        ]
    },
    {
        name: 'Outputs',
        color: 'text-mistral-muted',
        nodes: [
            { name: 'Response', icon: Send, type: 'responseNode' },
            { name: 'Telegram Message', icon: Send, type: 'telegramMessageNode' }
        ]
    }
];

export const Sidebar = () => {
    const [isCollapsed, setIsCollapsed] = React.useState(false);

    const onDragStart = (event: React.DragEvent, nodeType: string) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.effectAllowed = 'move';
    };

    return (
        <aside className={`${isCollapsed ? 'w-[72px]' : 'w-[280px]'} bg-[#1a2234] border-r border-mistral-border flex flex-col h-full overflow-hidden z-10 shrink-0 transition-all duration-300`}>
            <div className="p-4 border-b border-mistral-border flex items-center gap-3">
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="w-10 h-10 rounded-xl bg-[#f97316] hover:bg-[#ea580c] flex items-center justify-center shrink-0 transition-colors shadow-lg cursor-pointer"
                    title={isCollapsed ? "Expandir panel" : "Contraer panel"}
                >
                    <PixelMistralLogo size={22} className="text-white drop-shadow-sm" />
                </button>
                {!isCollapsed && (
                    <div className="flex items-center gap-2">
                        <PixelMistralLogo className="w-5 h-5 text-mistral-orange" />
                        <span className="font-bold text-white tracking-wide truncate">Mistral UI</span>
                    </div>
                )}
            </div>

            <div className="p-3 space-y-6 flex-1 overflow-y-auto custom-scrollbar overflow-x-hidden">
                {categories.map((category) => (
                    <div key={category.name} className="flex flex-col gap-1">
                        {!isCollapsed && (
                            <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1 whitespace-nowrap">{category.name}</h3>
                        )}
                        <div className="space-y-1">
                            {category.nodes.map((node) => {
                                const Icon = node.icon;
                                return (
                                    <div
                                        key={node.name}
                                        title={isCollapsed ? node.name : undefined}
                                        className={`flex items-center ${isCollapsed ? 'justify-center p-3' : 'gap-3 p-2.5'} bg-transparent hover:bg-mistral-panel rounded-lg cursor-grab active:cursor-grabbing hover:ring-2 hover:ring-mistral-orange transition-all group`}
                                        draggable
                                        onDragStart={(e) => onDragStart(e, node.type)}
                                    >
                                        <Icon className={`w-5 h-5 ${category.color || 'text-mistral-orange'} group-hover:scale-110 transition-transform shrink-0 drop-shadow`} />
                                        {!isCollapsed && (
                                            <span className="text-sm text-gray-300 group-hover:text-mistral-orange font-medium truncate tracking-wide">{node.name}</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Simulated Mistral Profile Section */}
            <div className={`p-4 border-t border-mistral-border flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} shrink-0`}>
                <div className="w-10 h-10 rounded-full shrink-0 bg-[#2d3748] flex items-center justify-center text-xs font-bold text-white border border-gray-600">
                    LZ
                </div>
                {!isCollapsed && (
                    <div className="flex flex-col overflow-hidden">
                        <span className="text-sm text-white font-medium truncate">Le Flux Builder</span>
                        <span className="text-[11px] text-[#f97316] truncate">Upgrade a Pro</span>
                    </div>
                )}
            </div>
        </aside>
    );
};
