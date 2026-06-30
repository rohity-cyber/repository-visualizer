/**
 * buildGraph.js — Flat grid layout, GitDiagram-inspired
 *
 * NO parentNode / extent — all nodes are flat on the canvas.
 * Folder = a header label node above its files.
 * Files = stacked beneath folder header in up to MAX_COL_FILES columns.
 * Groups arranged in a responsive column grid (left→right, wrap down).
 *
 * This keeps every group compact and readable at default zoom.
 */

/* ── Language colours ──────────────────────────── */
const LANG_COLORS = {
  python:     '#3572A5',
  javascript: '#f1e05a',
  typescript: '#2b7489',
  jsx:        '#61dafb',
  tsx:        '#61dafb',
  c:          '#555555',
  cpp:        '#f34b7d',
  java:       '#b07219',
  go:         '#00ADD8',
  rust:       '#dea584',
  ruby:       '#701516',
  php:        '#4F5D95',
  csharp:     '#178600',
  swift:      '#ffac45',
  kotlin:     '#A97BFF',
  markdown:   '#083fa1',
  json:       '#8B949E',
  yaml:       '#cb171e',
  html:       '#e34c26',
  css:        '#563d7c',
  scss:       '#c6538c',
  shell:      '#89e051',
  unknown:    '#484f58',
};

/* ── Folder accent colours ─────────────────────── */
const GROUP_COLORS = [
  '#6366f1', '#06b6d4', '#10b981', '#f59e0b',
  '#ec4899', '#8b5cf6', '#14b8a6', '#f97316',
  '#3b82f6', '#84cc16', '#fb7185', '#a78bfa',
  '#22d3ee', '#34d399', '#fbbf24', '#f472b6',
];

function getComplexityColor(c) {
  if (c <= 5)  return '#22c55e';
  if (c <= 15) return '#f59e0b';
  return '#ef4444';
}

function getTopLevelGroup(filePath) {
  const parts = filePath.replace(/\\/g, '/').split('/').filter(p => p && p !== '.');
  if (parts.length <= 1) return '(root)';
  return parts[0];
}

/* ── Layout constants ──────────────────────────── */
const FILE_W          = 220;   // file card width
const FILE_H          = 64;    // file card height
const FILE_GAP_Y      = 8;     // vertical gap between file cards
const FILE_INNER_GAP  = 16;    // horizontal gap between columns within a group
const MAX_COL_FILES   = 10;    // max files per column before wrapping within group
const FOLDER_H        = 38;    // folder header height
const FOLDER_ABOVE    = 10;    // gap between folder header and first file
const GROUP_PAD       = 16;    // padding around the group contents
const GROUP_COLS      = 4;     // how many groups per row before wrapping
const GROUP_GAP_X     = 100;   // horizontal gap between group columns (more room for edges)
const GROUP_GAP_Y     = 90;    // vertical gap between group rows
const CANVAS_X        = 40;
const CANVAS_Y        = 40;

export function buildGraphElements(rawNodes, rawEdges) {
  const fileNodes    = rawNodes.filter(n => n.type === 'file');
  const fileLabelMap = new Map();  // id → label, for edge tooltips

  /* ── Pre-compute connection counts ── */
  const connCount = new Map();  // id → number of edges touching this node
  rawEdges.forEach(e => {
    connCount.set(e.source, (connCount.get(e.source) || 0) + 1);
    connCount.set(e.target, (connCount.get(e.target) || 0) + 1);
  });

  /* ── Group by top-level directory ── */
  const groupMap = {};
  fileNodes.forEach(file => {
    const key = getTopLevelGroup(file.path);
    if (!groupMap[key]) groupMap[key] = [];
    groupMap[key].push(file);
  });

  const nodes = [];
  const edges = [];

  /* ── Sort groups: root first, then alphabetical ── */
  const groupEntries = Object.entries(groupMap).sort((a, b) => {
    if (a[0] === '(root)') return -1;
    if (b[0] === '(root)') return 1;
    return a[0].localeCompare(b[0]);
  });

  /* ── Pre-compute each group's bounding box ── */
  const groupLayouts = groupEntries.map(([key, files], idx) => {
    const numFiles  = files.length;
    const numCols   = Math.ceil(numFiles / MAX_COL_FILES);  // columns of files in this group
    const numRows   = Math.min(numFiles, MAX_COL_FILES);    // rows in the tallest column

    const innerW = numCols * FILE_W + (numCols - 1) * FILE_INNER_GAP;
    const innerH = numRows * FILE_H + (numRows - 1) * FILE_GAP_Y;

    const groupW = innerW + GROUP_PAD * 2;
    const groupH = FOLDER_H + FOLDER_ABOVE + innerH + GROUP_PAD;

    return {
      key,
      label: key,
      color: GROUP_COLORS[idx % GROUP_COLORS.length],
      files,
      groupW,
      groupH,
      numCols,
    };
  });

  /* ── Compute row heights ── */
  const rowHeights = [];
  groupLayouts.forEach((g, i) => {
    const row = Math.floor(i / GROUP_COLS);
    if (rowHeights[row] === undefined) rowHeights[row] = 0;
    rowHeights[row] = Math.max(rowHeights[row], g.groupH);
  });

  /* ── Emit nodes ── */
  groupLayouts.forEach((g, groupIdx) => {
    const gridCol = groupIdx % GROUP_COLS;
    const gridRow = Math.floor(groupIdx / GROUP_COLS);

    /* Compute X for this group's column.
       Since groups can have different widths we track cumulative X per column. */
    let gx = CANVAS_X;
    for (let c = 0; c < gridCol; c++) {
      // Find the widest group in this column across all rows
      let colMaxW = 0;
      for (let r = 0; r * GROUP_COLS + c < groupLayouts.length; r++) {
        const gi = r * GROUP_COLS + c;
        if (gi < groupLayouts.length) colMaxW = Math.max(colMaxW, groupLayouts[gi].groupW);
      }
      gx += colMaxW + GROUP_GAP_X;
    }

    /* Compute Y from sum of previous row heights */
    let gy = CANVAS_Y;
    for (let r = 0; r < gridRow; r++) {
      gy += (rowHeights[r] || 0) + GROUP_GAP_Y;
    }

    /* ── Folder header node ── */
    const headerId = `folder__${g.key}`;
    nodes.push({
      id:       headerId,
      type:     'folderNode',
      position: { x: gx, y: gy },
      data: {
        label:    g.label,
        fileCount: g.files.length,
        color:    g.color,
        sectionW: g.groupW,
        numCols:  g.numCols,
      },
      style:     { width: g.groupW, zIndex: 0 },
      draggable: true,
      selectable: false,
    });

    /* ── File card nodes (flat, no parentNode) ── */
    g.files.forEach((file, fileIdx) => {
      const colIdx  = Math.floor(fileIdx / MAX_COL_FILES);
      const rowIdx  = fileIdx % MAX_COL_FILES;

      const fx = gx + GROUP_PAD + colIdx * (FILE_W + FILE_INNER_GAP);
      const fy = gy + FOLDER_H + FOLDER_ABOVE + rowIdx * (FILE_H + FILE_GAP_Y);

      const lang   = file.language || 'unknown';
      const lColor = LANG_COLORS[lang] || LANG_COLORS.unknown;

      nodes.push({
        id:       file.id,
        type:     'fileNode',
        position: { x: fx, y: fy },
        data: {
          label:           file.label,
          language:        lang,
          color:           lColor,
          groupColor:      g.color,
          loc:             file.loc        || 0,
          complexity:      file.complexity  || 0,
          sizeBytes:       file.size_bytes  || 0,
          codeLines:       file.code_lines  || 0,
          path:            file.path,
          complexityColor: getComplexityColor(file.complexity || 0),
          connectionCount: connCount.get(file.id) || 0,
          nodeWidth:       FILE_W,
          nodeHeight:      FILE_H,
          animationDelay:  groupIdx * 20 + fileIdx * 8,
          raw:             file,
        },
        style:     { width: FILE_W, height: FILE_H, zIndex: 2 },
        draggable: true,
      });

      // Store label for edge tooltips
      fileLabelMap.set(file.id, file.label);
    });
  });

  /* ── Edges ── */
  const nodeMap    = new Map(nodes.map(n => [n.id, n]));
  const edgeSet    = new Set();

  rawEdges.forEach(e => {
    const sourceNode = nodeMap.get(e.source);
    const targetNode = nodeMap.get(e.target);
    if (!sourceNode || !targetNode) return;

    const key = `${e.source}||${e.target}`;
    if (edgeSet.has(key)) return;
    edgeSet.add(key);

    const sourceColor  = sourceNode.data.color  || '#8b5cf6';
    const sourceName   = fileLabelMap.get(e.source) || e.source;
    const targetName   = fileLabelMap.get(e.target) || e.target;

    // Use a hex-like visible opacity: ~80% solid
    const visibleStroke = `${sourceColor}cc`;   // cc = ~80% opacity in hex
    const arrowColor    = `${sourceColor}ee`;   // ee = ~93% opacity

    edges.push({
      id:        e.id,
      source:    e.source,
      target:    e.target,
      type:      'floatingEdge',
      animated:  false,
      style:     {
        stroke:      visibleStroke,
        strokeWidth: 1.8,
      },
      markerEnd: {
        type:   'arrowclosed',
        color:  arrowColor,
        width:  16,
        height: 16,
      },
      data: {
        baseColor:  sourceColor,
        sourceName,
        targetName,
        edgeType:   'imports',
      },
    });
  });

  return { nodes, edges };
}
