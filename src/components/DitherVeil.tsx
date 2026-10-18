"use client";

/* ─── DitherVeil ───
   A pointer-driven dither veil: the artwork sits behind a two-tone, pixel-grid
   halftone, and the untouched photograph is revealed along the path of the cursor
   (a "brush" that keeps its memory for `linger` seconds) plus an optional shockwave
   on click.

   Ported from the ReactBits component of the same name, with the behaviour intact and
   three local additions: `alignX` (so the sampler can match a CSS `object-position`),
   a canvas that stays invisible until the artwork has decoded, and an `onerror` that
   keeps it that way. Two render passes per frame:

     1. mask  — a small half-resolution target that only ever accumulates the brush
                trail: last frame is faded by `uFade`, the new stroke is stamped on
                top. Kept on the GPU so the trail costs one fullscreen triangle.
     2. view  — the dithered poster itself. Ordered patterns (bayer/noise/lines) are
                pure shader work; error-diffusion kernels (floyd/atkinson) cannot be,
                so they run once on the CPU into a small texture and are only
                recomputed when a key below changes.

   The loop is demand-driven: it renders while the pointer is over the canvas, while
   a burst or the intro is running, and until the trail has faded out — otherwise the
   rAF chain ends and the canvas costs nothing. */

import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import { Renderer, Program, Mesh, Triangle, Texture, RenderTarget } from "ogl";

type Pattern = "bayer" | "noise" | "atkinson" | "floyd" | "lines";
type Palette = "duotone" | "rgb";
type Fit = "contain" | "cover";
type Kernel = [number, number, number][];
type Rgb = [number, number, number];

export interface DitherVeilProps {
  src?: string;
  fit?: Fit;
  /** 0–1, same scale and meaning as CSS `object-position` on the x axis: the share of
      the crop taken off the left edge. 0.5 is centred. */
  alignX?: number;
  pattern?: Pattern;
  pixelSize?: number;
  levels?: number;
  palette?: Palette;
  inkColor?: string;
  paperColor?: string;
  contrast?: number;
  brightness?: number;
  revealRadius?: number;
  softness?: number;
  linger?: number;
  rimColor?: string;
  rim?: number;
  /** Only let the print land where the artwork itself is at least this bright, fading in
      over the next five times that (0.01 → full at 0.06). 0, the default, prints over the
      whole frame — including the flat blacks, where ink marked onto nothing reads as
      noise. Raise it to keep the effect on the parts of the picture that are actually lit. */
  printFloor?: number;
  reverse?: boolean;
  wander?: boolean;
  /** Where the autonomous drift is centred, how far it reaches and how fast it runs
      (1 = the component's own pace), in UV of the box with y down. Move the path onto
      the lit part of a picture: ink printed onto black shows as nothing. */
  wanderCenter?: [number, number];
  wanderSpan?: [number, number];
  wanderSpeed?: number;
  /** Gives that drift a second stop: the x keeps sweeping but the y walks
      `wanderCenter[1]` and lifts `wanderSpan[1]` above it wherever x comes within
      `wanderRise[1]` of `wanderRise[0]` in UV — for a second lit patch that stands
      above the main one. */
  wanderRise?: [number, number];
  clickBurst?: boolean;
  className?: string;
  style?: CSSProperties;
}

/* `wanderRise` stays optional through the resolved settings: absent means there is no
   second stop to visit, which is a mode rather than a value the loop needs filled in. */
type Settings = Required<Omit<DitherVeilProps, "src" | "className" | "style" | "wanderRise">> & {
  wanderRise?: [number, number];
};

const DEFAULT_SRC =
  "https://images.unsplash.com/photo-1737071371043-761e02b1ef95?q=80&w=1400&auto=format&fit=crop";

/* 0/1/2 are the pure-shader thresholds, 3 means "read the CPU-diffused texture". */
const ORDERED: Record<string, number> = { bayer: 0, noise: 1, lines: 2 };

const KERNELS: Record<string, Kernel> = {
  atkinson: [
    [1, 0, 1 / 8],
    [2, 0, 1 / 8],
    [-1, 1, 1 / 8],
    [0, 1, 1 / 8],
    [1, 1, 1 / 8],
    [0, 2, 1 / 8],
  ],
  floyd: [
    [1, 0, 7 / 16],
    [-1, 1, 3 / 16],
    [0, 1, 5 / 16],
    [1, 1, 1 / 16],
  ],
};

const MASK_SCALE = 0.5;
const MAX_BURSTS = 4;
const BURST_SECONDS = 1.2;
const HOLD = 1.6;
const INTRO_MS = 1100;
/* Autonomous drift is slow, so half the display's refresh rate is indistinguishable from
   it while it halves the work: without this, `wander` turns the demand-driven loop into a
   permanent 60fps one. */
const WANDER_FRAME_MS = 1000 / 30;

const hexToRgb = (hex: string): Rgb => {
  let h = String(hex || "").replace("#", "");
  if (h.length === 3) h = h.replace(/./g, (c) => c + c);
  const n = parseInt(h.slice(0, 6), 16);
  return Number.isNaN(n)
    ? [0, 0, 0]
    : [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

/* UV scale that maps the box back onto the image: >1 zooms in (cover), <1 hands the
   image a margin and lets the matte fill the rest (contain). */
const fitScale = (w: number, h: number, iw: number, ih: number, contain: boolean): [number, number] => {
  const ratio = w / h / (iw / ih);
  if (contain) return ratio > 1 ? [ratio, 1] : [1, 1 / ratio];
  return ratio > 1 ? [1, 1 / ratio] : [ratio, 1];
};

/* Where `wander` drifts when the pointer is away: a lissajous around `center` reaching
   `span` from it, in UV of the box. The defaults are the component's own path — the
   middle of the frame, 0.41 × 0.35 either side — and the two weights below are what
   make `span` the outermost excursion rather than an amplitude.

   `rise` gives the path a second home: the x keeps sweeping, but the y stops swinging
   and walks `center[1]` instead, lifting `span[1]` above that line — and back down —
   wherever x is within `rise[1]` of `rise[0]`. That is how a lit patch standing above
   the main one (dancers over a crowd) gets visited now and then without the brush
   spending the rest of its time crossing the dark in between. cos² so it arrives at the
   top and leaves it without a kink in the path. */
const wanderAt = (
  t: number,
  w: number,
  h: number,
  center: [number, number],
  span: [number, number],
  rise?: [number, number]
): [number, number] => {
  const x = w * (center[0] + span[0] * (0.8 * Math.sin(t * 0.53) + 0.2 * Math.sin(t * 1.31 + 0.6)));
  if (rise) {
    const u = Math.min(1, Math.max(-1, (x / w - rise[0]) / Math.max(1e-3, rise[1])));
    const bell = Math.cos((Math.PI / 2) * u) ** 2;
    return [x, h * (center[1] - span[1] * bell)];
  }
  return [x, h * (center[1] + span[1] * (0.8 * Math.sin(t * 0.71 + 1.1) + 0.2 * Math.cos(t * 1.57)))];
};

/* The border ring of a 32×32 downscale tells us two things: how flat the edges are
   (a poster on a plain background should keep that background as paper) and whether
   the image is a cut-out at all — see `uKey` in the fragment shader. */
const measureEdge = (
  context: CanvasRenderingContext2D,
  image: HTMLImageElement
): { matte: Rgb; plain: boolean } => {
  const size = 32;
  context.canvas.width = size;
  context.canvas.height = size;
  context.drawImage(image, 0, 0, size, size);
  const data = context.getImageData(0, 0, size, size).data;
  const sum = [0, 0, 0];
  const squares = [0, 0, 0];
  let count = 0;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (x > 0 && y > 0 && x < size - 1 && y < size - 1) continue;
      for (let c = 0; c < 3; c++) {
        const v = data[(y * size + x) * 4 + c] / 255;
        sum[c] += v;
        squares[c] += v * v;
      }
      count++;
    }
  }
  const matte: Rgb = [sum[0] / count, sum[1] / count, sum[2] / count];
  const spread =
    matte.reduce((total, mean, c) => total + Math.sqrt(Math.max(0, squares[c] / count - mean * mean)), 0) / 3;
  return { matte, plain: spread < 0.06 };
};

/* A 64×64 blue noise tile for the `noise` pattern, built once on the main thread with
   the classic void-and-cluster relaxation. Cheap enough (4096 pixels) to run lazily,
   and cached for the lifetime of the module. */
let blueNoise: Uint8Array | null = null;

const getBlueNoise = (): Uint8Array => {
  if (blueNoise) return blueNoise;
  const size = 64;
  const n = size * size;
  const wrap = size - 1;
  const taps: number[] = [];
  for (let dy = -6; dy <= 6; dy++) {
    for (let dx = -6; dx <= 6; dx++) taps.push(dx, dy, Math.exp(-(dx * dx + dy * dy) / 4.5));
  }
  const energy = new Float32Array(n);
  const on = new Uint8Array(n);
  const splat = (i: number, sign: number) => {
    const x = i % size;
    const y = (i - x) / size;
    for (let k = 0; k < taps.length; k += 3) {
      energy[((y + taps[k + 1]) & wrap) * size + ((x + taps[k]) & wrap)] += sign * taps[k + 2];
    }
  };
  const find = (state: number, highest: boolean) => {
    let best = 0;
    let value = highest ? -Infinity : Infinity;
    for (let i = 0; i < n; i++) {
      if (on[i] !== state) continue;
      if (highest ? energy[i] > value : energy[i] < value) {
        value = energy[i];
        best = i;
      }
    }
    return best;
  };
  let seed = 7;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const initial = Math.round(n * 0.1);
  for (let placed = 0; placed < initial; ) {
    const i = Math.floor(random() * n);
    if (on[i]) continue;
    on[i] = 1;
    splat(i, 1);
    placed++;
  }
  for (let guard = 0; guard < n; guard++) {
    const cluster = find(1, true);
    on[cluster] = 0;
    splat(cluster, -1);
    const gap = find(0, false);
    on[gap] = 1;
    splat(gap, 1);
    if (gap === cluster) break;
  }
  const seedOn = on.slice();
  const seedEnergy = energy.slice();
  const rank = new Uint16Array(n);
  for (let r = initial - 1; r >= 0; r--) {
    const cluster = find(1, true);
    on[cluster] = 0;
    splat(cluster, -1);
    rank[cluster] = r;
  }
  on.set(seedOn);
  energy.set(seedEnergy);
  for (let r = initial; r < n; r++) {
    const gap = find(0, false);
    on[gap] = 1;
    splat(gap, 1);
    rank[gap] = r;
  }
  const data = new Uint8Array(n * 4);
  for (let i = 0; i < n; i++) {
    const v = Math.floor((rank[i] / n) * 256);
    data[i * 4] = v;
    data[i * 4 + 1] = v;
    data[i * 4 + 2] = v;
    data[i * 4 + 3] = 255;
  }
  blueNoise = data;
  return data;
};

/* Error diffusion, serpented row by row so the worm artefacts do not line up.
   Runs over the *cell grid* (screen pixels / pixelSize), never the full image. */
const diffuse = (
  pixels: Uint8ClampedArray,
  cols: number,
  rows: number,
  kernel: Kernel,
  levels: number,
  rgb: boolean,
  grade: (v: number) => number
): Uint8Array => {
  const channels = rgb ? 3 : 1;
  const values = new Float32Array(cols * rows * channels);
  for (let i = 0; i < cols * rows; i++) {
    const r = pixels[i * 4] / 255;
    const g = pixels[i * 4 + 1] / 255;
    const b = pixels[i * 4 + 2] / 255;
    if (rgb) {
      values[i * 3] = grade(r);
      values[i * 3 + 1] = grade(g);
      values[i * 3 + 2] = grade(b);
    } else {
      values[i] = grade(0.2126 * r + 0.7152 * g + 0.0722 * b);
    }
  }
  const steps = levels - 1;
  const out = new Uint8Array(cols * rows * 4);
  for (let y = 0; y < rows; y++) {
    const dir = y & 1 ? -1 : 1;
    for (let i = 0; i < cols; i++) {
      const x = dir > 0 ? i : cols - 1 - i;
      const p = y * cols + x;
      for (let c = 0; c < channels; c++) {
        const old = values[p * channels + c];
        const q = Math.min(steps, Math.max(0, Math.round(old * steps))) / steps;
        const err = old - q;
        const byte = Math.round(q * 255);
        if (rgb) out[p * 4 + c] = byte;
        else out[p * 4] = out[p * 4 + 1] = out[p * 4 + 2] = byte;
        for (let k = 0; k < kernel.length; k++) {
          const nx = x + kernel[k][0] * dir;
          const ny = y + kernel[k][1];
          if (nx < 0 || nx >= cols || ny >= rows) continue;
          values[(ny * cols + nx) * channels + c] += err * kernel[k][2];
        }
      }
      out[p * 4 + 3] = 255;
    }
  }
  return out;
};

const vertex = `#version 300 es
in vec2 position;
in vec2 uv;
out vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

/* Pass 1. One channel of state: how strongly every texel is "revealed". `uFade` is the
   per-frame leak that makes the trail disappear after `linger` seconds, `uSoftness` the
   width of the stamp's falloff, `uHold` a constant the view pass divides out again. */
const maskFragment = `#version 300 es
precision highp float;

uniform sampler2D tPrev;
uniform vec2 uSize;
uniform vec2 uFrom;
uniform vec2 uTo;
uniform float uRadius;
uniform float uSoftness;
uniform float uStrength;
uniform float uFade;
uniform float uHold;

in vec2 vUv;
out vec4 fragColor;

float strokeDistance(vec2 p, vec2 a, vec2 b) {
  vec2 ab = b - a;
  float h = clamp(dot(p - a, ab) / max(dot(ab, ab), 0.0001), 0.0, 1.0);
  return length(p - a - ab * h);
}

void main() {
  vec2 p = vec2(vUv.x, 1.0 - vUv.y) * uSize;
  float trail = max(texture(tPrev, vUv).r - uFade, 0.0);
  float band = max(uRadius * uSoftness, 1.0) * uHold;
  float d = strokeDistance(p, uFrom, uTo);
  trail = max(trail, clamp((uRadius - d) / band, 0.0, 1.0) * uStrength);
  fragColor = vec4(trail, 0.0, 0.0, 1.0);
}
`;

/* Pass 2. The poster itself.
     - `level` is the quantised brightness: either an ordered threshold (bayer/blue
       noise/engraving lines) or the CPU-diffused texel.
     - `mask` is the reveal, and `shown` lets `reverse` swap which side of it wins.
     - the rim (off by default) paints a bayer-ordered outline one step ahead of the
       reveal, so the wave has an edge instead of a hard cut.
     - `uKey` is the "cut-out" switch: when the artwork's own edges are flat, that flat
       colour is kept as paper instead of being dithered into the picture. */
const viewFragment = `#version 300 es
precision highp float;
precision highp int;

uniform sampler2D tImage;
uniform sampler2D tMask;
uniform sampler2D tNoise;
uniform sampler2D tDiffused;
uniform vec2 uResolution;
uniform vec2 uCover;
uniform float uShift;
uniform float uLod;
uniform float uCell;
uniform int uPattern;
uniform int uPalette;
uniform float uLevels;
uniform vec3 uInk;
uniform vec3 uPaper;
uniform vec3 uRimColor;
uniform float uRim;
uniform float uContrast;
uniform float uBrightness;
uniform float uReverse;
uniform float uFloor;
uniform float uIntro;
uniform float uHold;
uniform vec3 uMatte;
uniform float uKey;
uniform vec2 uSize;
uniform vec4 uBursts[4];
uniform float uBurstWidth;

in vec2 vUv;
out vec4 fragColor;

float bayer(vec2 cell) {
  ivec2 p = ivec2(mod(cell, 8.0));
  int v = p.x ^ p.y;
  int m = ((v & 1) << 5) | ((p.y & 1) << 4) | ((v & 2) << 2) | ((p.y & 2) << 1) | ((v & 4) >> 1) | ((p.y & 4) >> 2);
  return (float(m) + 0.5) / 64.0;
}

float blueNoise(vec2 cell) {
  return (texelFetch(tNoise, ivec2(mod(cell, 64.0)), 0).r * 255.0 + 0.5) / 256.0;
}

float engraving(vec2 cell) {
  float period = 6.0;
  float f = (mod(cell.x + cell.y, period) + 0.5) / period;
  return clamp(abs(f * 2.0 - 1.0) + (bayer(cell) - 0.5) * (2.0 / period), 0.0, 1.0);
}

vec2 imageUv(vec2 uv) {
  return (uv - 0.5) * uCover + 0.5 + uShift;
}

float within(vec2 p) {
  vec2 s = step(vec2(0.0), p) * step(p, vec2(1.0));
  return s.x * s.y;
}

vec3 grade(vec3 c) {
  return pow(clamp((c - 0.5) * uContrast + 0.5 + uBrightness, 0.0, 1.0), vec3(1.6));
}

float shockwave(vec2 p) {
  float value = 0.0;
  for (int i = 0; i < 4; i++) {
    vec4 burst = uBursts[i];
    if (burst.w <= 0.0) continue;
    float offset = distance(p, burst.xy) - burst.z;
    float edge = offset > 0.0 ? offset / (uBurstWidth * 0.35) : -offset / uBurstWidth;
    value = max(value, clamp(1.0 - edge, 0.0, 1.0) * burst.w);
  }
  return value;
}

vec3 toned(vec3 c) {
  return uPalette == 1 ? grade(c) : grade(vec3(dot(c, vec3(0.2126, 0.7152, 0.0722))));
}

vec3 quantize(vec3 v, float t) {
  float steps = max(uLevels - 1.0, 1.0);
  vec3 s = v * steps;
  vec3 base = floor(s);
  return min(base + step(vec3(t), s - base), vec3(steps)) / steps;
}

void main() {
  vec2 px = vec2(gl_FragCoord.x, uResolution.y - gl_FragCoord.y);
  vec2 cell = floor(px / uCell);
  vec2 center = (cell + 0.5) * uCell;
  vec2 cellUv = vec2(center.x / uResolution.x, 1.0 - center.y / uResolution.y);

  vec2 sampleUv = imageUv(cellUv);
  float framed = within(sampleUv);
  /* The one sample of the artwork this cell is built from — the dither reads it, and so
     does the luminance gate below. */
  vec3 src = mix(uMatte, textureLod(tImage, sampleUv, uLod).rgb, framed);
  vec3 level;
  if (uPattern == 3) {
    level = texelFetch(tDiffused, ivec2(cell), 0).rgb;
  } else {
    float t = uPattern == 1 ? blueNoise(cell) : (uPattern == 2 ? engraving(cell) : bayer(cell));
    level = quantize(toned(src), t);
  }

  vec3 color = mix(uInk, mix(uInk, uPaper, level), max(framed, uKey));
  vec3 backdrop = mix(uInk, uPaper, toned(uMatte));
  vec2 photoUv = imageUv(vUv);
  vec3 raw = texture(tImage, photoUv).rgb;
  float plain = uKey * (1.0 - smoothstep(0.05, 0.22, distance(raw, uMatte)));
  vec3 photo = mix(mix(uInk, backdrop, uKey), mix(raw, backdrop, plain), within(photoUv));

  vec2 point = vec2(cellUv.x, 1.0 - cellUv.y) * uSize;
  float mask = max(clamp(texture(tMask, cellUv).r * uHold, 0.0, 1.0), shockwave(point));
  float shown = mix(mask, 1.0 - mask, uReverse);
  float order = bayer(cell.yx);
  float low = order * (1.0 - uRim);
  /* Ink on a black sky is still ink, and at these dot densities it reads as dirt rather
     than as print, so the print is held back until the artwork under it is lit: nothing
     at uFloor, full strength at five times that. The gate multiplies a step, so the
     print dissolves in cell by cell instead of fading like a layer opacity. */
  float gate = uFloor > 0.0 ? smoothstep(uFloor, uFloor * 6.0, dot(src, vec3(0.2126, 0.7152, 0.0722))) : 1.0;
  color = mix(color, uRimColor, step(low, shown) * step(0.001, uRim) * gate);
  color = mix(color, photo, max(step(low + uRim, shown), 1.0 - gate));

  vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
  float spread = length((cellUv - 0.5) * aspect) / length(aspect * 0.5);
  float appear = step(spread * 0.72 + bayer(cell + vec2(3.0, 5.0)) * 0.28, uIntro * 1.001);
  fragColor = vec4(mix(uInk, color, appear), 1.0);
}
`;

const DitherVeil = ({
  src = DEFAULT_SRC,
  fit = "contain",
  alignX = 0.5,
  pattern = "floyd",
  pixelSize = 2,
  levels = 2,
  palette = "duotone",
  inkColor = "#120f17",
  paperColor = "#f4f1ea",
  contrast = 1.15,
  brightness = 0,
  revealRadius = 200,
  softness = 0.6,
  linger = 1,
  rimColor = "#a78bfa",
  rim = 0,
  printFloor = 0,
  reverse = false,
  wander = false,
  wanderCenter = [0.5, 0.5],
  wanderSpan = [0.41, 0.35],
  wanderSpeed = 1,
  wanderRise,
  clickBurst = true,
  className = "",
  style,
}: DitherVeilProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<Settings | null>(null);
  const wakeRef = useRef<() => void>(() => {});

  /* Props land in a ref instead of the effect below: the GL context, the mask history
     and the decoded image must survive a re-render, so the second effect only depends
     on `src`. Changing a prop just wakes the loop and the next frame picks it up. */
  useEffect(() => {
    settingsRef.current = {
      fit,
      alignX,
      pattern,
      pixelSize,
      levels,
      palette,
      inkColor,
      paperColor,
      contrast,
      brightness,
      revealRadius,
      softness,
      linger,
      rimColor,
      rim,
      printFloor,
      reverse,
      wander,
      wanderCenter,
      wanderSpan,
      wanderSpeed,
      wanderRise,
      clickBurst,
    };
    wakeRef.current();
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const renderer = new Renderer({
      dpr: Math.min(window.devicePixelRatio || 1, 2),
      alpha: false,
      antialias: false,
    });
    const gl = renderer.gl;
    const canvas = gl.canvas;
    canvas.style.display = "block";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    /* The very first frames are black ink over an empty image, and a sprite that 404s
       or a format the browser cannot decode never leaves that state. Holding the canvas
       invisible until the artwork has actually decoded means whatever is behind it
       (here: the plain <img>) simply stays the visible layer. */
    canvas.style.opacity = "0";
    canvas.style.transition = "opacity .35s linear";
    container.appendChild(canvas);

    const gl2 = gl as WebGL2RenderingContext;
    /* A half-float mask keeps the trail from stepping; without the extension we fall
       back to 8 bits and get a floor on the per-frame fade so it still reaches zero. */
    const floatMask = renderer.isWebgl2 && !!renderer.getExtension("EXT_color_buffer_float");
    const geometry = new Triangle(gl);

    const dataTexture = () =>
      new Texture(gl, {
        image: new Uint8Array(4),
        width: 1,
        height: 1,
        generateMipmaps: false,
        flipY: false,
        minFilter: gl.NEAREST,
        magFilter: gl.NEAREST,
      });
    const imageTexture = new Texture(gl, { minFilter: gl.LINEAR_MIPMAP_LINEAR, magFilter: gl.LINEAR });
    const noiseTexture = dataTexture();
    const diffusedTexture = dataTexture();

    const createMask = (w: number, h: number) =>
      new RenderTarget(gl, {
        width: w,
        height: h,
        depth: false,
        type: floatMask ? gl2.HALF_FLOAT : gl.UNSIGNED_BYTE,
        internalFormat: floatMask ? gl2.RGBA16F : gl.RGBA,
        minFilter: gl.LINEAR,
        magFilter: gl.LINEAR,
      });
    /* ogl has no dispose(), and a leaked framebuffer per resize adds up on a device
       that rotates or gets dragged around. */
    const destroyMask = (target: RenderTarget) => {
      gl.deleteFramebuffer(target.buffer);
      gl.deleteTexture(target.texture.texture);
    };
    let masks = [createMask(2, 2), createMask(2, 2)];

    const maskUniforms = {
      tPrev: { value: masks[0].texture },
      uSize: { value: [1, 1] },
      uFrom: { value: [0, 0] },
      uTo: { value: [0, 0] },
      uRadius: { value: 1 },
      uSoftness: { value: 0.5 },
      uStrength: { value: 0 },
      uFade: { value: 1 },
      uHold: { value: HOLD },
    };
    const viewUniforms = {
      tImage: { value: imageTexture },
      tMask: { value: masks[0].texture },
      tNoise: { value: noiseTexture },
      tDiffused: { value: diffusedTexture },
      uResolution: { value: [1, 1] },
      uCover: { value: [1, 1] },
      uShift: { value: 0 },
      uLod: { value: 0 },
      uCell: { value: 3 },
      uPattern: { value: 0 },
      uPalette: { value: 0 },
      uLevels: { value: 2 },
      uInk: { value: [0, 0, 0] },
      uPaper: { value: [1, 1, 1] },
      uRimColor: { value: [1, 1, 1] },
      uRim: { value: 0 },
      uContrast: { value: 1 },
      uBrightness: { value: 0 },
      uReverse: { value: 0 },
      uFloor: { value: 0 },
      uIntro: { value: 0 },
      uHold: { value: HOLD },
      uMatte: { value: [0, 0, 0] },
      uKey: { value: 0 },
      uSize: { value: [1, 1] },
      uBursts: { value: Array.from({ length: MAX_BURSTS * 4 }, () => 0) },
      uBurstWidth: { value: 60 },
    };
    const program = (fragment: string, uniforms: Record<string, { value: unknown }>) =>
      new Program(gl, { vertex, fragment, uniforms, depthTest: false, depthWrite: false });
    const maskMesh = new Mesh(gl, { geometry, program: program(maskFragment, maskUniforms) });
    const viewMesh = new Mesh(gl, { geometry, program: program(viewFragment, viewUniforms) });

    /* The 2D scratch canvas the CPU paths read back from: edge measurement and the
       error-diffusion source. Sized to the cell grid, never to the screen. */
    const sampler = document.createElement("canvas");
    const samplerContext = sampler.getContext("2d", { willReadFrequently: true });

    let image: HTMLImageElement | null = null;
    let introStart = 0;
    let diffusedKey = "";
    let diffusionBlocked = false;
    let width = 1;
    let height = 1;
    let visible = true;
    let raf = 0;
    let last = performance.now();
    let nextDue = 0;
    let trailUntil = 0;
    let presence = 0;
    let drift = 0;
    const pointer = { x: 0, y: 0, inside: false, fresh: true, placed: false };
    const brush = { x: 0, y: 0, px: 0, py: 0 };
    const bursts: { x: number; y: number; start: number }[] = [];

    const layout = () => {
      width = Math.max(1, container.clientWidth);
      height = Math.max(1, container.clientHeight);
      renderer.setSize(width, height);
      viewUniforms.uResolution.value = [canvas.width, canvas.height];
      maskUniforms.uSize.value = [width, height];
      viewUniforms.uSize.value = [width, height];
      const mw = Math.max(2, Math.round(width * MASK_SCALE));
      const mh = Math.max(2, Math.round(height * MASK_SCALE));
      if (mw !== masks[0].width || mh !== masks[0].height) {
        masks.forEach(destroyMask);
        masks = [createMask(mw, mh), createMask(mw, mh)];
      }
      if (!pointer.placed) {
        pointer.x = width / 2;
        pointer.y = height / 2;
      }
    };

    /* Floyd/Atkinson only: read the cells back, diffuse them, upload. Guarded by a key
       over every setting it depends on, so this runs on resize or a prop change and
       otherwise costs nothing. A tainted canvas (cross-origin image without CORS) is
       remembered as `diffusionBlocked` and degrades to the bayer path. */
    const updateDiffusion = (cell: number, s: Settings) => {
      if (!image || !samplerContext) return;
      const cols = Math.ceil(canvas.width / cell);
      const rows = Math.ceil(canvas.height / cell);
      const key = [
        s.pattern,
        s.levels,
        s.palette,
        s.contrast,
        s.brightness,
        s.fit,
        s.alignX,
        cols,
        rows,
        canvas.width,
        canvas.height,
      ].join("|");
      if (key === diffusedKey) return;
      diffusedKey = key;
      const [cx, cy] = viewUniforms.uCover.value;
      const shift = viewUniforms.uShift.value;
      const iw = image.naturalWidth;
      const ih = image.naturalHeight;
      sampler.width = cols;
      sampler.height = rows;
      samplerContext.imageSmoothingEnabled = true;
      samplerContext.imageSmoothingQuality = "high";
      const [mr, mg, mb] = viewUniforms.uMatte.value;
      samplerContext.fillStyle = `rgb(${mr * 255}, ${mg * 255}, ${mb * 255})`;
      samplerContext.fillRect(0, 0, cols, rows);
      const sx = (0.5 - 0.5 * cx + shift) * iw;
      const sy = (0.5 - 0.5 * cy) * ih;
      const sw = ((cols * cell) / canvas.width) * cx * iw;
      const sh = ((rows * cell) / canvas.height) * cy * ih;
      const x0 = Math.max(sx, 0);
      const y0 = Math.max(sy, 0);
      const x1 = Math.min(sx + sw, iw);
      const y1 = Math.min(sy + sh, ih);
      if (x1 > x0 && y1 > y0) {
        samplerContext.drawImage(
          image,
          x0,
          y0,
          x1 - x0,
          y1 - y0,
          ((x0 - sx) / sw) * cols,
          ((y0 - sy) / sh) * rows,
          ((x1 - x0) / sw) * cols,
          ((y1 - y0) / sh) * rows
        );
      }
      const grade = (v: number) =>
        Math.pow(Math.min(1, Math.max(0, (v - 0.5) * s.contrast + 0.5 + s.brightness)), 1.6);
      const pixels = samplerContext.getImageData(0, 0, cols, rows).data;
      diffusedTexture.image = diffuse(pixels, cols, rows, KERNELS[s.pattern], s.levels, s.palette === "rgb", grade);
      diffusedTexture.width = cols;
      diffusedTexture.height = rows;
      diffusedTexture.needsUpdate = true;
    };

    const frame = (now: number) => {
      raf = 0;
      const s = settingsRef.current;
      if (!s) return;
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;

      /* Autonomous drift is the only thing to draw when the pointer is away, and it is
         slow: half the display's rate looks the same and costs half. Tracking a hand or
         running a click burst always gets every frame. */
      const autonomous =
        s.wander && !reducedMotion && !pointer.inside && bursts.length === 0 && (!image || now - introStart > INTRO_MS);
      if (autonomous && now < nextDue) {
        raf = requestAnimationFrame(frame);
        return;
      }
      nextDue = autonomous ? now + WANDER_FRAME_MS : 0;

      /* Target: the pointer, or — when `wander` is on and the pointer is away — a slow
         path over the artwork, eased in so the hand-off is not a jump. */
      const wanderOn = s.wander && !reducedMotion;
      let targetX = pointer.x;
      let targetY = pointer.y;
      if (!pointer.inside && wanderOn) {
        drift = Math.min(1, drift + dt / 1.2);
        const [wx, wy] = wanderAt(now / 1000 * s.wanderSpeed, width, height, s.wanderCenter, s.wanderSpan, s.wanderRise);
        const k = drift * drift * (3 - 2 * drift);
        targetX += (wx - targetX) * k;
        targetY += (wy - targetY) * k;
      } else {
        drift = 0;
      }

      presence += ((pointer.inside || wanderOn ? 1 : 0) - presence) * (1 - Math.exp(-dt / 0.16));

      /* The brush trails the target on a fixed time constant, so a fast flick still
         paints a continuous stroke rather than a dotted line. */
      if (pointer.fresh) {
        brush.x = brush.px = targetX;
        brush.y = brush.py = targetY;
        pointer.fresh = false;
      } else {
        const follow = 1 - Math.exp(-dt / 0.035);
        brush.x += (targetX - brush.x) * follow;
        brush.y += (targetY - brush.y) * follow;
      }

      const burstData = viewUniforms.uBursts.value;
      burstData.fill(0);
      for (let i = bursts.length - 1; i >= 0; i--) {
        if ((now - bursts[i].start) / 1000 >= BURST_SECONDS) bursts.splice(i, 1);
      }
      bursts.forEach((b, i) => {
        const k = Math.max(0, (now - b.start) / 1000 / BURST_SECONDS);
        const reach =
          Math.hypot(Math.max(b.x, width - b.x), Math.max(b.y, height - b.y)) + viewUniforms.uBurstWidth.value;
        burstData[i * 4] = b.x;
        burstData[i * 4 + 1] = b.y;
        burstData[i * 4 + 2] = reach * Math.sin((k * Math.PI) / 2);
        burstData[i * 4 + 3] = 1 - k * k * k;
      });

      if (presence > 0.002) trailUntil = now + s.linger * 1000 + 150;

      const minFade = floatMask ? 0 : 1.5 / 255;
      const fade = s.linger > 0 ? dt / s.linger : 1;
      maskUniforms.tPrev.value = masks[0].texture;
      maskUniforms.uFrom.value = [brush.px, brush.py];
      maskUniforms.uTo.value = [brush.x, brush.y];
      maskUniforms.uRadius.value = s.revealRadius * (0.45 + 0.55 * presence);
      maskUniforms.uSoftness.value = s.softness;
      maskUniforms.uStrength.value = presence;
      maskUniforms.uFade.value = Math.max(fade, minFade);
      viewUniforms.uBurstWidth.value = Math.max(60, s.revealRadius * 0.9);
      renderer.render({ scene: maskMesh, target: masks[1] });
      masks.reverse();
      brush.px = brush.x;
      brush.py = brush.y;

      const cell = Math.max(1, Math.round(s.pixelSize * renderer.dpr));
      if (image) {
        viewUniforms.uCover.value = fitScale(
          canvas.width,
          canvas.height,
          image.naturalWidth,
          image.naturalHeight,
          s.fit === "contain"
        );
      }
      /* Only the axis that is actually cropped can be aligned: when the image is wider
         than the box uCover.x < 1 and there is a left/right window to move, otherwise
         `object-position` would have had nothing to do either. */
      viewUniforms.uShift.value = (Math.min(Math.max(s.alignX, 0), 1) - 0.5) * Math.max(0, 1 - viewUniforms.uCover.value[0]);
      let patternIndex = ORDERED[s.pattern] ?? 0;
      if (KERNELS[s.pattern]) {
        patternIndex = 0;
        if (image && !diffusionBlocked) {
          try {
            updateDiffusion(cell, s);
            patternIndex = 3;
          } catch {
            diffusionBlocked = true;
          }
        }
      }
      if (patternIndex === 1 && noiseTexture.width !== 64) {
        noiseTexture.image = getBlueNoise();
        noiseTexture.width = 64;
        noiseTexture.height = 64;
        noiseTexture.needsUpdate = true;
      }

      /* The ordered thresholds work on a grid of `cell` pixels, so the source is
         sampled at a mip level that has already averaged the same footprint — without
         it, a 1px cell would alias the artwork into noise. */
      const texelsPerPixel = image ? (viewUniforms.uCover.value[0] * image.naturalWidth) / canvas.width : 1;
      viewUniforms.tMask.value = masks[0].texture;
      viewUniforms.uCell.value = cell;
      viewUniforms.uLod.value = Math.log2(Math.max(cell * texelsPerPixel, 1));
      viewUniforms.uPattern.value = patternIndex;
      viewUniforms.uPalette.value = s.palette === "rgb" ? 1 : 0;
      viewUniforms.uLevels.value = Math.max(2, Math.round(s.levels));
      viewUniforms.uInk.value = hexToRgb(s.inkColor);
      viewUniforms.uPaper.value = hexToRgb(s.paperColor);
      viewUniforms.uRimColor.value = hexToRgb(s.rimColor);
      viewUniforms.uRim.value = Math.min(Math.max(s.rim, 0), 0.95);
      viewUniforms.uContrast.value = s.contrast;
      viewUniforms.uBrightness.value = s.brightness;
      viewUniforms.uReverse.value = s.reverse ? 1 : 0;
      viewUniforms.uFloor.value = Math.max(0, s.printFloor);
      const intro = image ? Math.min(1, (now - introStart) / INTRO_MS) : 0;
      viewUniforms.uIntro.value = 1 - Math.pow(1 - intro, 2);
      renderer.render({ scene: viewMesh });

      const busy =
        pointer.inside ||
        wanderOn ||
        presence > 0.002 ||
        bursts.length > 0 ||
        now < trailUntil ||
        (image && intro < 1);
      if (busy && visible) raf = requestAnimationFrame(frame);
    };

    const wake = () => {
      if (raf || !visible) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    wakeRef.current = wake;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onload = () => {
      image = img;
      imageTexture.image = img;
      try {
        if (samplerContext) {
          const edge = measureEdge(samplerContext, img);
          viewUniforms.uMatte.value = edge.matte;
          viewUniforms.uKey.value = edge.plain ? 1 : 0;
        }
      } catch {}
      introStart = performance.now();
      canvas.style.opacity = "1";
      wake();
    };
    img.onerror = () => {
      image = null;
      canvas.style.opacity = "0";
    };
    img.src = src;

    const locate = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
      pointer.placed = true;
    };
    const onMove = (e: PointerEvent) => {
      locate(e);
      if (!pointer.inside) {
        pointer.inside = true;
        pointer.fresh = true;
      }
      wake();
    };
    const onLeave = () => {
      pointer.inside = false;
      wake();
    };
    const onDown = (e: PointerEvent) => {
      onMove(e);
      if (!settingsRef.current?.clickBurst || (e.pointerType === "mouse" && e.button !== 0)) return;
      bursts.push({ x: pointer.x, y: pointer.y, start: performance.now() });
      if (bursts.length > MAX_BURSTS) bursts.shift();
    };
    container.addEventListener("pointermove", onMove, { passive: true });
    container.addEventListener("pointerenter", onMove, { passive: true });
    container.addEventListener("pointerdown", onDown, { passive: true });
    container.addEventListener("pointerleave", onLeave, { passive: true });
    container.addEventListener("pointercancel", onLeave, { passive: true });

    /* Resize keeps the trail (targets are recreated, not the history) and the
       intersection observer stops the loop entirely for an offscreen canvas. */
    const resizeObserver = new ResizeObserver(() => {
      layout();
      wake();
    });
    resizeObserver.observe(container);
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      wake();
    });
    intersectionObserver.observe(container);

    layout();
    wake();

    return () => {
      cancelAnimationFrame(raf);
      wakeRef.current = () => {};
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      img.onload = null;
      container.removeEventListener("pointermove", onMove);
      container.removeEventListener("pointerenter", onMove);
      container.removeEventListener("pointerdown", onDown);
      container.removeEventListener("pointerleave", onLeave);
      container.removeEventListener("pointercancel", onLeave);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    };
  }, [src]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden touch-pan-y ${className}`.trim()}
      style={style}
    />
  );
};

export default DitherVeil;
