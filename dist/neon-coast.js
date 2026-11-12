/*! Neon Coast 0.1.0 — the pixel look of phareim.no — github.com/phareim/neon-coast */

// src/js/stage.js
function makeCanvas(w, h) {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.ceil(w));
  c.height = Math.max(1, Math.ceil(h));
  return c;
}
function pixelRatio(max = 3) {
  if (typeof window === "undefined") return 1;
  const ceiling = Math.max(1, Math.min(max, Math.round(window.devicePixelRatio || 1)));
  const nav = (
    /** @type {Navigator & { deviceMemory?: number }} */
    navigator
  );
  const cores = nav.hardwareConcurrency ?? 8;
  const touch = "ontouchstart" in window || nav.maxTouchPoints > 0;
  const low = cores <= 4 || touch && (nav.deviceMemory ?? 8) <= 4;
  return low ? Math.max(1, ceiling - 1) : ceiling;
}
var glowCache = /* @__PURE__ */ new Map();
function glowSprite(color) {
  let c = glowCache.get(color);
  if (c) return c;
  c = makeCanvas(64, 64);
  const g = (
    /** @type {CanvasRenderingContext2D} */
    c.getContext("2d")
  );
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, color);
  grad.addColorStop(0.35, color + "aa");
  grad.addColorStop(1, color + "00");
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  glowCache.set(color, c);
  return c;
}
var ctx2d = (c) => (
  /** @type {CanvasRenderingContext2D} */
  c.getContext("2d")
);
function createPixelStage(canvas, opts = {}) {
  const defW = opts.minW ?? 240;
  const defH = opts.minH ?? 180;
  const bgColor = opts.bg ?? "#0b0616";
  const maxRatio = opts.maxRatio ?? 3;
  const screen = ctx2d(canvas);
  let scene = makeCanvas(1, 1);
  let sg = ctx2d(scene);
  let lightC = makeCanvas(1, 1);
  let lg = ctx2d(lightC);
  let hudC = makeCanvas(1, 1);
  let hg = ctx2d(hudC);
  let bloomC = makeCanvas(1, 1);
  let bg = ctx2d(bloomC);
  let overlayC = null;
  let scanTile = null;
  let W = 1;
  let H = 1;
  let scale = 1;
  let vw = 1;
  let vh = 1;
  let hw = 1;
  let hh = 1;
  let rot = false;
  let dpr = 1;
  let cssW = 1;
  let cssH = 1;
  const lights = [];
  const pool = [];
  const emits = [];
  const emitImgs = [];
  const masks = /* @__PURE__ */ new WeakMap();
  function maskOf(img) {
    let m = masks.get(img);
    if (!m) {
      m = makeCanvas(img.width, img.height);
      const mg = ctx2d(m);
      mg.drawImage(img, 0, 0);
      mg.globalCompositeOperation = "source-in";
      mg.fillStyle = "#ffffff";
      mg.fillRect(0, 0, m.width, m.height);
      masks.set(img, m);
    }
    return m;
  }
  function resize(w, h, ratio = globalThis.devicePixelRatio || 1, minW = defW, minH = defH, rotate = false) {
    dpr = Math.max(1, Math.min(pixelRatio(maxRatio), ratio || 1));
    cssW = Math.max(1, w);
    cssH = Math.max(1, h);
    W = Math.max(1, Math.round(cssW * dpr));
    H = Math.max(1, Math.round(cssH * dpr));
    canvas.width = W;
    canvas.height = H;
    rot = rotate;
    const fw = rot ? H : W;
    const fh = rot ? W : H;
    scale = Math.max(1, Math.floor(Math.min(fw / minW, fh / minH)));
    vw = Math.ceil(fw / scale);
    vh = Math.ceil(fh / scale);
    hw = Math.ceil(W / scale);
    hh = Math.ceil(H / scale);
    scene = makeCanvas(vw, vh);
    sg = ctx2d(scene);
    lightC = makeCanvas(vw, vh);
    lg = ctx2d(lightC);
    hudC = makeCanvas(hw, hh);
    hg = ctx2d(hudC);
    bloomC = makeCanvas(vw, vh);
    bg = ctx2d(bloomC);
    for (const c of [sg, lg, hg, screen]) c.imageSmoothingEnabled = false;
    const p = makeCanvas(1, Math.max(2, scale));
    const pg = ctx2d(p);
    pg.fillStyle = "rgba(0,0,0,0.13)";
    pg.fillRect(0, 0, 1, Math.max(1, Math.floor(scale / 3)));
    scanTile = p;
    overlayC = null;
  }
  function overlay() {
    if (!overlayC) {
      overlayC = makeCanvas(W, H);
      const g = ctx2d(overlayC);
      const scan = scanTile && scale >= 3 ? g.createPattern(scanTile, "repeat") : null;
      if (scan) {
        g.fillStyle = scan;
        g.fillRect(0, 0, W, H);
      }
      const grad = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
      grad.addColorStop(0, "rgba(5,3,12,0)");
      grad.addColorStop(1, "rgba(5,3,12,0.45)");
      g.fillStyle = grad;
      g.fillRect(0, 0, W, H);
    }
    screen.drawImage(overlayC, 0, 0);
  }
  function begin() {
    lights.length = 0;
    emits.length = 0;
    emitImgs.length = 0;
    sg.setTransform(1, 0, 0, 1, 0, 0);
    sg.globalAlpha = 1;
    sg.globalCompositeOperation = "source-over";
    hg.setTransform(1, 0, 0, 1, 0, 0);
    hg.clearRect(0, 0, hw, hh);
    return sg;
  }
  function light(x2, y, r, color, a = 1) {
    let L = pool[lights.length];
    if (!L) {
      L = { x: x2, y, r, color, a };
      pool.push(L);
    } else {
      L.x = x2;
      L.y = y;
      L.r = r;
      L.color = color;
      L.a = a;
    }
    lights.push(L);
  }
  function emit(x2, y, w, h) {
    emits.push(x2, y, w, h);
  }
  function emitImage(img, x2 = 0, y = 0) {
    emitImgs.push({ img, x: x2, y });
  }
  function present(o = {}) {
    const g = sg;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalAlpha = 1;
    if (o.ambient) {
      lg.globalCompositeOperation = "source-over";
      lg.globalAlpha = 1;
      lg.fillStyle = o.ambient;
      lg.fillRect(0, 0, vw, vh);
      lg.globalCompositeOperation = "lighter";
      for (const L of lights) {
        if (L.x < -L.r || L.y < -L.r || L.x > vw + L.r || L.y > vh + L.r) continue;
        lg.globalAlpha = Math.max(0, Math.min(1, L.a));
        lg.drawImage(glowSprite(L.color), L.x - L.r, L.y - L.r, L.r * 2, L.r * 2);
      }
      lg.globalAlpha = 1;
      lg.globalCompositeOperation = "source-over";
      lg.fillStyle = "#ffffff";
      for (let i = 0; i < emits.length; i += 4) lg.fillRect(emits[i], emits[i + 1], emits[i + 2], emits[i + 3]);
      for (const e of emitImgs) lg.drawImage(maskOf(e.img), e.x, e.y);
      g.globalCompositeOperation = "multiply";
      g.drawImage(lightC, 0, 0);
      g.globalCompositeOperation = "source-over";
    }
    o.afterLight?.(g);
    g.globalAlpha = 1;
    g.globalCompositeOperation = "source-over";
    if (o.flash && o.flash.a > 4e-3) {
      g.globalAlpha = Math.min(1, o.flash.a);
      g.fillStyle = o.flash.color;
      g.fillRect(0, 0, vw, vh);
      g.globalAlpha = 1;
    }
    const fade = Math.max(0, Math.min(1, o.fade ?? 0));
    if (fade > 0) {
      g.globalAlpha = fade;
      g.fillStyle = bgColor;
      g.fillRect(0, 0, vw, vh);
      g.globalAlpha = 1;
    }
    screen.setTransform(1, 0, 0, 1, 0, 0);
    screen.globalCompositeOperation = "source-over";
    screen.globalAlpha = 1;
    screen.fillStyle = bgColor;
    screen.fillRect(0, 0, W, H);
    const sw = rot ? vh : vw;
    const sh = rot ? vw : vh;
    const ox = Math.floor((W - sw * scale) / 2) + Math.round(o.shakeX ?? 0) * scale;
    const oy = Math.floor((H - sh * scale) / 2) + Math.round(o.shakeY ?? 0) * scale;
    const place = () => {
      if (rot) screen.setTransform(0, -scale, scale, 0, ox, oy + vw * scale);
    };
    const unplace = () => {
      if (rot) screen.setTransform(1, 0, 0, 1, 0, 0);
    };
    screen.imageSmoothingEnabled = false;
    place();
    if (rot) screen.drawImage(scene, 0, 0);
    else screen.drawImage(scene, 0, 0, vw, vh, ox, oy, vw * scale, vh * scale);
    unplace();
    const bloomK = o.bloom ?? 1;
    if (bloomK > 0 && fade < 1 && lights.length) {
      bg.globalCompositeOperation = "source-over";
      bg.clearRect(0, 0, vw, vh);
      bg.globalCompositeOperation = "lighter";
      for (const L of lights) {
        if (L.a < 0.3) continue;
        const rad = L.r * 0.9;
        if (L.x < -rad || L.y < -rad || L.x > vw + rad || L.y > vh + rad) continue;
        bg.globalAlpha = Math.min(1, L.a) * 0.32 * bloomK;
        bg.drawImage(glowSprite(L.color), L.x - rad, L.y - rad, rad * 2, rad * 2);
      }
      bg.globalAlpha = 1;
      screen.globalCompositeOperation = "lighter";
      screen.globalAlpha = 1 - fade;
      screen.imageSmoothingEnabled = true;
      place();
      if (rot) screen.drawImage(bloomC, 0, 0);
      else screen.drawImage(bloomC, 0, 0, vw, vh, ox, oy, vw * scale, vh * scale);
      unplace();
      screen.imageSmoothingEnabled = false;
      screen.globalAlpha = 1;
      screen.globalCompositeOperation = "source-over";
    }
    if (o.overlay !== false) overlay();
    const hx = Math.floor((W - hw * scale) / 2);
    const hy = Math.floor((H - hh * scale) / 2);
    screen.drawImage(hudC, 0, 0, hw, hh, hx, hy, hw * scale, hh * scale);
  }
  return {
    resize,
    begin,
    light,
    emit,
    emitImage,
    present,
    px: (v) => Math.round(v * dpr / scale),
    get g() {
      return sg;
    },
    get hud() {
      return hg;
    },
    lights,
    get vw() {
      return vw;
    },
    get vh() {
      return vh;
    },
    get hw() {
      return hw;
    },
    get hh() {
      return hh;
    },
    get rotated() {
      return rot;
    },
    get scale() {
      return scale;
    },
    get k() {
      return scale / dpr;
    },
    get cssW() {
      return cssW;
    },
    get cssH() {
      return cssH;
    }
  };
}

// src/js/tokens.js
var PAL = {
  k: "#0b0616",
  // ink: outlines, the night, hard shadows
  K: "#1c1030",
  // night: dark shade
  u: "#2a1f4a",
  // dusk: deep violet-grey
  w: "#fff4ff",
  // white
  W: "#cfc6ff",
  // lavender
  g: "#8f86b8",
  // haze
  G: "#5a5285",
  // slate
  c: "#2ff3ff",
  // cyan: the interface, the player
  C: "#1a9fc4",
  b: "#2f5fd0",
  // blue
  B: "#1a2f78",
  p: "#ff2fa0",
  // pink: call to action, you, danger
  P: "#b01874",
  m: "#ff8ae0",
  // rose
  v: "#9a4ff0",
  // violet
  V: "#54259e",
  y: "#ffd23f",
  // gold: treasure
  Y: "#c4861c",
  e: "#fff1b0",
  // cream
  o: "#ff8a3d",
  // orange
  r: "#ff3b5c",
  // red
  R: "#9e1638",
  l: "#b6ff4a",
  // lime
  L: "#4f9a2a",
  t: "#3fd8b0",
  // teal
  T: "#1f7a6e",
  h: "#3a1a4a",
  // plum
  H: "#7a3a8a",
  s: "#f5c3a8",
  // skin
  S: "#c98576",
  n: "#6a4432",
  // wood
  N: "#3a2418",
  a: "#5b2a1c",
  // clay
  i: "#b0543a",
  j: "#e07a4e"
};
var COLORS = {
  ink: PAL.k,
  night: PAL.K,
  dusk: PAL.u,
  slate: PAL.G,
  haze: PAL.g,
  lavender: PAL.W,
  white: PAL.w,
  cyan: PAL.c,
  "cyan-deep": PAL.C,
  blue: PAL.b,
  "blue-deep": PAL.B,
  pink: PAL.p,
  "pink-deep": PAL.P,
  rose: PAL.m,
  violet: PAL.v,
  "violet-deep": PAL.V,
  gold: PAL.y,
  "gold-deep": PAL.Y,
  cream: PAL.e,
  orange: PAL.o,
  red: PAL.r,
  "red-deep": PAL.R,
  lime: PAL.l,
  "lime-deep": PAL.L,
  teal: PAL.t,
  "teal-deep": PAL.T,
  plum: PAL.h,
  "plum-light": PAL.H
};
var SKY = ["#0b0616", "#140b26", "#1c1030", "#2a1a4c", "#43246e", "#6a2a7c", "#a8347e", "#e0508a"];
var SUN = ["#fff1b0", "#ffd23f", "#ff8a3d", "#ff2fa0"];
var WINDOW = ["#3a46c8", "#2f38b0", "#262c98", "#1d2180", "#151868"];
var WINDOW_TEAL = ["#1f7a9a", "#1a6888", "#155676", "#104464", "#0b3252"];
var UI = {
  text: "#f2e9ff",
  "text-muted": "#b9a8d9",
  "text-subtle": "#8f86b8",
  /** Panel fill: the night, nearly opaque. */
  surface: "rgba(11, 6, 22, 0.88)",
  /** Inside inputs, meters and tracks. */
  field: "#140b26",
  /** Edges that should not shout: inputs at rest, frames, keys. */
  quiet: "#6a5aa8",
  /** Divider lines. */
  rule: "#54259e",
  /** The faint cyan line inside the top edge of a box. */
  "box-rule": "rgba(47, 243, 255, 0.35)",
  /** The 16-bit window: its white bevel, the dark line round it, and the shadow under its letters. */
  "window-edge": "#f4f6ff",
  "window-shade": "#0a0e30",
  "window-hi": "rgba(160, 190, 255, 0.5)"
};
var WIN16 = {
  /** @type {Tone16} */
  hot: { top: [58, 74, 204], bottom: [36, 14, 104], hi: "#ffffff", lo: "#aab2ea", hi2: "#c8d0ff", lo2: "#6c74c4" },
  /** @type {Tone16} */
  cool: { top: [34, 132, 164], bottom: [12, 44, 92], hi: "#ffffff", lo: "#a4c8e4", hi2: "#c4ecff", lo2: "#5c98c0" },
  /** The dark line round the bevel. */
  outline: "#070a2c",
  /** The line inside the bevel: heavier under the top and left edge, lighter along the bottom and right. */
  inner: "rgba(6,8,44,0.62)",
  innerSoft: "rgba(6,8,44,0.36)",
  /** The shadow on the world, in three steps that soften its edge (nearest first). */
  shadow: ["rgba(4,4,30,0.22)", "rgba(4,4,30,0.2)", "rgba(4,4,30,0.14)"]
};
var TEXT16 = {
  text: "#ffffff",
  /** Under the letters in a window: right, below and the corner between. */
  shadow: "#0a0c38",
  /** All the way round letters that lie straight on the world (and the chosen answer). */
  rim: "#06081f",
  dim: "#b8c6fa",
  faint: "#7482cc",
  hot: "#ff8fd4",
  cool: "#8cecff",
  prize: "#ffe070",
  ok: "#aaf472",
  /** The "more" arrow: its top row and the rest. */
  more: "#e4fbff",
  moreLo: "#8cecff"
};
var INK16 = {
  k: "#12061c",
  // rim
  w: "#ffffff",
  m: "#ffa0e4",
  // light on the heart
  p: "#ff3aa8",
  P: "#c2187c",
  // the heart's shaded side
  D: "#7c0e58",
  K: "#2a1a4a",
  // an empty heart
  u: "#463672",
  g: "#c8cef4"
  // the glove's shade
};
var five = (v) => Math.min(248, Math.round(v / 8) * 8);
var hex2 = (n) => n.toString(16).padStart(2, "0");
var rgbHex = (c) => "#" + c.map(hex2).join("");
function rampAt(tone, f) {
  return rgbHex([0, 1, 2].map((i) => five(tone.top[i] + (tone.bottom[i] - tone.top[i]) * f)));
}
function ramp5(tone, from = 0) {
  const cuts = [];
  for (let i = 0; i < 3; i++) {
    const a = tone.top[i];
    const d = tone.bottom[i] - a;
    if (!d) continue;
    for (let k = 0; k < 32; k++) {
      const f = (8 * k + 4 - a) / d;
      if (f > from && f < 1) cuts.push(f);
    }
  }
  const edges = [from, ...[...new Set(cuts)].sort((x2, y) => x2 - y), 1];
  const out = [];
  for (let j = 0; j < edges.length - 1; j++) {
    const color = rampAt(tone, (edges[j] + edges[j + 1]) / 2);
    if (out.length && out[out.length - 1].color === color) continue;
    out.push({ color, at: Math.round((edges[j] - from) / (1 - from) * 1e4) / 1e4 });
  }
  return out;
}
function contrast(a, b) {
  const lum = (h) => {
    const [r, g, bl] = [1, 3, 5].map((i) => {
      const c = parseInt(h.slice(i, i + 2), 16) / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const x2 = lum(a);
  const y = lum(b);
  return (Math.max(x2, y) + 0.05) / (Math.min(x2, y) + 0.05);
}
function readableFrom(tone, texts) {
  for (let s = 0; s <= 256; s++) {
    const bg = rampAt(tone, s / 256);
    if (texts.every((t) => contrast(t, bg) >= 4.5)) return s / 256;
  }
  return 1;
}
var WIN16_RAMPS = {
  hot: ramp5(WIN16.hot, readableFrom(WIN16.hot, [TEXT16.text, TEXT16.dim, TEXT16.cool, TEXT16.prize, TEXT16.ok])),
  cool: ramp5(WIN16.cool, readableFrom(WIN16.cool, [TEXT16.text])),
  plate: ramp5(WIN16.cool, readableFrom(WIN16.cool, [TEXT16.prize]))
};
var ROLES = {
  bg: "ink",
  accent: "cyan",
  hot: "pink",
  prize: "gold",
  ok: "lime",
  warn: "orange",
  danger: "red"
};

// src/js/sprites.js
var cache = /* @__PURE__ */ new WeakMap();
function cached(rows, key, build) {
  let m = cache.get(rows);
  if (!m) {
    m = /* @__PURE__ */ new Map();
    cache.set(rows, m);
  }
  let c = m.get(key);
  if (!c) {
    c = build();
    m.set(key, c);
  }
  return c;
}
var ctx2d2 = (c) => (
  /** @type {CanvasRenderingContext2D} */
  c.getContext("2d")
);
function sprite(rows, pal, flip = false) {
  const key = (pal ? JSON.stringify(pal) : "") + (flip ? "|f" : "");
  return cached(rows, key, () => {
    const h = rows.length;
    const w = rows[0].length;
    const c = makeCanvas(w, h);
    const g = ctx2d2(c);
    for (let y = 0; y < h; y++) {
      const row = rows[y];
      for (let x2 = 0; x2 < w; x2++) {
        const ch = row[x2];
        if (ch === "." || ch === " ") continue;
        const col = pal?.[ch] ?? PAL[ch];
        if (!col) continue;
        g.fillStyle = col;
        g.fillRect(flip ? w - 1 - x2 : x2, y, 1, 1);
      }
    }
    return c;
  });
}
function silhouette(rows, color) {
  return cached(rows, "sil:" + color, () => {
    const h = rows.length;
    const w = rows[0].length;
    const c = makeCanvas(w, h);
    const g = ctx2d2(c);
    g.fillStyle = color;
    for (let y = 0; y < h; y++) for (let x2 = 0; x2 < w; x2++) {
      const ch = rows[y][x2];
      if (ch !== "." && ch !== " ") g.fillRect(x2, y, 1, 1);
    }
    return c;
  });
}
function put(g, c, x2, y) {
  g.drawImage(c, Math.round(x2), Math.round(y));
}
function putC(g, c, x2, y) {
  g.drawImage(c, Math.round(x2 - c.width / 2), Math.round(y - c.height / 2));
}
function shade(rows, body, hi, lo, outline = "k") {
  const h = rows.length;
  const w = rows[0].length;
  const on = (x2, y) => y >= 0 && y < h && x2 >= 0 && x2 < w && rows[y][x2] !== "." && rows[y][x2] !== " ";
  const out = [];
  for (let y = -1; y <= h; y++) {
    let line = "";
    for (let x2 = -1; x2 <= w; x2++) {
      if (on(x2, y)) {
        const ch = rows[y][x2];
        if (ch !== "X") line += ch;
        else if (!on(x2, y - 1)) line += hi;
        else if (!on(x2, y + 1)) line += lo;
        else line += body;
      } else if (on(x2 - 1, y) || on(x2 + 1, y) || on(x2, y - 1) || on(x2, y + 1)) line += outline;
      else line += ".";
    }
    out.push(line);
  }
  return out;
}
var LIGHTER = (
  /** @type {Record<string, string>} */
  { K: "u", u: "G", G: "g", V: "v", v: "m", P: "p", p: "m", m: "w", C: "c", c: "w", B: "b", b: "c", Y: "y", y: "e", h: "H", R: "r", r: "m", T: "t", t: "c", g: "W", W: "w" }
);
function relight(rows, remap = {}) {
  const src = rows.map((r) => [...r].map((ch) => remap[ch] ?? ch));
  const open = (x2, y) => y < 0 || src[y][x2] === "." || src[y][x2] === "k";
  return src.map((row, y) => row.map((ch, x2) => ch !== "." && ch !== "k" && open(x2, y - 1) ? LIGHTER[ch] ?? ch : ch).join(""));
}
var BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
function bayer(x2, y) {
  return (BAYER[(y & 3) * 4 + (x2 & 3)] + 0.5) / 16;
}
function mix(a, b, t) {
  const pa = parseInt(a.slice(1, 7), 16);
  const pb = parseInt(b.slice(1, 7), 16);
  const ch = (s) => {
    const x2 = pa >> s & 255;
    const y = pb >> s & 255;
    return Math.round(x2 + (y - x2) * t);
  };
  return "#" + (1 << 24 | ch(16) << 16 | ch(8) << 8 | ch(0)).toString(16).slice(1);
}
var SNAP_KEYS = ["K", "u", "w", "W", "g", "G", "c", "C", "b", "B", "p", "P", "m", "v", "V", "y", "Y", "o", "r", "R", "h", "e", "t", "T"];
function pixelize(paint, w, h, keys = SNAP_KEYS, outline = true) {
  w = Math.max(1, Math.round(w));
  h = Math.max(1, Math.round(h));
  const c = makeCanvas(w, h);
  const g = (
    /** @type {CanvasRenderingContext2D} */
    c.getContext("2d", { willReadFrequently: true })
  );
  g.translate(w / 2, h / 2);
  paint(g);
  const d = g.getImageData(0, 0, w, h).data;
  const pal = keys.map((k) => {
    const v = parseInt(PAL[k].slice(1), 16);
    return (
      /** @type {const} */
      [k, v >> 16 & 255, v >> 8 & 255, v & 255]
    );
  });
  const grid = [];
  for (let y = 0; y < h; y++) {
    const row = [];
    for (let x2 = 0; x2 < w; x2++) {
      const i = (y * w + x2) * 4;
      if (d[i + 3] < 115) {
        row.push(".");
        continue;
      }
      let best = "k";
      let bd = Infinity;
      for (const [k, r, gg, b] of pal) {
        const dr = d[i] - r;
        const dg = d[i + 1] - gg;
        const db = d[i + 2] - b;
        const dist = dr * dr * 0.3 + dg * dg * 0.59 + db * db * 0.11;
        if (dist < bd) {
          bd = dist;
          best = k;
        }
      }
      row.push(best);
    }
    grid.push(row);
  }
  if (!outline) return grid.map((r) => r.join(""));
  const on = (x2, y) => y >= 0 && y < h && x2 >= 0 && x2 < w && grid[y][x2] !== ".";
  const out = [];
  for (let y = -1; y <= h; y++) {
    let line = "";
    for (let x2 = -1; x2 <= w; x2++) {
      if (on(x2, y)) line += grid[y][x2];
      else line += on(x2 - 1, y) || on(x2 + 1, y) || on(x2, y - 1) || on(x2, y + 1) ? "k" : ".";
    }
    out.push(line);
  }
  return out;
}
var SPRITES = {
  heart: [
    ".kk.kk..",
    "kmpkppk.",
    "kwpppPk.",
    "kpppppPk",
    ".kpppPk.",
    "..kpPk..",
    "...kk..."
  ],
  "heart-half": [
    ".kk.kk..",
    "kmpkKKk.",
    "kwpkKKk.",
    "kppkKKKk",
    ".kpkKKk.",
    "..kpKk..",
    "...kk..."
  ],
  "heart-empty": [
    ".kk.kk..",
    "kKKkKKk.",
    "kKKKKKk.",
    "kKKKKKKk",
    ".kKKKKk.",
    "..kKKk..",
    "...kk..."
  ],
  gem: [
    "...kk...",
    "..klLk..",
    ".klwlLk.",
    "kllllLLk",
    "klllLLLk",
    ".kLLLLk.",
    "..kLLk..",
    "...kk..."
  ],
  key: [
    ".kkk....",
    "kyeyk...",
    "kykYkkkk",
    "kyYyyyYk",
    ".kkkyky.",
    "....k.k."
  ],
  bomb: [
    ".....ky.",
    "....ky..",
    "..kkYk..",
    ".kBbbBk.",
    "kBwbBBBk",
    "kBbBBBBk",
    ".kBBBBk.",
    "..kkkk.."
  ],
  coin: [
    "..kkkk..",
    ".keyyyk.",
    "keyYyyYk",
    "kyyYyyYk",
    "kyyYyyYk",
    "kyyyyyYk",
    ".kYYYYk.",
    "..kkkk.."
  ],
  star: shade([
    "...X...",
    "..XXX..",
    "XXXXXXX",
    ".XXXXX.",
    "..XXX..",
    ".XX.XX.",
    "XX...XX"
  ], "y", "e", "Y"),
  home: shade([
    "....X....",
    "...XXX...",
    "..XXXXX..",
    ".XXXXXXX.",
    "XXXXXXXXX",
    ".XXX.XXX.",
    ".XXX.XXX.",
    ".XXX.XXX."
  ], "c", "w", "C"),
  /* The three ways phareim.no's world is shown: the top-down tile grid, the isometric cube, the pencil. */
  "view-grid": [
    "ccccccccc",
    "c...c...c",
    "c...c...c",
    "c...c...c",
    "ccccccccc",
    "c...c...c",
    "c...c...c",
    "c...c...c",
    "ccccccccc"
  ],
  "view-cube": [
    "....c....",
    "..cc.cc..",
    "cc.....cc",
    "c.cc.cc.c",
    "c...c...c",
    "c...c...c",
    "c...c...c",
    ".cc.c.cc.",
    "...ccc..."
  ],
  "view-pencil": [
    "......cc.",
    ".....c.cc",
    "....c.ccc",
    "...c.ccc.",
    "..c.ccc..",
    ".c.ccc...",
    "c.ccc....",
    "c.cc.....",
    "ccc......"
  ],
  cursor: [
    "k.....",
    "kck...",
    "kcck..",
    "kccck.",
    "kcccck",
    "kccck.",
    "kcck..",
    "kck...",
    "k....."
  ],
  sun: [
    "...eeeee...",
    ".eeeeeeeee.",
    ".yyyyyyyyy.",
    "yyyyyyyyyyy",
    "yyyyyyyyyyy",
    "...........",
    "ooooooooooo",
    "...........",
    ".ppppppppp.",
    "...........",
    "...ppppp..."
  ]
};

// src/js/pixel16.js
var ctx2d3 = (c) => (
  /** @type {CanvasRenderingContext2D} */
  c.getContext("2d", { willReadFrequently: true })
);
function epx(src, w, h) {
  const out = new Uint32Array(w * h * 4);
  const at2 = (x2, y) => src[Math.max(0, Math.min(h - 1, y)) * w + Math.max(0, Math.min(w - 1, x2))];
  for (let y = 0; y < h; y++) {
    for (let x2 = 0; x2 < w; x2++) {
      const p = at2(x2, y);
      const up = at2(x2, y - 1);
      const right = at2(x2 + 1, y);
      const left = at2(x2 - 1, y);
      const down = at2(x2, y + 1);
      const o = y * 2 * w * 2 + x2 * 2;
      out[o] = left === up && left !== down && up !== right ? up : p;
      out[o + 1] = up === right && up !== left && right !== down ? right : p;
      out[o + w * 2] = down === left && down !== right && left !== up ? left : p;
      out[o + w * 2 + 1] = right === down && right !== up && down !== left ? down : p;
    }
  }
  return out;
}
function scale2x(src) {
  const w = src.width;
  const h = src.height;
  const read = makeCanvas(w, h);
  const rg = ctx2d3(read);
  rg.drawImage(src, 0, 0);
  const data = rg.getImageData(0, 0, w, h);
  const big = epx(new Uint32Array(data.data.buffer), w, h);
  const c = makeCanvas(w * 2, h * 2);
  const g = ctx2d3(c);
  const img = g.createImageData(w * 2, h * 2);
  new Uint32Array(img.data.buffer).set(big);
  g.putImageData(img, 0, 0);
  return c;
}
function seloutPixels(data, w, h, opts = {}) {
  const { dark = 0.16, keep = 0.5 } = opts;
  const src = data.slice();
  const luma = (i) => (src[i] * 0.299 + src[i + 1] * 0.587 + src[i + 2] * 0.114) / 255;
  for (let y = 0; y < h; y++) {
    for (let x2 = 0; x2 < w; x2++) {
      const i = (y * w + x2) * 4;
      if (src[i + 3] < 128 || luma(i) >= dark) continue;
      let r = 0, g = 0, b = 0, n = 0;
      for (const [dx, dy] of [[0, -1], [-1, 0], [1, 0], [0, 1]]) {
        const nx = x2 + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const j = (ny * w + nx) * 4;
        if (src[j + 3] < 128 || luma(j) < dark) continue;
        r += src[j];
        g += src[j + 1];
        b += src[j + 2];
        n++;
      }
      if (!n) continue;
      data[i] = r / n * keep;
      data[i + 1] = g / n * keep;
      data[i + 2] = b / n * keep;
    }
  }
  return data;
}
function selout(canvas, opts) {
  const g = ctx2d3(canvas);
  const img = g.getImageData(0, 0, canvas.width, canvas.height);
  seloutPixels(img.data, canvas.width, canvas.height, opts);
  g.putImageData(img, 0, 0);
  return canvas;
}
function quantize15(imageData, opts = {}) {
  const { data, width, height } = imageData;
  const dither = opts.dither ?? true;
  for (let y = 0; y < height; y++) {
    for (let x2 = 0; x2 < width; x2++) {
      const i = (y * width + x2) * 4;
      const d = dither ? (bayer(x2, y) - 0.5) * 0.55 : 0;
      for (let c = 0; c < 3; c++) {
        const v = Math.floor(data[i + c] / 255 * 31 + 0.5 + d);
        data[i + c] = Math.round(Math.max(0, Math.min(31, v)) * 255 / 31);
      }
    }
  }
  return imageData;
}
function ramp15(keys, n) {
  const rgb = keys.map((k) => [1, 3, 5].map((i) => parseInt(k.slice(i, i + 2), 16)));
  const out = [];
  for (let s = 0; s < n; s++) {
    const t = n === 1 ? 0 : s / (n - 1) * (rgb.length - 1);
    const i = Math.min(rgb.length - 2, Math.floor(t));
    const f = rgb.length === 1 ? 0 : t - i;
    const a = rgb[i];
    const b = rgb[Math.min(rgb.length - 1, i + 1)];
    out.push("#" + [0, 1, 2].map((c) => five(a[c] + (b[c] - a[c]) * f).toString(16).padStart(2, "0")).join(""));
  }
  return out;
}
function paintBands(ctx, x2, y, w, h, stops, opts = {}) {
  if (h <= 0 || w <= 0 || !stops.length) return;
  const list = stops.map((s, i) => typeof s === "string" ? { color: s, at: i / stops.length } : s);
  const dither = opts.dither ?? true;
  for (let r = 0; r < h; r++) {
    const f = (r + 0.5) / h;
    let i = 0;
    while (i + 1 < list.length && list[i + 1].at <= f) i++;
    ctx.fillStyle = list[i].color;
    ctx.fillRect(x2, y + r, w, 1);
    if (!dither || i + 1 >= list.length) continue;
    const end = Math.round(list[i + 1].at * h);
    const start = Math.round(list[i].at * h);
    const knit = Math.min(opts.knit ?? 4, Math.floor((end - start) / 2));
    const left = end - r;
    if (knit <= 0 || left > knit) continue;
    const amount = (knit - left + 1) / (knit + 1);
    ctx.fillStyle = list[i + 1].color;
    for (let c = 0; c < w; c++) if (bayer(x2 + c, y + r) < amount) ctx.fillRect(x2 + c, y + r, 1, 1);
  }
}

// src/js/scenery.js
var DUSK = {
  sky0: SKY[0],
  sky1: SKY[1],
  sky2: SKY[2],
  sky3: SKY[3],
  sky4: SKY[4],
  sky5: SKY[5],
  sky6: SKY[6],
  sky7: SKY[7],
  star: "#cfc6ff",
  starHi: "#fff4ff",
  starDim: "#6a5fa0",
  sun0: SUN[0],
  sun1: SUN[1],
  sun2: SUN[2],
  sun3: SUN[3],
  ridgeFar: "#2c2058",
  ridgeFarRim: "#6a4fb0",
  ridge: "#1c1440",
  ridgeRim: "#d0509e",
  canopyD: "#0f3445",
  canopyM: "#1b5763",
  canopyL: "#2a8579",
  canopyH: "#5fd6b8",
  rim: "#d0509e",
  trunk: "#3a2240",
  g0: "#245573",
  g1: "#2d6682",
  g2: "#1b4560",
  g3: "#163a52",
  blade: "#3f8fa8",
  tip: "#6fd2d6",
  path: "#7d4d7c",
  pathL: "#9b6593",
  pathD: "#5e3862",
  roof: "#8c2e72",
  roofL: "#b8468f",
  roofD: "#5a1c4c",
  roofHi: "#e070b0",
  wall: "#3b2b62",
  wallL: "#4f3c7e",
  wallD: "#271c46",
  window: "#ffd23f",
  windowD: "#ffb13f",
  stone: "#3a2f70",
  stoneL: "#4a3d88",
  stoneD: "#271f50",
  stoneTop: "#1f1a3c",
  neon: "#ff3fae",
  neonC: "#3ff0ff",
  water: "#123372",
  waterD: "#0b2358",
  waterHaze: "#2a2a78",
  wave: "#1d4590",
  foam: "#7ce4ff",
  horizon: "#2ff3ff",
  glint: "#ff5fd0",
  sand: "#a8846a",
  sandL: "#c29c7c",
  sandD: "#866651",
  sandW: "#5e4a56",
  palm: "#140a22",
  palmL: "#2a1840"
};
function hash2(x2, y, salt = 0) {
  let h = x2 * 374761393 + y * 668265263 + salt * 2246822519 | 0;
  h = Math.imul(h ^ h >>> 13, 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
function noise1(x2, c, salt = 0) {
  const gx = Math.floor(x2 / c);
  const f = x2 / c - gx;
  const s = f * f * (3 - 2 * f);
  const a = hash2(gx, 0, salt);
  const b = hash2(gx + 1, 0, salt);
  return a + (b - a) * s;
}
function rect(g, c, x2, y, w = 1, h = 1) {
  g.fillStyle = c;
  g.fillRect(x2, y, w, h);
}
function disc(g, c, cx, cy, rad) {
  g.fillStyle = c;
  for (let y = -rad; y <= rad; y++) {
    const half = Math.floor(Math.sqrt(rad * rad - y * y + rad * 0.8));
    g.fillRect(Math.round(cx - half), Math.round(cy + y), half * 2 + 1, 1);
  }
}
function ditherGradient(g, x2, y0, w, y1, stops) {
  const h = y1 - y0;
  if (h <= 0 || stops.length === 0) return;
  const n = stops.length - 1;
  for (let y = 0; y < h; y++) {
    const t = n === 0 ? 0 : y / Math.max(1, h - 1) * n;
    const i = Math.min(n - 1, Math.floor(t));
    const f = t - i;
    const a = stops[Math.max(0, i)];
    const b = stops[Math.min(n, i + 1)];
    const d = (f - 0.5) * 3 + 0.5;
    if (d <= 1 / 17 || n === 0) {
      rect(g, a, x2, y0 + y, w, 1);
      continue;
    }
    if (d >= 16 / 17) {
      rect(g, b, x2, y0 + y, w, 1);
      continue;
    }
    rect(g, a, x2, y0 + y, w, 1);
    g.fillStyle = b;
    for (let px = 0; px < w; px++) if (bayer(x2 + px, y0 + y) < d) g.fillRect(x2 + px, y0 + y, 1, 1);
  }
}
function paintSky(g, w, horizon, warm = true) {
  ditherGradient(g, 0, 0, w, horizon, warm ? SKY.slice(0, 7) : SKY.slice(0, 5));
}
function drawStars(g, w, maxY, time, density = 1, salt = 11) {
  const n = Math.floor(w * maxY / 260 * density);
  for (let i = 0; i < n; i++) {
    const x2 = Math.floor(hash2(i, 1, salt) * w);
    const y = Math.floor(Math.pow(hash2(i, 2, salt), 1.6) * maxY);
    const tw = hash2(i, 3, salt);
    const phase = Math.sin(time * (1.5 + tw * 3) + i);
    if (tw > 0.85) {
      rect(g, phase > 0.3 ? DUSK.starHi : DUSK.star, x2, y);
      if (phase > 0.6) {
        rect(g, DUSK.star, x2 - 1, y);
        rect(g, DUSK.star, x2 + 1, y);
        rect(g, DUSK.star, x2, y - 1);
        rect(g, DUSK.star, x2, y + 1);
      }
    } else if (tw > 0.4 || phase > -0.5) {
      rect(g, tw > 0.65 ? DUSK.star : DUSK.starDim, x2, y);
    }
  }
}
function paintSun(g, cx, cy, r, bandColor = DUSK.sky5) {
  cx = Math.round(cx);
  cy = Math.round(cy);
  r = Math.max(3, Math.round(r));
  for (let y = -r; y <= r; y++) {
    const half = Math.floor(Math.sqrt(r * r - y * y + r * 0.6));
    const t = (y + r) / (2 * r);
    const col = t < 0.28 ? DUSK.sun0 : t < 0.5 ? DUSK.sun1 : t < 0.72 ? DUSK.sun2 : DUSK.sun3;
    const below = y - Math.floor(r * 0.05);
    if (below > 0) {
      const period = Math.max(3, Math.round(r / 4));
      const gap = 1 + Math.floor(below / r * (period - 1));
      if (below % period < gap) {
        rect(g, bandColor, cx - half, cy + y, half * 2 + 1, 1);
        continue;
      }
    }
    rect(g, col, cx - half, cy + y, half * 2 + 1, 1);
  }
}
function paintRidge(g, w, base, height, bottom, body, rim, salt = 1, sharp = 0.5) {
  let prev = -1;
  for (let x2 = 0; x2 < w; x2++) {
    const n = noise1(x2, 38, salt) * 0.6 + noise1(x2, 13, salt + 7) * 0.3 * (1 + sharp) + noise1(x2, 5, salt + 3) * 0.1 * sharp;
    const top = Math.round(base - n * height);
    rect(g, body, x2, top, 1, bottom - top);
    rect(g, rim, x2, top, 1, 1);
    if (prev >= 0 && Math.abs(top - prev) > 1) rect(g, rim, x2, Math.min(top, prev), 1, Math.abs(top - prev));
    prev = top;
  }
}
function paintHeadland(g, x0, w, base, height, side, body = DUSK.ridgeFar, rim = DUSK.ridgeFarRim, salt = 4) {
  let prev = -1;
  for (let i = 0; i < w; i++) {
    const t = side === "left" ? 1 - i / w : i / w;
    const shape = Math.pow(t, 0.7) * (0.75 + noise1(i, 9, salt) * 0.25);
    const top = Math.round(base - shape * height);
    if (top >= base) {
      prev = -1;
      continue;
    }
    const x2 = x0 + i;
    rect(g, body, x2, top, 1, base - top);
    rect(g, rim, x2, top, 1, 1);
    if (prev >= 0 && Math.abs(top - prev) > 1) rect(g, rim, x2, Math.min(top, prev), 1, Math.abs(top - prev));
    prev = top;
  }
}
function paintSea(g, x0, w, top, bottom, opts = {}) {
  const { sunX = null, sunW = 20, time = 0, salt = 9 } = opts;
  const h = bottom - top;
  if (h <= 0) return;
  ditherGradient(g, x0, top, w, bottom, [DUSK.waterHaze, DUSK.water, DUSK.water, DUSK.waterD]);
  rect(g, DUSK.horizon, x0, top, w, 1);
  for (let y = top + 2; y < bottom; y += 2) {
    const depth = (y - top) / h;
    const len = 2 + Math.round(depth * 6);
    const step = 9 + Math.round((1 - depth) * 10);
    const drift = Math.floor(time * (2 + depth * 4) + hash2(y, 0, salt) * step);
    for (let x2 = -step; x2 < w + step; x2 += step) {
      const wx = x0 + x2 + (drift + Math.floor(hash2(x2, y, salt) * step)) % step;
      if (hash2(x2, y, salt + 1) < 0.45) continue;
      rect(g, DUSK.wave, wx, y, len, 1);
    }
  }
  if (sunX != null) paintReflection(g, top, bottom, sunX, sunW, time, salt);
  const n = Math.floor(w * h / 90);
  for (let i = 0; i < n; i++) {
    const tw = hash2(i, 7, salt);
    if (Math.sin(time * (1 + tw * 2) + i * 1.7) < 0.55) continue;
    const x2 = x0 + Math.floor(hash2(i, 5, salt) * w);
    const y = top + 2 + Math.floor(hash2(i, 6, salt) * (h - 2));
    rect(g, DUSK.foam, x2, y, tw > 0.7 ? 2 : 1, 1);
  }
}
function paintReflection(g, top, bottom, sunX, sunW = 20, time = 0, salt = 9) {
  const h = bottom - top;
  for (let y = top + 1; y < bottom; y += 2) {
    const depth = (y - top) / h;
    const sway = Math.round(Math.sin(time * 1.3 + y * 0.7) * (1 + depth * 2));
    const half = Math.round(sunW / 2 * (1 - depth * 0.55) * (0.55 + hash2(y, Math.floor(time * 2), salt) * 0.45));
    if (half < 1) continue;
    const col = depth < 0.2 ? DUSK.sun1 : depth < 0.45 ? DUSK.sun2 : depth < 0.75 ? DUSK.glint : DUSK.sun3;
    rect(g, col, Math.round(sunX - half + sway), y, half * 2, 1);
  }
}
function paintBeach(g, x0, w, top, bottom, time = 0, salt = 21) {
  rect(g, DUSK.sand, x0, top, w, bottom - top);
  for (let y = top + 3; y < bottom; y += 3) for (let x2 = x0; x2 < x0 + w; x2 += 4) {
    const n = hash2(Math.floor(x2 / 4), Math.floor(y / 3), salt);
    if (n > 0.72) rect(g, DUSK.sandL, x2, y, 4, 2);
    else if (n < 0.2) rect(g, DUSK.sandD, x2, y, 4, 2);
  }
  const swell = Math.sin(time * 0.9) * 0.5 + 0.5;
  for (let x2 = x0; x2 < x0 + w; x2++) {
    const n = noise1(x2, 11, salt);
    const reach = Math.round(1 + n * 3 + swell * 2);
    rect(g, DUSK.sandW, x2, top, 1, reach + 1);
    rect(g, DUSK.foam, x2, top + reach, 1, 1);
    if (noise1(x2 + Math.floor(time * 3), 5, salt + 2) > 0.6) rect(g, "#ffffff", x2, top + reach, 1, 1);
  }
}
function paintPalm(g, x2, baseY, h, lean = 4, light = 1, time = 0) {
  const top = baseY - h;
  let tx = x2;
  for (let y = baseY; y > top; y--) {
    const t = (baseY - y) / h;
    tx = Math.round(x2 + lean * t * t);
    const w = t < 0.4 ? 3 : 2;
    const left = tx - 1;
    rect(g, (baseY - y) % 4 === 0 ? DUSK.palmL : DUSK.palm, left, y, w, 1);
    rect(g, DUSK.rim, light > 0 ? left + w - 1 : left, y, 1, 1);
  }
  const cx = tx;
  const cy = top;
  const sway = Math.sin(time * 0.8) * 1.5;
  const len = Math.max(8, Math.round(h * 0.5));
  const fronds = [[200, 0.85, 0.7], [165, 1, 0.55], [130, 0.8, 0.35], [95, 0.55, 0.2], [55, 0.8, 0.35], [18, 1, 0.55], [-15, 0.85, 0.7]];
  for (const [deg, k, droop] of fronds) {
    const a = deg * Math.PI / 180;
    const L = Math.round(len * k);
    const lit = light > 0 ? Math.cos(a) > 0.2 : Math.cos(a) < -0.2;
    for (let i = 1; i <= L; i++) {
      const t = i / L;
      const fx = Math.round(cx + Math.cos(a) * i + sway * t * t * Math.sign(Math.cos(a) || 1));
      const fy = Math.round(cy - Math.sin(a) * i * 0.75 + droop * t * t * L);
      const thick = t < 0.55 ? 2 : 1;
      rect(g, DUSK.palm, fx, fy, 1, thick);
      if (lit && t < 0.9) rect(g, DUSK.rim, fx, fy, 1, 1);
      if (i % 2 === 0 && t > 0.2 && t < 0.97) rect(g, DUSK.palm, fx, fy + thick, 1, t < 0.75 ? 3 : 2);
    }
  }
  rect(g, DUSK.palm, cx - 2, cy - 1, 5, 3);
  rect(g, DUSK.palmL, cx - 1, cy + 1, 1, 1);
  rect(g, DUSK.palmL, cx + 1, cy + 1, 1, 1);
}
function paintTreeLine(g, x0, w, baseY, size = 7, salt = 5) {
  const step = Math.max(4, Math.round(size * 1.3));
  const trees = [];
  for (let x2 = x0 - size; x2 < x0 + w + size; x2 += step) {
    const r = Math.round(size * (0.75 + hash2(x2, 0, salt) * 0.5));
    trees.push({ x: x2 + Math.floor(hash2(x2, 1, salt) * step * 0.5), r, lift: Math.floor(hash2(x2, 2, salt) * size * 0.8) });
  }
  for (const t of trees) {
    const cy = baseY - t.r - t.lift;
    rect(g, DUSK.trunk, t.x - 1, cy, 3, baseY - cy);
    disc(g, DUSK.canopyD, t.x, cy, t.r);
  }
  for (const t of trees) {
    const cy = baseY - t.r - t.lift;
    disc(g, DUSK.canopyM, t.x, cy - 1, t.r - 2);
    rect(g, DUSK.canopyL, t.x - Math.round(t.r * 0.6), cy - t.r + 1, Math.round(t.r * 0.9), 1);
    rect(g, DUSK.canopyH, t.x - Math.round(t.r * 0.45), cy - t.r, Math.round(t.r * 0.6), 1);
    rect(g, DUSK.rim, t.x + t.r - 1, cy - 1, 1, Math.max(2, Math.round(t.r * 0.5)));
    for (let i = 0; i < 2; i++) {
      const lx = t.x - t.r + 2 + Math.floor(hash2(t.x, 10 + i, salt) * (t.r * 2 - 5));
      const ly = cy - t.r + 3 + Math.floor(hash2(t.x, 20 + i, salt) * t.r);
      rect(g, DUSK.canopyL, lx, ly, 3, 1);
      rect(g, DUSK.canopyD, lx, ly + 1, 3, 1);
    }
  }
}
function paintHouse(g, x2, baseY, w, h, salt = 0) {
  const roofH = Math.max(4, Math.round(h * 0.45));
  const wallTop = baseY - (h - roofH);
  rect(g, DUSK.wall, x2, wallTop, w, baseY - wallTop);
  for (let i = 2; i < w; i += 4) rect(g, DUSK.wallD, x2 + i, wallTop, 1, baseY - wallTop);
  rect(g, DUSK.wallD, x2, wallTop, w, 2);
  rect(g, DUSK.wallD, x2, wallTop, 1, baseY - wallTop);
  rect(g, DUSK.wallD, x2 + w - 1, wallTop, 1, baseY - wallTop);
  for (let y = 0; y < roofH; y++) {
    const inset = Math.round((roofH - y) * 0.9) - 1;
    const rx = x2 - 2 + inset;
    const rw = w + 4 - inset * 2;
    const yy = wallTop - roofH + y;
    rect(g, y % 3 === 2 ? DUSK.roofD : DUSK.roof, rx, yy, rw, 1);
    if (y % 3 === 0) for (let i = y % 2 * 2; i < rw; i += 4) rect(g, DUSK.roofL, rx + i, yy, 2, 1);
    rect(g, DUSK.roofHi, rx, yy, 1, 1);
  }
  rect(g, DUSK.roofHi, x2 - 1 + Math.round(roofH * 0.9), wallTop - roofH, Math.max(1, w + 2 - Math.round(roofH * 1.8)), 1);
  const wins = [];
  const wy = wallTop + 3;
  const n = Math.max(1, Math.floor((w - 4) / 7));
  for (let i = 0; i < n; i++) {
    if (hash2(x2, i, salt) < 0.3) continue;
    const wx = x2 + 3 + i * 7;
    if (wy + 5 > baseY - 1) break;
    rect(g, "#1a0f2a", wx, wy, 5, 5);
    rect(g, DUSK.window, wx + 1, wy + 1, 3, 3);
    rect(g, DUSK.windowD, wx + 1, wy + 3, 3, 1);
    rect(g, DUSK.sun0, wx + 1, wy + 1, 1, 1);
    wins.push({ x: wx + 2.5, y: wy + 2.5 });
  }
  return wins;
}
function paintGrass(g, x0, w, top, bottom, salt = 3) {
  rect(g, DUSK.g0, x0, top, w, bottom - top);
  for (let y = top; y < bottom; y += 3) for (let x2 = x0; x2 < x0 + w; x2 += 4) {
    const n = hash2(Math.floor(x2 / 4), Math.floor(y / 3), salt);
    if (n > 0.78) rect(g, DUSK.g1, x2, y, 4, 3);
    else if (n < 0.18) rect(g, DUSK.g2, x2, y, 4, 3);
  }
  for (let x2 = x0; x2 < x0 + w; x2 += 3) {
    if (hash2(x2, 5, salt) < 0.45) continue;
    const y = top + 1 + Math.floor(hash2(x2, 6, salt) * Math.max(1, bottom - top - 4));
    rect(g, DUSK.blade, x2, y + 1, 1, 2);
    rect(g, DUSK.tip, x2 + 1, y, 1, 2);
    if (hash2(x2, 7, salt) > 0.96) rect(g, "#ff8ae0", x2 + 2, y, 1, 1);
  }
  rect(g, DUSK.tip, x0, top, w, 1);
  rect(g, DUSK.g3, x0, top + 1, w, 1);
}
function paintLamp(g, x2, baseY, h, color) {
  rect(g, "#140a22", x2 - 1, baseY - 2, 3, 2);
  rect(g, "#140a22", x2, baseY - h, 1, h);
  rect(g, "#3a2a5a", x2, baseY - h, 1, h - 2);
  rect(g, "#140a22", x2 - 2, baseY - h - 3, 5, 3);
  rect(g, color, x2 - 1, baseY - h - 2, 3, 2);
  rect(g, "#ffffff", x2, baseY - h - 2, 1, 1);
  return { x: x2 + 0.5, y: baseY - h - 1 };
}

// src/js/scenery16.js
var DUSK16 = {
  /** The sky's key colours, zenith to horizon; `ramp15` makes the bands between. */
  sky: ["#100830", "#1a1048", "#382068", "#682878", "#a83080", "#e05088", "#f87888", "#f8b070"],
  sun: ["#f8f0b0", "#f8d040", "#f8b040", "#f88840", "#f86078", "#f830a0"],
  halo: "#f89878",
  cloud: "#582868",
  cloudLit: "#f87898",
  cloudTop: "#783888",
  ridgeFar: "#382068",
  ridgeFarRim: "#c050a0",
  ridge: "#181040",
  ridgeRim: "#f860b0",
  sea: ["#583890", "#283888", "#182868", "#101848", "#080c30"],
  horizon: "#f8c8e0",
  glint: "#f8e0f0",
  glintCyan: "#88e8f8",
  glintPink: "#f890d0"
};
var q = (c) => "#" + [1, 3, 5].map((i) => five(parseInt(c.slice(i, i + 2), 16)).toString(16).padStart(2, "0")).join("");
function paintSky16(g, w, horizon, bands = 16) {
  const colors = ramp15(DUSK16.sky, bands);
  const stops = colors.map((color, i) => ({ color, at: Math.pow(i / bands, 1 / 1.6) }));
  paintBands(g, 0, 0, w, horizon, stops, { dither: true, knit: 3 });
}
function paintSun16(g, cx, horizon, r) {
  cx = Math.round(cx);
  r = Math.max(6, Math.round(r));
  g.fillStyle = q(DUSK16.halo);
  for (let y = -Math.round(r * 1.5); y < 0; y++) {
    for (let x2 = -Math.round(r * 1.5); x2 <= Math.round(r * 1.5); x2++) {
      const d = Math.sqrt(x2 * x2 + y * y) / r;
      if (d <= 1.02 || d > 1.5) continue;
      const amount = d < 1.22 ? 0.5 : 0.25;
      if (bayer(cx + x2, horizon + y) < amount) g.fillRect(cx + x2, horizon + y, 1, 1);
    }
  }
  const cols = DUSK16.sun;
  const stripe = Math.max(4, Math.round(r / 5));
  for (let y = -r; y < 0; y++) {
    const half = Math.round(Math.sqrt(r * r - y * y));
    const p = (y + r) / r;
    if (p > 0.4) {
      const gap = Math.max(1, Math.round((p - 0.4) / 0.6 * stripe * 0.7));
      if ((y + r) % stripe < gap) continue;
    }
    g.fillStyle = cols[Math.min(cols.length - 1, Math.floor(p * cols.length))];
    g.fillRect(cx - half, horizon + y, half * 2, 1);
  }
}
function paintRidge16(g, w, base, height, o) {
  const salt = o.salt ?? 1;
  const haze = o.haze ?? 0;
  const sky = DUSK16.sky[DUSK16.sky.length - 2];
  const body = q(mix(o.body, sky, haze));
  const body2 = q(mix(mix(o.body, "#000000", 0.25), sky, haze));
  const rim = q(mix(o.rim, sky, haze * 0.5));
  const waves = [1, 2, 3, 5, 8].map((k, i) => ({ k, a: 1 / (i + 1.2), ph: hash2(k, salt, 7) * Math.PI * 2 }));
  const sum = waves.reduce((s, v) => s + v.a, 0);
  for (let x2 = 0; x2 < w; x2++) {
    let v = 0;
    for (const { k, a, ph } of waves) v += a * Math.sin(x2 / w * Math.PI * 2 * k + ph);
    const top = Math.round(base - height * (0.55 + 0.45 * (v / sum)));
    const depth = base - top;
    if (depth <= 0) continue;
    g.fillStyle = body;
    g.fillRect(x2, top, 1, depth);
    const mid = top + Math.round(depth * 0.55);
    g.fillStyle = body2;
    g.fillRect(x2, mid + 2, 1, Math.max(0, base - mid - 2));
    for (let y = mid; y < mid + 2 && y < base; y++) if (bayer(x2, y) < (y - mid + 1) / 3) g.fillRect(x2, y, 1, 1);
    const facing = o.sunX == null ? true : x2 < o.sunX === v > 0;
    g.fillStyle = rim;
    g.fillRect(x2, top, 1, facing ? 2 : 1);
  }
}
function paintClouds16(g, w, y0, y1, o = {}) {
  const salt = o.salt ?? 3;
  const n = o.count ?? Math.max(3, Math.round(w / 110));
  for (let i = 0; i < n; i++) {
    const cx = Math.floor(hash2(i, 1, salt) * w);
    const cy = Math.round(y0 + hash2(i, 2, salt) * (y1 - y0));
    const len = Math.round(w * (0.12 + hash2(i, 3, salt) * 0.22));
    const th = 2 + Math.floor(hash2(i, 4, salt) * 4);
    for (let r = 0; r < th; r++) {
      const edge = Math.min(r, th - 1 - r);
      const inset = edge === 0 ? Math.round(len * 0.12) + 2 : 0;
      const color = r === th - 1 ? DUSK16.cloudLit : r === 0 ? DUSK16.cloudTop : DUSK16.cloud;
      g.fillStyle = q(color);
      const x2 = cx - Math.round(len / 2) + inset + r % 2 * 2;
      const span = len - inset * 2;
      g.fillRect(x2, cy + r, span, 1);
      if (x2 < 0) g.fillRect(x2 + w, cy + r, span, 1);
      if (x2 + span > w) g.fillRect(x2 - w, cy + r, span, 1);
    }
  }
}
function drawDrift(g, layer, offset) {
  const w = layer.width;
  const o = (Math.round(offset) % w + w) % w;
  g.drawImage(layer, -o, 0);
  if (o) g.drawImage(layer, w - o, 0);
}
function paintSea16(g, w, top, bottom) {
  const colors = ramp15(DUSK16.sea, 8);
  paintBands(g, 0, top, w, bottom - top, colors, { dither: true, knit: 2 });
  g.fillStyle = q(DUSK16.horizon);
  g.fillRect(0, top, w, 1);
}
function paintGlints16(g, w, top, bottom, sunX, sunR, time) {
  const tick = Math.floor(time * 6);
  const depth = bottom - top;
  if (sunX != null) {
    const cols = DUSK16.sun.slice(1);
    for (let y = top + 2; y < top + depth * 0.7; y += 3) {
      const d = (y - top) / depth;
      const half = Math.round(sunR * (0.9 - d * 0.5) * (0.75 + 0.25 * hash2(y, tick, 5)));
      const shift = Math.round((hash2(y, tick, 6) - 0.5) * 4);
      g.fillStyle = cols[Math.min(cols.length - 1, Math.floor(d * 2 * cols.length))];
      let x2 = Math.round(sunX) - half + shift;
      while (x2 < sunX + half + shift) {
        const run = 3 + Math.floor(hash2(x2, y + tick, 8) * 10);
        g.fillRect(x2, y, Math.min(run, sunX + half + shift - x2), 1);
        x2 += run + 2 + Math.floor(hash2(x2, y, 9) * 4);
      }
    }
  }
  const n = Math.round(w * depth / 500);
  for (let i = 0; i < n; i++) {
    const life = tick + i * 7;
    const gen = Math.floor(life / 5);
    if (life % 5 > 2) continue;
    const x2 = Math.floor(hash2(i, gen, 21) * w);
    const y = top + 2 + Math.floor(Math.pow(hash2(i, gen, 22), 1.4) * (depth - 3));
    const len = 2 + Math.floor(hash2(i, gen, 23) * 4 * (y - top) / depth + 1);
    const k = hash2(i, gen, 24);
    g.fillStyle = k < 0.5 ? DUSK16.glint : k < 0.8 ? DUSK16.glintPink : DUSK16.glintCyan;
    g.fillRect(x2, y, len, 1);
  }
}

// src/js/elements.js
var Base = (
  /** @type {typeof HTMLElement} */
  typeof HTMLElement === "undefined" ? class {
  } : HTMLElement
);
var ctx2d4 = (c) => (
  /** @type {CanvasRenderingContext2D} */
  c.getContext("2d")
);
var SCENES = {
  coast(w, h, o) {
    const horizon = Math.round(h * o.horizon);
    const beachTop = Math.round(h * 0.87);
    const r = Math.max(5, Math.round(Math.min(h * 0.2, w * 0.28)));
    const sunX = o.sunX == null ? null : Math.round(w * o.sunX);
    const back = makeCanvas(w, h);
    paintSky(ctx2d4(back), w, horizon + 1);
    const front = makeCanvas(w, h);
    const f = ctx2d4(front);
    const sun = sunX == null ? null : sunLayer(w, horizon, sunX, r);
    if (sun) f.drawImage(sun, 0, 0);
    paintHeadland(f, 0, Math.round(w * 0.34), horizon, Math.round(h * 0.15), "left", DUSK.ridgeFar, DUSK.ridgeFarRim, 4);
    paintHeadland(f, Math.round(w * 0.72), Math.round(w * 0.28) + 1, horizon, Math.round(h * 0.1), "right", DUSK.ridgeFar, DUSK.ridgeFarRim, 8);
    paintHeadland(f, 0, Math.round(w * 0.18), horizon, Math.round(h * 0.07), "left", DUSK.ridge, DUSK.ridgeRim, 12);
    const palmH = Math.round(Math.min(h * 0.4, Math.max(28, w * 0.42)));
    return {
      back,
      front,
      sun,
      horizon,
      live(g, t, stage) {
        paintSea(g, 0, w, horizon, beachTop, { sunX: null, time: t });
        paintBeach(g, 0, w, beachTop, h, t);
        paintPalm(g, Math.round(w * 0.07), h - 1, palmH, 7, 1, t);
        paintPalm(g, Math.round(w * 0.95), h - 1, Math.round(palmH * 0.78), -6, -1, t + 1.7);
        stage.emit(0, horizon, w, 1);
        if (sunX != null) {
          stage.light(sunX, horizon - r * 0.4, r * 3.4, DUSK.sun3, 0.55);
          stage.light(sunX, horizon, r * 2, DUSK.sun1, 0.4);
        }
      },
      glow(g, t) {
        if (sunX != null) paintReflection(g, horizon, beachTop, sunX, r * 1.6, t);
      }
    };
  },
  town(w, h, o) {
    const horizon = Math.round(h * o.horizon);
    const ground = Math.round(h * 0.82);
    const r = Math.max(5, Math.round(Math.min(h * 0.16, w * 0.24)));
    const sunX = o.sunX == null ? null : Math.round(w * o.sunX);
    const back = makeCanvas(w, h);
    paintSky(ctx2d4(back), w, horizon + 1);
    const front = makeCanvas(w, h);
    const f = ctx2d4(front);
    const sun = sunX == null ? null : sunLayer(w, horizon, sunX, r);
    if (sun) f.drawImage(sun, 0, 0);
    paintRidge(f, w, horizon, Math.round(h * 0.18), ground, DUSK.ridgeFar, DUSK.ridgeFarRim, 2, 0.6);
    paintRidge(f, w, horizon + Math.round(h * 0.06), Math.round(h * 0.1), ground, DUSK.ridge, DUSK.ridgeRim, 5, 0.3);
    paintTreeLine(f, 0, w, ground, Math.max(5, Math.round(h * 0.045)), 5);
    const glows = [];
    const step = Math.max(34, Math.round(h * 0.3));
    for (let x2 = 6, i = 0; x2 < w - 20; x2 += step, i++) {
      const hw = 22 + i % 3 * 6;
      const hh = Math.round(h * 0.15) + i % 2 * 4;
      for (const win of paintHouse(f, x2, ground, hw, hh, i)) glows.push({ ...win, c: DUSK.window, r: 9 });
      const lampX = x2 + hw + Math.round((step - hw) / 2);
      if (lampX < w - 4) {
        const c = i % 2 ? DUSK.neonC : DUSK.neon;
        const lamp = paintLamp(f, lampX, ground + 1, Math.round(h * 0.09), c);
        glows.push({ ...lamp, c, r: 16 });
      }
    }
    paintGrass(f, 0, w, ground, h, 3);
    return {
      back,
      front,
      sun,
      horizon,
      live(g, t, stage) {
        for (const l of glows) stage.light(l.x, l.y, l.r, l.c, 0.75 + Math.sin(t * 2 + l.x) * 0.08);
        if (sunX != null) stage.light(sunX, horizon - r * 0.3, r * 3, DUSK.sun3, 0.45);
        void g;
      }
    };
  },
  hills(w, h, o) {
    const horizon = Math.round(h * o.horizon);
    const ground = Math.round(h * 0.84);
    const r = Math.max(5, Math.round(Math.min(h * 0.2, w * 0.26)));
    const sunX = o.sunX == null ? null : Math.round(w * o.sunX);
    const back = makeCanvas(w, h);
    paintSky(ctx2d4(back), w, horizon + 1);
    const front = makeCanvas(w, h);
    const f = ctx2d4(front);
    const sun = sunX == null ? null : sunLayer(w, horizon, sunX, r);
    if (sun) f.drawImage(sun, 0, 0);
    paintRidge(f, w, horizon, Math.round(h * 0.22), h, DUSK.ridgeFar, DUSK.ridgeFarRim, 7, 0.8);
    paintRidge(f, w, horizon + Math.round(h * 0.08), Math.round(h * 0.12), h, DUSK.ridge, DUSK.ridgeRim, 3, 0.4);
    paintTreeLine(f, 0, w, ground, Math.max(5, Math.round(h * 0.05)), 9);
    paintGrass(f, 0, w, ground, h, 6);
    return {
      back,
      front,
      sun,
      horizon,
      live(g, t, stage) {
        if (sunX != null) stage.light(sunX, horizon - r * 0.3, r * 3.2, DUSK.sun3, 0.5);
        void g;
        void t;
      }
    };
  },
  dusk(w, h, o) {
    const horizon = Math.round(h * o.horizon);
    const r = Math.max(5, Math.round(Math.min(h * 0.22, w * 0.3)));
    const sunX = o.sunX == null ? null : Math.round(w * o.sunX);
    const back = makeCanvas(w, h);
    const b = ctx2d4(back);
    paintSky(b, w, horizon + 1);
    rect(b, DUSK.ridge, 0, horizon + 1, w, h - horizon);
    const front = makeCanvas(w, h);
    const f = ctx2d4(front);
    const sun = sunX == null ? null : sunLayer(w, horizon, sunX, r);
    if (sun) f.drawImage(sun, 0, 0);
    paintRidge(f, w, horizon + 1, Math.round(h * 0.08), h, DUSK.ridge, DUSK.ridgeRim, 2, 0.2);
    return {
      back,
      front,
      sun,
      horizon,
      live(g, t, stage) {
        if (sunX != null) stage.light(sunX, horizon - r * 0.3, r * 3.2, DUSK.sun3, 0.5);
        void g;
        void t;
      }
    };
  }
};
function coast16(w, h, o) {
  const horizon = Math.round(h * o.horizon);
  const r = Math.max(8, Math.round(Math.min(h * 0.2, w * 0.24)));
  const sunX = o.sunX == null ? null : Math.round(w * o.sunX);
  const back = makeCanvas(w, h);
  paintSky16(ctx2d4(back), w, horizon);
  const front = makeCanvas(w, h);
  const f = ctx2d4(front);
  if (sunX != null) paintSun16(f, sunX, horizon, r);
  paintSea16(f, w, horizon, h);
  const clouds = makeCanvas(w, horizon);
  paintClouds16(ctx2d4(clouds), w, Math.round(horizon * 0.3), Math.round(horizon * 0.82), { salt: 3 });
  const far = makeCanvas(w, horizon + 1);
  paintRidge16(ctx2d4(far), w, horizon, Math.round(h * 0.08), { body: DUSK16.ridgeFar, rim: DUSK16.ridgeFarRim, haze: 0.35, salt: 4, sunX: sunX ?? void 0 });
  const near = makeCanvas(w, horizon + 1);
  paintRidge16(ctx2d4(near), w, horizon, Math.round(h * 0.035), { body: DUSK16.ridge, rim: DUSK16.ridgeRim, salt: 9, sunX: sunX ?? void 0 });
  return {
    back,
    front,
    sun: null,
    horizon,
    stars: 0.3,
    finish: { ambient: null, bloom: 0.8, overlay: false },
    live(g, t, stage) {
      drawDrift(g, clouds, t * 4);
      drawDrift(g, far, t * 1.5);
      drawDrift(g, near, t * 3);
      paintGlints16(g, w, horizon + 1, h, sunX, r, t);
      if (sunX != null) stage.light(sunX, horizon - r * 0.4, r * 3, DUSK16.sun[3], 0.5);
    }
  };
}
function sunLayer(w, horizon, cx, r) {
  const c = makeCanvas(w, horizon + 1);
  paintSun(ctx2d4(c), cx, horizon - Math.round(r * 0.55), r);
  return c;
}
var SCENE_CSS = `
:host { display: block; position: relative; overflow: hidden; background: #0b0616; contain: layout paint; }
:host([fixed]) { position: fixed; inset: 0; z-index: -1; pointer-events: none; }
:host([hidden]) { display: none; }
.ratio { padding-top: var(--nc-scene-ratio, 50%); }
canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; image-rendering: pixelated; }
`;
var NcScene = class extends Base {
  static get observedAttributes() {
    return ["scene", "pixels", "horizon", "sun", "still", "bare", "look"];
  }
  constructor() {
    super();
    this._canvas = null;
    this._stage = null;
    this._layout = null;
    this._ro = null;
    this._io = null;
    this._motion = null;
    this._raf = 0;
    this._last = 0;
    this._visible = true;
    this._t0 = typeof performance === "undefined" ? 0 : performance.now();
    this._onChange = () => this._schedule();
  }
  connectedCallback() {
    if (!this.shadowRoot) {
      const root = this.attachShadow({ mode: "open" });
      root.innerHTML = `<style>${SCENE_CSS}</style><div class="ratio"></div><canvas part="canvas"></canvas>`;
    }
    if (!this.hasAttribute("role")) this.setAttribute("aria-hidden", "true");
    this._canvas = /** @type {HTMLCanvasElement} */
    this.shadowRoot?.querySelector("canvas");
    this._stage = createPixelStage(this._canvas, { minW: 1, minH: this._pixels() });
    this._motion = matchMedia("(prefers-reduced-motion: reduce)");
    this._motion.addEventListener?.("change", this._onChange);
    this._ro = new ResizeObserver(() => {
      this._layout = null;
      this._schedule();
    });
    this._ro.observe(this);
    this._io = new IntersectionObserver((entries) => {
      this._visible = entries.some((e) => e.isIntersecting);
      this._schedule();
    });
    this._io.observe(this);
    document.addEventListener("visibilitychange", this._onChange);
  }
  disconnectedCallback() {
    this._ro?.disconnect();
    this._io?.disconnect();
    this._motion?.removeEventListener?.("change", this._onChange);
    document.removeEventListener("visibilitychange", this._onChange);
    cancelAnimationFrame(this._raf);
    this._raf = 0;
    this._layout = null;
  }
  attributeChangedCallback() {
    this._layout = null;
    if (this._stage) this._schedule();
  }
  _pixels() {
    const n = Number(this.getAttribute("pixels"));
    return (n >= 32 ? Math.round(n) : 180) * (this._is16() ? 2 : 1);
  }
  _is16() {
    return this.getAttribute("look") === "16";
  }
  _animated() {
    return !this.hasAttribute("still") && !this._motion?.matches;
  }
  _schedule() {
    if (this._raf || !this._stage) return;
    this._raf = requestAnimationFrame((now) => this._frame(now));
  }
  /** @param {number} now */
  _frame(now) {
    this._raf = 0;
    const stage = this._stage;
    if (!stage || !this.isConnected) return;
    if (!this._layout) {
      const box2 = this.getBoundingClientRect();
      if (box2.width < 1 || box2.height < 1) return;
      stage.resize(box2.width, box2.height, devicePixelRatio, 1, this._pixels());
      const sunAttr = this.getAttribute("sun");
      const sunX = sunAttr === "none" ? null : clamp01(Number(sunAttr ?? 0.5), 0.5);
      const horizon = Math.min(0.85, Math.max(0.3, clamp01(Number(this.getAttribute("horizon") ?? 0.6), 0.6)));
      const make = this._is16() ? coast16 : SCENES[this.getAttribute("scene") ?? "coast"] ?? SCENES.coast;
      this._layout = make(stage.vw, stage.vh, { horizon, sunX });
      this._last = 0;
    }
    const animated = this._animated();
    if (animated && this._last && now - this._last < 80) {
      if (this._visible && !document.hidden) this._schedule();
      return;
    }
    this._last = now;
    const t = animated ? (now - this._t0) / 1e3 : 2.5;
    const L = this._layout;
    const g = stage.begin();
    g.drawImage(L.back, 0, 0);
    drawStars(g, stage.vw, Math.max(4, L.horizon - 6), t, L.stars ?? 1, 11);
    g.drawImage(L.front, 0, 0);
    L.live(g, t, stage);
    if (L.sun) stage.emitImage(L.sun);
    const bare = this.hasAttribute("bare");
    const glow = L.glow;
    stage.present({
      ambient: bare ? null : "#b0a4dc",
      bloom: bare ? 0 : 1,
      overlay: !bare,
      ...L.finish && !bare ? L.finish : {},
      afterLight: glow ? (gg) => glow(gg, t) : void 0
    });
    if (animated && this._visible && !document.hidden) this._schedule();
  }
};
function clamp01(v, d) {
  return Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : d;
}
var SPRITE_CSS = `
:host { display: inline-block; line-height: 0; vertical-align: middle; }
:host([hidden]) { display: none; }
canvas { display: block; image-rendering: pixelated; image-rendering: crisp-edges; }
`;
var NcSprite = class extends Base {
  static get observedAttributes() {
    return ["name", "scale", "colors", "shade", "flip", "label", "look"];
  }
  constructor() {
    super();
    this._mo = null;
  }
  connectedCallback() {
    if (!this.shadowRoot) {
      const root = this.attachShadow({ mode: "open" });
      root.innerHTML = `<style>${SPRITE_CSS}</style><canvas part="canvas"></canvas>`;
    }
    this._mo = new MutationObserver(() => this.render());
    this._mo.observe(this, { childList: true, characterData: true, subtree: true });
    this.render();
  }
  disconnectedCallback() {
    this._mo?.disconnect();
  }
  attributeChangedCallback() {
    if (this.shadowRoot) this.render();
  }
  /** The rows this element draws. */
  get rows() {
    const name = this.getAttribute("name");
    let rows = name && SPRITES[name] ? SPRITES[name] : parseRows(this.textContent ?? "");
    const sh = (this.getAttribute("shade") ?? "").trim().split(/\s+/);
    if (sh.length >= 3 && rows.length) rows = shade(rows, sh[0], sh[1], sh[2], sh[3] ?? "k");
    return rows;
  }
  render() {
    const canvas = (
      /** @type {HTMLCanvasElement | null} */
      this.shadowRoot?.querySelector("canvas") ?? null
    );
    if (!canvas) return;
    const rows = this.rows;
    const label = this.getAttribute("label");
    if (label) {
      this.setAttribute("role", "img");
      this.setAttribute("aria-label", label);
    } else if (!this.hasAttribute("role")) this.setAttribute("aria-hidden", "true");
    if (!rows.length) {
      canvas.width = 0;
      canvas.height = 0;
      return;
    }
    const w = rows[0].length;
    const h = rows.length;
    const scale = Math.max(1, Number(this.getAttribute("scale")) || 4);
    const art = sprite(rows, parseColors(this.getAttribute("colors")), this.hasAttribute("flip"));
    const hi = this.getAttribute("look") === "16";
    canvas.width = hi ? w * 2 : w;
    canvas.height = hi ? h * 2 : h;
    canvas.style.width = `${w * scale}px`;
    canvas.style.height = `${h * scale}px`;
    const g = ctx2d4(canvas);
    g.clearRect(0, 0, canvas.width, canvas.height);
    g.drawImage(hi ? selout(scale2x(art)) : art, 0, 0);
  }
};
function parseRows(text) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const w = Math.max(0, ...lines.map((l) => l.length));
  return lines.map((l) => l.padEnd(w, "."));
}
function parseColors(s) {
  if (!s) return void 0;
  const out = {};
  for (const part of s.trim().split(/[\s,;]+/)) {
    const [k, v] = part.split(/[:=]/);
    if (k && v && k.length === 1) out[k] = v;
  }
  return out;
}
function defineElements() {
  if (typeof customElements === "undefined") return;
  if (!customElements.get("nc-scene")) customElements.define("nc-scene", NcScene);
  if (!customElements.get("nc-sprite")) customElements.define("nc-sprite", NcSprite);
}

// src/js/font.js
var GLYPH_H = 7;
var GLYPHS = {
  A: [".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  B: ["####.", "#...#", "#...#", "####.", "#...#", "#...#", "####."],
  C: [".###.", "#...#", "#....", "#....", "#....", "#...#", ".###."],
  D: ["####.", "#...#", "#...#", "#...#", "#...#", "#...#", "####."],
  E: ["#####", "#....", "#....", "####.", "#....", "#....", "#####"],
  F: ["#####", "#....", "#....", "####.", "#....", "#....", "#...."],
  G: [".###.", "#...#", "#....", "#.###", "#...#", "#...#", ".####"],
  H: ["#...#", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  I: ["###", ".#.", ".#.", ".#.", ".#.", ".#.", "###"],
  J: ["..###", "...#.", "...#.", "...#.", "#..#.", "#..#.", ".##.."],
  K: ["#...#", "#..#.", "#.#..", "##...", "#.#..", "#..#.", "#...#"],
  L: ["#....", "#....", "#....", "#....", "#....", "#....", "#####"],
  M: ["#...#", "##.##", "#.#.#", "#.#.#", "#...#", "#...#", "#...#"],
  N: ["#...#", "##..#", "#.#.#", "#..##", "#...#", "#...#", "#...#"],
  O: [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  P: ["####.", "#...#", "#...#", "####.", "#....", "#....", "#...."],
  Q: [".###.", "#...#", "#...#", "#...#", "#.#.#", "#..#.", ".##.#"],
  R: ["####.", "#...#", "#...#", "####.", "#.#..", "#..#.", "#...#"],
  S: [".####", "#....", "#....", ".###.", "....#", "....#", "####."],
  T: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "..#.."],
  U: ["#...#", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  V: ["#...#", "#...#", "#...#", "#...#", "#...#", ".#.#.", "..#.."],
  W: ["#...#", "#...#", "#...#", "#.#.#", "#.#.#", "##.##", "#...#"],
  X: ["#...#", "#...#", ".#.#.", "..#..", ".#.#.", "#...#", "#...#"],
  Y: ["#...#", "#...#", ".#.#.", "..#..", "..#..", "..#..", "..#.."],
  Z: ["#####", "....#", "...#.", "..#..", ".#...", "#....", "#####"],
  "\xC6": [".####", "#.#..", "#.#..", "#####", "#.#..", "#.#..", "#.###"],
  "\xD8": [".###.", "#..##", "#.#.#", "#.#.#", "#.#.#", "##..#", ".###."],
  "\xC5": [".#.#.", ".###.", ".....", ".###.", "#...#", "#####", "#...#"],
  0: [".###.", "#...#", "#..##", "#.#.#", "##..#", "#...#", ".###."],
  1: [".#.", "##.", ".#.", ".#.", ".#.", ".#.", "###"],
  2: [".###.", "#...#", "....#", "...#.", "..#..", ".#...", "#####"],
  3: ["####.", "....#", "....#", ".###.", "....#", "....#", "####."],
  4: ["...#.", "..##.", ".#.#.", "#..#.", "#####", "...#.", "...#."],
  5: ["#####", "#....", "####.", "....#", "....#", "#...#", ".###."],
  6: [".###.", "#....", "#....", "####.", "#...#", "#...#", ".###."],
  7: ["#####", "....#", "...#.", "..#..", ".#...", ".#...", ".#..."],
  8: [".###.", "#...#", "#...#", ".###.", "#...#", "#...#", ".###."],
  9: [".###.", "#...#", "#...#", ".####", "....#", "....#", ".###."],
  " ": ["...", "...", "...", "...", "...", "...", "..."],
  ".": [".", ".", ".", ".", ".", ".", "#"],
  ",": ["..", "..", "..", "..", ".#", ".#", "#."],
  "!": ["#", "#", "#", "#", "#", ".", "#"],
  "?": [".###.", "#...#", "....#", "...#.", "..#..", ".....", "..#.."],
  "'": ["#", "#", ".", ".", ".", ".", "."],
  '"': ["#.#", "#.#", "...", "...", "...", "...", "..."],
  "`": ["#.", ".#", "..", "..", "..", "..", ".."],
  ":": [".", ".", "#", ".", ".", "#", "."],
  ";": ["..", "..", ".#", "..", ".#", ".#", "#."],
  "-": ["....", "....", "....", "####", "....", "....", "...."],
  "\u2014": [".......", ".......", ".......", "#######", ".......", ".......", "......."],
  _: [".....", ".....", ".....", ".....", ".....", ".....", "#####"],
  "\xB7": ["..", "..", "..", "##", "##", "..", ".."],
  "\u2026": [".....", ".....", ".....", ".....", ".....", ".....", "#.#.#"],
  "+": [".....", "..#..", "..#..", "#####", "..#..", "..#..", "....."],
  "=": ["....", "....", "####", "....", "####", "....", "...."],
  "\xD7": [".....", "#...#", ".#.#.", "..#..", ".#.#.", "#...#", "....."],
  "/": ["....#", "....#", "...#.", "..#..", ".#...", "#....", "#...."],
  "\\": ["#....", "#....", ".#...", "..#..", "...#.", "....#", "....#"],
  "|": ["#", "#", "#", "#", "#", "#", "#"],
  "(": [".#", "#.", "#.", "#.", "#.", "#.", ".#"],
  ")": ["#.", ".#", ".#", ".#", ".#", ".#", "#."],
  "[": ["##", "#.", "#.", "#.", "#.", "#.", "##"],
  "]": ["##", ".#", ".#", ".#", ".#", ".#", "##"],
  "{": ["..#", ".#.", ".#.", "#..", ".#.", ".#.", "..#"],
  "}": ["#..", ".#.", ".#.", "..#", ".#.", ".#.", "#.."],
  "<": ["...#", "..#.", ".#..", "#...", ".#..", "..#.", "...#"],
  ">": ["#...", ".#..", "..#.", "...#", "..#.", ".#..", "#..."],
  "\xAB": [".....", "..#.#", ".#.#.", "#.#..", ".#.#.", "..#.#", "....."],
  "\xBB": [".....", "#.#..", ".#.#.", "..#.#", ".#.#.", "#.#..", "....."],
  "^": [".#.", "#.#", "...", "...", "...", "...", "..."],
  "~": [".....", ".....", ".##.#", "#..#.", ".....", ".....", "....."],
  "%": ["##..#", "##..#", "...#.", "..#..", ".#...", "#..##", "#..##"],
  "&": [".##..", "#..#.", "#.#..", ".#...", "#.#.#", "#..#.", ".##.#"],
  "*": [".....", "#.#.#", ".###.", "#####", ".###.", "#.#.#", "....."],
  "#": [".#.#.", ".#.#.", "#####", ".#.#.", "#####", ".#.#.", ".#.#."],
  "@": [".###.", "#...#", "#.###", "#.#.#", "#.###", "#....", ".###."],
  $: ["..#..", ".####", "#.#..", ".###.", "..#.#", "####.", "..#.."],
  "\u20AC": ["..###", ".#...", "####.", ".#...", "####.", ".#...", "..###"],
  "\xA3": ["..##.", ".#..#", ".#...", "####.", ".#...", ".#...", "#####"],
  "\xB0": [".#.", "#.#", ".#.", "...", "...", "...", "..."],
  "\u2665": [".....", "##.##", "#####", "#####", ".###.", "..#..", "....."],
  "\u2605": [".....", "..#..", "..#..", "#####", ".###.", ".#.#.", "#...#"],
  "\u266A": ["..##.", "..#.#", "..#..", "..#..", "###..", "###..", "....."],
  "\u25CF": [".....", ".###.", "#####", "#####", "#####", ".###.", "....."],
  "\u25CB": [".....", ".###.", "#...#", "#...#", "#...#", ".###.", "....."],
  "\u25A0": [".....", "####.", "####.", "####.", "####.", ".....", "....."],
  "\u25C6": [".....", "..#..", ".###.", "#####", ".###.", "..#..", "....."],
  "\u25C8": ["..#..", ".#.#.", "#.#.#", ".#.#.", "..#..", ".....", "....."],
  "\u275A": ["##", "##", "##", "##", "##", "##", "##"],
  "\u2713": [".....", "....#", "...##", "#.##.", "###..", ".#...", "....."],
  "\u2630": [".....", "#####", ".....", "#####", ".....", "#####", "....."],
  "\u2302": ["..#..", ".#.#.", "#...#", "#...#", "#...#", "#####", "....."],
  "\u21BB": ["..###.#", ".#...##", "#...###", "#......", "#.....#", ".#...#.", "..###.."],
  "\u2192": [".....", "...#.", "....#", "#####", "....#", "...#.", "....."],
  "\u2190": [".....", ".#...", "#....", "#####", "#....", ".#...", "....."],
  "\u2191": ["..#..", ".###.", "#.#.#", "..#..", "..#..", "..#..", "....."],
  "\u2193": [".....", "..#..", "..#..", "..#..", "#.#.#", ".###.", "..#.."],
  "\u25B6": ["#....", "##...", "###..", "####.", "###..", "##...", "#...."],
  "\u25C0": ["....#", "...##", "..###", ".####", "..###", "...##", "....#"],
  "\u25B2": [".....", "..#..", ".###.", "#####", "#####", ".....", "....."],
  "\u25BC": [".....", "#####", "#####", ".###.", "..#..", ".....", "....."]
};
var ABOVE = {
  "\xC5": [".###."],
  "\xC4": [".#.#."],
  "\xD6": [".#.#."],
  "\xDC": [".#.#."],
  "\xC9": ["..##."],
  "\xC8": [".##.."]
};
var ALIAS = {
  "\xC4": "A",
  "\xD6": "O",
  "\xDC": "U",
  "\xC9": "E",
  "\xC8": "E",
  "\u2013": "-",
  "\u2019": "'",
  "\u2018": "'",
  "\u201C": '"',
  "\u201D": '"',
  "\u2022": "\xB7",
  "\u2715": "\xD7",
  "\u2717": "\xD7",
  "\u2039": "<",
  "\u203A": ">",
  "\xA0": " "
};
function glyph(ch) {
  return GLYPHS[ch] ?? GLYPHS[ALIAS[ch] ?? "?"] ?? GLYPHS["?"];
}
function glyphRows(ch) {
  return glyph(ch.toUpperCase());
}
function glyphAbove(ch) {
  return ABOVE[ch.toUpperCase()] ?? [];
}
function textWidth(text) {
  let w = 0;
  for (const ch of text.toUpperCase()) w += glyph(ch)[0].length + 1;
  return Math.max(0, w - 1);
}
function drawText(ctx, text, x2, y, color, shadow) {
  drawBigText(ctx, text, x2, y, 1, color, shadow);
}
function drawBigText(ctx, text, x2, y, n, color, shadow) {
  const t = text.toUpperCase();
  const pass = (ox, oy, fill) => {
    ctx.fillStyle = fill;
    let cx = x2 + ox;
    for (const ch of t) {
      const up = ABOVE[ch] ?? [];
      const rows = up.length ? [...up, ...glyph(ch)] : glyph(ch);
      const w = rows[0].length;
      for (let gy = 0; gy < rows.length; gy++) {
        const row = rows[gy];
        let gx = 0;
        while (gx < w) {
          if (row[gx] !== "#") {
            gx++;
            continue;
          }
          const start = gx;
          while (gx < w && row[gx] === "#") gx++;
          ctx.fillRect(cx + start * n, y + oy + (gy - up.length) * n, (gx - start) * n, n);
        }
      }
      cx += (w + 1) * n;
    }
  };
  if (shadow) pass(n, n, shadow);
  pass(0, 0, color);
}
function bigTextWidth(text, n) {
  return textWidth(text) * n;
}
function wrapText(text, maxWidth) {
  const lines = [];
  for (const para of text.split("\n")) {
    const words = para.split(/\s+/).filter(Boolean);
    let line = "";
    for (const word of words) {
      const next = line ? line + " " + word : word;
      if (textWidth(next) <= maxWidth || !line) line = next;
      else {
        lines.push(line);
        line = word;
      }
    }
    lines.push(line);
  }
  return lines;
}

// src/js/ui.js
function drawBox(g, x2, y, w, h, opts = {}) {
  const { edge = COLORS.cyan, fill = UI.surface, rule = true } = opts;
  g.fillStyle = fill;
  g.fillRect(x2, y, w, h);
  g.fillStyle = edge;
  g.fillRect(x2 + 1, y, w - 2, 1);
  g.fillRect(x2 + 1, y + h - 1, w - 2, 1);
  g.fillRect(x2, y + 1, 1, h - 2);
  g.fillRect(x2 + w - 1, y + 1, 1, h - 2);
  if (rule) {
    g.fillStyle = UI["box-rule"];
    g.fillRect(x2 + 2, y + 2, w - 4, 1);
  }
}
function drawWindow(g, x2, y, w, h, opts = {}) {
  const bands = opts.bands ?? (opts.teal ? WINDOW_TEAL : WINDOW);
  for (let r = 0; r < h; r++) {
    const f = r / Math.max(1, h - 1) * (bands.length - 1);
    const i = Math.min(bands.length - 1, Math.floor(f));
    g.fillStyle = bands[i];
    g.fillRect(x2, y + r, w, 1);
    if (f - i > 0.75 && i + 1 < bands.length) {
      g.fillStyle = bands[i + 1];
      for (let c = (r + x2) % 2; c < w; c += 2) g.fillRect(x2 + c, y + r, 1, 1);
    }
  }
  g.fillStyle = UI["window-shade"];
  g.fillRect(x2 + 2, y - 1, w - 4, 1);
  g.fillRect(x2 + 2, y + h, w - 4, 1);
  g.fillRect(x2 - 1, y + 2, 1, h - 4);
  g.fillRect(x2 + w, y + 2, 1, h - 4);
  g.fillRect(x2, y, 2, 1);
  g.fillRect(x2, y + 1, 1, 1);
  g.fillRect(x2 + w - 2, y, 2, 1);
  g.fillRect(x2 + w - 1, y + 1, 1, 1);
  g.fillRect(x2, y + h - 1, 2, 1);
  g.fillRect(x2, y + h - 2, 1, 1);
  g.fillRect(x2 + w - 2, y + h - 1, 2, 1);
  g.fillRect(x2 + w - 1, y + h - 2, 1, 1);
  g.fillStyle = UI["window-edge"];
  g.fillRect(x2 + 2, y, w - 4, 1);
  g.fillRect(x2 + 2, y + h - 1, w - 4, 1);
  g.fillRect(x2, y + 2, 1, h - 4);
  g.fillRect(x2 + w - 1, y + 2, 1, h - 4);
  g.fillRect(x2 + 1, y + 1, 1, 1);
  g.fillRect(x2 + w - 2, y + 1, 1, 1);
  g.fillRect(x2 + 1, y + h - 2, 1, 1);
  g.fillRect(x2 + w - 2, y + h - 2, 1, 1);
  g.fillStyle = UI["window-hi"];
  g.fillRect(x2 + 2, y + 1, w - 4, 1);
  g.fillRect(x2 + 1, y + 2, 1, h - 4);
  g.fillStyle = "rgba(6, 8, 40, 0.45)";
  g.fillRect(x2 + 2, y + h - 2, w - 4, 1);
  g.fillRect(x2 + w - 2, y + 2, 1, h - 4);
}
function drawDialog(g, text, x2, y, w, opts = {}) {
  const { chars = Infinity, more = false, time = 0, edge = COLORS.pink } = opts;
  const lines = wrapText(text, w - 16);
  const h = lines.length * (GLYPH_H + 4) + 12;
  drawBox(g, x2, y, w, h, { edge });
  let left = Math.floor(chars);
  lines.forEach((line, i) => {
    const shown = line.slice(0, Math.max(0, left));
    left -= line.length + 1;
    drawText(g, shown, x2 + 8, y + 7 + i * (GLYPH_H + 4), COLORS.white, COLORS.plum);
  });
  if (more && chars >= text.length && Math.floor(time * 3) % 2 === 0) {
    g.fillStyle = COLORS.cyan;
    g.fillRect(x2 + w - 11, y + h - 7, 5, 1);
    g.fillRect(x2 + w - 10, y + h - 6, 3, 1);
    g.fillRect(x2 + w - 9, y + h - 5, 1, 1);
  }
  return h;
}
function drawBanner(g, text, cx, y, alpha = 1) {
  if (alpha <= 0) return;
  const w = textWidth(text);
  const x2 = Math.round(cx - w / 2);
  g.globalAlpha = Math.min(1, alpha);
  g.fillStyle = "rgba(11,6,22,0.6)";
  g.fillRect(x2 - 8, y - 5, w + 16, GLYPH_H + 10);
  drawText(g, text, x2, y, COLORS.white, COLORS.pink);
  g.fillStyle = COLORS.cyan;
  g.fillRect(x2 - 8, y - 5, w + 16, 1);
  g.fillStyle = COLORS.pink;
  g.fillRect(x2 - 8, y + GLYPH_H + 4, w + 16, 1);
  g.globalAlpha = 1;
}
function drawMeter(g, x2, y, value, opts = {}) {
  const { cells = 12, cell = 3, gap = 1, h = 3, color = COLORS.pink, empty = COLORS.dusk } = opts;
  const lit = Math.floor(Math.max(0, Math.min(1, value)) * cells + 1e-9);
  const w = cells * (cell + gap) - gap + 2;
  g.fillStyle = COLORS.ink;
  g.fillRect(x2, y, w, h + 2);
  for (let i = 0; i < cells; i++) {
    g.fillStyle = i < lit ? color : empty;
    g.fillRect(x2 + 1 + i * (cell + gap), y + 1, cell, h);
  }
  return w;
}
function drawHearts(g, x2, y, hp, maxHp, perRow = 10) {
  const n = Math.ceil(maxHp / 2);
  for (let i = 0; i < n; i++) {
    const left = hp - i * 2;
    const rows = left >= 2 ? SPRITES.heart : left === 1 ? SPRITES["heart-half"] : SPRITES["heart-empty"];
    g.drawImage(sprite(rows), x2 + i % perRow * 9, y + Math.floor(i / perRow) * 9);
  }
  return Math.ceil(n / perRow) * 9 - 2;
}

// src/js/font16.js
var CAP16 = 12;
var LINE16 = 14;
var ABOVE16 = 3;
var BELOW16 = 2;
var GAP = 2;
function at(top, rows) {
  const blank = ".".repeat(rows[0].length);
  const out = [];
  for (let r = 0; r < CAP16; r++) out.push(rows[r - top] ?? blank);
  return out;
}
function x(n, row) {
  return Array.from({ length: n }, () => row);
}
var GLYPHS16 = {
  A: ["...##...", "...##...", "..####..", "..####..", ".##..##.", ".##..##.", ".##..##.", "##....##", "########", "##....##", "##....##", "##....##"],
  B: ["######..", "##...##.", "##....##", "##....##", "##...##.", "######..", "##...##.", "##....##", "##....##", "##....##", "##...##.", "######.."],
  C: ["..####..", ".##..##.", "##....##", ...x(6, "##......"), "##....##", ".##..##.", "..####.."],
  D: ["######..", "##...##.", ...x(8, "##....##"), "##...##.", "######.."],
  E: ["#######", ...x(4, "##....."), "######.", ...x(5, "##....."), "#######"],
  F: ["#######", ...x(4, "##....."), "######.", ...x(6, "##.....")],
  G: ["..####..", ".##..##.", "##....##", "##......", "##......", "##......", "##..####", "##....##", "##....##", "##....##", ".##..##.", "..####.."],
  H: [...x(5, "##....##"), "########", ...x(6, "##....##")],
  I: ["####", ...x(10, ".##."), "####"],
  J: [...x(8, ".....##"), "##...##", "##...##", ".##.##.", "..###.."],
  K: ["##....##", "##...##.", "##...##.", "##..##..", "##.##...", "####....", "####....", "##.##...", "##..##..", "##...##.", "##...##.", "##....##"],
  L: [...x(11, "##....."), "#######"],
  M: ["##......##", "###....###", "###....###", "####..####", "##.#..#.##", "##.####.##", "##..##..##", "##..##..##", ...x(4, "##......##")],
  N: ["##....##", "###...##", "###...##", "####..##", "##.#..##", "##.##.##", "##.##.##", "##..#.##", "##..####", "##...###", "##...###", "##....##"],
  O: ["..####..", ".##..##.", ...x(8, "##....##"), ".##..##.", "..####.."],
  P: ["######..", "##...##.", "##....##", "##....##", "##....##", "##...##.", "######..", ...x(5, "##......")],
  Q: ["..####..", ".##..##.", ...x(6, "##....##"), "##..#.##", "##..####", ".##..##.", "..###.##"],
  R: ["######..", "##...##.", "##....##", "##....##", "##...##.", "######..", "##.##...", "##..##..", "##..##..", "##...##.", "##...##.", "##....##"],
  S: ["..####..", ".##..##.", "##....##", "##......", ".##.....", "..####..", ".....##.", "......##", "......##", "##....##", ".##..##.", "..####.."],
  T: ["########", ...x(11, "...##...")],
  U: [...x(10, "##....##"), ".##..##.", "..####.."],
  V: [...x(4, "##....##"), ...x(4, ".##..##."), "..####..", "..####..", "...##...", "...##..."],
  W: [...x(4, "##......##"), "##..##..##", "##..##..##", "##.####.##", "##.#..#.##", "####..####", "###....###", "###....###", "##......##"],
  X: ["##....##", "##....##", ".##..##.", ".##..##.", "..####..", "...##...", "...##...", "..####..", ".##..##.", ".##..##.", "##....##", "##....##"],
  Y: ["##....##", "##....##", ".##..##.", ".##..##.", "..####..", "..####..", ...x(6, "...##...")],
  Z: ["########", "......##", ".....##.", ".....##.", "....##..", "...##...", "...##...", "..##....", ".##.....", ".##.....", "##......", "########"],
  "\xC6": ["...#######", "..####....", "..####....", "..####....", ".##.##....", ".##.#####.", ".##.##....", ".##.##....", "######....", "##..##....", "##..##....", "##..######"],
  "\xD8": ["..####.#", ".##..##.", "##...###", "##...###", "##..#.##", "##..#.##", "##.#..##", "##.#..##", "###...##", "###...##", ".##..##.", "#.####.."],
  "\xC5": ["...##...", "...##...", "..####..", "..####..", ".##..##.", ".##..##.", ".##..##.", "##....##", "########", "##....##", "##....##", "##....##"],
  0: ["..###..", ".##.##.", ...x(8, "##...##"), ".##.##.", "..###.."],
  1: ["..##..", ".###..", "####..", ...x(8, "..##.."), "######"],
  2: ["..###..", ".##.##.", "##...##", ".....##", ".....##", "....##.", "...##..", "..##...", ".##....", "##.....", "##.....", "#######"],
  3: ["..###..", ".##.##.", "##...##", ".....##", "....##.", "..###..", "....##.", ".....##", ".....##", "##...##", ".##.##.", "..###.."],
  4: ["....##.", "...###.", "...###.", "..#.##.", ".##.##.", ".#..##.", "##..##.", "#######", ...x(4, "....##.")],
  5: ["#######", "##.....", "##.....", "##.....", "#####..", "....##.", ".....##", ".....##", ".....##", "##...##", ".##.##.", "..###.."],
  6: ["..###..", ".##.##.", "##.....", "##.....", "##.##..", "###.##.", ...x(4, "##...##"), ".##.##.", "..###.."],
  7: ["#######", ".....##", ".....##", "....##.", "....##.", "...##..", "...##..", ...x(5, "..##...")],
  8: ["..###..", ".##.##.", "##...##", "##...##", ".##.##.", "..###..", ".##.##.", "##...##", "##...##", "##...##", ".##.##.", "..###.."],
  9: ["..###..", ".##.##.", ...x(4, "##...##"), ".##.###", "..##.##", ".....##", ".....##", ".##.##.", "..###.."],
  " ": x(12, "..."),
  ".": at(10, ["##", "##"]),
  ",": at(10, [".##", ".##"]),
  "!": [...x(8, "##"), "..", "..", "##", "##"],
  "?": ["..###..", ".##.##.", "##...##", ".....##", ".....##", "....##.", "...##..", "...##..", ".......", ".......", "...##..", "...##.."],
  "'": at(0, ["##", "##", ".#", "#."]),
  '"': at(0, ["##.##", "##.##", ".#..#", "#..#."]),
  ":": at(3, ["##", "##", "..", "..", "..", "..", "..", "##", "##"]),
  ";": at(3, [".##", ".##", "...", "...", "...", "...", "...", ".##", ".##"]),
  "-": at(5, ["#####", "#####"]),
  "\xB7": at(4, [".##.", "####", "####", ".##."]),
  "+": at(3, ["..##..", "..##..", "######", "######", "..##..", "..##.."]),
  "/": ["....##", "....##", "...##.", "...##.", "...##.", "..##..", "..##..", ".##...", ".##...", ".##...", "##....", "##...."],
  "(": ["..##", ".##.", ".##.", ...x(6, "##.."), ".##.", ".##.", "..##"],
  ")": ["##..", ".##.", ".##.", ...x(6, "..##"), ".##.", ".##.", "##.."],
  "%": [".##...##", "#..#..##", "#..#.##.", ".##..##.", "....##..", "....##..", "...##...", "...##...", ".##..##.", ".##.#..#", "##..#..#", "##...##."],
  "&": ["..###....", ".##.##...", ".##.##...", ".##.##...", "..###....", ".###.....", "##.##..##", "##..##.##", "##...###.", "##...###.", ".##.##.##", "..###..##"],
  "*": at(2, ["...##...", "##.##.##", ".######.", "..####..", ".######.", "##.##.##", "...##..."]),
  "#": at(1, [".##..##.", ".##..##.", "########", ".##..##.", ".##..##.", ".##..##.", "########", ".##..##.", ".##..##."]),
  "=": at(3, ["######", "######", "......", "......", "######", "######"]),
  "<": at(1, ["....##", "...##.", "..##..", ".##...", "##....", "##....", ".##...", "..##..", "...##.", "....##"]),
  ">": at(1, ["##....", ".##...", "..##..", "...##.", "....##", "....##", "...##.", "..##..", ".##...", "##...."]),
  _: at(10, ["#######", "#######"]),
  "\xD7": at(3, ["##...##", ".##.##.", "..###..", "..###..", ".##.##.", "##...##"]),
  "\u2665": at(2, [".##...##.", "####.####", "#########", "#########", ".#######.", "..#####..", "...###...", "....#...."]),
  "\u2192": at(3, [".....##..", "......##.", "#########", "#########", "......##.", ".....##.."]),
  "\u2190": at(3, ["..##.....", ".##......", "#########", "#########", ".##......", "..##....."]),
  "\u2191": at(1, ["...##...", "..####..", ".######.", "##.##.##", ...x(6, "...##...")]),
  "\u2193": at(1, [...x(6, "...##..."), "##.##.##", ".######.", "..####..", "...##..."])
};
var MARKS16_ABOVE = {
  "\xC5": ["...##...", "..#..#..", "...##..."],
  "\xC9": ["....##.", "...##..", "......."]
};
var MARKS16_BELOW = {
  ",": ["..#", ".#."],
  ";": ["..#", ".#."]
};
var ALIAS16 = { "\u2014": "-", "\u2013": "-", "\u2019": "'", "\u2018": "'", "\u201C": '"', "\u201D": '"', "\u2026": ".", "\xC9": "E", "\xC8": "E", "\xC4": "\xC6", "\xD6": "\xD8", "\xDC": "U" };
function glyph2(ch) {
  return GLYPHS16[ch] ?? GLYPHS16[ALIAS16[ch] ?? "?"] ?? GLYPHS16["?"];
}
function glyphRows16(ch) {
  return glyph2(ch.toUpperCase());
}
function glyphExtra16(ch) {
  const c = ch.toUpperCase();
  return { above: MARKS16_ABOVE[c] ?? [], below: MARKS16_BELOW[c] ?? [] };
}
function textWidth16(text) {
  let w = 0;
  for (const ch of text.toUpperCase()) w += glyph2(ch)[0].length + GAP;
  return Math.max(0, w - GAP);
}
function wrapText16(text, maxWidth) {
  const lines = [];
  for (const para of text.split("\n")) {
    const words = para.split(/\s+/).filter(Boolean);
    let line = "";
    for (const word of words) {
      const next = line ? line + " " + word : word;
      if (textWidth16(next) <= maxWidth || !line) line = next;
      else {
        lines.push(line);
        line = word;
      }
    }
    lines.push(line);
  }
  return lines;
}
var OFFSETS = {
  drop: [[1, 0], [0, 1], [1, 1]],
  rim: [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1], [2, 1], [1, 2], [2, 2], [0, 2], [2, 0]]
};
function drawText16(ctx, text, x2, y, color, shadow, unit = 1, edge = "drop") {
  const t = text.toUpperCase();
  const x0 = Math.round(x2 / unit) * unit;
  const y0 = Math.round(y / unit) * unit;
  const pass = (ox, oy, fill) => {
    ctx.fillStyle = fill;
    let cx = x0 + ox * unit;
    for (const ch of t) {
      const g = glyph2(ch);
      const { above, below } = glyphExtra16(ch);
      const rows = [...above, ...g, ...below];
      const top = y0 + (oy - above.length) * unit;
      for (let r = 0; r < rows.length; r++) {
        const row = rows[r];
        let c = 0;
        while (c < row.length) {
          if (row[c] !== "#") {
            c++;
            continue;
          }
          const s = c;
          while (c < row.length && row[c] === "#") c++;
          ctx.fillRect(cx + s * unit, top + r * unit, (c - s) * unit, unit);
        }
      }
      cx += (g[0].length + GAP) * unit;
    }
  };
  if (shadow) for (const [ox, oy] of OFFSETS[edge]) pass(ox, oy, shadow);
  pass(0, 0, color);
}

// src/js/ui16.js
function box(out, x2, y, w, h, cuts, fill) {
  const n = Math.min(cuts.length, Math.floor(h / 2));
  for (let i = 0; i < n; i++) {
    const c = Math.min(cuts[i], Math.floor(w / 2));
    out.push([x2 + c, y + i, w - c * 2, 1, fill], [x2 + c, y + h - 1 - i, w - c * 2, 1, fill]);
  }
  out.push([x2, y + n, w, h - n * 2, fill]);
}
var WIN16_LEAD = 1;
var WIN16_TRAIL = 5;
function window16Rects(w, h, tone = "hot", opts = {}) {
  const t = WIN16[tone];
  const out = [];
  const round = [3, 2, 1];
  const [s1, s2, s3] = WIN16.shadow;
  if (opts.shadow !== false) {
    box(out, 3, 4, w + 2, h + 2, [4, 2, 1, 1], s3);
    box(out, 2, 3, w + 2, h + 2, round, s2);
    box(out, 1, 2, w + 2, h + 2, round, s1);
  }
  box(out, 0, 0, w + 2, h + 2, round, WIN16.outline);
  box(out, 1, 1, w, h, [2, 1], t.lo);
  box(out, 1, 1, w - 1, h - 1, [2, 1], t.hi);
  box(out, 2, 2, w - 2, h - 2, [1], t.lo2);
  box(out, 2, 2, w - 3, h - 3, [1], t.hi2);
  if (opts.fill !== false) {
    const rows = h - 4;
    let start = 0;
    let color = "";
    for (let r = 0; r <= rows; r++) {
      const c = r < rows ? rampAt(t, rows > 1 ? r / (rows - 1) : 0) : "";
      if (c === color) continue;
      if (color) out.push([3, 3 + start, w - 4, r - start, color]);
      color = c;
      start = r;
    }
  }
  out.push([3, 3, w - 4, 1, WIN16.inner], [3, 4, 1, h - 5, WIN16.inner]);
  out.push([4, h - 2, w - 5, 1, WIN16.innerSoft], [w - 2, 4, 1, h - 6, WIN16.innerSoft]);
  return out;
}
function drawWindow16(ctx, x2, y, w, h, opts = {}) {
  const u = opts.unit ?? 1;
  const W = Math.max(8, Math.round(w));
  const H = Math.max(8, Math.round(h));
  const ox = Math.round(x2 / u) * u - WIN16_LEAD * u;
  const oy = Math.round(y / u) * u - WIN16_LEAD * u;
  for (const [rx, ry, rw, rh, fill] of window16Rects(W, H, opts.tone ?? "hot")) {
    ctx.fillStyle = fill;
    ctx.fillRect(ox + rx * u, oy + ry * u, rw * u, rh * u);
  }
}
var MORE = [10, 8, 6, 4, 2];
function more16Rects() {
  const out = [];
  MORE.forEach((n, r) => out.push([(10 - n) / 2 + 1, r + 1, n, 1, TEXT16.shadow]));
  MORE.forEach((n, r) => out.push([(10 - n) / 2, r, n, 1, r === 0 ? TEXT16.more : TEXT16.moreLo]));
  return out;
}
function drawMore16(ctx, x2, y, time, unit = 1) {
  const beat = time * 1.6 % 1;
  if (beat > 0.72) return;
  const dy = beat > 0.36 ? 1 : 0;
  for (const [rx, ry, rw, rh, fill] of more16Rects()) {
    ctx.fillStyle = fill;
    ctx.fillRect(x2 + rx * unit, y + (ry + dy) * unit, rw * unit, rh * unit);
  }
}
var GLOVE16 = [
  ".....kkkk.....",
  "....kwwwwkkkk.",
  ".kkkwwwwwwwwwk",
  "kwwwwwwwwwwwwk",
  "kwwwwwwkkkkkk.",
  "kwwwwwwwwk....",
  "kwwwwwwgk.....",
  "kwwwwwwwwk....",
  ".kwwwwwgk.....",
  "..kggggk......",
  "...kkkk......."
];
var HEARTS16 = {
  full: [
    "..kkkk...kkkk...",
    ".kmmppk.kppppk..",
    "kmwwpppkpppppPk.",
    "kmwpppppppppPPk.",
    "kmppppppppppPPk.",
    "kpppppppppppPPk.",
    "kppppppppppPPDk.",
    ".kpppppppppPDk..",
    "..kpppppppPDk...",
    "...kpppppPDk....",
    "....kpppPDk.....",
    ".....kpPDk......",
    "......kDk.......",
    ".......k........",
    "................",
    "................"
  ],
  half: [
    "..kkkk...kkkk...",
    ".kmmppk.kuuuuk..",
    "kmwwpppkKKKKKuk.",
    "kmwppppkKKKKKKk.",
    "kmpppppkKKKKKKk.",
    "kppppppkKKKKKKk.",
    "kppppppkKKKKKKk.",
    ".kpppppkKKKKKk..",
    "..kppppkKKKKk...",
    "...kpppkKKKk....",
    "....kppkKKk.....",
    ".....kpkKk......",
    "......kkk.......",
    ".......k........",
    "................",
    "................"
  ],
  empty: [
    "..kkkk...kkkk...",
    ".kuuuuk.kuuuuk..",
    "kuuKKKKkKKKKKuk.",
    "kuKKKKKKKKKKKKk.",
    "kuKKKKKKKKKKKKk.",
    "kKKKKKKKKKKKKKk.",
    "kKKKKKKKKKKKKKk.",
    ".kKKKKKKKKKKKk..",
    "..kKKKKKKKKKk...",
    "...kKKKKKKKk....",
    "....kKKKKKk.....",
    ".....kKKKk......",
    "......kKk.......",
    ".......k........",
    "................",
    "................"
  ]
};
function drawGlove16(ctx, x2, y, time, unit = 1) {
  const dx = Math.floor(time * 3) % 2 === 0 ? 0 : 1;
  const c = sprite(GLOVE16, INK16);
  ctx.drawImage(c, x2 + dx * unit, y, c.width * unit, c.height * unit);
}
function drawHearts16(ctx, x2, y, hp, maxHp, opts = {}) {
  const { perRow = 10, unit = 1 } = opts;
  const n = Math.ceil(maxHp / 2);
  for (let i = 0; i < n; i++) {
    const left = hp - i * 2;
    const rows = left >= 2 ? HEARTS16.full : left === 1 ? HEARTS16.half : HEARTS16.empty;
    ctx.drawImage(sprite(rows, INK16), x2 + i % perRow * 18 * unit, y + Math.floor(i / perRow) * 18 * unit, 16 * unit, 16 * unit);
  }
  return (Math.ceil(n / perRow) * 18 - 4) * unit;
}
function rectsToSvg(w, h, rects) {
  const body = rects.filter((r) => r[2] > 0 && r[3] > 0).map(([x2, y, rw, rh, f]) => `<rect x='${x2}' y='${y}' width='${rw}' height='${rh}' fill='${f}'/>`).join("");
  return `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 ${w} ${h}' shape-rendering='crispEdges'>${body}</svg>`;
}
function rowsToRects(rows, ink) {
  const out = [];
  rows.forEach((row, y) => {
    let x2 = 0;
    while (x2 < row.length) {
      const ch = row[x2];
      const s = x2;
      while (x2 < row.length && row[x2] === ch) x2++;
      if (ink[ch]) out.push([s, y, x2 - s, 1, ink[ch]]);
    }
  });
  return out;
}

// src/js/index.js
defineElements();
export {
  ABOVE,
  ABOVE16,
  ALIAS,
  ALIAS16,
  BELOW16,
  CAP16,
  COLORS,
  DUSK,
  DUSK16,
  GLOVE16,
  GLYPHS,
  GLYPHS16,
  GLYPH_H,
  HEARTS16,
  INK16,
  LINE16,
  MARKS16_ABOVE,
  MARKS16_BELOW,
  NcScene,
  NcSprite,
  PAL,
  ROLES,
  SKY,
  SPRITES,
  SUN,
  TEXT16,
  UI,
  WIN16,
  WIN16_LEAD,
  WIN16_RAMPS,
  WIN16_TRAIL,
  WINDOW,
  WINDOW_TEAL,
  bayer,
  bigTextWidth,
  contrast,
  createPixelStage,
  defineElements,
  disc,
  ditherGradient,
  drawBanner,
  drawBigText,
  drawBox,
  drawDialog,
  drawDrift,
  drawGlove16,
  drawHearts,
  drawHearts16,
  drawMeter,
  drawMore16,
  drawStars,
  drawText,
  drawText16,
  drawWindow,
  drawWindow16,
  epx,
  five,
  glowSprite,
  glyphAbove,
  glyphExtra16,
  glyphRows,
  glyphRows16,
  hash2,
  makeCanvas,
  mix,
  more16Rects,
  noise1,
  paintBands,
  paintBeach,
  paintClouds16,
  paintGlints16,
  paintGrass,
  paintHeadland,
  paintHouse,
  paintLamp,
  paintPalm,
  paintReflection,
  paintRidge,
  paintRidge16,
  paintSea,
  paintSea16,
  paintSky,
  paintSky16,
  paintSun,
  paintSun16,
  paintTreeLine,
  parseRows,
  pixelRatio,
  pixelize,
  put,
  putC,
  quantize15,
  ramp15,
  ramp5,
  rampAt,
  readableFrom,
  rect,
  rectsToSvg,
  relight,
  rowsToRects,
  scale2x,
  selout,
  seloutPixels,
  shade,
  silhouette,
  sprite,
  textWidth,
  textWidth16,
  window16Rects,
  wrapText,
  wrapText16
};
