import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import './FolderNode.css';

function FolderNode({ data, selected }) {
  const { label, fileCount, color } = data;

  return (
    <div
      className={`folder-node ${selected ? 'folder-node--selected' : ''}`}
      style={{ '--folder-color': color || '#30363d' }}
    >
      <Handle type="target" position={Position.Left} className="folder-node__handle" />

      <div className="folder-node__header">
        <div className="folder-node__header-left">
          <span className="folder-node__icon">📁</span>
          <span className="folder-node__label">{label}</span>
        </div>
        <span className="folder-node__count">
          {fileCount} {fileCount === 1 ? 'file' : 'files'}
        </span>
      </div>

      <Handle type="source" position={Position.Right} className="folder-node__handle" />
    </div>
  );
}

export default memo(FolderNode);