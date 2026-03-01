import React from 'react';
import { Eye, MessageSquare, Bot, Search, Code, FileText, Zap, Send } from 'lucide-react';

const categories = [
    {
        name: 'Yellow (Core)',
        color: 'text-mistral-yellow',
        nodes: [
            { name: 'Pixtral Vision/OCR', icon: Eye, type: 'pixtralNode' },
            { name: 'Mistral Chat', icon: MessageSquare, type: 'default' },
            { name: 'Agent Handoff', icon: Bot, type: 'default' }
        ]
    },
    {
        name: 'Light Blue (Tools)',
        color: 'text-blue-400',
        nodes: [
            { name: 'Web Search', icon: Search, type: 'default' },
            { name: 'Code Execution', icon: Code, type: 'default' },
            { name: 'Document Library (RAG)', icon: FileText, type: 'default' }
        ]
    },
    {
        name: 'Green (I/O)',
        color: 'text-green-400',
        nodes: [
            { name: 'Trigger (Webhook/Timer)', icon: Zap, type: 'default' },
            { name: 'Output (Email/Slack)', icon: Send, type: 'default' }
        ]
    }
];

export const Sidebar = () => {
    const onDragStart = (event: React.DragEvent, nodeType: string) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.effectAllowed = 'move';
    };

    return (
        <aside className="w-[280px] bg-[#1a2234] border-r border-mistral-border flex flex-col h-full overflow-y-auto z-10 shrink-0 backdrop-blur-md bg-opacity-80">
            <div className="p-4 border-b border-mistral-border">
                <h2 className="text-sm font-semibold text-mistral-muted uppercase tracking-wider">Nodes</h2>
            </div>

            <div className="p-4 space-y-6 flex-1">
                {categories.map((category) => (
                    <div key={category.name}>
                        <h3 className="text-xs font-medium text-mistral-muted mb-3">{category.name}</h3>
                        <div className="space-y-2">
                            {category.nodes.map((node) => {
                                const Icon = node.icon;
                                return (
                                    <div
                                        key={node.name}
                                        className="flex items-center gap-3 p-3 bg-mistral-panel rounded-md cursor-grab active:cursor-grabbing hover:ring-1 hover:ring-mistral-yellow transition-all group"
                                        draggable
                                        onDragStart={(e) => onDragStart(e, node.type)}
                                    >
                                        <Icon className={`w-5 h-5 ${category.color} group-hover:scale-110 transition-transform`} />
                                        <span className="text-sm text-mistral-muted group-hover:text-white">{node.name}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </aside>
    );
};
