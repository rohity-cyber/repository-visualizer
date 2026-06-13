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
  const dirNodes  = rawNodes.filter(n => n.type === 'directory' && n.id !== '__root__');

  // Map each file to its immediate parent folder
  const folderMap = {};
  fileNodes.forEach(file => {
    const parts  = file.path.replace(/\\/g, '/').split('/');
    const parent = parts.length > 1 ? parts.slice(0, -1).join('/') : '__root__';
    if (!folderMap[parent]) folderMap[parent] = [];
    folderMap[parent].push(file);
  });

  const nodes = [];
  const edges = [];

  // Layout constants
  const FOLDER_PADDING_X  = 24;
  const FOLDER_PADDING_Y  = 48;
  const FILE_COL_WIDTH    = 160;
  const FILE_ROW_HEIGHT   = 100;
  const FILES_PER_ROW     = 3;
  const FOLDER_GAP_X      = 80;
  const FOLDER_GAP_Y      = 60;

  let folderX = 40;
  let folderY = 40;
  let maxHeightInRow = 0;
  let colIndex = 0;
  const FOLDERS_PER_ROW = 3;

  const folderEntries = Object.entries(folderMap);

  folderEntries.forEach(([folderPath, files], folderIdx) => {
    const folderColor = FOLDER_COLORS[folderIdx % FOLDER_COLORS.length];
    const folderLabel = folderPath === '__root__'
      ? 'root'
      : folderPath.replace(/\\/g, '/').split('/').pop();

    // Calculate folder dimensions based on file count
    const cols         = Math.min(files.length, FILES_PER_ROW);
    const rows         = Math.ceil(files.length / FILES_PER_ROW);
    const folderWidth  = cols * FILE_COL_WIDTH +