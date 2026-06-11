import React from 'react';
import './TopBar.css';

export default function TopBar({ repoPath, setRepoPath, onAnalyze, loading, stats }) {
  const handleKey = (e) => {
    if (e.key === 'Enter') onAnalyze(repoPath);
  };

  return (
    <div className="topbar">
      <div className="topbar-brand">
        <span className="brand-icon">⬡</span>
        <span className="brand-name">RepoViz</span>
      </div>

      <div className="topbar-input-group">
        <input
          className="topbar-input"
          type="text"
          placeholder="Paste absolute repo path, e.g. /home/user/my-project"
          value={repoPath}
          onChange={e => setRepoPath(e.target.value)}
          onKeyDown={handleKey}
          disabled={loading}
        />
        <button
          className="topbar-btn"
          onClick={() => onAnalyze(repoPath)}
          disabled={loading || !repoPath.trim()}
        >
          {loading ? 'Scanning...' : 'Analyze'}
        </button>
      </div>

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