// The city through the window, drawn as one SVG (512 x 322, the glass's own pixels).
// Buildings have rooftop details and window grids; neon signs are mounted on buildings
// with no windows behind them and nothing drawn over them. The window's middle bar
// sits at x 251-261, so signs stay on one pane or the other.

const NS = 'http://www.w3.org/2000/svg';

function seeded(seed) {
  return () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

// How many windows are lit at each time of day.
const LIT = { sunrise: 0.2, golden: 0.12, dusk: 0.34, midnight: 0.46 };

// x, width, top, tone (1-4), window style, roof detail, optional sign.
// Sign boxes are in glass pixels; windows are left out wherever a sign sits.
const BUILDINGS = [
  { x: 0, w: 58, top: 160, tone: 2, windows: 'grid', roof: 'tank' },
  { x: 52, w: 70, top: 112, tone: 3, windows: 'grid', roof: 'ac',
    sign: { type: 'box', text: 'CAFE', x: 64, y: 196, w: 46, h: 16, color: 'peach' } },
  { x: 118, w: 60, top: 78, tone: 1, windows: 'bands', roof: 'antenna' },
  { x: 176, w: 72, top: 194, tone: 4, windows: 'grid', roof: 'escape' },
  { x: 264, w: 64, top: 152, tone: 2, windows: 'grid', roof: 'billboard',
    sign: { type: 'billboard', text: '24H', sub: 'RECORD STORE', x: 270, y: 116, w: 52, h: 26, color: 'cyan' } },
  { x: 322, w: 78, top: 96, tone: 1, windows: 'bands', roof: 'spire',
    sign: { type: 'vertical', text: 'HOTEL', x: 354, y: 118, w: 14, h: 74, color: 'pink' } },
  { x: 396, w: 60, top: 170, tone: 3, windows: 'grid', roof: 'tank' },
  { x: 450, w: 62, top: 128, tone: 4, windows: 'grid', roof: 'ac',
    sign: { type: 'box', text: 'JAZZ', x: 460, y: 150, w: 42, h: 16, color: 'pink' } },
];

// A blade sign hanging off the side of the tall left tower.
const BLADE = { type: 'vertical', text: 'RECORDS', x: 178, y: 104, w: 15, h: 86, color: 'pink', bracket: true };

const COLORS = {
  pink: ['#F28DB2', '#FFE3EF'],
  cyan: ['#6FE3F2', '#E3FBFF'],
  peach: ['#FFB38A', '#FFF0E6'],
};

const svg = (tag, attrs = {}) => {
  const node = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  return node;
};

const overlaps = (a, b, pad = 3) =>
  a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y;

export function buildCity(container, sky) {
  const rnd = seeded(11);
  const litChance = LIT[sky] ?? LIT.dusk;
  const root = svg('svg', { viewBox: '0 0 512 322', class: 'city-svg', 'aria-hidden': 'true' });

  const defs = svg('defs');
  defs.innerHTML = `
    <filter id="neon-glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="2.2" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <linearGradient id="bld-shade" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".22"/></linearGradient>`;
  root.append(defs);

  const signs = [...BUILDINGS.filter((b) => b.sign).map((b) => b.sign), BLADE];
  // Tiny lights in the far-off skyline, behind everything else.
  const far = svg('g', { class: 'far-lights' });
  for (let i = 0; i < 46; i++) {
    far.append(svg('rect', { x: (rnd() * 510).toFixed(1), y: (168 + rnd() * 90).toFixed(1), width: 1.6, height: 2, class: 'far-light' }));
  }
  root.append(far);
  const buildings = svg('g', { class: 'buildings' });
  const roofs = svg('g', { class: 'roofs' });
  const windows = svg('g', { class: 'windows' });

  for (const b of BUILDINGS) {
    const height = 322 - b.top;
    buildings.append(svg('rect', { x: b.x, y: b.top, width: b.w, height, class: `bld t${b.tone}` }));
    // Right-hand shading and a lighter cornice along the top.
    buildings.append(svg('rect', { x: b.x + b.w * 0.55, y: b.top, width: b.w * 0.45, height, fill: 'url(#bld-shade)' }));
    buildings.append(svg('rect', { x: b.x - 1, y: b.top, width: b.w + 2, height: 3, class: 'cornice' }));

    addRoof(roofs, b);

    // Windows, skipping anywhere a sign is mounted.
    const rows = b.windows === 'bands' ? 11 : 13;
    for (let y = b.top + 9; y < 262; y += rows) {
      if (b.windows === 'bands') {
        for (let x = b.x + 5; x + 8 <= b.x + b.w - 4; x += 10) addWindow(windows, { x, y, w: 8, h: 4 });
      } else {
        for (let x = b.x + 6; x + 5 <= b.x + b.w - 5; x += 10) addWindow(windows, { x, y, w: 5, h: 7 });
      }
    }
  }

  function addWindow(group, box) {
    if (signs.some((s) => overlaps(box, s))) return;
    const r = rnd();
    const lit = r < litChance;
    const color = r < 0.04 ? '#6FE3F2' : r < 0.07 ? '#F7A9C8' : r < litChance * 0.5 ? '#FFE7B8' : '#FFD38A';
    group.append(svg('rect', {
      x: box.x, y: box.y, width: box.w, height: box.h, rx: 0.6,
      class: lit ? 'win lit' : 'win',
      // Inline style, so it wins over the unlit window colour in the stylesheet.
      ...(lit ? { style: `fill: ${color}`, opacity: Math.min(1, 0.6 + r * 0.8).toFixed(2) } : {}),
    }));
  }

  const signLayer = svg('g', { class: 'signs' });
  for (const s of signs) signLayer.append(drawSign(s));

  root.append(buildings, windows, roofs, signLayer);
  container.replaceChildren(root);
}

function addRoof(group, b) {
  const cx = b.x + b.w / 2;
  if (b.roof === 'tank') {
    // A wooden water tower on stilts.
    const x = b.x + b.w * 0.25;
    group.append(svg('path', { d: `M${x + 2} ${b.top} L${x + 4} ${b.top - 9} M${x + 16} ${b.top} L${x + 14} ${b.top - 9} M${x + 3} ${b.top - 4} H${x + 15}`, class: 'roof-line' }));
    group.append(svg('rect', { x: x, y: b.top - 22, width: 18, height: 14, rx: 2, class: 'roof-fill' }));
    group.append(svg('path', { d: `M${x - 1} ${b.top - 22} L${x + 9} ${b.top - 30} L${x + 19} ${b.top - 22} Z`, class: 'roof-fill' }));
    group.append(svg('path', { d: `M${x} ${b.top - 17} H${x + 18} M${x} ${b.top - 12} H${x + 18}`, class: 'roof-band' }));
  } else if (b.roof === 'antenna') {
    group.append(svg('rect', { x: b.x + 8, y: b.top - 10, width: b.w - 16, height: 10, class: 'roof-fill' }));
    group.append(svg('path', { d: `M${cx} ${b.top - 10} V${b.top - 46} M${cx - 6} ${b.top - 30} H${cx + 6} M${cx - 4} ${b.top - 38} H${cx + 4}`, class: 'roof-line' }));
    group.append(svg('circle', { cx, cy: b.top - 47, r: 2, class: 'beacon' }));
  } else if (b.roof === 'spire') {
    group.append(svg('rect', { x: b.x + 10, y: b.top - 12, width: b.w - 20, height: 12, class: 'roof-fill' }));
    group.append(svg('rect', { x: b.x + 22, y: b.top - 22, width: b.w - 44, height: 10, class: 'roof-fill' }));
    group.append(svg('path', { d: `M${cx} ${b.top - 22} V${b.top - 56}`, class: 'roof-line' }));
    group.append(svg('circle', { cx, cy: b.top - 57, r: 2, class: 'beacon slow' }));
  } else if (b.roof === 'ac') {
    group.append(svg('rect', { x: b.x + 8, y: b.top - 7, width: 14, height: 7, class: 'roof-fill' }));
    group.append(svg('rect', { x: b.x + 26, y: b.top - 5, width: 10, height: 5, class: 'roof-fill' }));
    group.append(svg('path', { d: `M${b.x + b.w - 14} ${b.top} V${b.top - 14} H${b.x + b.w - 8}`, class: 'roof-line' }));
  } else if (b.roof === 'escape') {
    // A fire escape zig-zagging down the left side.
    let d = '';
    for (let y = b.top + 10; y < 250; y += 22) {
      d += `M${b.x + 2} ${y} H${b.x + 20} M${b.x + 4} ${y} L${b.x + 18} ${y + 22} `;
    }
    group.append(svg('path', { d, class: 'roof-line thin' }));
    group.append(svg('rect', { x: b.x + b.w - 20, y: b.top - 8, width: 12, height: 8, class: 'roof-fill' }));
  }
}

function drawSign(s) {
  const [glow, light] = COLORS[s.color];
  const g = svg('g', { class: `sign sign-${s.color}${s.type === 'vertical' ? ' sign-v' : ''}` });

  if (s.type === 'billboard') {
    // Legs, a frame with two lamps, and the lettering.
    g.append(svg('path', { d: `M${s.x + 8} ${s.y + s.h} V${s.y + s.h + 10} M${s.x + s.w - 8} ${s.y + s.h} V${s.y + s.h + 10}`, class: 'roof-line' }));
    g.append(svg('rect', { x: s.x, y: s.y, width: s.w, height: s.h, rx: 2, class: 'sign-board' }));
    g.append(svg('rect', { x: s.x + 1.5, y: s.y + 1.5, width: s.w - 3, height: s.h - 3, rx: 1.5, fill: 'none', stroke: glow, 'stroke-width': 1.4, filter: 'url(#neon-glow)' }));
    const t = svg('text', { x: s.x + s.w / 2, y: s.y + 13, 'text-anchor': 'middle', class: 'sign-text big', fill: light, filter: 'url(#neon-glow)' });
    t.textContent = s.text;
    const sub = svg('text', { x: s.x + s.w / 2, y: s.y + s.h - 4, 'text-anchor': 'middle', class: 'sign-text tiny', fill: light });
    sub.textContent = s.sub;
    g.append(t, sub);
    return g;
  }

  if (s.bracket) g.append(svg('path', { d: `M${s.x - 4} ${s.y + 6} H${s.x + 2} M${s.x - 4} ${s.y + s.h - 6} H${s.x + 2}`, class: 'roof-line' }));
  g.append(svg('rect', { x: s.x, y: s.y, width: s.w, height: s.h, rx: 3, class: 'sign-board' }));
  g.append(svg('rect', { x: s.x + 1.5, y: s.y + 1.5, width: s.w - 3, height: s.h - 3, rx: 2, fill: 'none', stroke: glow, 'stroke-width': 1.4, filter: 'url(#neon-glow)' }));

  if (s.type === 'vertical') {
    const step = (s.h - 8) / s.text.length;
    [...s.text].forEach((ch, i) => {
      const t = svg('text', { x: s.x + s.w / 2, y: s.y + 4 + step * (i + 0.5) + 3.2, 'text-anchor': 'middle', class: 'sign-text', fill: light, filter: 'url(#neon-glow)' });
      t.textContent = ch;
      g.append(t);
    });
  } else {
    const t = svg('text', { x: s.x + s.w / 2, y: s.y + s.h / 2 + 3.6, 'text-anchor': 'middle', class: 'sign-text', fill: light, filter: 'url(#neon-glow)' });
    t.textContent = s.text;
    g.append(t);
  }
  return g;
}
