import React, { memo } from 'react';
import { FiFolder } from 'react-icons/fi';
import './FolderNode.css';

/**
 * FolderNode — A labeled header bar spanning all file columns in this group.
 * Placed above the file nodes for this folder on the flat canvas.
 * No handles — folder-level edges not used.
 */
function FolderNode({ data }) {
  const { label, fileCount, color, sectionW, numCols } = data;

  return (
    <div
      className="folder-node"
      style={{
        '--folder-color': color,
        width: sectionW || 220,
      }}
    >
      {/* Left accent line */}
      <div className="folder-node__accent" />

      {/* Icon + Label */}
      <FiFolder className="folder-node__icon" />
      <span className="folder-node__name">{label}</span>

      {/* File count badge */}
      <span className="folder-node__count">{fileCount}</span>

      {/* Columns hint (only if multi-column) */}
      {numCols > 1 && (
        <span className="folder-node__cols">×{numCols}</span>
      )}
    </div>
  );
}

export default memo(FolderNode);
