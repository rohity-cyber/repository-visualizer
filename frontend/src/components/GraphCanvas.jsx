import React, { useState, useCallback, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  BackgroundVariant,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow';
import { toPng } from 'html-to-image';
import 'reactflow/dist/style.css';
import FileNode from './FileNode';
import FolderNode from './FolderNode';
import FloatingEdge from './FloatingEdge';
import './GraphCanvas.css';

const nodeTypes = {
  fileNode: FileNode,
  folderNode: FolderNode,
};

const edgeTypes = {
  floatingEdge: FloatingEdge,
};

const minimapStyle = {
  background: 'rgba(5,5,14,0.94)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '12px',
  boxShadow: '0 4px 32px rgba(0,0,0,0.8)',
};

const defaultEdgeOptions = {
  type: 'floatingEdge',
  animated: false,
  style: { stroke: '#6366f128', strokeWidth: 1 },
  markerEnd: { type: 'arrowclosed', color: '#6366f130', width: 8, height: 8 },
};

function Flow({ nodes: initNodes, edges: initEdges, onNodeClick, zoomToNodeRef, exportRef, selectedNode, theme }) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initEdges);
  const [hoveredNode, setHoveredNode] = useState(null);
  const { fitView, setCenter } = useReactFlow();
  const flowWrapperRef = useRef(null);

  // Sync nodes/edges when parent props change
  React.useEffect(() => {
    setNodes(initNodes);
    setEdges(initEdges);
    const t = setTimeout(() => {
      fitView({ padding: 0.12, duration: 700, includeHiddenNodes: false });
    }, 150);
    return () => clearTimeout(t);
  }, [initNodes, initEdges, setNodes, setEdges, fitView]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, ...defaultEdgeOptions }, eds)),
    [setEdges]
  );

  const handleNodeClick = useCallback(
    (_, node) => { if (node.type === 'fileNode') onNodeClick(node); },
    [onNodeClick]
  );

  const handleNodeMouseEnter = useCallback(
    (_, node) => { if (node.type === 'fileNode') setHoveredNode(node); },
    []
  );

  const handleNodeMouseLeave = useCallback(() => setHoveredNode(null), []);

  /* ── Active node: click-selection wins over hover ── */
  const activeNodeId = selectedNode?.id ?? hoveredNode?.id ?? null;

  /* ── Compute which node IDs are directly connected to the active node ── */
  const connectedIds = React.useMemo(() => {
    if (!activeNodeId) return new Set();
    const ids = new Set([activeNodeId]);
    edges.forEach(e => {
      if (e.source === activeNodeId) ids.add(e.target);
      if (e.target === activeNodeId) ids.add(e.source);
    });
    return ids;
  }, [edges, activeNodeId]);

  /* ── Apply dim / connected flags to nodes ── */
  const styledNodes = React.useMemo(() => {
    if (!activeNodeId) return nodes;
    return nodes.map(n => {
      if (n.type !== 'fileNode') return n;
      const isConnected = connectedIds.has(n.id) && n.id !== activeNodeId;
      const isDimmed = !connectedIds.has(n.id);
      return {
        ...n,
        data: { ...n.data, dimmed: isDimmed, connected: isConnected },
      };
    });
  }, [nodes, activeNodeId, connectedIds]);

  /* ── Three-tier edge visibility ──
     • No active node  → ghost hints  (barely visible, just texture)
     • Connected edge  → vivid, animated, labeled
     • Inactive edge   → near-invisible
  ── */
  const styledEdges = React.useMemo(() => {
    return edges.map(e => {
      const rawColor = e.data?.baseColor || '#8b5cf6';

      // In light mode, mix the raw color with a dark walnut brown for better contrast
      const baseColor = theme === 'light'
        ? `color-mix(in srgb, ${rawColor} 40%, #4a3623)`
        : rawColor;

      const isConnected = !!activeNodeId && (e.source === activeNodeId || e.target === activeNodeId);

      if (!activeNodeId) {
        // Ghost hints — visible enough to hint structure, not noisy
        return {
          ...e,
          type: 'floatingEdge',
          style: { stroke: `color-mix(in srgb, ${baseColor} 18%, transparent)`, strokeWidth: 1.5 },
          markerEnd: { type: 'arrowclosed', color: `color-mix(in srgb, ${baseColor} 24%, transparent)`, width: 8, height: 8 },
          animated: false,
          zIndex: 0,
          data: { ...e.data, showLabel: false, baseColor },
        };
      }

      if (isConnected) {
        // Active connection — full color, animated flow
        return {
          ...e,
          type: 'floatingEdge',
          style: { stroke: baseColor, strokeWidth: 3, filter: `drop-shadow(0 0 6px color-mix(in srgb, ${baseColor} 50%, transparent))` },
          markerEnd: { type: 'arrowclosed', color: baseColor, width: 20, height: 20 },
          animated: true,
          zIndex: 999,
          data: { ...e.data, showLabel: true, baseColor },
        };
      }

      // Inactive — nearly invisible so connected ones pop
      return {
        ...e,
        type: 'floatingEdge',
        style: { stroke: `color-mix(in srgb, ${baseColor} 8%, transparent)`, strokeWidth: 0.8 },
        markerEnd: { type: 'arrowclosed', color: `color-mix(in srgb, ${baseColor} 12%, transparent)`, width: 6, height: 6 },
        animated: false,
        zIndex: 0,
        data: { ...e.data, showLabel: false, baseColor },
      };
    });
  }, [edges, activeNodeId, theme]);

  /* ── Zoom to a specific node ── */
  zoomToNodeRef.current = (node) => {
    const target = nodes.find(n => n.id === node.id);
    if (!target) return;
    const absX = (target.position?.x || 0) + (target.data?.nodeWidth || 220) / 2;
    const absY = (target.position?.y || 0) + (target.data?.nodeHeight || 64) / 2;
    setCenter(absX, absY, { zoom: 2.2, duration: 700 });
  };

  /* ── Export as PNG ── */
  exportRef.current = async (repoName) => {
    const wrapper = flowWrapperRef.current;
    if (!wrapper) return;
    try {
      const dataUrl = await toPng(wrapper, { backgroundColor: '#050508', quality: 1, pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `${repoName || 'repoviz'}-graph.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  return (
    <div ref={flowWrapperRef} style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={styledNodes}
        edges={styledEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        onNodeMouseEnter={handleNodeMouseEnter}
        onNodeMouseLeave={handleNodeMouseLeave}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        fitViewOptions={{ padding: 0.12, includeHiddenNodes: false, duration: 800 }}
        minZoom={0.04}
        maxZoom={4}
        attributionPosition="bottom-right"
        elevateNodesOnSelect
        nodesDraggable={true}
        panOnDrag={true}
        zoomOnScroll={true}
        zoomOnPinch={true}
        selectNodesOnDrag={false}
        proOptions={{ hideAttribution: false }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          color={theme === 'light' ? 'rgba(139,90,43,0.13)' : 'rgba(180,130,80,0.11)'}
          gap={24}
          size={1.2}
        />

        <Controls showInteractive={false} />

        <MiniMap
          style={minimapStyle}
          nodeColor={(node) => {
            if (node.type === 'folderNode') return '#8b5e3c'; // Brown theme accent
            return node.data?.color || '#484f58';
          }}
          maskColor="rgba(3,3,12,0.84)"
          zoomable
          pannable
        />

        {/* Interaction hint — shown when nothing is active */}
        {!activeNodeId && (
          <div className="gc-hint">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.3" />
              <path d="M6.5 5.5v3M6.5 3.5v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            Hover or click any file to reveal its connections
          </div>
        )}
      </ReactFlow>
    </div>
  );
}

export default function GraphCanvas({ nodes, edges, setNodes, setEdges, onNodeClick, repoRoot, zoomToNodeRef, exportRef, selectedNode, theme }) {
  return (
    <div className="graph-canvas">
      <ReactFlowProvider>
        <Flow
          nodes={nodes}
          edges={edges}
          onNodeClick={onNodeClick}
          zoomToNodeRef={zoomToNodeRef}
          exportRef={exportRef}
          selectedNode={selectedNode}
          theme={theme}
        />
      </ReactFlowProvider>
    </div>
  );
}
