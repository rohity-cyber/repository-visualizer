# RepoViz — Interactive Repository Visualizer

RepoViz is a powerful developer tool for analyzing and understanding complex codebases visually. Point it at a local directory or a public GitHub repository, and it will scan the source files, extract file-level dependency relationships statically, and render them as an interactive, zoomable, and draggable node graph.

The project addresses the visual limitations of traditional nested file trees, showing you *exactly* how different modules and files depend on each other, alongside cyclomatic complexity, lines of code, and AI-driven code explanations.

---

##  Design System & Aesthetics

RepoViz features a premium, Pinterest/Notion-inspired theme engine. Both themes are fully responsive and share a unified layout with glassmorphism blurs (`backdrop-filter`) and smooth micro-animations.

- **Light Theme (Warm Beige & Walnut Brown):** A bright, clean, organic look with beige backgrounds (`#f4ede3`), walnut brown typography, and warm caramel highlights.
- **Dark Theme (Warm Mocha & Espresso):** A deep, classy mocha dark mode (`#1b1613`) using soft espresso tones and cream typography (`#f6eee3`) that perfectly compliments the light theme instead of using generic cold grays or pure black.
- **Dynamic Edge Blending:** Connection edges automatically tint and blend into the active background (darkened walnut brown in light mode, and soft gray in dark mode) to avoid distracting neon lines and maintain a modest, clean visual style.

---

##  Tech Stack

### Frontend
- **React 19 & JavaScript (ES6+)**
- **React Flow v11:** Powering the zoomable, draggable node canvas, handles, and custom floating connection paths.
- **Dagre Layout (`@dagrejs/dagre`):** Provides automated layout orchestration to keep large codebases structured and clean.
- **React Markdown:** Renders the repository's own `README.md` within the details pane.
- **Lucide Icons / React Icons (Fi):** Provides clean UI iconography.

### Backend
- **Python 3.10+ & FastAPI:** A high-performance, asynchronous REST API framework.
- **Uvicorn:** ASGI web server.
- **Groq API & LLMs (`llama-3.3-70b-versatile`):** Powering instant, 3-sentence plain-English file explanations.
- **SSE (Server-Sent Events):** Real-time backend-to-frontend event streaming for scan progress updates.
- **Custom Dependency Extraction:** Regex-based static AST import parsing (zero code execution for absolute safety).

---

##  Project Directory Structure

```
repository-visualizer/
├── README.md               # Main project documentation (this file)
├── backend/
│   ├── run.py              # Development ASGI server entrypoint
│   ├── main.py             # FastAPI App containing REST endpoints & SSE streaming
│   ├── analyzer.py         # Static code parsing engine & dependency extractor
│   ├── ai_service.py       # Groq client integration & local MD5-keyed cache on disk
│   ├── requirements.txt    # Python package dependencies
│   └── .env.example        # Environment variables template
└── frontend/
    ├── public/
    │   ├── favicon.svg     # Custom RepoViz brand favicon (SVG)
    │   ├── index.html      # Main HTML entrypoint (configured metadata & theme tag)
    │   └── manifest.json
    ├── src/
    │   ├── App.jsx         # App shell, theme state provider, responsive layout
    │   ├── App.css         # Background ambient glows and layout framework
    │   ├── index.css       # Core typography, reset rules, CSS theme variables (`--t-*`)
    │   ├── api.js          # Axios API client setup (with endpoints mapped to backend)
    │   ├── components/
    │   │   ├── TopBar.jsx         # Custom brand logo, URL input, dropdown history, theme toggle
    │   │   ├── TopBar.css
    │   │   ├── Sidebar.jsx        # File navigation list, complexity scale slider
    │   │   ├── Sidebar.css
    │   │   ├── SidePanel.jsx      # Metrics overview, raw code preview, README viewer, AI explain
    │   │   ├── SidePanel.css
    │   │   ├── GraphCanvas.jsx    # ReactFlow viewport, minimap, controls, dotted background
    │   │   ├── GraphCanvas.css
    │   │   ├── FileNode.jsx       # Custom two-row code card component
    │   │   ├── FileNode.css
    │   │   ├── FolderNode.jsx     # Unified brown/caramel directory container component
    │   │   ├── FolderNode.css
    │   │   ├── FloatingEdge.jsx   # Custom connection edge with hover tooltip label
    │   │   ├── FloatingEdge.css
    │   │   ├── ProgressBar.jsx    # Glassy SSE-progress scanner overlay
    │   │   └── ProgressBar.css
    │   └── utils/
    │       └── buildGraph.js      # Converts backend JSON format into ReactFlow nodes/edges
    └── package.json
```

---

##  Module Overviews & Logic

### 1. Backend Code Scanner (`backend/analyzer.py`)
- Traverse the target path while applying sensible default exclusion folders (e.g. `.git`, `node_modules`, `venv`, `__pycache__`, `dist`).
- Analyzes files across multiple major languages: **Python, JavaScript/TypeScript, Go, C/C++, Java, Rust, Ruby, PHP**.
- Extracts dependency mappings by parsing `import`, `require`, `include`, `use`, and packaging syntaxes.
- Calculates file metrics: **Lines of Code (LoC)**, comment lines, blank lines, file size, and estimates **Cyclomatic Complexity** based on branch heuristics.

### 2. AI Service & Cache (`backend/ai_service.py`)
- Integrates with the **Groq API** to explain code files on demand.
- **Disk Caching:** A local JSON cache is created on the backend. When a file is analyzed, an MD5 hash of its content is calculated. If the hash matches an entry in the cache, the cached response is served instantly. This ensures zero API costs and zero lag for unmodified files.

### 3. SSE Progress Streaming (`backend/main.py`)
- For large repositories, standard HTTP requests might time out. The backend utilizes **Server-Sent Events (SSE)** under `/api/analyze-progress` to stream real-time JSON chunks (e.g. `{"percent": 45, "message": "Cloning repository..."}`) to the frontend.

### 4. Graph Construction Utility (`frontend/src/utils/buildGraph.js`)
- Feeds nodes and edges into the `dagre` layout engine.
- Groups files inside columns based on their directory prefix and maps parent folders (`FolderNode`) dynamically, providing hierarchical layout sections.

---

##  API Overview

| Endpoint | Method | Response | Description |
|---|---|---|---|
| `/` | GET | JSON | Health check returning API status |
| `/api/analyze` | POST | JSON | Analyzes a repository and returns a structured node/edge graph |
| `/api/analyze-progress` | GET | EventStream | Streams progress metrics via Server-Sent Events (SSE) |
| `/api/explain` | POST | JSON | Fetches a 3-sentence Groq summary for a file path (disk-cached) |
| `/api/file-content` | GET | PlainText | Fetches the raw file content (capped at 50KB for security) |
| `/api/readme` | GET | PlainText | Fetches the repository's root README (capped at 100KB) |

---

##  Setup & Installation

### Prerequisites
- Python 3.10+
- Node.js 18+
- Git (command line utility must be available on your system path)

### 1. Backend Server Setup
Navigate to the backend directory, install requirements, and create your environment file:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

Open `.env` and enter your Groq API key:
```env
GROQ_API_KEY=gsk_your_groq_key_here
```

Launch the server using the development entrypoint:
```bash
python run.py
```
The API will run on `http://localhost:8000`.

### 2. Frontend Web Setup
Navigate to the frontend directory, install dependencies, and start the development server:

```bash
cd ../frontend
npm install
npm start
```
The web application will open automatically at `http://localhost:3000`.

---

##  Verification & Usage

1. **Submit a Repository:** Enter a local path (e.g., `.` for this repository) or a public GitHub repository link (e.g., `https://github.com/octocat/Hello-World`) in the top search bar and click **Analyze**.
2. **Review Progress:** Watch the Server-Sent Events progress loader execute stages.
3. **Explore Connections:** Hover or click nodes to highlight adjacent connections.
4. **Detail Panel:** Click any node to open the side details drawer to inspect lines of code, complexity metrics, raw code previews, the project README, or run the Groq AI explain feature.
5. **Theme Selection:** Toggle between the Warm Beige (Light) and Warm Mocha (Dark) modes via the top bar switch.
