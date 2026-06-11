"""
Repository Structure Analysis Engine - FastAPI Backend
"""
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
import os

from analyzer import RepositoryAnalyzer
from ai_service import AIService

app = FastAPI(
    title="Repo Analyzer API",
    description="Analyzes local Git repositories for structure, dependencies, and complexity",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ai_service = AIService()


class AnalyzeRequest(BaseModel):
    path: str
    max_depth: Optional[int] = 8
    exclude_dirs: Optional[list[str]] = None


class AIExplainRequest(BaseModel):
    file_path: str
    repo_path: str


@app.get("/")
def root():
    return {"status": "ok", "message": "Repo Analyzer API is running"}


@app.post("/api/analyze")
def analyze_repository(request: AnalyzeRequest):
    """
    Traverses a local directory and returns nodes and edges as JSON.
    """
    path = os.path.expanduser(request.path)

    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail=f"Path not found: {path}")
    if not os.path.isdir(path):
        raise HTTPException(status_code=400, detail=f"Path is not a directory: {path}")

    exclude = request.exclude_dirs or [
        ".git", "__pycache__", "node_modules", ".venv", "venv",
        "env", "dist", "build", ".next", ".cache", "coverage",
        ".mypy_cache", ".pytest_cache"
    ]

    try:
        analyzer = RepositoryAnalyzer(path, max_depth=request.max_depth, exclude_dirs=exclude)
        graph = analyzer.analyze()
        return JSONResponse(content=graph)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/explain")
async def explain_file(request: AIExplainRequest):
    """
    Reads a file and asks AI to explain it in 3 sentences.
    Uses a local cache keyed by file hash.
    """
    file_path = os.path.join(
        os.path.expanduser(request.repo_path),
        request.file_path.lstrip("/")
    )

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail=f"File not found: {file_path}")

    try:
        with open(file_path, "r", encoding="utf-8", errors="replace") as f:
            content = f.read()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not read file: {e}")

    import hashlib
    file_hash = hashlib.md5(content.encode()).hexdigest()
    cached = ai_service.get_cached(file_hash)
    if cached:
        return {"explanation": cached, "cached": True, "file": request.file_path}

    explanation = await ai_service.explain_code(content, request.file_path)
    ai_service.set_cache(file_hash, explanation)

    return {"explanation": explanation, "cached": False, "file": request.file_path}


@app.get("/api/file-content")
def get_file_content(repo_path: str = Query(...), file_path: str = Query(...)):
    """Returns raw file content for preview."""
    full_path = os.path.join(os.path.expanduser(repo_path), file_path.lstrip("/"))
    if not os.path.exists(full_path):
        raise HTTPException(status_code=404, detail="File not found")
    try:
        with open(full_path, "r", encoding="utf-8", errors="replace") as f:
            content = f.read(50_000)
        return {"content": content, "truncated": os.path.getsize(full_path) > 50_000}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))