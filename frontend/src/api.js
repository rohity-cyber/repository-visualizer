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

  source.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);

      if (data.error) {
        source.close();
        onError(data.message);
        return;
      }

      onProgress(data.percent, data.message);

      if (data.percent === 100 && data.result) {
        source.close();
        onComplete(data.result);
      }
    } catch (err) {
      source.close();
      onError('Failed to parse progress data');
    }
  };

  source.onerror = () => {
    source.close();
    onError('Connection to server lost');
  };

  return source;
}