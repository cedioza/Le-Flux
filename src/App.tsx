import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  useReactFlow,
  addEdge,
  BackgroundVariant
} from '@xyflow/react';
import type { Connection, Edge, Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { PixtralNode, DefaultNode, TestNode, WebhookNode, HttpNode, MapperNode, ResponseNode, CodestralNode, DocumentAINode, AudioNode, BatchNode, ContextNode, MistralNode } from './components/nodes/CustomNodes';
import { SettingsPanel, LogsPanel } from './components/Panels';
import DeletableEdge from './components/nodes/CustomEdges';

const nodeTypes = {
  pixtralNode: PixtralNode,
  testNode: TestNode,
  webhookNode: WebhookNode,
  httpNode: HttpNode,
  mapperNode: MapperNode,
  responseNode: ResponseNode,
  codestralNode: CodestralNode,
  documentAINode: DocumentAINode,
  audioNode: AudioNode,
  batchNode: BatchNode,
  contextNode: ContextNode,
  mistralNode: MistralNode,
  default: DefaultNode,
};

const edgeTypes = {
  deletableEdge: DeletableEdge,
};

// --- Initial Data (PokeAPI Flow) ---
const initialNodes: Node[] = [
  { id: '1', type: 'testNode', position: { x: 250, y: 150 }, data: { label: 'PokeAPI Trigger' } },
  { id: '2', type: 'httpNode', position: { x: 550, y: 150 }, data: { method: 'GET', url: 'https://pokeapi.co/api/v2/pokemon-species/aegislash' } },
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', animated: true, type: 'deletableEdge' },
];

export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const { screenToFlowPosition } = useReactFlow();

  const [apiKey, setApiKey] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const stopExecutionRef = useRef(false);
  const [executionLatency, setExecutionLatency] = useState<number | null>(null);
  const [executionLogs, setExecutionLogs] = useState<{ time: string, message: string, type: 'info' | 'error' | 'success' | 'warning' }[]>([]);

  // --- Flow Management State ---
  const [flows, setFlows] = useState<{ id: string; name: string; nodes: Node[]; edges: Edge[]; updatedAt: number }[]>([]);
  const [currentFlowId, setCurrentFlowId] = useState<string>('default');

  // Load flows from localStorage on mount
  useEffect(() => {
    const savedFlows = localStorage.getItem('leflux_flows');
    if (savedFlows) {
      try {
        const parsed = JSON.parse(savedFlows);
        if (parsed.length > 0) {
          setFlows(parsed);
          const lastFlow = parsed.sort((a: any, b: any) => b.updatedAt - a.updatedAt)[0];
          setCurrentFlowId(lastFlow.id);
          setNodes(lastFlow.nodes || []);
          setEdges(lastFlow.edges || []);
          return;
        }
      } catch (e) {
        console.error("Error loading flows from localStorage", e);
      }
    }

    // Default flow if none exists
    const defaultFlow = {
      id: 'default',
      name: 'Demo Flow',
      nodes: initialNodes,
      edges: initialEdges,
      updatedAt: Date.now()
    };
    setFlows([defaultFlow]);
  }, [setNodes, setEdges]);

  const handleSelectFlow = (id: string) => {
    const flow = flows.find(f => f.id === id);
    if (flow) {
      setCurrentFlowId(id);
      setNodes(flow.nodes || []);
      setEdges(flow.edges || []);
      setSelectedNode(null);
      setExecutionLogs([]);
    }
  };

  const handleNewFlow = () => {
    const newId = `flow_${Date.now()}`;
    const newFlow = {
      id: newId,
      name: `Untitled Flow ${flows.length + 1}`,
      nodes: [],
      edges: [],
      updatedAt: Date.now()
    };
    const updatedFlows = [...flows, newFlow];
    setFlows(updatedFlows);
    setCurrentFlowId(newId);
    setNodes([]);
    setEdges([]);
    localStorage.setItem('leflux_flows', JSON.stringify(updatedFlows));
    setSelectedNode(null);
    setExecutionLogs([]);
  };

  const handleSaveFlow = () => {
    const updatedFlows = flows.map(f => {
      if (f.id === currentFlowId) {
        return { ...f, nodes, edges, updatedAt: Date.now() };
      }
      return f;
    });
    setFlows(updatedFlows);
    localStorage.setItem('leflux_flows', JSON.stringify(updatedFlows));
  };

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');

      // check if the dropped element is valid
      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: Node = {
        id: `node_${Date.now()}`,
        type,
        position,
        data: { label: `New ${type.replace('Node', '')}` },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [screenToFlowPosition, setNodes],
  );

  const onDeleteNode = useCallback((id: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== id));
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
    setSelectedNode(null);
  }, [setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge({ ...params, animated: true, type: 'deletableEdge' }, eds)),
    [setEdges],
  );

  const onNodeClick = (_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  };

  const onPaneClick = () => {
    setSelectedNode(null);
  };

  const getUpstreamNodes = useCallback((nodeId: string, allNodes: Node[], allEdges: Edge[], visited = new Set<string>()): Node[] => {
    if (visited.has(nodeId)) return [];
    visited.add(nodeId);
    const parentIds = allEdges.filter(e => e.target === nodeId).map(e => e.source);
    let ancestors: Node[] = [];
    for (const pid of parentIds) {
      const parentNode = allNodes.find(n => n.id === pid);
      if (parentNode) {
        ancestors.push(parentNode, ...getUpstreamNodes(pid, allNodes, allEdges, visited));
      }
    }
    // Remove duplicates by id
    return Array.from(new Map(ancestors.map(item => [item.id, item])).values());
  }, []);

  const upstreamNodes = selectedNode ? getUpstreamNodes(selectedNode.id, nodes, edges) : [];

  const handleTestNode = async (node: Node) => {
    const flowContext: Record<string, any> = {};
    upstreamNodes.forEach(n => {
      flowContext[n.id] = { data: n.data?.responsePreview };
    });

    const replaceVariables = (text: string) => {
      if (!text) return '';
      return text.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (_, path) => {
        const parts = path.split('.');
        let current: any = flowContext;
        for (const p of parts) {
          if (current && typeof current === 'object' && p in current) {
            current = current[current.hasOwnProperty(p) ? p : p];
          } else {
            return 'null';
          }
        }
        return typeof current === 'object' ? JSON.stringify(current) : String(current);
      });
    };

    try {
      if (node.type === 'httpNode') {
        const method = String(node.data?.method || 'GET');
        const url = String(node.data?.url || '');
        if (!url) throw new Error("Por favor ingresa un Endpoint URL.");
        let headers: Record<string, string> = {};
        try { headers = JSON.parse(String(node.data?.headers || '{}')); } catch (e) { }

        const res = await fetch(url, { method, headers });
        let responseData: any = null;
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
          responseData = await res.json();
        } else {
          responseData = await res.text();
        }
        setNodes((nds) => nds.map((n) => n.id === node.id ? { ...n, data: { ...n.data, responsePreview: responseData } } : n));
        setSelectedNode((prev) => (prev && prev.id === node.id ? { ...prev, data: { ...prev.data, responsePreview: responseData } } : prev));

      } else if (node.type === 'mistralNode') {
        if (!apiKey) throw new Error("Por favor ingresa tu Mistral API Key en la configuración superior.");
        const model = String(node.data?.model || 'mistral-large-latest');
        const systemPrompt = replaceVariables(String(node.data?.systemPrompt || ''));
        const userMessage = replaceVariables(String(node.data?.userMessage || ''));

        const messages = [];
        if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
        if (userMessage) messages.push({ role: 'user', content: userMessage });
        if (messages.length === 0) messages.push({ role: 'user', content: 'Say hello' });

        const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model,
            messages
          })
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || res.statusText);
        }

        const json = await res.json();
        const output = json.choices[0]?.message?.content || json;
        setNodes((nds) => nds.map((n) => n.id === node.id ? { ...n, data: { ...n.data, responsePreview: output } } : n));
        setSelectedNode((prev) => (prev && prev.id === node.id ? { ...prev, data: { ...prev.data, responsePreview: output } } : prev));

      } else if (node.type === 'mapperNode') {
        const previewObj: Record<string, any> = {};
        const mappings = node.data?.mappings;
        if (Array.isArray(mappings)) {
          mappings.forEach((m: any) => {
            if (m.key) {
              previewObj[m.key] = replaceVariables(m.value);
            }
          });
        }
        setNodes((nds) => nds.map((n) => n.id === node.id ? { ...n, data: { ...n.data, responsePreview: previewObj } } : n));
        setSelectedNode((prev) => (prev && prev.id === node.id ? { ...prev, data: { ...prev.data, responsePreview: previewObj } } : prev));

      } else {
        // Nada extra que ejecutar para nodos genéricos
      }
    } catch (err: any) {
      const errorMsg = `Error en Test: ${err.message}`;
      setNodes((nds) => nds.map((n) => n.id === node.id ? { ...n, data: { ...n.data, responsePreview: errorMsg } } : n));
      setSelectedNode((prev) => (prev && prev.id === node.id ? { ...prev, data: { ...prev.data, responsePreview: errorMsg } } : prev));
    }
  };

  const handleStop = () => {
    stopExecutionRef.current = true;
  };

  const handlePlay = async () => {
    if (isExecuting) return;
    setIsExecuting(true);
    stopExecutionRef.current = false;
    setExecutionLatency(null);
    const startTime = Date.now();
    setExecutionLogs([{ time: new Date().toLocaleTimeString(), message: 'Inicializando motor de ejecución Le Flux...', type: 'info' }]);

    const flowContext: Record<string, any> = {};
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    // Simulate initial setup delay
    await delay(300);

    // Topological Sort (Kahn's Algorithm) to execute nodes in correct data dependency order
    const inDegree = new Map<string, number>(nodes.map(n => [n.id, 0]));
    edges.forEach(e => {
      if (inDegree.has(e.target)) {
        inDegree.set(e.target, inDegree.get(e.target)! + 1);
      }
    });

    const queue: Node[] = nodes.filter(n => inDegree.get(n.id) === 0);
    const sortedNodes: Node[] = [];

    while (queue.length > 0) {
      const curr = queue.shift()!;
      sortedNodes.push(curr);
      edges.filter(e => e.source === curr.id).forEach(e => {
        const deg = inDegree.get(e.target)! - 1;
        inDegree.set(e.target, deg);
        if (deg === 0) {
          queue.push(nodes.find(n => n.id === e.target)!);
        }
      });
    }

    // Fallback to original order if cycle is detected or sort fails to include all nodes
    const nodesToExecute = sortedNodes.length === nodes.length ? sortedNodes : nodes;

    setExecutionLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), message: `Flujo detectado: ${nodes.length} nodos, ${edges.length} conexiones. Orden resuelto.`, type: 'info' }]);

    let hasError = false;

    // Enable edge deletion with Backspace/Delete keys
    // ReactFlow automatically supports edge deletion when selected and delete/backspace is pressed if onEdgesChange is provided.
    // Ensure nodes are marked hasError: false at the start
    setNodes((nds) => nds.map(n => ({ ...n, data: { ...n.data, hasError: false, responsePreview: null } })));

    // Execution loop
    for (const node of nodesToExecute) {
      if (stopExecutionRef.current) {
        setExecutionLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), message: 'Ejecución detenida por el usuario.', type: 'warning' }]);
        hasError = true;
        break;
      }

      setNodes((nds) => nds.map(n => n.id === node.id ? { ...n, data: { ...n.data, isExecuting: true, hasError: false } } : n));

      await delay(1200);

      const isMistralNode = ['pixtralNode', 'codestralNode', 'documentAINode', 'audioNode', 'batchNode', 'contextNode', 'mistralNode'].includes(node.type!);

      if (isMistralNode && !apiKey) {
        setExecutionLogs(prev => [...prev, {
          time: new Date().toLocaleTimeString(),
          message: `Error en ${node.data?.label || node.type}: API Key de Mistral es requerida para este servicio.`,
          type: 'error'
        }]);
        hasError = true;
        break;
      }

      if (node.type === 'httpNode') {
        const method = String(node.data?.method || 'GET');
        const url = String(node.data?.url || '');
        let headers = {};
        try {
          headers = JSON.parse(String(node.data?.headers || '{}'));
        } catch (e) { }

        setExecutionLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), message: `Ejecutando ${method} hacia ${url}...`, type: 'warning' }]);

        let responseData: any = null;
        try {
          const res = await fetch(url, { method, headers });
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

          const contentType = res.headers.get("content-type");
          if (contentType && contentType.indexOf("application/json") !== -1) {
            responseData = await res.json();
          }

          // Sincronizar la vista si el usuario tiene el nodo seleccionado mientras se ejecuta
          setNodes((nds) => nds.map((n) => n.id === node.id ? { ...n, data: { ...n.data, responsePreview: responseData } } : n));
          setSelectedNode(prev => prev && prev.id === node.id ? { ...prev, data: { ...prev.data, responsePreview: responseData } } : prev);

          flowContext[node.id] = { data: responseData };

          setExecutionLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), message: `Respuesta HTTP status: ${res.status} OK.`, type: 'success' }]);
        } catch (error: any) {
          setNodes((nds) => nds.map((n) => {
            if (n.id === node.id) {
              return { ...n, data: { ...n.data, responsePreview: `Fallo HTTP: ${error.message}`, hasError: true } };
            }
            return n;
          }));
          setExecutionLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), message: `Fallo HTTP request: ${error.message}.`, type: 'error' }]);
          hasError = true;
          break;
        }
      } else if (node.type === 'mistralNode') {
        const replaceVariables = (text: string) => {
          if (!text) return '';
          return text.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (_, path) => {
            const parts = path.split('.');
            let current: any = flowContext;
            for (const p of parts) {
              if (current && typeof current === 'object' && p in current) {
                current = current[current.hasOwnProperty(p) ? p : p];
              } else {
                return 'null';
              }
            }
            return typeof current === 'object' ? JSON.stringify(current) : String(current);
          });
        };
        const model = String(node.data?.model || 'mistral-large-latest');
        const systemPrompt = replaceVariables(String(node.data?.systemPrompt || ''));
        const userMessage = replaceVariables(String(node.data?.userMessage || ''));

        const messages = [];
        if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
        if (userMessage) messages.push({ role: 'user', content: userMessage });
        if (messages.length === 0) messages.push({ role: 'user', content: 'Say hello' });

        setExecutionLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), message: `Ejecutando Mistral (${model})...`, type: 'warning' }]);

        try {
          const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
              model,
              messages
            })
          });

          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || res.statusText);
          }

          const json = await res.json();
          const output = json.choices[0]?.message?.content || json;

          setNodes((nds) => nds.map((n) => n.id === node.id ? { ...n, data: { ...n.data, responsePreview: output } } : n));
          setSelectedNode((prev) => (prev && prev.id === node.id ? { ...prev, data: { ...prev.data, responsePreview: output } } : prev));
          flowContext[node.id] = { data: output };

          setExecutionLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), message: `Mistral completado con éxito.`, type: 'success' }]);
        } catch (error: any) {
          setNodes((nds) => nds.map((n) => n.id === node.id ? { ...n, data: { ...n.data, responsePreview: `Fallo Mistral: ${error.message}`, hasError: true } } : n));
          hasError = true;
          break;
        }

      } else if (node.type === 'mapperNode') {
        const replaceVariables = (text: string) => {
          if (!text) return '';
          return text.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (_, path) => {
            const parts = path.split('.');
            let current: any = flowContext;
            for (const p of parts) {
              if (current && typeof current === 'object' && p in current) {
                current = current[current.hasOwnProperty(p) ? p : p];
              } else {
                return 'null';
              }
            }
            return typeof current === 'object' ? JSON.stringify(current) : String(current);
          });
        };
        const previewObj: Record<string, any> = {};
        const mappings = node.data?.mappings;
        if (Array.isArray(mappings)) {
          mappings.forEach((m: any) => {
            if (m.key) {
              previewObj[m.key] = replaceVariables(m.value);
            }
          });
        }
        setNodes((nds) => nds.map((n) => n.id === node.id ? { ...n, data: { ...n.data, responsePreview: previewObj } } : n));
        setSelectedNode((prev) => (prev && prev.id === node.id ? { ...prev, data: { ...prev.data, responsePreview: previewObj } } : prev));
        flowContext[node.id] = { data: previewObj };

        setExecutionLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), message: `Ejecutando Data Mapper basado en contexto...`, type: 'success' }]);

      } else if (node.type === 'responseNode') {
        // Collect everything executed previously to show in the Response node
        setNodes((nds) => nds.map((n) => {
          if (n.id === node.id) {
            return { ...n, data: { ...n.data, responsePreview: flowContext } };
          }
          return n;
        }));
        setSelectedNode(prev => prev && prev.id === node.id ? { ...prev, data: { ...prev.data, responsePreview: flowContext } } : prev);

        setExecutionLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), message: `Retornando respuesta final (status 200). Payload finalizado.`, type: 'success' }]);
        flowContext[node.id] = { data: { status: 200, payload: flowContext } };
      } else {
        setExecutionLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), message: `Ejecutando nodo: ${node.data?.label || node.type}`, type: 'success' }]);
        const defaultData = { executed: true, timestamp: new Date().toISOString() };
        setNodes((nds) => nds.map((n) => n.id === node.id ? { ...n, data: { ...n.data, responsePreview: defaultData } } : n));
        setSelectedNode(prev => prev && prev.id === node.id ? { ...prev, data: { ...prev.data, responsePreview: defaultData } } : prev);
        flowContext[node.id] = { data: defaultData };
      }

      setNodes((nds) => nds.map(n => n.id === node.id ? { ...n, data: { ...n.data, isExecuting: false } } : n));
    }

    const endTime = Date.now();

    await delay(1000);
    if (!hasError) {
      setExecutionLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), message: 'Flujo finalizado exitosamente.', type: 'info' }]);
    } else {
      setExecutionLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), message: 'Flujo abortado debido a un error.', type: 'error' }]);
    }

    setExecutionLatency(endTime - startTime);
    setIsExecuting(false);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-mistral-bg text-mistral-text font-sans">
      <Header
        flows={flows.map(f => ({ id: f.id, name: f.name }))}
        currentFlowId={currentFlowId}
        onSelectFlow={handleSelectFlow}
        onNewFlow={handleNewFlow}
        onSaveFlow={handleSaveFlow}
        apiKey={apiKey}
        onApiKeyChange={setApiKey}
        onPlay={handlePlay}
        onStop={handleStop}
        isExecuting={isExecuting}
      />

      <div className="flex flex-1 h-full overflow-hidden relative">
        <Sidebar />

        <main className="flex-1 relative border-x border-mistral-border">
          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <h1 className="text-4xl font-bold text-gray-700 uppercase tracking-widest">Arrastra nodos aquí</h1>
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
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            deleteKeyCode={["Backspace", "Delete"]} // Enable default edge deletion
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

        {(isExecuting || executionLogs.length > 0) && !selectedNode && (
          <LogsPanel logs={executionLogs} isExecuting={isExecuting} />
        )}
        {selectedNode && (
          <SettingsPanel
            selectedNode={selectedNode}
            upstreamNodes={upstreamNodes}
            onClose={() => setSelectedNode(null)}
            onDelete={onDeleteNode}
            onUpdateData={(newData) => {
              setNodes((nds) =>
                nds.map((n) => {
                  if (n.id === selectedNode.id) {
                    n.data = { ...n.data, ...newData };
                  }
                  return n;
                })
              );
              setSelectedNode((prev) => (prev && prev.id === selectedNode.id ? { ...prev, data: { ...prev.data, ...newData } } : prev));
            }}
            onTestNode={() => handleTestNode(selectedNode)}
          />
        )}
      </div>

      <footer className="h-12 bg-[#1a2234] border-t border-mistral-border flex items-center justify-between px-6 shrink-0 text-xs text-mistral-muted transition-colors">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isExecuting ? 'bg-green-400 animate-pulse' : 'bg-mistral-yellow'}`} />
            {isExecuting ? 'Ejecutándose' : 'Workflow válido'}
          </span>
          <span className="border-l border-mistral-border pl-4">Costo estimado $0.02</span>
          <span className="border-l border-mistral-border pl-4">Tokens: 1.2K</span>
          <span className="border-l border-mistral-border pl-4">
            Latencia: {isExecuting ? '...' : executionLatency !== null ? `${executionLatency}ms` : '0ms'}
          </span>
        </div>
        <div>
          <span>Última exec: {isExecuting ? 'Ahora' : '2min ago'}</span>
        </div>
      </footer>
    </div>
  );
}
