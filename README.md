# Repository Visualizer

A tool for exploring the structure of a codebase visually. Point it at a local folder or a public GitHub repository, and it builds an interactive node graph of the directory tree — complete with file/folder relationships, dependency edges, AI-generated explanations of individual files, and a live progress stream while large repos are being scanned.

## Features

- **Local or GitHub input** — analyze a path on disk, or paste a GitHub URL and the backend will shallow-clone it to a temp directory.
- **Interactive graph view** — built with React Flow (`reactflow`) and auto-laid-out with `dagre`, showing folders, files, and groups as distinct node types.
- **Dependency detection** — parses `import`/`require`/`include`/`use` statements across Python, JavaScript/TypeScript, C/C++, Java, Go, Rust, Ruby, and PHP to draw dependency edges between files.
- **AI file explanations** — sends file contents to the Groq API (`llama-3.3-70b-versatile`, free tier) to generate a short, plain-English explanation of what a file does, with results cached on disk by content hash so repeat lookups are instant.
- **File preview & README rendering** — view raw file contents or a repo's rendered `README.md` without leaving the graph.
- **Real-time progress** — a Server-Sent Events (SSE) endpoint streams scan progress (cloning, traversing, parsing) to the UI for large repositories.
- **Image export** — export the rendered graph as an image via `html-to-image`.

## Tech Stack

**Backend**
- Python, [FastAPI](https://fastapi.tiangolo.com/) + Uvicorn
- `httpx` for async HTTP calls to the Groq API
- Standard library `ast`/regex-based parsing for dependency extraction

**Frontend**
- React 19
- [React Flow](https://reactflow.dev/) for the graph canvas
- `@dagrejs/dagre` for automatic graph layout
- `axios` for API calls, `react-markdown` for README rendering, `react-icons` for UI icons

## Project Structure

```
repository-visualizer/
├── backend/
│   ├── main.py            # FastAPI app: routes for analyze, explain, file-content, readme, progress (SSE)
│   ├── analyzer.py         # RepositoryAnalyzer: directory traversal, language detection, dependency parsing
│   ├── ai_service.py        # Groq API integration + on-disk explanation cache
│   ├── run.py               # Dev entrypoint (uvicorn)
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── api.js                  # Axios client for the backend API
    │   ├── components/
    │   │   ├── GraphCanvas.jsx     # React Flow graph rendering
    │   │   ├── FolderNode.jsx / FileNode.jsx / GroupNode.jsx
    │   │   ├── Sidebar.jsx / SidePanel.jsx
    │   │   ├── TopBar.jsx
    │   │   └── ProgressBar.jsx     # SSE-driven scan progress
    │   └── utils/
    │       └── buildGraph.js       # Converts backend graph JSON into React Flow nodes/edges
    └── package.json
```

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm
- Git (required for the GitHub-URL clone feature)

### 1. Backend setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

Edit `.env` and add a free Groq API key (get one at https://console.groq.com) if you want AI file explanations to work:

```
GROQ_API_KEY=your_groq_key_here
```

Run the API server:

```bash
python run.py
```

The API will be available at `http://localhost:8000`.

### 2. Frontend setup

```bash
cd frontend
npm install
npm start
```

The app will open at `http://localhost:3000` and is pre-configured to talk to the backend at `http://localhost:8000`.

## Usage

1. Open the app in your browser.
2. Enter a local folder path (e.g. `~/projects/my-app`) or a GitHub URL (e.g. `https://github.com/owner/repo`).
3. Watch the progress bar as the repository is scanned.
4. Explore the generated graph — click a file node to preview its contents, view its README, or request an AI-generated explanation.
5. Export the graph as an image if needed.

## API Overview

| Endpoint | Method | Description |
|---|---|---|
| `/api/analyze` | POST | Analyze a local path or GitHub URL, returns the full node/edge graph |
| `/api/analyze-progress` | GET (SSE) | Same as above, but streams progress updates as the scan runs |
| `/api/explain` | POST | Returns an AI-generated explanation of a given file (cached by content hash) |
| `/api/file-content` | GET | Returns raw content of a file for preview (truncated at 50 KB) |
| `/api/readme` | GET | Returns the repo's README content, if present |

## Notes

- Excluded by default during scans: `.git`, `__pycache__`, `node_modules`, `.venv`/`venv`/`env`, `dist`, `build`, `.next`, `.cache`, `coverage`, `.mypy_cache`, `.pytest_cache`.
- Cloned GitHub repositories are shallow-cloned (`--depth=1`) into a temp directory and removed after analysis.
- AI explanations require a Groq API key; without one, the app still works fully for graph visualization, just without the explanation feature.

## License

Add your preferred license here.
