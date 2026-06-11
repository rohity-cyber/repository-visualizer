import axios from 'axios';

const BASE = 'http://localhost:8000';

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