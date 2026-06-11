import React, { useState, useCallback } from 'react';
import GraphCanvas from './components/GraphCanvas';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import SidePanel from './components/SidePanel';
import { analyzeRepo } from './api';
import { buildGraphElements } from './utils/buildGraph';
import './App.css';

export default function App() {
  const [repoPath, setRepoPath]     = useState('');
  const [nodes, setNodes]           = useState([]);
  const [edges, setEdges]           = useState([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [selectedNode, setSelectedNode] = useState(null);
  const [stats, setStats]           = useState(null);
  const [repoRoot, setRepoRoot]     = useState('');

  const handleAnalyze = useCallback(async (path) => {
    if (!path.trim()) return;
    setLoading(true);
    setError('');
    setSelectedNode(null);
    setNodes([]);
    setEdges([]);

    try {
      const data = await analyzeRepo(path);
      const { nodes: n, edges: e } = buildGraphElements(data.nodes, data.edges);
      setNodes(n);
      setEdges(e);
      setStats(data.stats);
      setRepoRoot(path);
    } catch (err) {
      setError(err.message || 'Failed to analyze repository.');
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="app-shell">
      <TopBar
        repoPath={repoPath}
        setRepoPath={setRepoPath}
        onAnalyze={handleAnalyze}
        loading={loading}
        stats={stats}
      />
      <div className="app-body">
        <Sidebar stats={stats} selectedNode={selectedNode} />
        <div className="canvas-wrapper">
          {error && <div className="error-banner">{error}</div>}
          {!loading && nodes.length === 0 && !error && (
            <div className="empty-state">
              <div className="empty-icon">⬡</div>
              <h2>No repository loaded</h2>
              <p>Enter an absolute path above and click Analyze</p>
              <code>Example: /home/user/my-project</code>
            </div>
          )}
          {loading && (
            <div className="empty-state">
              <div className="spinner" />
              <p>Scanning repository...</p>
            </div>
          )}
          {nodes.length > 0 && (
            <GraphCanvas
              nodes={nodes}
              edges={edges}
              setNodes={setNodes}
              setEdges={setEdges}
              onNodeClick={setSelectedNode}
              repoRoot={repoRoot}
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