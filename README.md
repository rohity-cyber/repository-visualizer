# Repository Visualizer

A tool for analyzing and understanding complex codebases visually. Point it at a local folder or a public GitHub repository, and it scans the files, extracts dependency relationships without executing any code, and renders the whole thing as an interactive, draggable node graph — with AI-generated plain-English summaries available on click.

This addresses the core problem of standard file explorers only showing folder hierarchy, not how files actually relate to each other, and of static diagrams being hard to read and navigate for large projects.

## Problem → Solution mapping

| Challenge from the spec | How it's addressed |
|---|---|
| **Hidden relationships** — file explorers don't show how files interact | `analyzer.py` statically scans source files and extracts `import`/`require`/`#include`/`use` statements (no code execution) to build dependency edges between files |
| **Clunky visualization** | Frontend uses React Flow for a zoomable, draggable canvas, with `dagre` for automatic layout so large graphs stay organized |
| **Slow onboarding** | Clicking a file node calls `/api/explain`, which sends the file's content to the Groq API and returns a short, plain-English summary |
| **Missing context on bloated files** | Every file node carries computed metrics: lines of code, blank/comment lines, code lines, file size, and an estimated cyclomatic complexity |

## Features

Core (from the spec):
- **Local or GitHub input** — analyze a path on disk, or paste a GitHub URL and the backend shallow-clones it (`git clone --depth=1`) to a temp directory and cleans up afterward.
- **Static dependency extraction** — supports Python, JavaScript/TypeScript, C/C++, Java, Go, Rust, Ruby, and PHP via per-language regex/AST-based import detection.
- **Interactive, draggable canvas** — built with `reactflow`, nodes can be moved, zoomed, and organized freely; distinct node types for files, folders, and groups.
- **AI summaries on click** — selecting a file requests a 3-sentence explanation from Groq (`llama-3.3-70b-versatile`, free tier).
- **Local caching for AI calls** — explanations are cached on disk keyed by an MD5 hash of file content, so a file is only re-sent to the AI if its contents actually change (controls API cost, per the spec's "Other Notes").
- **Code metrics per file** — LoC, blank lines, comment lines, code lines, file size, and cyclomatic complexity, shown per node.

Additional features beyond the original spec:
- **Real-time scan progress (SSE)** — `/api/analyze-progress` streams live progress events (cloning, file counting, scanning, dependency resolution) to the frontend via Server-Sent Events, so large repos don't feel like they've frozen the UI.
- **File content preview** — view a file's raw source directly from the graph without opening the project elsewhere.
- **Rendered README view** — fetches and renders the analyzed repo's own `README.md` (via `react-markdown`) inside the app.
- **Graph image export** — export the current graph view as a PNG via `html-to-image`.
- **Sensible default exclusions** — `.git`, `__pycache__`, `node_modules`, virtual envs, `dist`/`build`/`.next`, caches, etc. are skipped automatically so the graph isn't cluttered with noise.
- **Graceful degradation without an API key** — the app is fully usable for graph visualization and metrics even if `GROQ_API_KEY` isn't set; only the AI-explanation feature is disabled, with a clear message telling the user how to enable it.

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

## Quick Verification (for testing/review)

To confirm the tool works end-to-end without needing your own large project:

1. Start both servers (see below).
2. In the UI, enter `.` or any small local folder path, or a small public GitHub repo URL such as `https://github.com/octocat/Hello-World`.
3. Confirm: the progress bar moves through stages, a graph renders with draggable nodes, clicking a file shows its metrics, and (if `GROQ_API_KEY` is set) clicking "Explain" returns an AI summary.
4. Re-click "Explain" on the same unmodified file — it should return instantly and be marked `cached: true`, confirming the disk cache is working.
5. Hit `http://localhost:8000/` directly — it should return `{"status": "ok", ...}`, confirming the backend is reachable independent of the frontend.

## Assumptions & Notes

- The project assumes Git is installed and on `PATH`, since GitHub URL analysis depends on shelling out to `git clone`.
- Dependency extraction is regex/AST-based on raw file text — it does not execute code, and so it can occasionally produce false positives/negatives compared to a full language-aware compiler/linter (e.g. dynamic imports, conditional requires). This is an intentional tradeoff for safety and speed, per the spec's requirement to analyze "without running the code."
- Cyclomatic complexity is an approximation (heuristic-based) rather than a full AST-derived metric for every supported language, since most languages don't have a built-in parser available in this stack the way Python's `ast` module does.
- Cloned GitHub repos are shallow clones (`--depth=1`) and are deleted after analysis — nothing persists on disk beyond the AI explanation cache.
- File previews are truncated at 50 KB and READMEs at 100 KB to keep responses fast on very large files.

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

## License

Add your preferred license here.
