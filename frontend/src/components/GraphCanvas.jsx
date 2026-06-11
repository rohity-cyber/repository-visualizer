import React, { useCallback } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';
import FileNode from './FileNode';
import './GraphCanvas.css';

const nodeTypes = { fileNode: FileNode };

const minimapStyle = {
  background: '#161b22',
  border: '1px solid #21262d',
  borderRadius: '8px',
};

export default function GraphCanvas({ nodes: initNodes, edges: initEdges, onNodeClick, repoRoot }) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initEdges);

  // Sync when parent passes new data (new repo analyzed)
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
      onNodeClick(node);
    },
    [onNodeClick]
  );

  return (
    <div className="graph-canvas">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={3}
        attributionPosition="bottom-right"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="#21262d"
        />
        <Controls
          style={{
            background: '#161b22',
            border: '1px solid #21262d',
            borderRadius: '8px',
          }}
        />
        <MiniMap
          style={minimapStyle}
          nodeColor={(node) => node.data?.color || '#484f58'}
          maskColor="rgba(13,17,23,0.7)"
        />
      </ReactFlow>
    </div>
  );
}