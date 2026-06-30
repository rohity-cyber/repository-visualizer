import React, { useState } from 'react';
import {
  getSmoothStepPath,
  EdgeLabelRenderer,
  BaseEdge,
} from 'reactflow';
import './FloatingEdge.css';

/**
 * FloatingEdge
 * ─────────────
 * Renders a smooth-step (orthogonal + rounded) edge path.
 * Shows a  Source → Target  tooltip ONLY when:
 *   • data.showLabel is true (the connected node is active), OR
 *   • the user hovers directly over this edge
 *
 * This keeps the canvas clean by default and reveals connections on demand.
 */
export default function FloatingEdge({
  id,
  sourceX, sourceY,
  targetX, targetY,
  sourcePosition, targetPosition,
  style = {},
  markerEnd,
  data = {},
}) {
  const [hovered, setHovered] = useState(false);

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
    borderRadius: 14,
  });

  const {
    baseColor  = '#8b5cf6',
    sourceName = '',
    targetName = '',
    showLabel  = false,
  } = data;

  const showTooltip = (showLabel || hovered) && sourceName && targetName;

  return (
    <>
      {/* Wide transparent hit-area — makes the edge easy to hover */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={22}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ cursor: 'crosshair' }}
      />

      {/* Actual visible path */}
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          transition: 'stroke 0.22s ease, stroke-width 0.22s ease, opacity 0.22s ease, filter 0.22s ease',
        }}
      />

      {/* Tooltip — appears on hover or when this edge's node is active */}
      {showTooltip && (
        <EdgeLabelRenderer>
          <div
            className="fe-tooltip"
            style={{
              transform: `translate(-50%, -100%) translate(${labelX}px, ${labelY - 12}px)`,
              '--edge-color': baseColor,
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
          >
            <span className="fe-tooltip__src">{sourceName}</span>
            <span className="fe-tooltip__arrow">→</span>
            <span className="fe-tooltip__tgt">{targetName}</span>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
