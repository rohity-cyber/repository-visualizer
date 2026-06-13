import axios from 'axios';

const BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export async function analyzeRepo(path, maxDepth = 8) {
  try {
    const res = await axios.post(`${BASE}/api/analyze`, {
      path,
      max_depth: maxDepth,
    });
    return res.data;
  } catch (err) {
    const detail = err.response?.data?.detail || err.message;
    throw new Error(detail);
  }
}

export async function explainFile(repoPath, filePath) {
  try {
    const res = await axios.post(`${BASE}/api/explain`, {
      repo_path: repoPath,
      file_path: filePath,
    });
    return res.data;
  } catch (err) {
    const detail = err.response?.data?.detail || err.message;
    throw new Error(detail);
  }
}

export async function getFileContent(repoPath, filePath) {
  try {
    const res = await axios.get(`${BASE}/api/file-content`, {
      params: { repo_path: repoPath, file_path: filePath },
    });
    return res.data;
  } catch (err) {
    const detail = err.response?.data?.detail || err.message;
    throw new Error(detail);
  }
}

export async function getReadme(repoPath) {
  try {
    const res = await axios.get(`${BASE}/api/readme`, {
      params: { repo_path: repoPath },
    });
    return res.data;
  } catch (err) {
    const detail = err.response?.data?.detail || err.message;
    throw new Error(detail);
  }
}

export function analyzeRepoWithProgress(path, onProgress, onComplete, onError) {
  const url = `${BASE}/api/analyze-progress?path=${encodeURIComponent(path)}&max_depth=8`;
  const source = new EventSource(url);

  // FIX: Track whether we finished successfully so onerror doesn't fire
  // onError after a clean server-side close. EventSource auto-reconnects
  // on any close — including a normal one — which triggers onerror before
  // the browser realises the server is done. Ignoring onerror once we've
  // already completed prevents the false "Connection to server lost" error.
  let completed = false;

  source.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);

      if (data.error) {
        completed = true;
        source.close();
        onError(data.message);
        return;
      }

      onProgress(data.percent, data.message);

      if (data.percent === 100 && data.result) {
        completed = true;
        source.close();
        onComplete(data.result);
      }
    } catch (err) {
      completed = true;
      source.close();
      onError('Failed to parse progress data');
    }
  };

  source.onerror = () => {
    // Ignore errors that fire after a successful completion
    if (completed) return;
    source.close();
    onError('Connection to server lost');
  };

  return source;
}
