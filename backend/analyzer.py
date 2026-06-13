"""
Repository traversal, dependency parsing, and complexity metrics.
"""
import os
import re
import ast
from pathlib import Path
from typing import Optional, Callable


SUPPORTED_EXTENSIONS = {
    ".py": "python",
    ".js": "javascript",
    ".jsx": "javascript",
    ".ts": "typescript",
    ".tsx": "typescript",
    ".c": "c",
    ".cpp": "cpp",
    ".h": "c",
    ".hpp": "cpp",
    ".java": "java",
    ".go": "go",
    ".rs": "rust",
    ".rb": "ruby",
    ".php": "php",
    ".cs": "csharp",
    ".swift": "swift",
    ".kt": "kotlin",
    ".md": "markdown",
    ".json": "json",
    ".yaml": "yaml",
    ".yml": "yaml",
    ".toml": "toml",
    ".env": "env",
    ".sh": "shell",
    ".html": "html",
    ".css": "css",
    ".scss": "scss",
}

DEPENDENCY_PATTERNS = {
    "python":     [r"^\s*import\s+([\w\.]+)", r"^\s*from\s+([\w\.]+)\s+import"],
    "javascript": [r'(?:import|require)\s*[\(\'\"]([^\'"]+)[\'"\)]', r'from\s+[\'\"](.[^\'"]+)[\'\"]'],
    "typescript": [r'(?:import|require)\s*[\(\'\"]([^\'"]+)[\'"\)]', r'from\s+[\'\"](.[^\'"]+)[\'\"]'],
    "c":          [r'#include\s+[<\"]([\w\.\/]+)[>"]'],
    "cpp":        [r'#include\s+[<\"]([\w\.\/]+)[>"]'],
    "java":       [r'import\s+([\w\.]+);'],
    "go":         [r'import\s+\"([\w\.\/]+)\"', r'"([\w\.\/]+)"'],
    "rust":       [r'use\s+([\w::]+);', r'extern crate\s+(\w+);'],
    "ruby":       [r'require\s+[\'\"]([\w\/\.]+)[\'\"]'],
    "php":        [r'(?:require|include)(?:_once)?\s*[\'\"]([\w\/\.]+)[\'\"]'],
}


class RepositoryAnalyzer:
    def __init__(self, root_path: str, max_depth: int = 8, exclude_dirs: list = None, progress_callback: Callable = None):
        self.root              = Path(root_path).resolve()
        self.max_depth         = max_depth
        self.exclude_dirs      = set(exclude_dirs or [])
        self.nodes             = {}
        self.edges             = []
        self.progress_callback = progress_callback
        self._total_files      = 0
        self._scanned_files    = 0

    def analyze(self) -> dict:
        # First pass: count total files for progress tracking
        self._report_progress(0, "Counting files...")
        self._total_files = self._count_files(self.root, depth=0)

        # Second pass: actually analyze
        self._report_progress(5, "Starting analysis...")
        self._traverse(self.root, depth=0)

        self._report_progress(90, "Resolving dependencies...")
        self._resolve_edges()

        return {
            "nodes": list(self.nodes.values()),
            "edges": self.edges,
            "root": str(self.root),
            "stats": {
                "total_files": sum(1 for n in self.nodes.values() if n["type"] == "file"),
                "total_dirs":  sum(1 for n in self.nodes.values() if n["type"] == "directory"),
                "total_edges": len(self.edges),
            }
        }

    def _report_progress(self, percent: int, message: str):
        if self.progress_callback:
            self.progress_callback(percent, message)

    def _count_files(self, path: Path, depth: int) -> int:
        if depth > self.max_depth or not path.is_dir():
            return 0
        count = 0
        try:
            for entry in path.iterdir():
                if entry.name in self.exclude_dirs or entry.name.startswith("."):
                    continue
                if entry.is_file():
                    count += 1
                elif entry.is_dir():
                    count += self._count_files(entry, depth + 1)
        except PermissionError:
            pass
        return count

    def _traverse(self, path: Path, depth: int):
        if depth > self.max_depth:
            return

        relative = path.relative_to(self.root)
        node_id  = str(relative) if str(relative) != "." else "__root__"

        if path.is_dir():
            if path.name in self.exclude_dirs:
                return
            self.nodes[node_id] = {
                "id":       node_id,
                "label":    path.name if depth > 0 else self.root.name,
                "type":     "directory",
                "path":     str(relative),
                "depth":    depth,
                "children": [],
            }
            try:
                entries = sorted(path.iterdir(), key=lambda p: (p.is_file(), p.name.lower()))
                for entry in entries:
                    if entry.name.startswith(".") and entry.name not in (".env",):
                        continue
                    child_id = str(entry.relative_to(self.root))
                    self.nodes[node_id]["children"].append(child_id)
                    self._traverse(entry, depth + 1)
            except PermissionError:
                pass

        elif path.is_file():
            ext     = path.suffix.lower()
            lang    = SUPPORTED_EXTENSIONS.get(ext, "unknown")
            metrics = self._compute_metrics(path, lang)
            deps    = self._extract_dependencies(path, lang)

            self.nodes[node_id] = {
                "id":           node_id,
                "label":        path.name,
                "type":         "file",
                "path":         str(relative),
                "depth":        depth,
                "extension":    ext,
                "language":     lang,
                "dependencies": deps,
                **metrics,
            }

            # Update progress
            self._scanned_files += 1
            if self._total_files > 0:
                percent = 5 + int((self._scanned_files / self._total_files) * 80)
                self._report_progress(percent, f"Scanning {path.name}...")

    def _compute_metrics(self, path: Path, lang: str) -> dict:
        try:
            with open(path, "r", encoding="utf-8", errors="replace") as f:
                lines = f.readlines()
        except Exception:
            return {"loc": 0, "blank_lines": 0, "comment_lines": 0, "complexity": 0, "size_bytes": 0}

        loc           = len(lines)
        blank_lines   = sum(1 for l in lines if not l.strip())
        comment_lines = self._count_comments(lines, lang)
        complexity    = self._cyclomatic_complexity(path, lines, lang)
        size_bytes    = path.stat().st_size

        return {
            "loc":           loc,
            "blank_lines":   blank_lines,
            "comment_lines": comment_lines,
            "code_lines":    loc - blank_lines - comment_lines,
            "complexity":    complexity,
            "size_bytes":    size_bytes,
        }

    def _count_comments(self, lines: list, lang: str) -> int:
        # FIX #4: Properly track block comment state for Python and C-style languages
        count    = 0
        in_block = False
        for line in lines:
            stripped = line.strip()
            if lang == "python":
                if in_block:
                    count += 1
                    # Detect closing triple-quote (but not the opening one again)
                    if stripped.endswith('"""') or stripped.endswith("'''"):
                        in_block = False
                elif stripped.startswith("#"):
                    count += 1
                elif stripped.startswith('"""') or stripped.startswith("'''"):
                    count += 1
                    # Only enter block mode if the triple-quote isn't closed on the same line
                    closes_same_line = (
                        stripped.count('"""') >= 2 or stripped.count("'''") >= 2
                    )
                    if not closes_same_line:
                        in_block = True
            elif lang in ("javascript", "typescript", "java", "c", "cpp", "csharp", "go"):
                if in_block:
                    count += 1
                    if "*/" in stripped:
                        in_block = False
                elif stripped.startswith("//"):
                    count += 1
                elif stripped.startswith("/*"):
                    count += 1
                    in_block = True
        return count

    def _cyclomatic_complexity(self, path: Path, lines: list, lang: str) -> int:
        if lang == "python":
            try:
                source = "".join(lines)
                tree   = ast.parse(source)
                complexity = 1
                for node in ast.walk(tree):
                    if isinstance(node, (
                        ast.If, ast.While, ast.For, ast.ExceptHandler,
                        ast.With, ast.Assert, ast.comprehension, ast.BoolOp,
                    )):
                        complexity += 1
                return complexity
            except SyntaxError:
                pass

        decision_keywords = re.compile(
            r'\b(if|else|elif|for|while|case|catch|except|&&|\|\||and|or|try|switch)\b'
        )
        complexity = 1
        for line in lines:
            complexity += len(decision_keywords.findall(line))
        return complexity

    def _extract_dependencies(self, path: Path, lang: str) -> list:
        patterns = DEPENDENCY_PATTERNS.get(lang, [])
        if not patterns:
            return []
        deps = []
        try:
            with open(path, "r", encoding="utf-8", errors="replace") as f:
                content = f.read()
            for pattern in patterns:
                for match in re.finditer(pattern, content, re.MULTILINE):
                    dep = match.group(1).strip()
                    if dep and dep not in deps:
                        deps.append(dep)
        except Exception:
            pass
        return deps

    def _resolve_edges(self):
        stem_map: dict[str, list] = {}
        for node_id, node in self.nodes.items():
            if node["type"] == "file":
                stem = Path(node["label"]).stem.lower()
                stem_map.setdefault(stem, []).append(node_id)

        path_map: dict[str, str] = {}
        for node_id, node in self.nodes.items():
            if node["type"] == "file":
                p = node["path"].replace("\\", "/").lower()
                path_map[p] = node_id
                path_map[str(Path(p).with_suffix(""))] = node_id

        edge_set = set()

        for node_id, node in self.nodes.items():
            if node["type"] != "file":
                continue

            source_dir = str(Path(node["path"]).parent).replace("\\", "/").lower()
            if source_dir == ".":
                source_dir = ""

            for dep in node.get("dependencies", []):
                dep_clean = dep.strip()
                target_id = None

                # FIX #3: Handle JS/TS relative imports separately from Python dot-notation
                if dep_clean.startswith("."):
                    # Relative import (JS/TS style) — resolve against the source file's directory
                    try:
                        base = Path(source_dir) if source_dir else Path(".")
                        resolved = str((base / dep_clean).resolve().relative_to(Path(".").resolve()))
                        resolved = resolved.replace("\\", "/").lower()
                    except ValueError:
                        resolved = dep_clean.lstrip("./").lower()

                    target_id = path_map.get(resolved) or path_map.get(str(Path(resolved).with_suffix("")))

                    if not target_id:
                        # Fallback: match by stem name only
                        stem = Path(dep_clean).name.lstrip(".")
                        candidates = stem_map.get(stem, [])
                        if len(candidates) == 1:
                            target_id = candidates[0]
                else:
                    # Python-style module or third-party — use dot-to-slash conversion
                    dep_normalized = dep_clean.replace(".", "/").lower().strip("/")
                    if dep_normalized in path_map:
                        target_id = path_map[dep_normalized]
                    else:
                        stem       = Path(dep_normalized).name.split(".")[-1]
                        candidates = stem_map.get(stem, [])
                        if len(candidates) == 1:
                            target_id = candidates[0]

                if target_id and target_id != node_id:
                    edge_key = f"{node_id}||{target_id}"
                    if edge_key not in edge_set:
                        edge_set.add(edge_key)
                        self.edges.append({
                            "id":     edge_key,
                            "source": node_id,
                            "target": target_id,
                        })