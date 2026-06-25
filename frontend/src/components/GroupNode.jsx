import React, { memo } from 'react';
import './GroupNode.css';

/**
 * GroupNode — A glassmorphism container that acts as a folder section.
 * Mimics GitDiagram's labeled group boxes.
 * File nodes are placed INSIDE this as child nodes.
 */
function GroupNode({ data }) {
  const { label, color, count, width, height } = data;

  return (
    <div
      className="group-node"
      style={{
        '--group-color': color,
        width,
        height,
      }}
    >
      {/* Top label bar */}
      <div className="group-node__header">
        <div className="group-node__icon">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
            <path d="M1.75 1h5.5c.414 0 .75.336.75.75V4H14c.414 0 .75.336.75.75v9.5a.75.75 0 01-.75.75H2a.75.75 0 01-.75-.75V1.75A.75.75 0 011.75 1z" fill="currentColor"/>
          </svg>
        </div>
        <span className="group-node__label">{label}</span>
        <span className="group-node__count">{count}</span>
      </div>

      {/* Content area — ReactFlow will place child nodes here */}
      <div className="group-node__body" />
    </div>
  );
}

export default memo(GroupNode);
