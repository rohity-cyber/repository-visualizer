import React, { useState, useEffect, useRef } from 'react';
import { FiSearch, FiDownload, FiFolder, FiSun, FiMoon } from 'react-icons/fi';
import './TopBar.css';

const MAX_HISTORY = 5;
const STORAGE_KEY = 'repoviz_history';

function loadHistory() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}

function saveHistory(path) {
  const prev    = loadHistory();
  const updated = [path, ...prev.filter(p => p !== path)].slice(0, MAX_HISTORY);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export default function TopBar({ repoPath, setRepoPath, onAnalyze, loading, stats, searchQuery, setSearchQuery, onExport, canExport, theme, onToggleTheme }) {
  const [history, setHistory]           = useState(loadHistory);
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef                      = useRef(null);

  const isUrl = repoPath.startsWith('https://github.com') || repoPath.startsWith('git@github.com');

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleAnalyze = () => {
    if (!repoPath.trim()) return;
    const updated = saveHistory(repoPath.trim());
    setHistory(updated);
    setShowDropdown(false);
    onAnalyze(repoPath.trim());
  };

  const handleKey = (e) => {
    if (e.key === 'Enter')    handleAnalyze();
    if (e.key === 'Escape')   setShowDropdown(false);
    if (e.key === 'ArrowDown') setShowDropdown(true);
  };

  const handleHistoryClick = (path) => {
    setRepoPath(path);
    setShowDropdown(false);
    onAnalyze(path);
  };

  const handleClearHistory = (e) => {
    e.stopPropagation();
    localStorage.removeItem(STORAGE_KEY);
    setHistory([]);
    setShowDropdown(false);
  };

  const removeHistoryItem = (e, path) => {
    e.stopPropagation();
    const updated = history.filter(p => p !== path);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setHistory(updated);
  };

  return (
    <div className="topbar">

      {/* ── Brand ── */}
      <div className="topbar-brand">
        <div className="brand-logo">
          <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="4"  cy="10" r="2.5" fill="white" opacity="0.9"/>
            <circle cx="16" cy="4"  r="2.5" fill="white" opacity="0.9"/>
            <circle cx="16" cy="16" r="2.5" fill="white" opacity="0.9"/>
            <line x1="4" y1="10" x2="16" y2="4"  stroke="white" strokeWidth="1.3" opacity="0.55"/>
            <line x1="4" y1="10" x2="16" y2="16" stroke="white" strokeWidth="1.3" opacity="0.55"/>
            <line x1="16" y1="4" x2="16" y2="16" stroke="white" strokeWidth="1.3" opacity="0.55"/>
          </svg>
        </div>
        <span className="brand-name">Repo<span>Viz</span></span>
      </div>

      {/* ── URL / Path input ── */}
      <div className="topbar-input-group" ref={wrapperRef}>
        <div className="topbar-input-wrapper">
          <FiFolder className="topbar-input-icon" />
          <input
            className="topbar-input"
            type="text"
            placeholder="GitHub URL or local path — e.g. https://github.com/user/repo"
            value={repoPath}
            onChange={e => setRepoPath(e.target.value)}
            onKeyDown={handleKey}
            onFocus={() => history.length > 0 && setShowDropdown(true)}
            disabled={loading}
          />
          {isUrl && <span className="topbar-input-badge">GitHub</span>}

          {/* History dropdown */}
          {showDropdown && history.length > 0 && (
            <div className="topbar-dropdown">
              <div className="topbar-dropdown-header">
                <span>Recent</span>
                <button className="dropdown-clear-btn" onClick={handleClearHistory}>
                  Clear all
                </button>
              </div>
              {history.map((path, i) => (
                <div
                  key={i}
                  className="topbar-dropdown-item"
                  onClick={() => handleHistoryClick(path)}
                >
                  <span className="dropdown-item-icon">
                    {path.startsWith('https://') ? '⎇' : '📁'}
                  </span>
                  <span className="dropdown-item-path">{path}</span>
                  <button
                    className="dropdown-item-remove"
                    onClick={(e) => removeHistoryItem(e, path)}
                    title="Remove"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          className="topbar-btn"
          onClick={handleAnalyze}
          disabled={loading || !repoPath.trim()}
        >
          {loading ? (
            <><span className="btn-spinner" />{isUrl ? 'Cloning…' : 'Scanning…'}</>
          ) : 'Analyze'}
        </button>

        {canExport && (
          <button
            className="topbar-btn topbar-btn--export"
            onClick={onExport}
            title="Export graph as PNG"
          >
            <FiDownload size={13} />
            Export
          </button>
        )}
      </div>

      {/* ── Right-aligned actions & stats ── */}
      <div className="topbar-right">
        {/* ── File search ── */}
        {stats && (
          <div className="topbar-search-group">
            <div className="topbar-search-wrapper">
              <FiSearch className="topbar-search-icon" />
              <input
                className="topbar-search"
                type="text"
                placeholder="Search files…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* ── Theme toggle ── */}
        <button
          className="topbar-theme-btn"
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          aria-label="Toggle theme"
        >
          {theme === 'dark'
            ? <FiSun size={15} />
            : <FiMoon size={15} />
          }
        </button>

        {/* ── Repo stats ── */}
        {stats && (
          <div className="topbar-stats">
            <span className="topbar-stat-badge">
              <span className="stat-num">{stats.total_files}</span> files
            </span>
            <span className="topbar-stat-badge">
              <span className="stat-num">{stats.total_dirs}</span> dirs
            </span>
            <span className="topbar-stat-badge">
              <span className="stat-num">{stats.total_edges}</span> links
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
