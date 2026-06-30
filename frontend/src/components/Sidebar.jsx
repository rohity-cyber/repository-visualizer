import React, { useState } from 'react';
import { FiChevronsLeft, FiChevronsRight, FiSearch } from 'react-icons/fi';
import './Sidebar.css';

const LANG_COLORS = {
  python:     '#3572A5',
  javascript: '#f1e05a',
  typescript: '#2b7489',
  go:         '#00ADD8',
  rust:       '#dea584',
  java:       '#b07219',
  cpp:        '#f34b7d',
  c:          '#555555',
  html:       '#e34c26',
  css:        '#563d7c',
};

export default function Sidebar({ collapsed, onToggleCollapse, stats, selectedNode, nodes, onZoomToNode }) {
  const [fileSearch, setFileSearch] = useState('');

  const fileNodes = (nodes || []).filter(n => n.type === 'fileNode' && n.data?.language !== undefined);

  const filtered = fileNodes.filter(n =>
    n.data.label.toLowerCase().includes(fileSearch.toLowerCase())
  );

  /* ── Complexity color helper ── */
  const complexityLabel = (c) => {
    if (!c || c <= 5)  return { label: `${c}`, color: '#10b981' };
    if (c <= 15)       return { label: `${c}`, color: '#f59e0b' };
    return              { label: `${c}`, color: '#ef4444' };
  };

  return (
    <div className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}>

      {/* ── Collapse toggle ── */}
      <button
        className="sidebar-toggle"
        onClick={onToggleCollapse}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <FiChevronsRight size={14} /> : <FiChevronsLeft size={14} />}
      </button>



      {/* ── Complexity scale ── */}
      <div className="sidebar-section">
        <div className="sidebar-title">Complexity</div>
        <div className="complexity-bar-wrapper">
          <div className="complexity-bar" />
          <div className="complexity-ticks">
            <span>Low ≤5</span>
            <span>Med 6–15</span>
            <span>High &gt;15</span>
          </div>
        </div>
      </div>

      {/* ── Selected file details ── */}
      {selectedNode && (
        <div className="sidebar-section sidebar-selected-section">
          <div className="sidebar-title">Selected File</div>
          <div className="selected-meta">
            <div className="meta-row">
              <span className="meta-label">Name</span>
              <span className="meta-value">{selectedNode.data?.label}</span>
            </div>
            <div className="meta-row">
              <span className="meta-label">Lang</span>
              <span className="meta-value" style={{ color: selectedNode.data?.color }}>
                {selectedNode.data?.language}
              </span>
            </div>
            <div className="meta-row">
              <span className="meta-label">Lines</span>
              <span className="meta-value">{selectedNode.data?.loc}</span>
            </div>
            <div className="meta-row">
              <span className="meta-label">Complexity</span>
              <span className="meta-value" style={{ color: selectedNode.data?.complexityColor }}>
                {selectedNode.data?.complexity}
              </span>
            </div>
            <div className="meta-row">
              <span className="meta-label">Size</span>
              <span className="meta-value">
                {(selectedNode.data?.sizeBytes / 1024).toFixed(1)} KB
              </span>
            </div>
            {selectedNode.data?.connectionCount > 0 && (
              <div className="meta-row">
                <span className="meta-label">Links</span>
                <span className="meta-value" style={{ color: '#a5b4fc' }}>
                  {selectedNode.data.connectionCount}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── File list ── */}
      {fileNodes.length > 0 && (
        <div className="sidebar-section sidebar-section--files">
          <div className="sidebar-title">Files ({fileNodes.length})</div>

          <div className="sidebar-search-wrapper">
            <FiSearch className="sidebar-search-icon" />
            <input
              className="sidebar-file-search"
              type="text"
              placeholder="Filter files…"
              value={fileSearch}
              onChange={e => setFileSearch(e.target.value)}
            />
          </div>

          <div className="sidebar-file-list">
            {filtered.map(node => {
              const cx = complexityLabel(node.data.complexity);
              return (
                <div
                  key={node.id}
                  className={`sidebar-file-item ${selectedNode?.id === node.id ? 'sidebar-file-item--active' : ''}`}
                  onClick={() => onZoomToNode(node)}
                  title={node.data.path}
                >
                  <span className="sidebar-file-dot" style={{ background: node.data.color }} />
                  <span className="sidebar-file-name">{node.data.label}</span>
                  <span className="sidebar-file-complexity" style={{ color: cx.color }}>
                    {cx.label}
                  </span>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="sidebar-file-empty">No files match</div>
            )}
          </div>
        </div>
      )}

      {/* ── Hint ── */}
      <div className="sidebar-hint">
        Click any node to reveal connections and details
      </div>
    </div>
  );
}
