// ASCII lilies: rich color generator + button-only regrow edition
(() => {
  'use strict';

  const RAMP = ' .:-=+*cxoaX#%&@';
  const WORLD_W = 1000;
  const WORLD_H = 1100;
  const FPS = 30;

  // 12 curated base palettes + procedural generator below for infinite variety
  const PALETTES = [
    { // 1. Classic Stargazer Pink
      petal: ['#f39ab2', '#ff758f', '#ffb3c6', '#e66086'], edge: '#ffe5ec',
      blush: '#d99aa6', throat: '#c9dc78', vein: 'rgba(170,40,80,0.45)', anther: '#4a1d10', spots: true,
    },
    { // 2. White Oriental & Cream
      petal: ['#f6f2ea', '#fffdf9', '#f3e5ab', '#ebe4d8'], edge: '#ffffff',
      blush: '#d8dcc0', throat: '#c8d87a', vein: 'rgba(120,130,90,0.4)', anther: '#8a3a16', spots: false,
    },
    { // 3. Vibrant Mixed Garden
      petal: ['#e3233a', '#d24aa9', '#f08a2a', '#e9c63c', '#f1e4c6', '#f39ab2'], edge: null,
      blush: '#c98a7a', throat: '#e8d070', vein: 'rgba(80,10,20,0.45)', anther: '#3a160a', spots: true,
    },
    { // 4. Sunset Coral & Gold
      petal: ['#ff595e', '#ff924c', '#ffca3a', '#ff758f', '#f4a261'], edge: '#fff0f3',
      blush: '#e5989b', throat: '#d9ed92', vein: 'rgba(140,30,50,0.45)', anther: '#582f0e', spots: true,
    },
    { // 5. Lavender & Amethyst Dream
      petal: ['#c77dff', '#e0aaff', '#9d4edd', '#b56576', '#d8bbff'], edge: '#f8edeb',
      blush: '#cdb4db', throat: '#cce3de', vein: 'rgba(90,24,154,0.45)', anther: '#3c096c', spots: true,
    },
    { // 6. Golden Hour & Apricot
      petal: ['#ffb703', '#ffd166', '#fb8500', '#f4a261', '#ffe599'], edge: '#fff8e7',
      blush: '#ddb892', throat: '#b5e48c', vein: 'rgba(160,70,10,0.42)', anther: '#5c2c06', spots: true,
    },
    { // 7. Crimson & Velvet Rose
      petal: ['#d90429', '#ef233c', '#ff4d6d', '#a4133c', '#ff758f'], edge: '#ffccd5',
      blush: '#c97a86', throat: '#d4e09b', vein: 'rgba(60,5,20,0.55)', anther: '#2b0910', spots: true,
    },
    { // 8. Pastel Sorbet (Peach, Lilac, Mint-Pink)
      petal: ['#ffadad', '#ffd6a5', '#fdffb6', '#ffc6ff', '#bdb2ff'], edge: '#ffffff',
      blush: '#e5b3fe', throat: '#d8f3dc', vein: 'rgba(140,80,120,0.38)', anther: '#6d4c3d', spots: false,
    },
    { // 9. Celestial Blue & Periwinkle
      petal: ['#72efdd', '#64dfdf', '#5390d9', '#7400b8', '#a9def9'], edge: '#e2eafc',
      blush: '#9bf6ff', throat: '#d9ed92', vein: 'rgba(30,50,130,0.45)', anther: '#240046', spots: false,
    },
    { // 10. Magenta, Berry & Plum
      petal: ['#f72585', '#b5179e', '#7209b7', '#ff5d8f', '#e0aaff'], edge: '#ffcbf2',
      blush: '#c77dff', throat: '#e9ff70', vein: 'rgba(70,10,60,0.5)', anther: '#3a0ca3', spots: true,
    },
    { // 11. Cherry Blossom & Soft Blush
      petal: ['#ffc2d1', '#ffb3c6', '#ff8fab', '#ffe5ec', '#fb6f92'], edge: '#fff5f8',
      blush: '#e29578', throat: '#dde5b6', vein: 'rgba(180,60,90,0.35)', anther: '#5e3023', spots: true,
    },
    { // 12. Tropical Flamingo & Tangerine
      petal: ['#ff6b6b', '#ff8e53', '#ffbe0b', '#fb5607', '#ff006e'], edge: '#fff1e6',
      blush: '#f28482', throat: '#c7f9cc', vein: 'rgba(150,20,40,0.48)', anther: '#3d1308', spots: true,
    }
  ];

  // ---------- helpers ----------
  function rng(seed) {
    return () => {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const randomSeed = () => ((Math.random() * 0x7fffffff) | 0) ^ (Date.now() & 0x7fffffff);

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const prog = (T, start, dur) => clamp((T - start) / dur, 0, 1);
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const smooth = (a, b, t) => { const x = clamp((t - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); };
  const rad = (d) => (d * Math.PI) / 180;

  // Convert HSL to #rrggbb so we can procedurally generate infinite flower colors
  function hslToHex(h, s, l) {
    h = ((h % 360) + 360) % 360;
    s /= 100; l /= 100;
    const k = n => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    const toHex = x => Math.round(255 * x).toString(16).padStart(2, '0');
    return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
  }

  let lastPaletteIdx = -1;
  function pickRandomPalette() {
    const r = rng(randomSeed());
    // 45% chance to procedurally invent a brand-new harmonious color palette,
    // 55% chance to pick one of the 12 curated palettes (never repeating the last one)
    if (r() < 0.45) {
      const baseHue = Math.floor(r() * 360);
      // Avoid pure muddy greens (hues 95-145) for main petals
      const safeHue = (baseHue > 90 && baseHue < 150) ? (baseHue + 120) % 360 : baseHue;
      const spread = 25 + r() * 75;
      const petals = Array.from({ length: 6 }, (_, i) => {
        const h = safeHue + (i - 2.5) * (spread / 3) + (r() - 0.5) * 20;
        const s = 68 + r() * 28;
        const l = 55 + r() * 26;
        return hslToHex(h, s, l);
      });
      return {
        petal: petals,
        edge: hslToHex(safeHue, 60, 92),
        blush: hslToHex(safeHue + 15, 45, 70),
        throat: hslToHex(75 + r() * 25, 65, 68),
        vein: `rgba(90, 20, 45, 0.45)`,
        anther: '#4a1d10',
        spots: r() > 0.35
      };
    }

    let idx = Math.floor(r() * PALETTES.length);
    if (idx === lastPaletteIdx) idx = (idx + 1 + Math.floor(r() * (PALETTES.length - 1))) % PALETTES.length;
    lastPaletteIdx = idx;
    return PALETTES[idx];
  }

  function rgbOf(c) {
    if (c[0] === '#') {
      const n = parseInt(c.slice(1), 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }
    return c.match(/\d+/g).slice(0, 3).map(Number);
  }
  function mix(a, b, t) {
    const A = rgbOf(a), B = rgbOf(b);
    return `rgb(${Math.round(lerp(A[0], B[0], t))},${Math.round(lerp(A[1], B[1], t))},${Math.round(lerp(A[2], B[2], t))})`;
  }

  function bez(p, t) {
    const u = 1 - t;
    return [
      u * u * u * p[0][0] + 3 * u * u * t * p[1][0] + 3 * u * t * t * p[2][0] + t * t * t * p[3][0],
      u * u * u * p[0][1] + 3 * u * u * t * p[1][1] + 3 * u * t * t * p[2][1] + t * t * t * p[3][1],
    ];
  }
  function bezAngle(p, t) {
    const a = bez(p, Math.max(0, t - 0.01)), b = bez(p, Math.min(1, t + 0.01));
    return Math.atan2(b[1] - a[1], b[0] - a[0]);
  }

  let T = 0;
  function sway(x, y) {
    const lift = clamp((1090 - y) / 800, 0, 1);
    return [x + Math.sin(T * 0.9 + y * 0.006) * 8 * lift + Math.sin(T * 0.43 + x * 0.004) * 4 * lift, y];
  }

  // ---------- scene ----------
  const STEM_START = 0, STEM_DUR = 2.6;
  const LEAF_START = 1.0;
  const BUD_START = 2.2;
  const BLUSH_START = 3.6;
  const OPEN_START = 5.0, OPEN_GAP = 0.85, OPEN_DUR = 3.2;

  function buildScene() {
    const r = rng(randomSeed());
    const S = { stems: [], leaves: [], buds: [] };

    const numStems = 6 + Math.floor(r() * 5);
    const fanWidth = 340 + r() * 220;
    const centerBias = (r() - 0.5) * 60;

    for (let s = 0; s < numStems; s++) {
      const frac = numStems === 1 ? 0.5 : s / (numStems - 1);
      const spreadX = (frac - 0.5) * fanWidth + (r() - 0.5) * 85;
      const tx = clamp(500 + centerBias + spreadX, 200, 800);

      const distFromCenter = Math.abs(tx - 500) / 320;
      const ty = clamp(240 + distFromCenter * 220 + (r() - 0.35) * 180, 210, 640);
      const sides = r() < 0.35 ? 1 : (r() < 0.82 ? 2 : 3);

      const bx = 460 + r() * 80;
      const by = 1090;
      const cp1x = lerp(bx, tx, 0.05 + r() * 0.35) + (r() - 0.5) * 110;
      const cp1y = lerp(by, ty, 0.25 + r() * 0.2);
      const cp2x = lerp(bx, tx, 0.55 + r() * 0.35) + (r() - 0.5) * 110;
      const cp2y = lerp(by, ty, 0.65 + r() * 0.22);

      const stem = [[bx, by], [cp1x, cp1y], [cp2x, cp2y], [tx, ty]];
      const lean = (tx - bx) * (0.07 + r() * 0.07);
      const stemRef = {
        pts: stem,
        start: STEM_START + r() * 0.5,
        width: 7 + r() * 3.5,
        color: r() > 0.5 ? '#5a9a30' : '#4b8928'
      };
      S.stems.push(stemRef);

      const n = 4 + Math.floor(r() * 5);
      const startSide = r() > 0.5 ? 1 : -1;
      for (let i = 0; i < n; i++) {
        const t = 0.18 + (i / n) * 0.56 + r() * 0.05;
        const side = (i % 2 ? 1 : -1) * startSide;
        S.leaves.push({
          stem, t, side, len: 70 + r() * 70, w: 11 + r() * 8,
          spread: rad(22 + r() * 36), start: LEAF_START + t * 1.5 + r() * 0.35, tint: r(),
        });
      }

      S.buds.push({ stem, stemRef, at: 1, ped: null, dir: rad(-90 + lean + (r() - 0.5) * 24) });
      for (let k = 0; k < sides; k++) {
        const side = (k % 2 ? 1 : -1) * (r() > 0.25 ? 1 : -1);
        const at = 0.76 + r() * 0.18;
        const base = bez(stem, at);
        const ang = rad(-90 + lean + side * (24 + r() * 34));
        const len = 35 + r() * 55;
        const end = [base[0] + Math.cos(ang) * len, base[1] + Math.sin(ang) * len];
        const ped = [base, [lerp(base[0], end[0], 0.3), base[1] - len * 0.35], [lerp(base[0], end[0], 0.8), lerp(base[1], end[1], 0.7)], end];
        S.buds.push({ stem, stemRef, at, ped, dir: ang });
      }
    }

    const order = S.buds.map((_, i) => i).sort(() => r() - 0.5);
    const fullOpenCount = Math.max(4, Math.floor(S.buds.length * (0.45 + r() * 0.25)));
    order.forEach((idx, rank) => {
      const b = S.buds[idx];
      b.len = 105 + r() * 55;
      b.width = 17 + r() * 7;
      b.squash = 0.55 + r() * 0.3;
      b.twist = (r() - 0.5) * 1.1;
      b.droop = rad((b.dir > rad(-90) ? 1 : -1) * (12 + r() * 24));
      b.colorIdx = Math.floor(r() * 20);
      b.rnd = Array.from({ length: 12 }, r);
      b.grow = BUD_START + r() * 1.2;
      if (rank < fullOpenCount) {
        b.maxOpen = 0.9 + r() * 0.15; b.blush = 1; b.openAt = OPEN_START + rank * OPEN_GAP + r() * 0.3;
      } else if (rank < fullOpenCount + 4) {
        b.maxOpen = 0.08 + r() * 0.18; b.blush = 0.8; b.openAt = OPEN_START + 2 + r() * 4;
      } else {
        b.maxOpen = 0; b.blush = 0.1 + r() * 0.2; b.openAt = Infinity; b.len *= 0.75;
      }
    });
    addFillers(S, r);
    return S;
  }

  const RUSCUS_START = 0.6;
  const GYP_START = 2.4;

  function addFillers(S, r) {
    S.ruscus = [];
    S.gyp = [];

    const sprig = (base, ang, len, start, depth) => {
      const end = [base[0] + Math.cos(ang) * len, base[1] + Math.sin(ang) * len];
      const bend = (r() - 0.5) * len * 0.45;
      const pts = [base, [lerp(base[0], end[0], 0.33) + bend, lerp(base[1], end[1], 0.33)],
        [lerp(base[0], end[0], 0.7) + bend * 0.5, lerp(base[1], end[1], 0.7)], end];
      const leaves = [];
      for (let t = 0.2 + r() * 0.08, i = 0; t <= 1; t += 0.075 + r() * 0.035, i++) {
        leaves.push({ t, side: i % 2 ? 1 : -1, len: 32 + r() * 20, w: 9 + r() * 5, tint: r() });
      }
      leaves.push({ t: 1, side: 0, len: 44 + r() * 18, w: 11, tint: r() });
      S.ruscus.push({ pts, leaves, start });
      if (depth > 0) {
        for (let k = 0; k < 2; k++) {
          const t = 0.35 + r() * 0.35;
          const p = bez(pts, t);
          const side = k ? 1 : -1;
          sprig(p, ang + side * rad(25 + r() * 20), len * (0.4 + r() * 0.2), start + t * 1.4, depth - 1);
        }
      }
    };

    const numRuscus = 5 + Math.floor(r() * 4);
    for (let i = 0; i < numRuscus; i++) {
      const frac = i / (numRuscus - 1);
      const ang = rad(lerp(-160, -20, frac) + (r() - 0.5) * 18);
      const len = 360 + r() * 240;
      const base = [475 + r() * 50, 830 - r() * 50];
      const end = [base[0] + Math.cos(ang) * len, base[1] + Math.sin(ang) * len];
      sprig(base, ang, Math.hypot(end[0] - base[0], end[1] - base[1]), RUSCUS_START + r() * 0.8, r() > 0.65 ? 1 : 0);
    }

    const numClouds = 8 + Math.floor(r() * 5);
    for (let ci = 0; ci < numClouds; ci++) {
      const cx = 240 + r() * 520;
      const cy = 280 + r() * 380;
      const base = [475 + r() * 50, 980 + r() * 70];
      const start = GYP_START + ci * 0.12 + r() * 0.4;
      const outward = Math.atan2(cy - 620, cx - 500);
      const segs = [], flowers = [];
      const branch = (x, y, ang, len, depth, t) => {
        const x2 = x + Math.cos(ang) * len, y2 = y + Math.sin(ang) * len;
        segs.push({ x, y, x2, y2, t, w: 1.5 + depth * 0.8 });
        const t2 = t + 0.18;
        if (depth === 0) {
          flowers.push({ x: x2, y: y2, s: 4.5 + r() * 3.5, t: t2 + r() * 0.3, puffs: 2 + Math.floor(r() * 2) });
          return;
        }
        if (depth < 3 && r() < 0.75) flowers.push({ x: x2, y: y2, s: 3.5 + r() * 2.5, t: t2 + r() * 0.3, puffs: 1 });
        const kids = 2 + (r() < 0.45 ? 1 : 0);
        for (let k = 0; k < kids; k++) {
          const spread = rad(lerp(-70, 70, kids === 1 ? 0.5 : k / (kids - 1)) + (r() - 0.5) * 30);
          const target = lerp(ang + spread, outward, 0.25);
          branch(x2, y2, target, len * (0.4 + r() * 0.45), depth - 1, t2);
        }
      };
      const main = [[base[0], base[1]], [lerp(base[0], cx, 0.2) + (r() - 0.5) * 60, lerp(base[1], cy, 0.5)], [lerp(base[0], cx, 0.8), cy + 60], [cx, cy + 40]];
      branch(cx, cy + 40, outward * 0.5 - Math.PI / 4, 36 + r() * 14, 4, 0.6);
      S.gyp.push({ main, segs, flowers, start, front: ci % 2 === 1 });
    }
  }

  // ---------- drawing ----------
  function strokeCurve(g, pts, from, upto, width, color) {
    if (upto <= from) return;
    const N = 36;
    g.beginPath();
    for (let i = 0; i <= N; i++) {
      const p = bez(pts, lerp(from, upto, i / N));
      const q = sway(p[0], p[1]);
      i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]);
    }
    g.lineWidth = width;
    g.strokeStyle = color;
    g.lineCap = 'round';
    g.stroke();
  }

  function stemProgress(st) {
    return easeInOut(prog(T, st.start, STEM_DUR));
  }

  function drawLeaf(g, lf) {
    const p = easeOut(prog(T, lf.start, 1.4));
    if (!p) return;
    const a = bez(lf.stem, lf.t);
    const [x, y] = sway(a[0], a[1]);
    const ang = bezAngle(lf.stem, lf.t) + lf.side * lf.spread * (0.4 + 0.6 * p);
    const L = lf.len * p, W = lf.w * (0.4 + 0.6 * p);
    g.save();
    g.translate(x, y);
    g.rotate(ang);
    const bend = lf.side * L * 0.18;
    g.beginPath();
    g.moveTo(0, 0);
    g.bezierCurveTo(L * 0.3, -W, L * 0.7, -W * 0.8 + bend * 0.5, L, bend);
    g.bezierCurveTo(L * 0.7, W * 0.8 + bend * 0.5, L * 0.3, W, 0, 0);
    const grad = g.createLinearGradient(0, 0, L, 0);
    grad.addColorStop(0, '#2e6e22');
    grad.addColorStop(0.5, lf.tint > 0.5 ? '#4c9a2e' : '#3f8a2a');
    grad.addColorStop(1, '#78bc44');
    g.fillStyle = grad;
    g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.55)';
    g.lineWidth = 5;
    g.stroke();
    g.strokeStyle = 'rgba(20,60,15,0.8)';
    g.lineWidth = 3;
    g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(L * 0.6, bend * 0.3, L * 0.95, bend * 0.95); g.stroke();
    g.restore();
  }

  function tepal(g, L, W, color, edge, throat, vein, open, curl, spots, rnd) {
    const rc = smooth(0.45, 1, open);
    const tipX = L * (1 - 0.12 * rc), tipY = curl * W * 1.6 * rc;
    g.beginPath();
    g.moveTo(0, 0);
    g.bezierCurveTo(L * 0.3, -W * 0.85, L * 0.72, -W * 1.05 + tipY * 0.3, tipX, tipY);
    g.bezierCurveTo(L * 0.72, W * 1.05 + tipY * 0.3, L * 0.3, W * 0.85, 0, 0);
    const grad = g.createLinearGradient(0, 0, L, 0);
    grad.addColorStop(0, throat);
    grad.addColorStop(lerp(0.45, 0.22, open), color);
    grad.addColorStop(1, edge);
    g.fillStyle = grad;
    g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.65)';
    g.lineWidth = 6;
    g.stroke();
    g.strokeStyle = open > 0.2 ? vein : 'rgba(40,70,20,0.55)';
    g.lineWidth = 5;
    g.beginPath(); g.moveTo(L * 0.05, 0); g.quadraticCurveTo(L * 0.6, tipY * 0.2, tipX * 0.94, tipY * 0.9); g.stroke();
    if (spots && open > 0.6) {
      g.fillStyle = `rgba(110,15,40,${(open - 0.6) * 2})`;
      for (let i = 0; i < 4; i++) {
        g.beginPath();
        g.arc(L * (0.18 + rnd[i] * 0.22), (rnd[i + 4] - 0.5) * W * 0.8, 3.5, 0, Math.PI * 2);
        g.fill();
      }
    }
  }

  function budState(b) {
    const grow = easeOut(prog(T, b.grow, 2.2));
    const blush = smooth(0, 1, prog(T, BLUSH_START + (b.grow - BUD_START), 2.5)) * b.blush;
    const open = easeInOut(prog(T, b.openAt, OPEN_DUR)) * b.maxOpen;
    return { grow, blush, open };
  }

  function drawBud(g, b, pal) {
    const sp = stemProgress(b.stemRef);
    if (b.ped) {
      if (sp < b.at) return;
      const pp = easeOut(prog(T, b.stemRef.start + STEM_DUR * b.at, 1.0));
      strokeCurve(g, b.ped, 0, pp, 5, '#5f9a34');
      if (pp < 0.6) return;
    } else if (sp < 0.98) {
      return;
    }
    const { grow, blush, open } = budState(b);
    if (!grow) return;

    const base = b.ped ? b.ped[3] : bez(b.stem, 1);
    const [x, y] = sway(base[0], base[1]);
    const multi = Array.isArray(pal.petal);
    const petal = multi ? pal.petal[b.colorIdx % pal.petal.length] : pal.petal;
    const edge = pal.edge || mix(petal, '#ffffff', 0.25);

    const budCol = mix('#9cc63e', pal.blush, blush);
    const color = mix(budCol, petal, smooth(0.05, 0.45, open));
    const edgeCol = mix(mix('#b4d860', pal.blush, blush), edge, smooth(0.05, 0.45, open));
    const throat = mix('#8fbf3a', pal.throat, open);

    const L = b.len * (0.3 + 0.7 * grow) * (1 + 0.3 * open);
    const W = b.width * (0.6 + 0.4 * grow) * (1 + 1.4 * open);

    g.save();
    g.translate(x, y);
    g.rotate(b.dir + b.droop * open);
    g.scale(1, lerp(1, b.squash, open));
    g.fillStyle = '#5f9a34';
    g.beginPath(); g.ellipse(0, 0, 9, 7, 0, 0, Math.PI * 2); g.fill();
    g.rotate(b.twist * open);
    for (const k of [3, 1, -1, 2, -2, 0]) {
      g.save();
      g.rotate(rad(k * 60) * open);
      const wob = 1 + (b.rnd[(k + 3) % 12] - 0.5) * 0.12 * open;
      tepal(g, L * wob, W, color, edgeCol, throat, pal.vein, open, k === 0 ? 0.3 : Math.sign(k) || 1, pal.spots, b.rnd);
      g.restore();
    }
    const st = smooth(0.55, 1, open);
    if (st > 0) {
      for (let i = 0; i < 6; i++) {
        const a = rad(-28 + i * 11);
        const l = L * 0.72 * st * (0.92 + b.rnd[i] * 0.16);
        g.strokeStyle = '#d6dca8';
        g.lineWidth = 3;
        g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(l * 0.5, a * l * 0.3, Math.cos(a) * l, Math.sin(a) * l); g.stroke();
        g.fillStyle = pal.anther;
        g.beginPath(); g.ellipse(Math.cos(a) * l, Math.sin(a) * l, 11, 4.5, a + Math.PI / 2, 0, Math.PI * 2); g.fill();
      }
      const pl = L * 0.82 * st;
      g.strokeStyle = '#cfe0a0';
      g.lineWidth = 4;
      g.beginPath(); g.moveTo(0, 0); g.lineTo(pl, 0); g.stroke();
      g.fillStyle = '#86a83c';
      g.beginPath(); g.arc(pl, 0, 7, 0, Math.PI * 2); g.fill();
    }
    g.restore();
  }

  function leafShape(g, L, W, bend) {
    g.beginPath();
    g.moveTo(0, 0);
    g.bezierCurveTo(L * 0.25, -W, L * 0.7, -W * 0.8 + bend * 0.5, L, bend);
    g.bezierCurveTo(L * 0.7, W * 0.8 + bend * 0.5, L * 0.25, W, 0, 0);
  }

  function drawRuscus(g, S) {
    for (const sp of S.ruscus) {
      const p = easeOut(prog(T, sp.start, 2.2));
      if (!p) continue;
      strokeCurve(g, sp.pts, 0, p, 4, '#4f7a34');
      for (const lf of sp.leaves) {
        const lp = easeOut(prog(p, lf.t - 0.04, 0.22));
        if (!lp) continue;
        const a = bez(sp.pts, lf.t);
        const [x, y] = sway(a[0], a[1]);
        g.save();
        g.translate(x, y);
        g.rotate(bezAngle(sp.pts, lf.t) + lf.side * rad(38));
        const L = lf.len * lp, W = lf.w * lp;
        leafShape(g, L, W, lf.side * L * 0.08);
        const grad = g.createLinearGradient(0, -W, L, W);
        grad.addColorStop(0, lf.tint > 0.5 ? '#356a2c' : '#2c5f30');
        grad.addColorStop(0.55, lf.tint > 0.5 ? '#5aa046' : '#4c9240');
        grad.addColorStop(1, '#3a7436');
        g.fillStyle = grad;
        g.fill();
        g.strokeStyle = 'rgba(0,0,0,0.6)';
        g.lineWidth = 4;
        g.stroke();
        g.strokeStyle = 'rgba(150,190,110,0.5)';
        g.lineWidth = 2;
        g.beginPath(); g.moveTo(0, 0); g.lineTo(L * 0.85, lf.side * L * 0.06); g.stroke();
        g.restore();
      }
    }
  }

  function drawGyp(g, S, front) {
    for (const c of S.gyp) {
      if (c.front !== front) continue;
      const p = prog(T, c.start, 3.2);
      if (!p) continue;
      strokeCurve(g, c.main, 0, easeOut(Math.min(1, p * 3)), 3, '#6b8a4a');
      const local = p * 3.2 - 0.6;
      g.strokeStyle = '#6f8f50';
      for (const sg of c.segs) {
        const k = clamp((local - sg.t) / 0.25, 0, 1);
        if (!k) continue;
        const [x, y] = sway(sg.x, sg.y), [x2, y2] = sway(sg.x2, sg.y2);
        g.lineWidth = sg.w;
        g.beginPath(); g.moveTo(x, y); g.lineTo(lerp(x, x2, k), lerp(y, y2, k)); g.stroke();
      }
      for (const f of c.flowers) {
        const k = easeOut(clamp((local - f.t) / 0.5, 0, 1));
        if (!k) continue;
        const [x, y] = sway(f.x, f.y);
        const tw = 0.88 + 0.12 * Math.sin(T * 2.5 + f.x * 0.3);
        g.fillStyle = `rgba(252,250,244,${tw})`;
        for (let i = 0; i < f.puffs; i++) {
          g.beginPath();
          g.arc(x + (i - (f.puffs - 1) / 2) * f.s * 0.9, y - (i % 2) * f.s * 0.6, f.s * k, 0, Math.PI * 2);
          g.fill();
        }
      }
    }
  }

  function drawScene(g, S, pal) {
    drawRuscus(g, S);
    drawGyp(g, S, false);
    for (const st of S.stems) strokeCurve(g, st.pts, 0, stemProgress(st), st.width || 9, st.color || '#5a9a30');
    for (const lf of S.leaves) drawLeaf(g, lf);
    const sorted = S.buds.slice().sort((a, b) => budState(a).open - budState(b).open || (a.openAt - b.openAt || 0));
    for (const b of sorted) drawBud(g, b, pal);
    drawGyp(g, S, true);
  }

  // ---------- ascii renderer ----------
  const screen = document.getElementById('screen');
  screen.style.cursor = 'default';
  const sctx = screen.getContext('2d');
  const off = document.createElement('canvas');
  const octx = off.getContext('2d', { willReadFrequently: true });

  let cols = 0, rows = 0, cellW = 0, cellH = 0, fontSize = 0, dpr = 1;
  const styleCache = new Map();
  function style(r, g, b) {
    const key = (r << 16) | (g << 8) | b;
    let s = styleCache.get(key);
    if (!s) { s = `rgb(${r},${g},${b})`; styleCache.set(key, s); }
    return s;
  }

  function clearScreen() {
    octx.setTransform(1, 0, 0, 1, 0, 0);
    octx.clearRect(0, 0, cols, rows);
    octx.fillStyle = '#000';
    octx.fillRect(0, 0, cols, rows);

    sctx.setTransform(1, 0, 0, 1, 0, 0);
    sctx.clearRect(0, 0, screen.width, screen.height);
    sctx.fillStyle = '#000';
    sctx.fillRect(0, 0, screen.width, screen.height);
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth, h = window.innerHeight;
    fontSize = clamp(Math.floor(Math.min(w / 100, h / 85)), 5, 11);
    sctx.font = `bold ${fontSize}px Menlo, Consolas, "DejaVu Sans Mono", monospace`;
    cellW = sctx.measureText('M').width || fontSize * 0.6;
    cellH = fontSize;
    screen.width = Math.floor(w * dpr);
    screen.height = Math.floor(h * dpr);
    cols = Math.ceil(w / cellW);
    rows = Math.ceil(h / cellH);
    off.width = cols;
    off.height = rows;
  }

  function render(S, pal) {
    const aspect = cellH / cellW;
    const sx = Math.min(cols / WORLD_W, (rows * aspect) / WORLD_H) * 0.96;
    octx.setTransform(1, 0, 0, 1, 0, 0);
    octx.clearRect(0, 0, cols, rows);
    octx.fillStyle = '#000';
    octx.fillRect(0, 0, cols, rows);
    octx.setTransform(sx, 0, 0, sx / aspect, (cols - WORLD_W * sx) / 2, (rows - (WORLD_H * sx) / aspect) / 2);

    drawScene(octx, S, pal);

    const data = octx.getImageData(0, 0, cols, rows).data;
    sctx.setTransform(1, 0, 0, 1, 0, 0);
    sctx.clearRect(0, 0, screen.width, screen.height);
    sctx.fillStyle = '#000';
    sctx.fillRect(0, 0, screen.width, screen.height);

    sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    sctx.save();
    sctx.globalAlpha = 0.42;
    sctx.filter = `blur(${Math.round(cellH * 0.4)}px)`;
    sctx.imageSmoothingEnabled = true;
    sctx.drawImage(off, 0, 0, cols * cellW, rows * cellH);
    sctx.restore();

    sctx.font = `bold ${fontSize}px Menlo, Consolas, "DejaVu Sans Mono", monospace`;
    sctx.textBaseline = 'top';
    const n = RAMP.length - 1;
    const flick = Math.floor(T * 8);
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const i = (y * cols + x) * 4;
        const r = data[i], g = data[i + 1], b = data[i + 2];
        const m = Math.max(r, g, b);
        if (m < 14) continue;
        const v = m / 255;
        const h = ((x * 73856093) ^ (y * 19349663) ^ (flick * 83492791)) >>> 0;
        const j = h % 7 === 0 ? (h & 8 ? 1 : -1) : 0;
        const idx = clamp(Math.round(Math.pow(v, 0.7) * n) + j, 1, n);
        const k = Math.min(1.25, (40 + 215 * v) / m);
        sctx.fillStyle = style(Math.min(255, (r * k) | 0) & 0xf8, Math.min(255, (g * k) | 0) & 0xf8, Math.min(255, (b * k) | 0) & 0xf8);
        sctx.fillText(RAMP[idx], x * cellW, y * cellH);
      }
    }
  }

  // ---------- loop ----------
  let S = buildScene();
  let currentPalette = pickRandomPalette();
  let t0 = performance.now();
  let last = 0;

  function frame(now) {
    requestAnimationFrame(frame);
    if (now - last < 1000 / FPS) return;
    last = now;
    T = (now - t0) / 1000;
    render(S, currentPalette);
  }

  const regenerate = (e) => {
    if (e) e.stopPropagation();
    currentPalette = pickRandomPalette();
    S = buildScene();
    T = 0;
    t0 = performance.now();
    last = 0;
    clearScreen();
    render(S, currentPalette);
  };

  window.addEventListener('resize', resize);

  // Only regrow when clicking the dedicated button (NOT when clicking anywhere on the screen)
  const btn = document.getElementById('newBouquetBtn');
  if (btn) btn.addEventListener('click', regenerate);

  window.addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.key === 'r') regenerate();
    if (e.key === 'p' || e.key === 'c') {
      currentPalette = pickRandomPalette();
      T = 0;
      t0 = performance.now();
      last = 0;
      clearScreen();
    }
  });

  const q = new URLSearchParams(location.search);
  if (q.has('p')) currentPalette = PALETTES[clamp(+q.get('p') | 0, 0, PALETTES.length - 1)];
  if (q.has('t')) t0 = performance.now() - +q.get('t') * 1000;

  resize();
  clearScreen();
  requestAnimationFrame(frame);
})();