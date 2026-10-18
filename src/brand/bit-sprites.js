// @ts-nocheck
/* Generated from the design system's assets/Mascot/bit.js (ES module build). */
/* drills.pro Bit, 8-bit edition. One 32x32 generator for the app icon (t=0), the mascot (t=1), every pose, the GIF frames and the live previews.
   Everything is rasterised to hard pixels (no anti-aliasing) in a fixed 9-colour palette. */
const Bit = (function () {
  const N = 32;
  const PAL = { '.': null, K: '#0E1320', O: '#FF6A1A', D: '#C4470C', L: '#FF9A5A', W: '#FBFAF7', T: '#2DD4BF', A: '#F5B83D', S: '#1F2845' };
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const ss = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  const outBack = (x, c1 = 1.35) => { const c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
  const inOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const POSES = {
    idle: {},
    detect: { lookX: 1, frame: 1 },
    train: { brow: 1, mouth: 'flat', drop: 0.3, lookX: 0 },
    ship: { armL: 1, armR: 1, mouth: 'open', spark: 1 },
    oops: { cross: true, mouth: 'wavy', warn: 1, shift: 1 },
  };
  const segDist = (px, py, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1]; const l2 = dx * dx + dy * dy || 1; const t = clamp(((px - a[0]) * dx + (py - a[1]) * dy) / l2); return Math.max(Math.abs(px - (a[0] + t * dx)), Math.abs(py - (a[1] + t * dy))); };
  const polyDist = (px, py, pts) => Math.min(...pts.slice(1).map((p, i) => segDist(px, py, pts[i], p)));
  const lp = (A, B, t) => A.map((p, i) => [lerp(p[0], B[i][0], t), lerp(p[1], B[i][1], t)]);
  const rrIn = (x, y, X, Y, W, H, r) => { if (x < X || x > X + W || y < Y || y > Y + H) return false; const cx = clamp(x, X + r, X + W - r), cy = clamp(y, Y + r, Y + H - r); return Math.hypot(x - cx, y - cy) <= r; };

  const ICON = [ [[8, 13], [8, 8], [13, 8]], [[19, 8], [24, 8], [24, 13]], [[8, 19], [8, 24], [13, 24]], [[19, 24], [24, 24], [24, 19]] ];
  const arm = (side, r) => { const x0 = side < 0 ? 5 : 27, x1 = side < 0 ? 4 : 28; return [[x0, 15], [x1, 15], [x1, Math.round(lerp(20, 10, r))]]; };
  const FOOT_L = [[12, 24], [12, 27], [9, 27]], FOOT_R = [[20, 24], [20, 27], [23, 27]];

  function grid(o) {
    const p = Object.assign({ t: 1, accent: null, lookX: 0, lookY: 0, blink: 0, squash: 0, bob: 0, armL: 0, armR: 0, pulse: 0, mouth: 'smile', brow: 0, drop: -1, frame: 0, spark: 0, warn: 0, shift: 0, cross: false, mask: false, flash: 0, rim: 'W' }, o.pose ? POSES[o.pose] : {}, o);
    const t = p.t;
    const pix = Array.from({ length: N }, () => Array(N).fill('.'));
    const set = (x, y, c) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && x < N && y >= 0 && y < N) pix[y][x] = c; };
    // object space transform: squash/stretch about the feet, integer bob
    const sx = 1 + 0.08 * p.squash, sy = 1 - 0.1 * p.squash, piv = lerp(32, 28, t), bob = Math.round(p.bob), shift = p.shift;
    const obj = (ix, iy) => [16 + (ix + 0.5 - shift - 16) / sx, piv + (iy + 0.5 - bob - piv) / sy];
    const each = (fn) => { for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const [ox, oy] = obj(x, y); const c = fn(ox, oy, x, y); if (c) pix[y][x] = c; } };
    const acc = p.accent;  // optional tenant accent: replaces O (body) with accent; D and L are derived by the caller
    // with a rim the icon tile is inset 2px so its ink edge and the 1px paper rim still fit the 32 grid
    const ins = p.rim && !p.mask ? 2 : 0;
    const bx = lerp(ins, 6, t), by = lerp(ins, 5, t), bw = lerp(32 - 2 * ins, 20, t), bh = lerp(32 - 2 * ins, 19, t), br = p.mask ? 0 : lerp(7 - ins / 2, 5.5, t);
    const bodyMask = Array.from({ length: N }, () => Array(N).fill(false));
    // 1. body: tile (ink) -> orange body with ink outline
    const bodyFill = ss(0.15, 0.6, t) > 0.5 ? 'O' : 'K';
    each((x, y, ix, iy) => { if (rrIn(x, y, bx - 1, by - 1, bw + 2, bh + 2, br + 1) && !(t > 0.05 && false)) { return 'K'; } return null; });
    each((x, y, ix, iy) => { if (rrIn(x, y, bx, by, bw, bh, br)) { bodyMask[iy][ix] = true; return bodyFill; } return null; });
    // 8-bit shading on the body once it is orange: light top-left inner edge, dark bottom-right inner edge
    if (bodyFill === 'O') {
      const src = pix.map((r) => r.slice());
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (bodyMask[y][x] && src[y][x] === 'O') {
        const k = (xx, yy) => (xx < 0 || yy < 0 || xx >= N || yy >= N) ? true : src[yy][xx] === 'K' || !bodyMask[yy][xx];
        if (k(x, y + 1) || k(x + 1, y) ) pix[y][x] = 'D'; else if (k(x - 1, y) || k(x, y - 1)) pix[y][x] = 'L';
      }
    }
    // 2. limbs: the four frame corners become arms and feet
    const limbs = [lp(ICON[0], arm(-1, p.armL), t), lp(ICON[1], arm(1, p.armR), t), lp(ICON[2], FOOT_L, t), lp(ICON[3], FOOT_R, t)];
    const th = 1.9, thu = th + lerp(0, 2, ss(0.55, 1, t));
    each((x, y) => limbs.some((pts) => polyDist(x, y, pts) <= thu / 2) ? 'K' : null);
    each((x, y) => limbs.some((pts) => polyDist(x, y, pts) <= th / 2) ? 'O' : null);
    // limb shading: darker lowest row of each limb
    // 3. eye (same disc, iris and pupil in both states)
    const cx = 16, cy = lerp(16, 12.6, t), er = lerp(5.6, 5.6, t), ir = lerp(3.3, 3.4, t);
    const ey = 1 - 0.92 * p.blink;
    const lx = Math.round(p.lookX * 1.2 * t), ly = Math.round(p.lookY * t);
    each((x, y) => { const dy = (y - cy) / ey; return Math.hypot(x - cx, dy) <= er + 1 && p.blink < 0.7 ? 'K' : null; });
    each((x, y) => { const dy = (y - cy) / ey; return Math.hypot(x - cx, dy) <= er && p.blink < 0.7 ? 'W' : null; });
    each((x, y) => { const dy = (y - cy) / ey; return Math.hypot(x - (cx + lx), dy - ly) <= ir && p.blink < 0.7 ? 'K' : null; });
    if (p.blink >= 0.7) { for (let x = 10; x <= 21; x++) { const [qx, qy] = [x, Math.round(cy)]; set(qx + shift, qy + bob, 'K'); } }
    else {
      const pcx = Math.round(cx + lx) - 1, pcy = Math.round(cy + ly) - 1;
      if (p.cross) { [[0, 0], [1, 1], [1, 0], [0, 1]].forEach(([a, b]) => set(pcx + a + shift, pcy + b + bob, 'W')); set(pcx - 1 + shift, pcy - 1 + bob, 'W'); set(pcx + 2 + shift, pcy + 2 + bob, 'W'); set(pcx + 2 + shift, pcy - 1 + bob, 'W'); set(pcx - 1 + shift, pcy + 2 + bob, 'W'); }
      else { const big = (1 + p.pulse) > 1.12 ? 1 : 0; for (let a = -big; a < 2 + big; a++) for (let b = -big; b < 2 + big; b++) set(pcx + a + shift, pcy + b + bob, 'T'); set(pcx - 1 - big + shift, pcy - 1 - big + bob, 'W'); }
    }
    // 4. mouth (pixels), appears once the body is orange
    if (t > 0.8) {
      const m = { smile: [[13, 20], [14, 21], [15, 21], [16, 21], [17, 21], [18, 20]], flat: [[14, 21], [15, 21], [16, 21], [17, 21]],
        open: [[13, 20], [14, 20], [15, 20], [16, 20], [17, 20], [18, 20], [14, 21], [15, 21], [16, 21], [17, 21], [15, 22], [16, 22]],
        wavy: [[12, 21], [13, 20], [14, 21], [15, 22], [16, 21], [17, 20], [18, 21], [19, 22]] }[p.mouth] || [];
      m.forEach(([x, y]) => set(x + shift, y + bob, 'K'));
    }
    // 4b. sticker rim: a 1px paper contour around the figure so the ink outline survives dark, mid-grey and photo grounds
    if (p.rim && !p.mask) { const src = pix.map((r) => r.slice());
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (src[y][x] === '.') {
        let hit = false; for (let dy = -1; dy <= 1 && !hit; dy++) for (let dx = -1; dx <= 1; dx++) { const yy = y + dy, xx = x + dx; if (yy >= 0 && xx >= 0 && yy < N && xx < N && src[yy][xx] !== '.') { hit = true; break; } }
        if (hit) pix[y][x] = p.rim; } }
    // 5. pose extras
    const line = (x0, y0, x1, y1, c) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)); for (let i = 0; i <= n; i++) set(lerp(x0, x1, n ? i / n : 0) + shift, lerp(y0, y1, n ? i / n : 0) + bob, c); };
    if (p.brow && t > 0.8) { line(10, 5, 21, 7, 'K'); line(10, 6, 21, 8, 'K'); }
    if (p.drop >= 0 && t > 0.8) { const dy = Math.round(5 + p.drop * 7); [[1, 0], [0, 1], [1, 1], [2, 1], [0, 2], [1, 2], [2, 2], [1, 3]].forEach(([a, b]) => set(25 + a, dy + b, 'T')); }
    if (p.frame && t > 0.8) { const x0 = 7, x1 = 24, y0 = 4, y1 = 20; [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]].forEach(([x, y, dx, dy]) => { for (let i = 0; i < 4; i++) { set(x + dx * i, y, 'T'); set(x, y + dy * i, 'T'); } }); }
    const plus = (x, y, c) => { [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([a, b]) => set(x + a, y + b, c)); };
    if (p.spark && t > 0.8) { plus(4, 3, 'T'); plus(28, 3, 'A'); plus(2, 9, 'A'); plus(29, 9, 'T'); }
    if (p.flash) { plus(3, 3, 'W'); plus(28, 4, 'A'); plus(2, 27, 'T'); plus(29, 27, 'W'); }
    if (p.warn && t > 0.8) { for (let y = 1; y <= 9; y++) for (let x = 20; x <= 31; x++) { const d = Math.abs(x + 0.5 - 27), yy = y + 0.5 - 1; if (yy >= 0 && d <= yy * 0.62 + 0.6 && yy <= 8.4) set(x, y, 'K'); }
      for (let y = 2; y <= 8; y++) for (let x = 21; x <= 30; x++) { const d = Math.abs(x + 0.5 - 27), yy = y + 0.5 - 1; if (yy >= 0 && d <= yy * 0.62 - 0.5 && yy <= 7.4) set(x, y, 'A'); }
      set(27, 5, 'K'); set(27, 6, 'K'); set(27, 8, 'K'); }
    // tenant accent: swap body and limb oranges
    if (acc) for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const c = pix[y][x]; if (c === 'O') pix[y][x] = 'a0'; else if (c === 'D') pix[y][x] = 'a1'; else if (c === 'L') pix[y][x] = 'a2'; }
    return { pix, acc };
  }
  function shade(hex, f) { const v = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)); return '#' + v.map((c) => Math.round(clamp(f > 0 ? c + (255 - c) * f : c * (1 + f), 0, 255)).toString(16).padStart(2, '0')).join(''); }
  function colorOf(key, acc) { if (key === 'a0') return acc; if (key === 'a1') return shade(acc, -0.28); if (key === 'a2') return shade(acc, 0.3); return PAL[key]; }
  function svgFrom(g, opts) {
    opts = opts || {}; const { pix, acc } = g; const rects = [];
    for (let y = 0; y < N; y++) { let x = 0; while (x < N) { const c = pix[y][x]; if (c === '.') { x++; continue; } let e = x; while (e + 1 < N && pix[y][e + 1] === c) e++; rects.push(`<rect x="${x}" y="${y}" width="${e - x + 1}" height="1" fill="${colorOf(c, acc)}"/>`); x = e + 1; } }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${N} ${N}" shape-rendering="crispEdges" role="img" aria-label="${opts.label || 'drills.pro Bit'}">${rects.join('')}</svg>`;
  }
  function frame(o) { return svgFrom(grid(o), o); }

  // 16x16 favicon: Bit's face on an orange tile
  function favicon() {
    const rr = (x, y) => rrIn(x + 0.5, y + 0.5, 0, 0, 16, 16, 4);
    const rows = []; for (let y = 0; y < 16; y++) { let r = ''; for (let x = 0; x < 16; x++) { const d = Math.hypot(x + 0.5 - 8, y + 0.5 - 8); let c = '.'; if (rr(x, y)) c = (rr(x - 1, y) && rr(x + 1, y) && rr(x, y - 1) && rr(x, y + 1)) ? 'O' : 'K'; if (d <= 5.2) c = 'K'; if (d <= 4.3) c = 'W'; if (d <= 2.6) c = 'K'; if (x >= 7 && x <= 8 && y >= 7 && y <= 8) c = 'T'; r += c; } rows.push(r); }
    let s = ''; rows.forEach((r, y) => { for (let x = 0; x < 16; x++) if (r[x] !== '.') s += `<rect x="${x}" y="${y}" width="1" height="1" fill="${PAL[r[x]]}"/>`; });
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shape-rendering="crispEdges" role="img" aria-label="drills.pro favicon">${s}</svg>`;
  }
  // pixel wordmark
  const G = { d: ['....#', '....#', '.####', '#...#', '#...#', '#...#', '.####'], r: ['#.##', '##..', '#...', '#...', '#...'], i: ['#', '.', '#', '#', '#', '#', '#'], l: ['#', '#', '#', '#', '#', '#', '#'],
    s: ['.####', '#....', '.###.', '....#', '####.'], p: ['####.', '#...#', '#...#', '#...#', '####.', '#....', '#....'], o: ['.###.', '#...#', '#...#', '#...#', '.###.'] };
  function wordmark(ink) {
    const word = ['d', 'r', 'i', 'l', 'l', 's', '.', 'p', 'r', 'o']; let x = 0; const out = [];
    const put = (gx, gy, c) => out.push(`<rect x="${gx}" y="${gy}" width="1" height="1" fill="${c}"/>`);
    word.forEach((ch) => {
      if (ch === '.') { put(x, 5, '#FF6A1A'); put(x + 1, 5, '#FF6A1A'); put(x, 6, '#FF6A1A'); put(x + 1, 6, '#FF6A1A'); x += 3; return; }
      const g = G[ch]; const top = (g.length === 7 && (ch === 'd' || ch === 'i' || ch === 'l')) ? 0 : 2;
      const rowsG = ch === 'p' ? G.p : g; const off = ch === 'p' ? 2 : top;
      rowsG.forEach((row, ry) => { for (let cx = 0; cx < row.length; cx++) if (row[cx] === '#') put(x + cx, off + ry, ink); });
      if (ch === 'i') put(x, 0, ink);
      x += g[0].length + 1;
    });
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${x - 1} 9" shape-rendering="crispEdges" role="img" aria-label="drills.pro">${out.join('')}</svg>`;
  }

  const TL = {
    morph: { T: 4.4, at(time) {
      time = ((time % 4.4) + 4.4) % 4.4; const u = (a, b) => clamp((time - a) / (b - a)), sin = (x) => Math.sin(Math.PI * x);
      let t = 0, squash = 0, lookX = 0, blink = 0, armR = 0, mouth = 'smile', bob = 0, flash = 0;
      const pulse = time < 0.5 ? 0.22 * sin(u(0, 0.5)) : 0;
      if (time < 0.62) { t = 0; squash = time > 0.4 ? sin(u(0.4, 0.62)) : 0; }
      else if (time < 1.32) { t = outBack(u(0.62, 1.32)); squash = -0.8 * sin(u(0.62, 1.32)); flash = time > 0.9 && time < 1.2 ? 1 : 0; }
      else if (time < 3.3) { t = 1; squash = time < 1.62 ? 0.4 * sin(u(1.32, 1.62)) : 0; }
      else if (time < 3.52) { t = 1; squash = sin(u(3.3, 3.52)); }
      else if (time < 4.2) { t = 1 - inOut(u(3.52, 4.2)); squash = -0.6 * sin(u(3.52, 4.2)); flash = time > 3.75 && time < 4.0 ? 1 : 0; }
      else { t = 0; squash = 0.3 * sin(u(4.2, 4.4)); }
      if (t > 0.98) {
        bob = (time > 1.7 && time < 3.0) ? Math.round(Math.sin(time * 7)) : 0;
        if (time >= 1.5 && time < 1.8) lookX = time > 1.62 ? 1 : 0; else if (time >= 1.8 && time < 2.1) lookX = time > 1.95 ? -1 : 1; else if (time >= 2.1 && time < 2.3) lookX = 0;
        if (time >= 2.3 && time < 2.48) blink = 1;
        if (time >= 2.55 && time < 3.3) { armR = Math.sin((time - 2.55) * 16) > 0 ? 1 : 0.6; if (time > 3.1) armR = 0; mouth = 'open'; }
      }
      return { t, squash, lookX, blink, armR, mouth, bob, pulse, flash };
    } },
    train: { T: 1.6, at(time) { const w = (2 * Math.PI * time) / 1.6; return { pose: 'train', t: 1, lookX: Math.round(Math.sin(w)), armL: Math.sin(w * 2) > 0 ? 1 : 0, armR: Math.sin(w * 2) > 0 ? 0 : 1, bob: Math.round(Math.sin(w * 4)), drop: (time % 0.8) / 0.8, blink: 0 }; } },
  };
  const api = { N, PAL, grid, frame, svgFrom, favicon, wordmark, TL, POSES, colorOf };
  return api;
})();
export default Bit;

