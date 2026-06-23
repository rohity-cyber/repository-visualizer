import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import './FileNode.css';

function FileNode({ data, selected }) {
  const {
    label = '',
    language = '',
    color = '#6366f1',
    groupColor = '#6366f1',
    complexity = 0,
    complexityColor = '#22c55e',
    loc = 0,
    nodeWidth  = 220,
    nodeHeight = 52,
    animationDelay = 0,
    highlighted,
    dimmed,
  } = data;

  const displayName = label.length > 24 ? label.slice(0, 23) + '…' : label;

  return (
    <div
      className={[
        'file-node',
        selected     ? 'file-node--selected'    : '',
        highlighted  ? 'file-node--highlighted' : '',
        dimmed       ? 'file-node--dimmed'      : '',
      ].filter(Boolean).join(' ')}
      style={{
        width:  nodeWidth,
        height: nodeHeight,
        '--node-color':       color,
        '--group-color':      groupColor,
        '--complexity-color': complexityColor,
        animationDelay:       animationDelay + 'ms',
      }}
    >
      <Handle type="target" position={Position.Left}  className="file-node__handle file-node__handle--left"  id="left" />
      <Handle type="source" position={Position.Right} className="file-node__handle file-node__handle--right" id="right" />
      <Handle type="target" position={Position.Top}   className="file-node__handle file-node__handle--top"   id="top" />
      <Handle type="source" position={Position.Bottom} className="file-node__handle file-node__handle--bot"  id="bottom" />

      {/* Language accent strip */}
      <div className="file-node__stripe" />

      {/* Main content */}
      <div className="file-node__inner">
        <div className="file-node__info">
          <span className="file-node__name">{displayName}</span>
          <span className="file-node__lang">{language}</span>
        </div>
        <div className="file-node__stats">
          <span className="file-node__loc">{loc}</span>
          <span
            className="file-node__badge"
            style={{ color: complexityColor }}
          >
            {complexity}
          </span>
        </div>
      </div>
    </div>
  );
}

export default memo(FileNode);
