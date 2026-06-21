import { buildGraphElements } from './buildGraph';

// Helper to make a minimal file node
function makeFile(id, path, loc = 0, language = 'javascript', complexity = 0) {
  return { id, type: 'file', path, loc, language, complexity, label: path.split('/').pop() };
}

// ── getLoCDimensions (tested indirectly via node data) ─────────────────────

describe('getLoCDimensions — LoC tier sizing', () => {
  const cases = [
    { loc: 0,   expectedW: 120, expectedH: 52,  label: '< 50 LoC' },
    { loc: 49,  expectedW: 120, expectedH: 52,  label: '49 LoC (boundary < 50)' },
    { loc: 50,  expectedW: 140, expectedH: 56,  label: '50 LoC (boundary 50–199)' },
    { loc: 199, expectedW: 140, expectedH: 56,  label: '199 LoC (boundary 50–199)' },
    { loc: 200, expectedW: 160, expectedH: 60,  label: '200 LoC (boundary 200–499)' },
    { loc: 499, expectedW: 160, expectedH: 60,  label: '499 LoC (boundary 200–499)' },
    { loc: 500, expectedW: 180, expectedH: 64,  label: '≥ 500 LoC' },
    { loc: 999, expectedW: 180, expectedH: 64,  label: '999 LoC' },
  ];

  cases.forEach(({ loc, expectedW, expectedH, label }) => {
    test(`${label}`, () => {
      const { nodes } = buildGraphElements([makeFile('f1', 'a/file.js', loc)], []);
      const fileNode = nodes.find(n => n.id === 'f1');
      expect(fileNode.data.nodeWidth).toBe(expectedW);
      expect(fileNode.data.nodeHeight).toBe(expectedH);
    });
  });

  test('nodeSize field is NOT present (removed)', () => {
    const { nodes } = buildGraphElements([makeFile('f1', 'a/file.js', 100)], []);
    const fileNode = nodes.find(n => n.id === 'f1');
    expect(fileNode.data.nodeSize).toBeUndefined();
  });
});

// ── animationDelay ─────────────────────────────────────────────────────────

describe('animationDelay values', () => {
  test('folder node animationDelay = folderIdx * 50', () => {
    // Two folders: folderIdx 0 and 1
    const raw = [
      makeFile('f1', 'alpha/a.js'),
      makeFile('f2', 'beta/b.js'),
    ];
    const { nodes } = buildGraphElements(raw, []);

    const folder0 = nodes.find(n => n.id === 'folder__alpha');
    const folder1 = nodes.find(n => n.id === 'folder__beta');

    expect(folder0.data.animationDelay).toBe(0);   // 0 * 50
    expect(folder1.data.animationDelay).toBe(50);  // 1 * 50
  });

  test('file node animationDelay = folderIdx * 50 + fileIdx * 30', () => {
    // folder 0 (folderIdx=0), two files (fileIdx 0 and 1)
    const raw = [
      makeFile('f1', 'alpha/a.js'),
      makeFile('f2', 'alpha/b.js'),
    ];
    const { nodes } = buildGraphElements(raw, []);

    const file1 = nodes.find(n => n.id === 'f1');
    const file2 = nodes.find(n => n.id === 'f2');

    expect(file1.data.animationDelay).toBe(0 * 50 + 0 * 30); // 0
    expect(file2.data.animationDelay).toBe(0 * 50 + 1 * 30); // 30
  });

  test('animationDelay is a non-negative number on all nodes', () => {
    const raw = [
      makeFile('f1', 'a/x.js', 10),
      makeFile('f2', 'a/y.js', 200),
      makeFile('f3', 'b/z.js', 500),
    ];
    const { nodes } = buildGraphElements(raw, []);
    nodes.forEach(n => {
      expect(typeof n.data.animationDelay).toBe('number');
      expect(n.data.animationDelay).toBeGreaterThanOrEqual(0);
    });
  });
});

// ── Layout constants ───────────────────────────────────────────────────────

describe('Layout constant effects', () => {
  test('folder width reflects FILE_COL_WIDTH=200 and FOLDER_PADDING_X=28', () => {
    // 1 file → cols=1, folderWidth = 1*200 + 2*28 = 256
    const { nodes } = buildGraphElements([makeFile('f1', 'mydir/a.js')], []);
    const folder = nodes.find(n => n.type === 'folderNode');
    expect(folder.style.width).toBe(256);
  });

  test('folder height reflects FILE_ROW_HEIGHT=108 and FOLDER_PADDING_Y=48', () => {
    // 1 file → rows=1, folderHeight = 1*108 + 48 + 20 = 176
    const { nodes } = buildGraphElements([makeFile('f1', 'mydir/a.js')], []);
    const folder = nodes.find(n => n.type === 'folderNode');
    expect(folder.style.height).toBe(176);
  });

  test('file node position centers node within cell using nodeWidth/nodeHeight', () => {
    // loc=0 → nodeWidth=120, nodeHeight=52
    // col=0, row=0: x = 28 + 0*200 + (200-120)/2 = 28+40 = 68
    //               y = 48 + 0*108 + (108-52)/2  = 48+28 = 76
    const { nodes } = buildGraphElements([makeFile('f1', 'mydir/a.js', 0)], []);
    const fileNode = nodes.find(n => n.id === 'f1');
    expect(fileNode.position.x).toBe(68);
    expect(fileNode.position.y).toBe(76);
  });
});

// ── Edge properties ────────────────────────────────────────────────────────

describe('Edge style overhaul', () => {
  const rawEdge = { id: 'e1', source: 'f1', target: 'f2' };
  const rawNodes = [makeFile('f1', 'a/x.js'), makeFile('f2', 'a/y.js')];

  test('animated is true', () => {
    const { edges } = buildGraphElements(rawNodes, [rawEdge]);
    expect(edges[0].animated).toBe(true);
  });

  test('stroke is rgba(99,102,241,0.4)', () => {
    const { edges } = buildGraphElements(rawNodes, [rawEdge]);
    expect(edges[0].style.stroke).toBe('rgba(99,102,241,0.4)');
  });

  test('strokeWidth is 1.5', () => {
    const { edges } = buildGraphElements(rawNodes, [rawEdge]);
    expect(edges[0].style.strokeWidth).toBe(1.5);
  });

  test('markerEnd color is #6366f1', () => {
    const { edges } = buildGraphElements(rawNodes, [rawEdge]);
    expect(edges[0].markerEnd.color).toBe('#6366f1');
  });

  test('markerEnd type is arrowclosed', () => {
    const { edges } = buildGraphElements(rawNodes, [rawEdge]);
    expect(edges[0].markerEnd.type).toBe('arrowclosed');
  });
});
