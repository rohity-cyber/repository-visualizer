import React, { useCallback, useRef } from 'react';
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
import FileNode  from './FileNode';
import FolderNode from './FolderNode';
import './GraphCanvas.css';

const nodeTypes = {
  fileNode:   FileNode,
  folderNode: FolderNode,
};

const minimapStyle = {
  background:   'rgba(5,5,12,0.90)',
  border:       '1px solid rgba(255,255,255,0.07)',
  borderRadius: '12px',
  boxShadow:    '0 4px 24px rgba(0,0,0,0.7)',
};

const defaultEdgeOptions = {
  type:      'smoothstep',
  animated:  false,
  style:     { stroke: 'rgba(139,92,246,0.35)', strokeWidth: 1.5 },
  markerEnd: {
    type:   'arrowclosed',
    color:  'rgba(139,92,246,0.55)',
    width:  12,
    height: 12,
  },
};

function Flow({ nodes: initNodes, edges: initEdges, onNodeClick, zoomToNodeRef, exportRef, selectedNode }) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initEdges);
  const { fitView, setCenter }           = useReactFlow();
  const flowWrapperRef                   = useRef(null);

  // Sync nodes/edges when parent updates
  React.useEffect(() => {
    setNodes(initNodes);
    setEdges(initEdges);
    // Auto-fit after a brief delay so nodes have rendered
    const t = setTimeout(() => {
      fitView({ padding: 0.1, duration: 600, includeHiddenNodes: false });
    }, 150);
    return () => clearTimeout(t);
  }, [initNodes, initEdges, setNodes, setEdges, fitView]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, ...defaultEdgeOptions }, eds)),
    [setEdges]
  );

  const handleNodeClick = useCallback(
    (_, node) => {
      if (node.type === 'fileNode') {
        onNodeClick(node);
      }
    },
    [onNodeClick]
  );

  // Highlight edges connected to selected node
  const styledEdges = React.useMemo(() => {
    if (!selectedNode) return edges;

    return edges.map(e => {
      const isConnected = e.source === selectedNode.id || e.target === selectedNode.id;
      const baseColor = e.data?.baseColor || '#a78bfa';
      
      return {
        ...e,
        style: {
          ...(e.style || {}),
          stroke:      isConnected ? baseColor : 'rgba(255,255,255,0.03)',
          strokeWidth: isConnected ? 2.5 : 1,
          opacity:     isConnected ? 1 : 0.15,
        },
        markerEnd: isConnected
          ? { type: 'arrowclosed', color: baseColor, width: 14, height: 14 }
          : (e.markerEnd || undefined),
        animated: isConnected,
        zIndex:   isConnected ? 10 : 0,
      };
    });
  }, [edges, selectedNode]);

  // Zoom to a specific node (flat layout — no parentNode offset)
  zoomToNodeRef.current = (node) => {
    const target = nodes.find(n => n.id === node.id);
    if (!target) return;
    const absX = (target.position?.x || 0) + (target.data?.nodeWidth || 210) / 2;
    const absY = (target.position?.y || 0) + (target.data?.nodeHeight || 50) / 2;
    setCenter(absX, absY, { zoom: 2.2, duration: 700 });
  };

  // Export as PNG
  exportRef.current = async (repoName) => {
    const wrapper = flowWrapperRef.current;
    if (!wrapper) return;
    try {
      const dataUrl = await toPng(wrapper, {
        backgroundColor: '#050508',
        quality: 1,
        pixelRatio: 2,
      });
      const link    = document.createElement('a');
      link.download = `${repoName || 'repoviz'}-graph.png`;
      link.href     = dataUrl;
      link.click();
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  return (
    <div ref={flowWrapperRef} style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={styledEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        fitViewOptions={{ padding: 0.1, includeHiddenNodes: false, duration: 800 }}
        minZoom={0.05}
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
        {/* Dot grid background — elegant purple-tinted dots */}
        <Background
          variant={BackgroundVariant.Dots}
          color="rgba(139,92,246,0.15)"
          gap={20}
          size={1}
        />

        {/* Control buttons */}
        <Controls showInteractive={false} />

        {/* Minimap */}
        <MiniMap
          style={minimapStyle}
          nodeColor={(node) => {
            if (node.type === 'groupNode')  return node.data?.color || '#6366f1';
            if (node.type === 'folderNode') return node.data?.color || '#6366f1';
            return node.data?.color || '#484f58';
          }}
          maskColor="rgba(5,5,12,0.8)"
          zoomable
          pannable
        />
      </ReactFlow>
    </div>
  );
}

export default function GraphCanvas({ nodes, edges, setNodes, setEdges, onNodeClick, repoRoot, zoomToNodeRef, exportRef, selectedNode }) {
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
        />
      </ReactFlowProvider>
    </div>
  );
}
