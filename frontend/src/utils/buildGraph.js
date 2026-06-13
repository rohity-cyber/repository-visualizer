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
  json:       '#292929',
  yaml:       '#cb171e',
  html:       '#e34c26',
  css:        '#563d7c',
  scss:       '#c6538c',
  shell:      '#89e051',
  unknown:    '#484f58',
  directory:  '#30363d',
};

const FOLDER_COLORS = [
  '#58a6ff',
  '#3fb950',
  '#d29922',
  '#f85149',
  '#bc8cff',
  '#f0883e',
  '#39d353',
  '#79c0ff',
  '#ffa657',
  '#ff7b72',
];

function getComplexityColor(complexity) {
  if (complexity <= 5)  return '#3fb950';
  if (complexity <= 15) return '#d29922';
  return '#f85149';
}

function getLoCSize(loc) {
  if (loc < 50)   return 32;
  if (loc < 200)  return 38;
  if (loc < 500)  return 46;
  if (loc < 1000) return 54;
  return 64;
}

export function buildGraphElements(rawNodes, rawEdges) {
  const fileNodes = rawNodes.filter(n => n.type === 'file');

  const folderMap = {};
  fileNodes.forEach(file => {
    const parts  = file.path.replace(/\\/g, '/').split('/');
    const parent = parts.length > 1 ? parts.slice(0, -1).join('/') : '__root__';
    if (!folderMap[parent]) folderMap[parent] = [];
    folderMap[parent].push(file);
  });

  const nodes = [];
  const edges = [];

  const FOLDER_PADDING_X = 24;
  const FOLDER_PADDING_Y = 48;
  const FILE_COL_WIDTH   = 160;
  const FILE_ROW_HEIGHT  = 100;
  const FILES_PER_ROW    = 3;
  const FOLDER_GAP_X     = 80;
  const FOLDER_GAP_Y     = 60;
  const FOLDERS_PER_ROW  = 3;

  let folderX        = 40;
  let folderY        = 40;
  let maxHeightInRow = 0;
  let colIndex       = 0;

  const folderEntries = Object.entries(folderMap);

  folderEntries.forEach(([folderPath, files], folderIdx) => {
    const folderColor = FOLDER_COLORS[folderIdx % FOLDER_COLORS.length];
    const folderLabel = folderPath === '__root__'
      ? 'root'
      : folderPath.replace(/\\/g, '/').split('/').pop();

    const cols        = Math.min(files.length, FILES_PER_ROW);
    const rows        = Math.ceil(files.length / FILES_PER_ROW);
    const folderWidth  = (cols * FILE_COL_WIDTH) + (FOLDER_PADDING_X * 2);
    const folderHeight = (rows * FILE_ROW_HEIGHT) + FOLDER_PADDING_Y + 20;

    const folderId = `folder__${folderPath}`;

    nodes.push({
      id:       folderId,
      type:     'folderNode',
      position: { x: folderX, y: folderY },
      style:    { width: folderWidth, height: folderHeight },
      data: {
        label:     folderLabel,
        fileCount: files.length,
        color:     folderColor,
        path:      folderPath,
      },
      draggable: true,
    });

    files.forEach((file, fileIdx) => {
      const col   = fileIdx % FILES_PER_ROW;
      const row   = Math.floor(fileIdx / FILES_PER_ROW);
      const lang  = file.language || 'unknown';
      const color = LANG_COLORS[lang] || LANG_COLORS.unknown;
      const size  = getLoCSize(file.loc || 0);

      nodes.push({
        id:       file.id,
        type:     'fileNode',
        position: {
          x: FOLDER_PADDING_X + col * FILE_COL_WIDTH + (FILE_COL_WIDTH - size) / 2,
          y: FOLDER_PADDING_Y + row * FILE_ROW_HEIGHT + (FILE_ROW_HEIGHT - size) / 2,
        },
        data: {
          label:           file.label,
          language:        lang,
          color,
          loc:             file.loc       || 0,
          complexity:      file.complexity || 0,
          sizeBytes:       file.size_bytes || 0,
          codeLines:       file.code_lines || 0,
          path:            file.path,
          complexityColor: getComplexityColor(file.complexity || 0),
          nodeSize:        size,
          folderColor,
          raw:             file,
        },
        draggable:  true,
        parentNode: folderId,
        extent:     'parent',
      });
    });

    maxHeightInRow = Math.max(maxHeightInRow, folderHeight);
    colIndex++;

    if (colIndex >= FOLDERS_PER_ROW) {
      folderX        = 40;
      folderY       += maxHeightInRow + FOLDER_GAP_Y;
      maxHeightInRow = 0;
      colIndex       = 0;
    } else {
      folderX += folderWidth + FOLDER_GAP_X;
    }
  });

  const edgeSet = new Set();
  rawEdges.forEach(e => {
    const key = `${e.source}||${e.target}`;
    if (!edgeSet.has(key)) {
      edgeSet.add(key);
      edges.push({
        id:        e.id,
        source:    e.source,
        target:    e.target,
        type:      'smoothstep',
        animated:  false,
        style:     { stroke: '#30363d', strokeWidth: 1.5 },
        markerEnd: { type: 'arrowclosed', color: '#30363d' },
      });
    }
  });

  return { nodes, edges };
}