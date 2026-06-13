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
import FileNode from './FileNode';
import FolderNode from './FolderNode';
import './GraphCanvas.css';

const nodeTypes = {
  fileNode:   FileNode,
  folderNode: FolderNode,
};

const minimapStyle = {
  background: '#161b22',
  border:     '1px solid #21262d',
  borderRadius: '8px',
};

function Flow({ nodes: initNodes, edges: initEdges, onNodeClick, zoomToNodeRef, exportRef }) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initEdges);
  const { setCenter }                    = useReactFlow();
  const flowWrapperRef                   = useRef(null);

  React.useEffect(() => {
    setNodes(initNodes);
    setEdges(initEdges);
  }, [initNodes, initEdges, setNodes, setEdges]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const handleNodeClick = useCallback(
    (_, node) => {
      // Only open side panel for file nodes, not folder nodes
      if (node.type === 'fileNode') {
        onNodeClick(node);
      }
    },
    [onNodeClick]
  );

  // FIX #1: Account for parent folder's absolute canvas position
  zoomToNodeRef.current = (node) => {
    const target = nodes.find(n => n.id === node.id);
    if (!target) return;

    const parent = target.parentNode
      ? nodes.find(n => n.id === target.parentNode)
      : null;

    const offsetX = parent ? parent.position.x : 0;
    const offsetY = parent ? parent.position.y : 0;

    setCenter(
      offsetX + target.position.x + (target.data.nodeSize || 44) / 2,
      offsetY + target.position.y + (target.data.nodeSize || 44) / 2,
      { zoom: 1.8, duration: 600 }
    );
  };

  // Expose export function to parent via ref
  exportRef.current = async (repoName) => {
    const wrapper = flowWrapperRef.current;
    if (!wrapper) return;
    try {
      const dataUrl = await toPng(wrapper, {
        backgroundColor: '#0d1117',
        quality:         1,
        pixelRatio:      2,
      });
      const link      = document.createElement('a');
      link.download   = `${repoName || 'repoviz'}-graph.png`;
      link.href       = dataUrl;
      link.click();
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  return (
    <div ref={flowWrapperRef} style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.05}
        maxZoom={3}
        attributionPosition="bottom-right"
        elevateNodesOnSelect={false}
        nodesDraggable={true}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="#21262d"
        />
        <Controls
          style={{
            background:   '#161b22',
            border:       '1px solid #21262d',
            borderRadius: '8px',
          }}
        />
        <MiniMap
          style={minimapStyle}
          nodeColor={(node) => {
            if (node.type === 'folderNode') return node.data?.color || '#30363d';
            return node.data?.color || '#484f58';
          }}
          maskColor="rgba(13,17,23,0.7)"
        />
      </ReactFlow>
    </div>
  );
}

export default function GraphCanvas({ nodes, edges, setNodes, setEdges, onNodeClick, repoRoot, zoomToNodeRef, exportRef }) {
  return (
    <div className="graph-canvas">
      <ReactFlowProvider>
        <Flow
          nodes={nodes}
          edges={edges}
          onNodeClick={onNodeClick}
          zoomToNodeRef={zoomToNodeRef}
          exportRef={exportRef}
        />
      </ReactFlowProvider>
    </div>
  );
}
