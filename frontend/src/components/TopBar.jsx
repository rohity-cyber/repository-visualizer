import React from 'react';
import './TopBar.css';

export default function TopBar({ repoPath, setRepoPath, onAnalyze, loading, stats, searchQuery, setSearchQuery }) {
  const handleKey = (e) => {
    if (e.key === 'Enter') onAnalyze(repoPath);
  };

  const isUrl = repoPath.startsWith('https://github.com') || repoPath.startsWith('git@github.com');

  return (
    <div className="topbar">
      <div className="topbar-brand">
        <span className="brand-icon">⬡</span>
        <span className="brand-name">RepoViz</span>
      </div>

      <div className="topbar-input-group">
        <div className="topbar-input-wrapper">
          <input
            className="topbar-input"
            type="text"
            placeholder="Local path or GitHub URL — e.g. C:\projects\myapp or https://github.com/user/repo"
            value={repoPath}
            onChange={e => setRepoPath(e.target.value)}
            onKeyDown={handleKey}
            disabled={loading}
          />
          {isUrl && <span className="topbar-input-badge">GitHub</span>}
        </div>
        <button
          className="topbar-btn"
          onClick={() => onAnalyze(repoPath)}
          disabled={loading || !repoPath.trim()}
        >
          {loading ? (
            <><span className="btn-spinner" />{isUrl ? 'Cloning...' : 'Scanning...'}</>
          ) : 'Analyze'}
        </button>
      </div>

      {stats && (
        <div className="topbar-search-group">
          <input
            className="topbar-search"
            type="text"
            placeholder="🔍 Search files..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      )}

      {stats && (
        <div className="topbar-stats">
          <span>{stats.total_files} files</span>
          <span className="stat-divider">·</span>
          <span>{stats.total_dirs} dirs</span>
          <span className="stat-divider">·</span>
          <span>{stats.total_edges} links</span>
        </div>
      )}
    </div>
  );
}