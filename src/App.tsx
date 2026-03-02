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
import type { Connection, Edge, Node, MiniMapNodeProps } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { io } from 'socket.io-client';

import { PixelMistralLogo, PixelRobot, PixelEye, PixelTerminal, PixelDocument } from './components/icons/PixelIcons';
import { Layers, Database, Activity, CheckCircle2 } from 'lucide-react'; // Some generic fallbacks

// Conectar con el backend en el mismo host si estamos en prod, o localhost:3000 si en dev
export const socket = io(import.meta.env.PROD ? '/' : 'http://localhost:3000');

import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { PixtralNode, DefaultNode, TestNode, WebhookNode, HttpNode, MapperNode, ResponseNode, CodestralNode, DocumentAINode, AudioNode, BatchNode, ContextNode, MistralNode, HuggingFaceNode, ElevenLabsNode, TelegramTriggerNode, TelegramMessageNode } from './components/nodes/CustomNodes';
import { SettingsPanel, LogsPanel } from './components/Panels';
import { CredentialsModal } from './components/CredentialsModal';
import type { ExecutionData } from './components/ExecutionsSidebar';
import { ExecutionsSidebar } from './components/ExecutionsSidebar';
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
  huggingFaceNode: HuggingFaceNode,
  elevenLabsNode: ElevenLabsNode,
  telegramTriggerNode: TelegramTriggerNode,
  telegramMessageNode: TelegramMessageNode,
  default: DefaultNode,
};

// --- Custom MiniMap Node with simple shapes (simulating icons) ---
const MiniMapCustomNode = ({ x, y, width, height, color, id }: MiniMapNodeProps) => {
  const isMistral = id.includes('mistral') || id.includes('pixtral') || id.includes('codestral');
  const isWebhook = id.includes('webhook') || id.includes('test');
  const isHttp = id.includes('http');
  const isResponse = id.includes('response');
  const isMapper = id.includes('mapper');
  const isDocument = id.includes('document');
  const isHuggingFace = id.includes('huggingFace');
  const isElevenLabs = id.includes('elevenLabs');
  const isTelegram = id.includes('telegram');

  const ICON_SIZE = 16;
  const cx = width / 2;
  const cy = height / 2;

  // Render a specific icon component based on type
  const renderIcon = () => {
    if (isMistral) return <PixelRobot size={ICON_SIZE} className="text-[#0B101E]" />;
    if (isWebhook) return <PixelEye size={ICON_SIZE} className="text-[#0B101E]" />;
    if (isHttp) return <PixelTerminal size={ICON_SIZE} className="text-[#0B101E]" />;
    if (isDocument) return <PixelDocument size={ICON_SIZE} className="text-[#0B101E]" />;
    if (isResponse) return <CheckCircle2 size={ICON_SIZE} className="text-[#0B101E]" />;
    if (isMapper) return <Activity size={ICON_SIZE} className="text-[#0B101E]" />;
    if (isHuggingFace) return <span className="text-[12px] flex items-center justify-center leading-none mt-0.5 ml-0.5">🤗</span>;
    if (isElevenLabs) return <span className="text-[12px] flex items-center justify-center leading-none mt-0.5 ml-0.5">🎙️</span>;
    if (isTelegram) return <span className="text-[12px] flex items-center justify-center leading-none mt-0.5 ml-0.5 text-blue-400">✈️</span>;
    return <PixelMistralLogo size={ICON_SIZE} className="text-[#0B101E]" />;
  };

  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect width={width} height={height} rx={4} fill={color} stroke="#1A2234" strokeWidth={2} />
      {/* Nested <svg> works perfectly in SVG to act as an embedded container with exact x,y positioning for icons */}
      <svg x={cx - ICON_SIZE / 2} y={cy - ICON_SIZE / 2} width={ICON_SIZE} height={ICON_SIZE} viewBox={`0 0 ${ICON_SIZE} ${ICON_SIZE}`}>
        {renderIcon()}
      </svg>
    </g>
  );
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

  const [credentials, setCredentials] = useState(() => {
    const saved = localStorage.getItem('leflux_credentials');
    return saved ? JSON.parse(saved) : { mistralKey: '', huggingFaceKey: '', elevenLabsKey: '', telegramToken: '' };
  });
  const [isCredentialsOpen, setIsCredentialsOpen] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const stopExecutionRef = useRef(false);
  const [executionLatency, setExecutionLatency] = useState<number | null>(null);
  const [executionLogs, setExecutionLogs] = useState<{ time: string, message: string, type: 'info' | 'error' | 'success' | 'warning' }[]>([]);

  // Referencia mutable a handlePlay para que el socket la pueda ver
  const handlePlayRef = useRef<((payload?: any) => Promise<void>) | undefined>(undefined);

  // --- Flow Management State ---
  const [flows, setFlows] = useState<{ id: string; name: string; nodes: Node[]; edges: Edge[]; updatedAt: number }[]>([]);
  const [currentFlowId, setCurrentFlowId] = useState<string>('default');

  const [viewMode, setViewMode] = useState<'editor' | 'executions'>('editor');
  const [executions, setExecutions] = useState<ExecutionData[]>([]);
  const [activeExecutionId, setActiveExecutionId] = useState<string | null>(null);

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

  const handleRenameFlow = (flowId: string, newName: string) => {
    const updatedFlows = flows.map(f => f.id === flowId ? { ...f, name: newName } : f);
    setFlows(updatedFlows);
    localStorage.setItem('leflux_flows', JSON.stringify(updatedFlows));
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

    // Guardar en backend (Producción Headless) - Enviar TODOS los flujos
    setExecutionLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), message: 'Empujando flows y Settings al backend Headless...', type: 'info' }]);
    socket.emit('save_flow', { flows: updatedFlows, credentials });
  };

  useEffect(() => {
    socket.on('save_flow_success', () => {
      setExecutionLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), message: 'Flow guardado exitosamente en Headless JSON.', type: 'success' }]);
    });
    socket.on('save_flow_error', (err) => {
      setExecutionLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), message: `Error guardando en backend: ${err.message}`, type: 'error' }]);
    });

    socket.on('webhook_received', ({ webhookId, payload }) => {
      setExecutionLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), message: `[MODO TEST] Webhook ID ${webhookId} recibido. Ejecutando flujo automáticamente...`, type: 'warning' }]);
      if (handlePlayRef.current) {
        handlePlayRef.current(payload);
      }
    });

    socket.on('test_timeout', ({ webhookId }) => {
      setExecutionLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), message: `[MODO TEST] Tiempo expirado (2 mins) para el webhook ${webhookId}. Escucha desactivada.`, type: 'info' }]);
    });

    socket.on('new_execution', (exec: ExecutionData) => {
      setExecutions(prev => [exec, ...prev]);
      setExecutionLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), message: `Nueva Ejecución Background completada (${exec.success ? 'Success' : 'Failed'}).`, type: exec.success ? 'success' : 'error' }]);
    });

    fetch(import.meta.env.PROD ? '/api/executions' : 'http://localhost:3000/api/executions')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setExecutions(data);
      })
      .catch(err => console.error("Error loading executions", err));

    return () => {
      socket.off('save_flow_success');
      socket.off('save_flow_error');
      socket.off('webhook_received');
      socket.off('test_timeout');
      socket.off('new_execution');
    }
  }, []);

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

  const handleSelectExecution = (exec: ExecutionData) => {
    setActiveExecutionId(exec.id);

    // Inject node contexts into responsePreview to view history
    const updatedNodes = nodes.map(n => {
      const execContext = exec.nodesContext[n.id];
      if (execContext !== undefined) {
        const hasErr = !!execContext?.error;
        return {
          ...n,
          data: {
            ...n.data,
            responsePreview: hasErr ? `Error: ${execContext.error}` : execContext,
            hasError: hasErr
          }
        };
      }
      return { ...n, data: { ...n.data, responsePreview: undefined, hasError: false } }; // clear unexecuted ones
    });

    setNodes(updatedNodes);

    // Auto-Select the Webhook node, or the node that failed, or the last executed node
    const executedNodeIds = Object.keys(exec.nodesContext).filter(k => k !== 'error');
    const targetNodeId = executedNodeIds.find(id => !!exec.nodesContext[id]?.error) || executedNodeIds[executedNodeIds.length - 1] || updatedNodes[0]?.id;
    const targetNode = updatedNodes.find(n => n.id === targetNodeId);

    setSelectedNode(targetNode || null);
  };

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
        const currentPathId = parts[0];
        const aliasNode = nodes.find(n => n.type === currentPathId || String(n.data?.label || '').replace(/[^a-zA-Z0-9_.-]/g, "") === currentPathId);
        if (aliasNode && flowContext[aliasNode.id]) {
          parts[0] = aliasNode.id;
        }

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
        if (!credentials.mistralKey) throw new Error("Por favor ingresa tu Mistral API Key en las Credenciales.");
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
            "Authorization": `Bearer ${credentials.mistralKey}`
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

      } else if (node.type === 'pixtralNode') {
        if (!credentials.mistralKey) throw new Error("Por favor ingresa tu Mistral API Key en las Credenciales.");
        const prompt = replaceVariables(String(node.data?.prompt || 'What is in this image?'));
        const imageSource = replaceVariables(String(node.data?.imageSource || ''));

        if (!imageSource || (!imageSource.startsWith('data:image') && !imageSource.startsWith('http'))) {
          throw new Error('Invalid or missing image source. Must be a base64 Data URI or HTTP URL.');
        }

        const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${credentials.mistralKey}`
          },
          body: JSON.stringify({
            model: 'pixtral-12b-2409',
            messages: [
              {
                role: 'user',
                content: [
                  { type: 'text', text: prompt },
                  { type: 'image_url', image_url: imageSource }
                ]
              }
            ]
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

      } else if (node.type === 'huggingFaceNode') {
        if (!credentials.huggingFaceKey) throw new Error("Por favor ingresa tu Hugging Face API Key en las Credenciales.");
        const model = String(node.data?.model || 'meta-llama/Meta-Llama-3-8B-Instruct');
        const prompt = "Hola, responde esto brevemente"; // Since it's a test, keep it simple.

        const res = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${credentials.huggingFaceKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ inputs: prompt })
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || res.statusText);
        }

        const json = await res.json();
        const output = Array.isArray(json) ? json[0]?.generated_text : json;
        setNodes((nds) => nds.map((n) => n.id === node.id ? { ...n, data: { ...n.data, responsePreview: output } } : n));
        setSelectedNode((prev) => (prev && prev.id === node.id ? { ...prev, data: { ...prev.data, responsePreview: output } } : prev));

      } else if (node.type === 'elevenLabsNode') {
        if (!credentials.elevenLabsKey) throw new Error("Por favor ingresa tu ElevenLabs API Key en las Credenciales.");
        const voiceId = String(node.data?.voiceId || 'JBFqnCBcs611NsnJI8XM');
        const textToSpeech = "Probando síntesis de voz con ElevenLabs.";

        const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
          method: "POST",
          headers: {
            "xi-api-key": credentials.elevenLabsKey,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ text: textToSpeech })
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.detail?.message || res.statusText);
        }

        const output = "Audio generado exitosamente (Test mode local). Revisa la ejecución global para confirmar el blob.";
        setNodes((nds) => nds.map((n) => n.id === node.id ? { ...n, data: { ...n.data, responsePreview: output } } : n));
        setSelectedNode((prev) => (prev && prev.id === node.id ? { ...prev, data: { ...prev.data, responsePreview: output } } : prev));

      } else if (node.type === 'telegramMessageNode') {
        if (!credentials.telegramToken) throw new Error("Falta Telegram Bot Token en Credenciales.");

        const replaceVariables = (text: string) => {
          if (!text) return '';
          return text.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (_, path) => {
            const parts = path.split('.');
            const currentPathId = parts[0];
            const aliasNode = nodes.find(n => n.type === currentPathId || String(n.data?.label || '').replace(/[^a-zA-Z0-9_.-]/g, "") === currentPathId);
            if (aliasNode && flowContext[aliasNode.id]) {
              parts[0] = aliasNode.id;
            }

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

        const chatId = replaceVariables(String(node.data?.chatId || ''));
        const textMessage = replaceVariables(String(node.data?.message || 'Prueba desde Mistral Flow Studio'));

        if (!chatId) throw new Error('Chat ID inválido o vacío para Telegram.');

        const res = await fetch(`https://api.telegram.org/bot${credentials.telegramToken}/sendMessage`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ chat_id: chatId, text: textMessage })
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.description || res.statusText);
        }

        const output = `Mensaje de prueba enviado a ${chatId} exitosamente.`;
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

  const handlePlay = async (initialPayload?: any) => {
    if (isExecuting) return;
    setIsExecuting(true);
    stopExecutionRef.current = false;
    setExecutionLatency(null);
    const startTime = Date.now();
    setExecutionLogs([{ time: new Date().toLocaleTimeString(), message: 'Inicializando motor de ejecución Le Flux...', type: 'info' }]);

    const flowContext: Record<string, any> = {};

    if (initialPayload && Object.keys(initialPayload).length > 0) {
      // Encontrar nodos webhooks y setearles el payload
      const webhooks = nodes.filter(n => n.type === 'webhookNode');
      webhooks.forEach(wh => {
        flowContext[wh.id] = { data: initialPayload };
        setNodes(nds => nds.map(n => n.id === wh.id ? { ...n, data: { ...n.data, responsePreview: initialPayload } } : n));
      });
      setExecutionLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), message: 'Payload externo inyectado vía Socket.io.', type: 'info' }]);
    }

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

      if (isMistralNode && !credentials.mistralKey) {
        setExecutionLogs(prev => [...prev, {
          time: new Date().toLocaleTimeString(),
          message: `Error en ${node.data?.label || node.type}: API Key de Mistral es requerida en Credenciales.`,
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
              "Authorization": `Bearer ${credentials.mistralKey}`
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

      } else if (node.type === 'pixtralNode') {
        setExecutionLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), message: `Ejecutando Pixtral Vision...`, type: 'warning' }]);

        if (!credentials.mistralKey) {
          setExecutionLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), message: `Falta Mistral API Key para Pixtral`, type: 'error' }]);
          hasError = true;
          break;
        }

        const replaceVariables = (text: string) => {
          if (!text) return '';
          return text.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (_, path) => {
            const parts = path.split('.');
            const currentPathId = parts[0];
            const aliasNode = nodes.find(n => n.type === currentPathId || String(n.data?.label || '').replace(/[^a-zA-Z0-9_.-]/g, "") === currentPathId);
            if (aliasNode && flowContext[aliasNode.id]) {
              parts[0] = aliasNode.id;
            }

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

        const prompt = replaceVariables(String(node.data?.prompt || 'What is in this image?'));
        const imageSource = replaceVariables(String(node.data?.imageSource || ''));

        if (!imageSource || (!imageSource.startsWith('data:image') && !imageSource.startsWith('http'))) {
          setExecutionLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), message: `Fuente de imagen inválida o ausente. (Data URI o HTTP URL requerido)`, type: 'error' }]);
          hasError = true;
          break;
        }

        try {
          const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${credentials.mistralKey}`
            },
            body: JSON.stringify({
              model: 'pixtral-12b-2409',
              messages: [
                {
                  role: 'user',
                  content: [
                    { type: 'text', text: prompt },
                    { type: 'image_url', image_url: imageSource }
                  ]
                }
              ]
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

          setExecutionLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), message: `Pixtral completado con éxito.`, type: 'success' }]);
        } catch (error: any) {
          setNodes((nds) => nds.map((n) => n.id === node.id ? { ...n, data: { ...n.data, responsePreview: `Fallo Pixtral: ${error.message}`, hasError: true } } : n));
          setExecutionLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), message: `Error Pixtral: ${error.message}`, type: 'error' }]);
          hasError = true;
          break;
        }

      } else if (node.type === 'huggingFaceNode') {
        setExecutionLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), message: `Ejecutando HuggingFace...`, type: 'warning' }]);

        if (!credentials.huggingFaceKey) {
          setExecutionLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), message: `Falta HF API Key`, type: 'error' }]);
          hasError = true;
          break;
        }

        let prompt = "Responde brevemente a lo siguiente:";
        // Get upstream dependencies data if available as prompt input conceptual override
        const upstreamEdges = edges.filter(e => e.target === node.id);
        if (upstreamEdges.length > 0) {
          const prevData = flowContext[upstreamEdges[0].source]?.data;
          if (prevData) prompt = typeof prevData === 'object' ? JSON.stringify(prevData) : String(prevData);
        }

        const model = String(node.data?.model || 'meta-llama/Meta-Llama-3-8B-Instruct');

        try {
          const res = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${credentials.huggingFaceKey}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ inputs: prompt })
          });

          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || res.statusText);
          }

          const json = await res.json();
          const output = Array.isArray(json) ? json[0]?.generated_text : json;
          setNodes((nds) => nds.map((n) => n.id === node.id ? { ...n, data: { ...n.data, responsePreview: output } } : n));
          setSelectedNode((prev) => (prev && prev.id === node.id ? { ...prev, data: { ...prev.data, responsePreview: output } } : prev));
          flowContext[node.id] = { data: output };
          setExecutionLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), message: `HuggingFace exito.`, type: 'success' }]);
        } catch (error: any) {
          setNodes((nds) => nds.map((n) => n.id === node.id ? { ...n, data: { ...n.data, responsePreview: `Fallo HuggingFace: ${error.message}`, hasError: true } } : n));
          setExecutionLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), message: `Error HF: ${error.message}`, type: 'error' }]);
          hasError = true;
          break;
        }

      } else if (node.type === 'elevenLabsNode') {
        setExecutionLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), message: `Ejecutando ElevenLabs...`, type: 'warning' }]);

        if (!credentials.elevenLabsKey) {
          setExecutionLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), message: `Falta ElevenLabs API Key`, type: 'error' }]);
          hasError = true;
          break;
        }

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

        const voiceId = String(node.data?.voiceId || 'JBFqnCBcs611NsnJI8XM');
        const textToSpeech = replaceVariables(String(node.data?.text || 'Hola mundo'));

        try {
          const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
            method: "POST",
            headers: {
              "xi-api-key": credentials.elevenLabsKey,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ text: textToSpeech })
          });

          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail?.message || res.statusText);
          }

          const output = "Audio Blob generado exitosamente.";
          setNodes((nds) => nds.map((n) => n.id === node.id ? { ...n, data: { ...n.data, responsePreview: output } } : n));
          setSelectedNode((prev) => (prev && prev.id === node.id ? { ...prev, data: { ...prev.data, responsePreview: output } } : prev));
          flowContext[node.id] = { data: output };
          setExecutionLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), message: `ElevenLabs exito.`, type: 'success' }]);
        } catch (error: any) {
          setNodes((nds) => nds.map((n) => n.id === node.id ? { ...n, data: { ...n.data, responsePreview: `Fallo ElevenLabs: ${error.message}`, hasError: true } } : n));
          setExecutionLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), message: `Error ElevenLabs: ${error.message}`, type: 'error' }]);
          hasError = true;
          break;
        }

      } else if (node.type === 'telegramMessageNode') {
        setExecutionLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), message: `Enviando mensaje Telegram...`, type: 'warning' }]);

        if (!credentials.telegramToken) {
          setExecutionLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), message: `Falta Telegram Bot Token en Credenciales`, type: 'error' }]);
          hasError = true;
          break;
        }

        const replaceVariables = (text: string) => {
          if (!text) return '';
          return text.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (_, path) => {
            const parts = path.split('.');
            const currentPathId = parts[0];
            const aliasNode = nodes.find(n => n.type === currentPathId || String(n.data?.label || '').replace(/[^a-zA-Z0-9_.-]/g, "") === currentPathId);
            if (aliasNode && flowContext[aliasNode.id]) {
              parts[0] = aliasNode.id;
            }

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

        const chatId = replaceVariables(String(node.data?.chatId || ''));
        const textMessage = replaceVariables(String(node.data?.message || ''));

        if (!chatId) {
          setExecutionLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), message: `Chat ID inválido o vacío para Telegram`, type: 'error' }]);
          hasError = true;
          break;
        }

        try {
          const res = await fetch(`https://api.telegram.org/bot${credentials.telegramToken}/sendMessage`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ chat_id: chatId, text: textMessage })
          });

          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.description || res.statusText);
          }

          const output = `Mensaje enviado a ${chatId} exitosamente.`;
          setNodes((nds) => nds.map((n) => n.id === node.id ? { ...n, data: { ...n.data, responsePreview: output } } : n));
          setSelectedNode((prev) => (prev && prev.id === node.id ? { ...prev, data: { ...prev.data, responsePreview: output } } : prev));
          flowContext[node.id] = { data: output };
          setExecutionLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), message: `Telegram exito.`, type: 'success' }]);
        } catch (error: any) {
          setNodes((nds) => nds.map((n) => n.id === node.id ? { ...n, data: { ...n.data, responsePreview: `Fallo Telegram: ${error.message}`, hasError: true } } : n));
          setExecutionLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), message: `Error Telegram: ${error.message}`, type: 'error' }]);
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

        let finalResponse: any = flowContext;
        if (node.data?.responseMode === 'custom') {
          const parsedStr = replaceVariables(String(node.data?.responseBody || ''));
          try {
            finalResponse = JSON.parse(parsedStr);
          } catch (e) {
            finalResponse = parsedStr;
          }
        }

        // Mostrar la salida final localmente en el nodo
        setNodes((nds) => nds.map((n) => {
          if (n.id === node.id) {
            return { ...n, data: { ...n.data, responsePreview: finalResponse } };
          }
          return n;
        }));
        setSelectedNode(prev => prev && prev.id === node.id ? { ...prev, data: { ...prev.data, responsePreview: finalResponse } } : prev);

        setExecutionLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), message: `Retornando respuesta final (${node.data?.responseMode === 'custom' ? 'Custom' : 'Global'}). Payload finalizado.`, type: 'success' }]);
        flowContext[node.id] = { data: finalResponse };
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

  // Mantener referencia actualizada
  useEffect(() => {
    handlePlayRef.current = handlePlay;
  }, [handlePlay]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-mistral-bg text-mistral-text font-sans">
      <Header
        flows={flows.map(f => ({ id: f.id, name: f.name }))}
        currentFlowId={currentFlowId}
        onSelectFlow={handleSelectFlow}
        onNewFlow={handleNewFlow}
        onSaveFlow={handleSaveFlow}
        onRenameFlow={handleRenameFlow}
        onOpenCredentials={() => setIsCredentialsOpen(true)}
        onPlay={handlePlay}
        onStop={handleStop}
        isExecuting={isExecuting}
        viewMode={viewMode}
        onChangeViewMode={(mode) => {
          setViewMode(mode);
          if (mode === 'editor') setActiveExecutionId(null); // clear sub-state
        }}
      />

      <div className="flex flex-1 h-full overflow-hidden relative">
        {viewMode === 'editor' ? (
          <Sidebar />
        ) : (
          <ExecutionsSidebar
            executions={executions.filter(e => !e.flowId || e.flowId === currentFlowId)}
            activeExecutionId={activeExecutionId}
            onSelectExecution={handleSelectExecution}
          />
        )}

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
            <Controls
              style={{
                backgroundColor: '#1a2234',
                borderColor: '#4B5563',
                fill: '#FCD34D',
                color: '#fff'
              }}
              className="react-flow-custom-controls border border-mistral-border rounded shadow-lg overflow-hidden"
            />
            <MiniMap
              className="bg-[#1a2234] border border-mistral-border rounded-lg shadow-xl"
              maskColor="rgba(17, 24, 39, 0.8)"
              nodeComponent={MiniMapCustomNode}
              nodeColor={(n) => {
                if (n.type === 'webhookNode') return '#10B981'; // green
                if (n.type === 'responseNode') return '#3B82F6'; // blue
                if (n.type === 'mistralNode' || n.type === 'pixtralNode') return '#F59E0B'; // orange
                if (n.type === 'httpNode') return '#6366F1'; // indigo
                if (n.type === 'huggingFaceNode') return '#FBBF24'; // yellow
                if (n.type === 'elevenLabsNode') return '#818CF8'; // soft indigo
                return '#6B7280'; // gray
              }}
              nodeBorderRadius={8}
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
            credentials={credentials}
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

      <CredentialsModal
        isOpen={isCredentialsOpen}
        onClose={() => setIsCredentialsOpen(false)}
        credentials={credentials}
        onSave={(newCreds) => {
          setCredentials(newCreds);
          localStorage.setItem('leflux_credentials', JSON.stringify(newCreds));
          setExecutionLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), message: 'Credenciales guardadas localmente.', type: 'info' }]);

          // Push it to backend automatically upon saving credentials
          socket.emit('save_flow', { nodes, edges, credentials: newCreds });
        }}
      />

      <footer className="h-12 bg-[#1a2234] border-t border-mistral-border flex items-center justify-between px-6 shrink-0 text-xs text-mistral-muted transition-colors">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isExecuting ? 'bg-green-400 animate-pulse' : 'bg-mistral-orange'}`} />
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
