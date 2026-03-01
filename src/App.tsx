import React, { useState, useCallback } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  BackgroundVariant
} from '@xyflow/react';
import type { Connection, Edge, Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { PixtralNode, DefaultNode } from './components/nodes/CustomNodes';
import { SettingsPanel, LogsPanel } from './components/Panels';

const nodeTypes = {
  pixtralNode: PixtralNode,
  default: DefaultNode,
};

// --- Initial Data ---
const initialNodes: Node[] = [
  { id: '1', type: 'default', position: { x: 250, y: 150 }, data: { label: 'Trigger: InvoiceImage', description: 'S3 Bucket' } },
  { id: '2', type: 'pixtralNode', position: { x: 550, y: 100 }, data: {} },
  { id: '3', type: 'default', position: { x: 880, y: 150 }, data: { label: 'Agent Analyze', description: 'mistral-large' } },
  { id: '4', type: 'default', position: { x: 1150, y: 250 }, data: { label: 'Email', description: 'admin@domain.com' } },
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', animated: true, type: 'smoothstep' },
  { id: 'e2-3', source: '2', target: '3', animated: true, type: 'smoothstep' },
  { id: 'e3-4', source: '3', target: '4', animated: true, type: 'smoothstep' },
];

export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  // App views: "empty", "live", "config"
  const [view, setView] = useState<'empty' | 'live' | 'config'>('live');

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge({ ...params, animated: true, type: 'smoothstep' }, eds)),
    [setEdges],
  );

  const onNodeClick = (_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    if (view !== 'config') {
      setView('config'); // Automatically open properties panel
    }
  };

  const onPaneClick = () => {
    setSelectedNode(null);
    if (view === 'config') setView('live');
  };

  const setEmptyView = () => {
    setView('empty');
    setNodes([]);
    setEdges([]);
    setSelectedNode(null);
  };

  const setLiveView = () => {
    setView('live');
    setNodes(initialNodes);
    setEdges(initialEdges);
    setSelectedNode(null);
  };

  const setConfigView = () => {
    setView('config');
    setNodes(initialNodes);
    setEdges(initialEdges);
    const pNode = initialNodes.find(n => n.id === '2');
    if (pNode) {
      setSelectedNode(pNode);
      // Let's pretend we "selected" it programmatically
      setNodes((nds) => nds.map((node) => ({ ...node, selected: node.id === '2' })));
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-mistral-bg text-mistral-text font-sans">
      <Header />

      {/* Demo View Switcher (just for the hackathon presentation) */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 flex gap-4 bg-[#1a2234] p-2 rounded-lg border border-mistral-border shadow-lg">
        <button onClick={setEmptyView} className={`text-xs px-3 py-1 rounded ${view === 'empty' ? 'bg-mistral-yellow text-black font-bold' : 'text-mistral-muted hover:text-white'}`}>Vista 1: Vacía</button>
        <button onClick={setLiveView} className={`text-xs px-3 py-1 rounded ${view === 'live' ? 'bg-mistral-yellow text-black font-bold' : 'text-mistral-muted hover:text-white'}`}>Vista 2: Ejecución</button>
        <button onClick={setConfigView} className={`text-xs px-3 py-1 rounded ${view === 'config' ? 'bg-mistral-yellow text-black font-bold' : 'text-mistral-muted hover:text-white'}`}>Vista 3: Config Nodo</button>
      </div>

      <div className="flex flex-1 h-full overflow-hidden relative">
        <Sidebar />

        <main className="flex-1 relative border-x border-mistral-border">
          {view === 'empty' && nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <h1 className="text-4xl font-bold text-gray-700 uppercase tracking-widest">Drag nodos aquí</h1>
            </div>
          )}

          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            fitView
            className="bg-mistral-bg"
          >
            <Background gap={20} color="#374151" variant={BackgroundVariant.Lines} />
            <Controls className="bg-mistral-panel border-mistral-border fill-white text-white" />
            <MiniMap
              className="bg-mistral-panel border border-mistral-border"
              nodeColor="#FCD34D"
              maskColor="rgba(17, 24, 39, 0.7)"
            />
          </ReactFlow>
        </main>

        {view === 'live' && <LogsPanel />}
        {view === 'config' && selectedNode && (
          <SettingsPanel selectedNode={selectedNode} onClose={() => setView('live')} />
        )}
      </div>

      <footer className="h-12 bg-[#1a2234] border-t border-mistral-border flex items-center justify-between px-6 shrink-0 text-xs text-mistral-muted">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${view === 'live' ? 'bg-green-400 animate-pulse' : 'bg-mistral-yellow'}`} />
            {view === 'live' ? 'Ejecutándose' : 'Workflow válido'}
          </span>
          <span className="border-l border-mistral-border pl-4">Costo estimado $0.02</span>
          <span className="border-l border-mistral-border pl-4">Tokens: 1.2K</span>
          <span className="border-l border-mistral-border pl-4">Latencia: 2s</span>
        </div>
        <div>
          <span>Última exec: {view === 'live' ? 'Now' : '2min ago'}</span>
        </div>
      </footer>
    </div>
  );
}
