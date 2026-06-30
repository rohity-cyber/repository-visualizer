import React, { useState, useCallback, useRef, useEffect } from 'react';
import GraphCanvas from './components/GraphCanvas';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import SidePanel from './components/SidePanel';
import ProgressBar from './components/ProgressBar';
import { analyzeRepoWithProgress } from './api';
import { buildGraphElements } from './utils/buildGraph';
import './App.css';

export default function App() {
  const [repoPath, setRepoPath]               = useState('');
  const [nodes, setNodes]                     = useState([]);
  const [edges, setEdges]                     = useState([]);
  const [loading, setLoading]                 = useState(false);
  const [error, setError]                     = useState('');
  const [selectedNode, setSelectedNode]       = useState(null);
  const [stats, setStats]                     = useState(null);
  const [repoRoot, setRepoRoot]               = useState('');
  const [searchQuery, setSearchQuery]         = useState('');
  const [progress, setProgress]               = useState({ percent: 0, message: '' });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useState(
    () => localStorage.getItem('repoviz_theme') || 'dark'
  );
  const zoomToNodeRef                         = useRef(null);
  const exportRef                             = useRef(null);

  // Apply theme to <html data-theme> on every change
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('repoviz_theme', theme);
  }, [theme]);

  const handleToggleTheme = useCallback(() => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  }, []);

  // Detect reduced-motion preference (for JS-driven animation decisions)
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Auto-collapse sidebar on narrow viewports
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1024px)');
    setSidebarCollapsed(mq.matches);
    const handler = (e) => setSidebarCollapsed(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // FIX #2: Track the active EventSource so we can close it
  const eventSourceRef = useRef(null);

  // FIX #2: Close SSE on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const handleAnalyze = useCallback((path) => {
    if (!path.trim()) return;

    // FIX #2: Close any existing SSE connection before starting a new one
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setLoading(true);
    setError('');
    setSelectedNode(null);
    setNodes([]);
    setEdges([]);
    setSearchQuery('');
    setProgress({ percent: 0, message: 'Starting...' });

    const source = analyzeRepoWithProgress(
      path,
      // onProgress
      (percent, message) => {
        setProgress({ percent, message });
      },
      // onComplete
      (data) => {
        const { nodes: n, edges: e } = buildGraphElements(data.nodes, data.edges);
        setNodes(n);
        setEdges(e);
        setStats(data.stats);
        setRepoRoot(path);
        setLoading(false);
        eventSourceRef.current = null;
      },
      // onError
      (errMsg) => {
        setError(errMsg || 'Failed to analyze repository.');
        setLoading(false);
        eventSourceRef.current = null;
      }
    );

    eventSourceRef.current = source;
  }, []);

  const handleZoomToNode = useCallback((node) => {
    setSelectedNode(node);
    if (zoomToNodeRef.current) {
      zoomToNodeRef.current(node);
    }
  }, []);

  const handleExport = useCallback(() => {
    if (exportRef.current) {
      const name = repoRoot.split(/[\\\/]/).filter(Boolean).pop() || 'repoviz';
      exportRef.current(name);
    }
  }, [repoRoot]);

  const displayNodes = nodes.map(node => ({
    ...node,
    data: {
      ...node.data,
      highlighted: (searchQuery && node.type === 'fileNode')
        ? node.data.label.toLowerCase().includes(searchQuery.toLowerCase())
        : null,
      dimmed: (searchQuery && node.type === 'fileNode')
        ? !node.data.label.toLowerCase().includes(searchQuery.toLowerCase())
        : false,
    }
  }));

  // Derived empty-state flags
  const showEmptyState = stats === null && !loading && nodes.length === 0;
  const fileNodesOnly  = displayNodes.filter(n => n.type === 'fileNode');
  const showNoMatch    = fileNodesOnly.length > 0 && fileNodesOnly.every(n => n.data.dimmed);

  return (
    <div className="app-shell">
      <TopBar
        repoPath={repoPath}
        setRepoPath={setRepoPath}
        onAnalyze={handleAnalyze}
        loading={loading}
        stats={stats}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onExport={handleExport}
        canExport={nodes.length > 0}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />
      <div className="app-body">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(prev => !prev)}
          stats={stats}
          selectedNode={selectedNode}
          nodes={nodes}
          onZoomToNode={handleZoomToNode}
        />
        <div className="canvas-wrapper">
          {error && <div className="error-banner">{error}</div>}

          {showEmptyState && (
            <div className="empty-state">
              {/* Floating background orbs */}
              <div className="empty-state__orb empty-state__orb--1" />
              <div className="empty-state__orb empty-state__orb--2" />
              <div className="empty-state__orb empty-state__orb--3" />
              <div className="empty-state__orb empty-state__orb--4" />

              <div className="empty-state__content">
                <div className="empty-icon">🕸️</div>
                <h2>Visualize Your Repository</h2>
                <p>Enter a GitHub URL or local path to generate an interactive dependency graph of your entire codebase</p>
                <code>https://github.com/user/repo &nbsp;or&nbsp; C:\projects\myapp</code>
              </div>
            </div>
          )}

          {showNoMatch && (
            <div className="no-match-banner">
              No files match your search
              <button
                className="no-match-banner__clear"
                onClick={() => setSearchQuery('')}
              >
                Clear search
              </button>
            </div>
          )}

          {loading && (
            <ProgressBar
              percent={progress.percent}
              message={progress.message}
            />
          )}

          {nodes.length > 0 && (
            <GraphCanvas
              nodes={displayNodes}
              edges={edges}
              setNodes={setNodes}
              setEdges={setEdges}
              onNodeClick={setSelectedNode}
              repoRoot={repoRoot}
              zoomToNodeRef={zoomToNodeRef}
              exportRef={exportRef}
              selectedNode={selectedNode}
              theme={theme}
            />
          )}
        </div>
        {selectedNode && (
          <SidePanel
            node={selectedNode}
            repoRoot={repoRoot}
            onClose={() => setSelectedNode(null)}
          />
        )}
      </div>
    </div>
  );
}
