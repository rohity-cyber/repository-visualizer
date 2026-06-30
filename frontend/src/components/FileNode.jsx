import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import './FileNode.css';

function FileNode({ data, selected }) {
  const {
    label           = '',
    language        = '',
    color           = '#6366f1',
    groupColor      = '#6366f1',
    complexity      = 0,
    complexityColor = '#22c55e',
    loc             = 0,
    connectionCount = 0,
    nodeWidth       = 220,
    nodeHeight      = 64,
    animationDelay  = 0,
    highlighted,
    dimmed,
    connected,
  } = data;

  // Trim long names with ellipsis
  const displayName = label.length > 22 ? label.slice(0, 21) + '…' : label;

  return (
    <div
      className={[
        'fn',
        selected    ? 'fn--selected'    : '',
        highlighted ? 'fn--highlighted' : '',
        dimmed      ? 'fn--dimmed'      : '',
        connected   ? 'fn--connected'   : '',
      ].filter(Boolean).join(' ')}
      style={{
        width:  nodeWidth,
        height: nodeHeight,
        '--c':  color,
        '--cc': complexityColor,
        animationDelay: animationDelay + 'ms',
      }}
    >
      {/* ReactFlow connection handles — visible on hover/active */}
      <Handle type="target" position={Position.Left}   className="fn__h fn__h--l" id="left"   />
      <Handle type="source" position={Position.Right}  className="fn__h fn__h--r" id="right"  />
      <Handle type="target" position={Position.Top}    className="fn__h fn__h--t" id="top"    />
      <Handle type="source" position={Position.Bottom} className="fn__h fn__h--b" id="bottom" />

      {/* Language colour accent bar */}
      <div className="fn__bar" />

      {/* Card body */}
      <div className="fn__body">
        {/* Row 1: filename + connection count */}
        <div className="fn__row fn__row--top">
          <span className="fn__name">{displayName}</span>
          {connectionCount > 0 && (
            <span className="fn__conn" title={`${connectionCount} connections`}>
              {connectionCount}
            </span>
          )}
        </div>

        {/* Row 2: language + metrics */}
        <div className="fn__row fn__row--bot">
          <span className="fn__lang">{language || 'unknown'}</span>
          <div className="fn__metrics">
            <span className="fn__loc">{loc}L</span>
            <span className="fn__cx" style={{ color: complexityColor, borderColor: `${complexityColor}44` }}>
              {complexity}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(FileNode);
