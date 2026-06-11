import React from 'react';
import './Sidebar.css';

const LANG_BADGE_COLORS = {
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

export default function Sidebar({ stats, selectedNode }) {
  return (
    <div className="sidebar">
      <div className="sidebar-section">
        <div className="sidebar-title">Legend</div>
        <div className="legend-list">
          {Object.entries(LANG_BADGE_COLORS).map(([lang, color]) => (
            <div className="legend-item" key={lang}>
              <span className="legend-dot" style={{ background: color }} />
              <span>{lang}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-title">Complexity</div>
        <div className="legend-list">
          <div className="legend-item">
            <span className="legend-dot" style={{ background: '#3fb950' }} />
            <span>Low (≤ 5)</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot" style={{ background: '#d29922' }} />
            <span>Medium (6–15)</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot" style={{ background: '#f85149' }} />
            <span>High ({'>'} 15)</span>
          </div>
        </div>
      </div>

      {selectedNode && (
        <div className="sidebar-section">
          <div className="sidebar-title">Selected File</div>
          <div className="selected-meta">
            <div className="meta-row">
              <span className="meta-label">Name</span>
              <span className="meta-value">{selectedNode.data?.label}</span>
            </div>
            <div className="meta-row">
              <span className="meta-label">Language</span>
              <span className="meta-value">{selectedNode.data?.language}</span>
            </div>
            <div className="meta-row">
              <span className="meta-label">Lines</span>
              <span className="meta-value">{selectedNode.data?.loc}</span>
            </div>
            <div className="meta-row">
              <span className="meta-label">Complexity</span>
              <span
                className="meta-value"
                style={{ color: selectedNode.data?.complexityColor }}
              >
                {selectedNode.data?.complexity}
              </span>
            </div>
            <div className="meta-row">
              <span className="meta-label">Size</span>
              <span className="meta-value">
                {(selectedNode.data?.sizeBytes / 1024).toFixed(1)} KB
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="sidebar-hint">
        Click any node to view details and AI explanation
      </div>
    </div>
  );
}