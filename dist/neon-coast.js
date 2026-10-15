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
  function light(x, y, r, color, a = 1) {
    let L = pool[lights.length];
    if (!L) {
      L = { x, y, r, color, a };
      pool.push(L);
    } else {
      L.x = x;
      L.y = y;
      L.r = r;
      L.color = color;
      L.a = a;
    }
    lights.push(L);
  }
  function emit(x, y, w, h) {
    emits.push(x, y, w, h);
  }
  function emitImage(img, x = 0, y = 0) {
    emitImgs.push({ img, x, y });
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
  "box-rule": "rgba(47, 243, 255, 0.35)"
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
      for (let x = 0; x < w; x++) {
        const ch = row[x];
        if (ch === "." || ch === " ") continue;
        const col = pal?.[ch] ?? PAL[ch];
        if (!col) continue;
        g.fillStyle = col;
        g.fillRect(flip ? w - 1 - x : x, y, 1, 1);
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
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const ch = rows[y][x];
      if (ch !== "." && ch !== " ") g.fillRect(x, y, 1, 1);
    }
    return c;
  });
}
function put(g, c, x, y) {
  g.drawImage(c, Math.round(x), Math.round(y));
}
function putC(g, c, x, y) {
  g.drawImage(c, Math.round(x - c.width / 2), Math.round(y - c.height / 2));
}
function shade(rows, body, hi, lo, outline = "k") {
  const h = rows.length;
  const w = rows[0].length;
  const on = (x, y) => y >= 0 && y < h && x >= 0 && x < w && rows[y][x] !== "." && rows[y][x] !== " ";
  const out = [];
  for (let y = -1; y <= h; y++) {
    let line = "";
    for (let x = -1; x <= w; x++) {
      if (on(x, y)) {
        const ch = rows[y][x];
        if (ch !== "X") line += ch;
        else if (!on(x, y - 1)) line += hi;
        else if (!on(x, y + 1)) line += lo;
        else line += body;
      } else if (on(x - 1, y) || on(x + 1, y) || on(x, y - 1) || on(x, y + 1)) line += outline;
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
  const open = (x, y) => y < 0 || src[y][x] === "." || src[y][x] === "k";
  return src.map((row, y) => row.map((ch, x) => ch !== "." && ch !== "k" && open(x, y - 1) ? LIGHTER[ch] ?? ch : ch).join(""));
}
var BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
function bayer(x, y) {
  return (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16;
}
function mix(a, b, t) {
  const pa = parseInt(a.slice(1, 7), 16);
  const pb = parseInt(b.slice(1, 7), 16);
  const ch = (s) => {
    const x = pa >> s & 255;
    const y = pb >> s & 255;
    return Math.round(x + (y - x) * t);
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
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
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
  const on = (x, y) => y >= 0 && y < h && x >= 0 && x < w && grid[y][x] !== ".";
  const out = [];
  for (let y = -1; y <= h; y++) {
    let line = "";
    for (let x = -1; x <= w; x++) {
      if (on(x, y)) line += grid[y][x];
      else line += on(x - 1, y) || on(x + 1, y) || on(x, y - 1) || on(x, y + 1) ? "k" : ".";
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
function hash2(x, y, salt = 0) {
  let h = x * 374761393 + y * 668265263 + salt * 2246822519 | 0;
  h = Math.imul(h ^ h >>> 13, 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
function noise1(x, c, salt = 0) {
  const gx = Math.floor(x / c);
  const f = x / c - gx;
  const s = f * f * (3 - 2 * f);
  const a = hash2(gx, 0, salt);
  const b = hash2(gx + 1, 0, salt);
  return a + (b - a) * s;
}
function rect(g, c, x, y, w = 1, h = 1) {
  g.fillStyle = c;
  g.fillRect(x, y, w, h);
}
function disc(g, c, cx, cy, rad) {
  g.fillStyle = c;
  for (let y = -rad; y <= rad; y++) {
    const half = Math.floor(Math.sqrt(rad * rad - y * y + rad * 0.8));
    g.fillRect(Math.round(cx - half), Math.round(cy + y), half * 2 + 1, 1);
  }
}
function ditherGradient(g, x, y0, w, y1, stops) {
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
      rect(g, a, x, y0 + y, w, 1);
      continue;
    }
    if (d >= 16 / 17) {
      rect(g, b, x, y0 + y, w, 1);
      continue;
    }
    rect(g, a, x, y0 + y, w, 1);
    g.fillStyle = b;
    for (let px = 0; px < w; px++) if (bayer(x + px, y0 + y) < d) g.fillRect(x + px, y0 + y, 1, 1);
  }
}
function paintSky(g, w, horizon, warm = true) {
  ditherGradient(g, 0, 0, w, horizon, warm ? SKY.slice(0, 7) : SKY.slice(0, 5));
}
function drawStars(g, w, maxY, time, density = 1, salt = 11) {
  const n = Math.floor(w * maxY / 260 * density);
  for (let i = 0; i < n; i++) {
    const x = Math.floor(hash2(i, 1, salt) * w);
    const y = Math.floor(Math.pow(hash2(i, 2, salt), 1.6) * maxY);
    const tw = hash2(i, 3, salt);
    const phase = Math.sin(time * (1.5 + tw * 3) + i);
    if (tw > 0.85) {
      rect(g, phase > 0.3 ? DUSK.starHi : DUSK.star, x, y);
      if (phase > 0.6) {
        rect(g, DUSK.star, x - 1, y);
        rect(g, DUSK.star, x + 1, y);
        rect(g, DUSK.star, x, y - 1);
        rect(g, DUSK.star, x, y + 1);
      }
    } else if (tw > 0.4 || phase > -0.5) {
      rect(g, tw > 0.65 ? DUSK.star : DUSK.starDim, x, y);
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
  for (let x = 0; x < w; x++) {
    const n = noise1(x, 38, salt) * 0.6 + noise1(x, 13, salt + 7) * 0.3 * (1 + sharp) + noise1(x, 5, salt + 3) * 0.1 * sharp;
    const top = Math.round(base - n * height);
    rect(g, body, x, top, 1, bottom - top);
    rect(g, rim, x, top, 1, 1);
    if (prev >= 0 && Math.abs(top - prev) > 1) rect(g, rim, x, Math.min(top, prev), 1, Math.abs(top - prev));
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
    const x = x0 + i;
    rect(g, body, x, top, 1, base - top);
    rect(g, rim, x, top, 1, 1);
    if (prev >= 0 && Math.abs(top - prev) > 1) rect(g, rim, x, Math.min(top, prev), 1, Math.abs(top - prev));
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
    for (let x = -step; x < w + step; x += step) {
      const wx = x0 + x + (drift + Math.floor(hash2(x, y, salt) * step)) % step;
      if (hash2(x, y, salt + 1) < 0.45) continue;
      rect(g, DUSK.wave, wx, y, len, 1);
    }
  }
  if (sunX != null) paintReflection(g, top, bottom, sunX, sunW, time, salt);
  const n = Math.floor(w * h / 90);
  for (let i = 0; i < n; i++) {
    const tw = hash2(i, 7, salt);
    if (Math.sin(time * (1 + tw * 2) + i * 1.7) < 0.55) continue;
    const x = x0 + Math.floor(hash2(i, 5, salt) * w);
    const y = top + 2 + Math.floor(hash2(i, 6, salt) * (h - 2));
    rect(g, DUSK.foam, x, y, tw > 0.7 ? 2 : 1, 1);
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
  for (let y = top + 3; y < bottom; y += 3) for (let x = x0; x < x0 + w; x += 4) {
    const n = hash2(Math.floor(x / 4), Math.floor(y / 3), salt);
    if (n > 0.72) rect(g, DUSK.sandL, x, y, 4, 2);
    else if (n < 0.2) rect(g, DUSK.sandD, x, y, 4, 2);
  }
  const swell = Math.sin(time * 0.9) * 0.5 + 0.5;
  for (let x = x0; x < x0 + w; x++) {
    const n = noise1(x, 11, salt);
    const reach = Math.round(1 + n * 3 + swell * 2);
    rect(g, DUSK.sandW, x, top, 1, reach + 1);
    rect(g, DUSK.foam, x, top + reach, 1, 1);
    if (noise1(x + Math.floor(time * 3), 5, salt + 2) > 0.6) rect(g, "#ffffff", x, top + reach, 1, 1);
  }
}
function paintPalm(g, x, baseY, h, lean = 4, light = 1, time = 0) {
  const top = baseY - h;
  let tx = x;
  for (let y = baseY; y > top; y--) {
    const t = (baseY - y) / h;
    tx = Math.round(x + lean * t * t);
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
  for (let x = x0 - size; x < x0 + w + size; x += step) {
    const r = Math.round(size * (0.75 + hash2(x, 0, salt) * 0.5));
    trees.push({ x: x + Math.floor(hash2(x, 1, salt) * step * 0.5), r, lift: Math.floor(hash2(x, 2, salt) * size * 0.8) });
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
function paintHouse(g, x, baseY, w, h, salt = 0) {
  const roofH = Math.max(4, Math.round(h * 0.45));
  const wallTop = baseY - (h - roofH);
  rect(g, DUSK.wall, x, wallTop, w, baseY - wallTop);
  for (let i = 2; i < w; i += 4) rect(g, DUSK.wallD, x + i, wallTop, 1, baseY - wallTop);
  rect(g, DUSK.wallD, x, wallTop, w, 2);
  rect(g, DUSK.wallD, x, wallTop, 1, baseY - wallTop);
  rect(g, DUSK.wallD, x + w - 1, wallTop, 1, baseY - wallTop);
  for (let y = 0; y < roofH; y++) {
    const inset = Math.round((roofH - y) * 0.9) - 1;
    const rx = x - 2 + inset;
    const rw = w + 4 - inset * 2;
    const yy = wallTop - roofH + y;
    rect(g, y % 3 === 2 ? DUSK.roofD : DUSK.roof, rx, yy, rw, 1);
    if (y % 3 === 0) for (let i = y % 2 * 2; i < rw; i += 4) rect(g, DUSK.roofL, rx + i, yy, 2, 1);
    rect(g, DUSK.roofHi, rx, yy, 1, 1);
  }
  rect(g, DUSK.roofHi, x - 1 + Math.round(roofH * 0.9), wallTop - roofH, Math.max(1, w + 2 - Math.round(roofH * 1.8)), 1);
  const wins = [];
  const wy = wallTop + 3;
  const n = Math.max(1, Math.floor((w - 4) / 7));
  for (let i = 0; i < n; i++) {
    if (hash2(x, i, salt) < 0.3) continue;
    const wx = x + 3 + i * 7;
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
  for (let y = top; y < bottom; y += 3) for (let x = x0; x < x0 + w; x += 4) {
    const n = hash2(Math.floor(x / 4), Math.floor(y / 3), salt);
    if (n > 0.78) rect(g, DUSK.g1, x, y, 4, 3);
    else if (n < 0.18) rect(g, DUSK.g2, x, y, 4, 3);
  }
  for (let x = x0; x < x0 + w; x += 3) {
    if (hash2(x, 5, salt) < 0.45) continue;
    const y = top + 1 + Math.floor(hash2(x, 6, salt) * Math.max(1, bottom - top - 4));
    rect(g, DUSK.blade, x, y + 1, 1, 2);
    rect(g, DUSK.tip, x + 1, y, 1, 2);
    if (hash2(x, 7, salt) > 0.96) rect(g, "#ff8ae0", x + 2, y, 1, 1);
  }
  rect(g, DUSK.tip, x0, top, w, 1);
  rect(g, DUSK.g3, x0, top + 1, w, 1);
}
function paintLamp(g, x, baseY, h, color) {
  rect(g, "#140a22", x - 1, baseY - 2, 3, 2);
  rect(g, "#140a22", x, baseY - h, 1, h);
  rect(g, "#3a2a5a", x, baseY - h, 1, h - 2);
  rect(g, "#140a22", x - 2, baseY - h - 3, 5, 3);
  rect(g, color, x - 1, baseY - h - 2, 3, 2);
  rect(g, "#ffffff", x, baseY - h - 2, 1, 1);
  return { x: x + 0.5, y: baseY - h - 1 };
}

// src/js/elements.js
var Base = (
  /** @type {typeof HTMLElement} */
  typeof HTMLElement === "undefined" ? class {
  } : HTMLElement
);
var ctx2d3 = (c) => (
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
    paintSky(ctx2d3(back), w, horizon + 1);
    const front = makeCanvas(w, h);
    const f = ctx2d3(front);
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
    paintSky(ctx2d3(back), w, horizon + 1);
    const front = makeCanvas(w, h);
    const f = ctx2d3(front);
    const sun = sunX == null ? null : sunLayer(w, horizon, sunX, r);
    if (sun) f.drawImage(sun, 0, 0);
    paintRidge(f, w, horizon, Math.round(h * 0.18), ground, DUSK.ridgeFar, DUSK.ridgeFarRim, 2, 0.6);
    paintRidge(f, w, horizon + Math.round(h * 0.06), Math.round(h * 0.1), ground, DUSK.ridge, DUSK.ridgeRim, 5, 0.3);
    paintTreeLine(f, 0, w, ground, Math.max(5, Math.round(h * 0.045)), 5);
    const glows = [];
    const step = Math.max(34, Math.round(h * 0.3));
    for (let x = 6, i = 0; x < w - 20; x += step, i++) {
      const hw = 22 + i % 3 * 6;
      const hh = Math.round(h * 0.15) + i % 2 * 4;
      for (const win of paintHouse(f, x, ground, hw, hh, i)) glows.push({ ...win, c: DUSK.window, r: 9 });
      const lampX = x + hw + Math.round((step - hw) / 2);
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
    paintSky(ctx2d3(back), w, horizon + 1);
    const front = makeCanvas(w, h);
    const f = ctx2d3(front);
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
    const b = ctx2d3(back);
    paintSky(b, w, horizon + 1);
    rect(b, DUSK.ridge, 0, horizon + 1, w, h - horizon);
    const front = makeCanvas(w, h);
    const f = ctx2d3(front);
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
function sunLayer(w, horizon, cx, r) {
  const c = makeCanvas(w, horizon + 1);
  paintSun(ctx2d3(c), cx, horizon - Math.round(r * 0.55), r);
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
    return ["scene", "pixels", "horizon", "sun", "still", "bare"];
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
    return n >= 32 ? Math.round(n) : 180;
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
      const box = this.getBoundingClientRect();
      if (box.width < 1 || box.height < 1) return;
      stage.resize(box.width, box.height, devicePixelRatio, 1, this._pixels());
      const sunAttr = this.getAttribute("sun");
      const sunX = sunAttr === "none" ? null : clamp01(Number(sunAttr ?? 0.5), 0.5);
      const horizon = Math.min(0.85, Math.max(0.3, clamp01(Number(this.getAttribute("horizon") ?? 0.6), 0.6)));
      const make = SCENES[this.getAttribute("scene") ?? "coast"] ?? SCENES.coast;
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
    drawStars(g, stage.vw, Math.max(4, L.horizon - 6), t, 1, 11);
    g.drawImage(L.front, 0, 0);
    L.live(g, t, stage);
    if (L.sun) stage.emitImage(L.sun);
    const bare = this.hasAttribute("bare");
    const glow = L.glow;
    stage.present({
      ambient: bare ? null : "#b0a4dc",
      bloom: bare ? 0 : 1,
      overlay: !bare,
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
    return ["name", "scale", "colors", "shade", "flip", "label"];
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
    canvas.width = w;
    canvas.height = h;
    canvas.style.width = `${w * scale}px`;
    canvas.style.height = `${h * scale}px`;
    const g = ctx2d3(canvas);
    g.clearRect(0, 0, w, h);
    g.drawImage(sprite(rows, parseColors(this.getAttribute("colors")), this.hasAttribute("flip")), 0, 0);
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
function drawText(ctx, text, x, y, color, shadow) {
  drawBigText(ctx, text, x, y, 1, color, shadow);
}
function drawBigText(ctx, text, x, y, n, color, shadow) {
  const t = text.toUpperCase();
  const pass = (ox, oy, fill) => {
    ctx.fillStyle = fill;
    let cx = x + ox;
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
function drawBox(g, x, y, w, h, opts = {}) {
  const { edge = COLORS.cyan, fill = UI.surface, rule = true } = opts;
  g.fillStyle = fill;
  g.fillRect(x, y, w, h);
  g.fillStyle = edge;
  g.fillRect(x + 1, y, w - 2, 1);
  g.fillRect(x + 1, y + h - 1, w - 2, 1);
  g.fillRect(x, y + 1, 1, h - 2);
  g.fillRect(x + w - 1, y + 1, 1, h - 2);
  if (rule) {
    g.fillStyle = UI["box-rule"];
    g.fillRect(x + 2, y + 2, w - 4, 1);
  }
}
function drawDialog(g, text, x, y, w, opts = {}) {
  const { chars = Infinity, more = false, time = 0, edge = COLORS.pink } = opts;
  const lines = wrapText(text, w - 16);
  const h = lines.length * (GLYPH_H + 4) + 12;
  drawBox(g, x, y, w, h, { edge });
  let left = Math.floor(chars);
  lines.forEach((line, i) => {
    const shown = line.slice(0, Math.max(0, left));
    left -= line.length + 1;
    drawText(g, shown, x + 8, y + 7 + i * (GLYPH_H + 4), COLORS.white, COLORS.plum);
  });
  if (more && chars >= text.length && Math.floor(time * 3) % 2 === 0) {
    g.fillStyle = COLORS.cyan;
    g.fillRect(x + w - 11, y + h - 7, 5, 1);
    g.fillRect(x + w - 10, y + h - 6, 3, 1);
    g.fillRect(x + w - 9, y + h - 5, 1, 1);
  }
  return h;
}
function drawBanner(g, text, cx, y, alpha = 1) {
  if (alpha <= 0) return;
  const w = textWidth(text);
  const x = Math.round(cx - w / 2);
  g.globalAlpha = Math.min(1, alpha);
  g.fillStyle = "rgba(11,6,22,0.6)";
  g.fillRect(x - 8, y - 5, w + 16, GLYPH_H + 10);
  drawText(g, text, x, y, COLORS.white, COLORS.pink);
  g.fillStyle = COLORS.cyan;
  g.fillRect(x - 8, y - 5, w + 16, 1);
  g.fillStyle = COLORS.pink;
  g.fillRect(x - 8, y + GLYPH_H + 4, w + 16, 1);
  g.globalAlpha = 1;
}
function drawMeter(g, x, y, value, opts = {}) {
  const { cells = 12, cell = 3, gap = 1, h = 3, color = COLORS.pink, empty = COLORS.dusk } = opts;
  const lit = Math.floor(Math.max(0, Math.min(1, value)) * cells + 1e-9);
  const w = cells * (cell + gap) - gap + 2;
  g.fillStyle = COLORS.ink;
  g.fillRect(x, y, w, h + 2);
  for (let i = 0; i < cells; i++) {
    g.fillStyle = i < lit ? color : empty;
    g.fillRect(x + 1 + i * (cell + gap), y + 1, cell, h);
  }
  return w;
}
function drawHearts(g, x, y, hp, maxHp, perRow = 10) {
  const n = Math.ceil(maxHp / 2);
  for (let i = 0; i < n; i++) {
    const left = hp - i * 2;
    const rows = left >= 2 ? SPRITES.heart : left === 1 ? SPRITES["heart-half"] : SPRITES["heart-empty"];
    g.drawImage(sprite(rows), x + i % perRow * 9, y + Math.floor(i / perRow) * 9);
  }
  return Math.ceil(n / perRow) * 9 - 2;
}

// src/js/index.js
defineElements();
export {
  ABOVE,
  ALIAS,
  COLORS,
  DUSK,
  GLYPHS,
  GLYPH_H,
  NcScene,
  NcSprite,
  PAL,
  ROLES,
  SKY,
  SPRITES,
  SUN,
  UI,
  bayer,
  bigTextWidth,
  createPixelStage,
  defineElements,
  disc,
  ditherGradient,
  drawBanner,
  drawBigText,
  drawBox,
  drawDialog,
  drawHearts,
  drawMeter,
  drawStars,
  drawText,
  glowSprite,
  glyphAbove,
  glyphRows,
  hash2,
  makeCanvas,
  mix,
  noise1,
  paintBeach,
  paintGrass,
  paintHeadland,
  paintHouse,
  paintLamp,
  paintPalm,
  paintReflection,
  paintRidge,
  paintSea,
  paintSky,
  paintSun,
  paintTreeLine,
  parseRows,
  pixelRatio,
  pixelize,
  put,
  putC,
  rect,
  relight,
  shade,
  silhouette,
  sprite,
  textWidth,
  wrapText
};
