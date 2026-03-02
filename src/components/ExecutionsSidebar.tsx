import { Clock, CheckCircle2, XCircle, Search, Filter } from 'lucide-react';

export interface ExecutionData {
    id: string;
    webhookId: string;
    flowId?: string;
    timestamp: string;
    success: boolean;
    latency: number;
    nodesContext: Record<string, any>;
}

interface ExecutionsSidebarProps {
    executions: ExecutionData[];
    activeExecutionId: string | null;
    onSelectExecution: (exec: ExecutionData) => void;
}

export const ExecutionsSidebar = ({ executions, activeExecutionId, onSelectExecution }: ExecutionsSidebarProps) => {
    return (
        <aside className="w-80 h-full bg-[#1a2234] border-r border-mistral-border flex flex-col shrink-0">
            <div className="p-4 border-b border-mistral-border bg-mistral-panel flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <h2 className="text-white font-semibold flex items-center gap-2">
                        <Clock className="w-4 h-4 text-mistral-orange" />
                        Executions
                    </h2>
                    <button className="text-mistral-muted hover:text-white p-1 rounded hover:bg-[#2d3748]">
                        <Filter className="w-4 h-4" />
                    </button>
                </div>

                <div className="relative">
                    <Search className="w-3 h-3 text-mistral-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Search by ID..."
                        className="w-full bg-[#0b101e] border border-mistral-border rounded-md pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-mistral-orange placeholder-gray-600 transition-colors"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-mistral-bg">
                {executions.length === 0 ? (
                    <div className="p-6 text-center text-mistral-muted text-sm italic">
                        No recent executions.
                        <div className="mt-2 text-xs">Webhook calls in production will appear here.</div>
                    </div>
                ) : (
                    <div className="divide-y divide-mistral-border">
                        {executions.map((exec) => {
                            const date = new Date(exec.timestamp);
                            const isActive = activeExecutionId === exec.id;

                            return (
                                <button
                                    key={exec.id}
                                    onClick={() => onSelectExecution(exec)}
                                    className={`w-full text-left p-4 hover:bg-[#1a2234] transition-colors group relative border-l-4 ${isActive ? 'border-mistral-orange bg-[#1a2234]' : 'border-transparent'}`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="flex items-center gap-2">
                                            {exec.success ? (
                                                <CheckCircle2 className="w-4 h-4 text-green-400 group-hover:scale-110 transition-transform" />
                                            ) : (
                                                <XCircle className="w-4 h-4 text-red-500 group-hover:scale-110 transition-transform" />
                                            )}
                                            <span className="text-white font-medium text-sm">
                                                {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="pl-6 text-xs text-mistral-muted space-y-0.5">
                                        <div className="flex justify-between">
                                            <span className={exec.success ? 'text-green-400/80' : 'text-red-400/80'}>
                                                {exec.success ? 'Succeeded' : 'Failed'} en {(exec.latency / 1000).toFixed(3)}s
                                            </span>
                                            <span className="font-mono text-[10px] opacity-50">{exec.id.split('_').pop()}</span>
                                        </div>
                                    </div>

                                    {isActive && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-mistral-orange shadow-[0_0_8px_rgba(249,115,22,0.8)]"></div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </aside>
    );
};
