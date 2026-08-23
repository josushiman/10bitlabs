// Draws dist/og.png — the card a link to this site renders as in Slack, iMessage
// or anywhere else that reads Open Graph tags.
//
// Generated during `npm run build` rather than committed, and from the palette in
// src/styles/global.css rather than from a copy of it: the card is the brand as
// the stylesheet currently states it, so a change to the accent reaches the share
// card without anyone remembering to re-export an image.
//
// It draws with arithmetic and no browser. Astro's build has no image toolchain
// in it, and the deploy job installs no Playwright browsers, so a renderer that
// needed either would either slow every deploy down or only work on a machine
// that had already run the tests. The mark is rectangles with rounded corners,
// which is a signed distance field and a few lines of anti-aliasing — see
// `roundedRectDistance` and `coverage`.
import { readFile, writeFile } from 'node:fs/promises';
import { deflateSync } from 'node:zlib';
import { pathToFileURL } from 'node:url';

/*
  1200×630 is what every card reader scales to, and the aspect ratio Slack,
  iMessage and X all crop to when it is anything else.
*/
const WIDTH = 1200;
const HEIGHT = 630;

/** The card's dimensions, and the mark's placement on it, for the test to measure against. */
export const CARD = {
  width: WIDTH,
  height: HEIGHT,
  barHeight: HEIGHT * 0.42,
  centreX: WIDTH / 2,
  centreY: HEIGHT * 0.47
};

/* ── the palette ─────────────────────────────────────────────────────────── */

/**
 * Convert one `oklch(L C H)` colour to a `#rrggbb` string.
 *
 * The stylesheet is written in OKLCH and a PNG is written in sRGB, so this is
 * the whole of what stands between them: OKLCH → OKLab → linear sRGB → sRGB.
 * Out-of-gamut components are clipped per channel, which is what a browser does
 * with these two colours as well — both sit comfortably inside sRGB.
 */
function oklchToHex(l, c, hDegrees) {
  const h = (hDegrees * Math.PI) / 180;
  const a = c * Math.cos(h);
  const b = c * Math.sin(h);

  // OKLab's three cone responses, cubed back out of their perceptual root.
  const lCone = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const mCone = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const sCone = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;

  const linear = [
    4.0767416621 * lCone - 3.3077115913 * mCone + 0.2309699292 * sCone,
    -1.2684380046 * lCone + 2.6097574011 * mCone - 0.3413193965 * sCone,
    -0.0041960863 * lCone - 0.7034186147 * mCone + 1.707614701 * sCone
  ];

  return `#${linear.map((channel) => channelToHex(channel)).join('')}`;
}

/** One linear-light channel as two hex digits, with the sRGB transfer curve applied. */
function channelToHex(value) {
  const encoded =
    value <= 0.0031308 ? 12.92 * value : 1.055 * Math.max(value, 0) ** (1 / 2.4) - 0.055;
  const byte = Math.round(Math.min(Math.max(encoded, 0), 1) * 255);
  return byte.toString(16).padStart(2, '0');
}

/**
 * The dark palette's background and accent, read out of the stylesheet.
 *
 * Every token there is a `light-dark(light, dark)` pair and the card is always
 * the dark one: a share card and a favicon are rendered long before a visitor
 * with a palette preference is anywhere near them, so there is no preference to
 * follow. The dark side is the design's own default, which makes it the right
 * one to freeze.
 */
export function darkPalette(css) {
  return { bg: darkSideOf(css, 'bg'), accent: darkSideOf(css, 'accent') };
}

function darkSideOf(css, token) {
  const declaration = new RegExp(
    `--${token}:\\s*light-dark\\([^,]+,\\s*oklch\\(([\\d.]+)\\s+([\\d.]+)\\s+([\\d.]+)\\)\\s*\\)`
  ).exec(css);
  if (!declaration) throw new Error(`No --${token} light-dark() pair in the stylesheet.`);

  const [, l, c, h] = declaration;
  return oklchToHex(Number(l), Number(c), Number(h));
}

/* ── the drawing ─────────────────────────────────────────────────────────── */

/** `#rrggbb` as the three bytes a pixel is made of. */
function rgb(hex) {
  const value = Number.parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

/**
 * Signed distance from a point to a rounded rectangle: negative inside,
 * positive outside, and in units of pixels either way.
 *
 * Having the distance rather than a yes/no is what gives the bars a clean edge:
 * a pixel half a pixel outside the shape is drawn half-strength, which is all
 * anti-aliasing is.
 */
function roundedRectDistance(x, y, rect) {
  const halfWidth = rect.width / 2;
  const halfHeight = rect.height / 2;
  const dx = Math.abs(x - (rect.x + halfWidth)) - (halfWidth - rect.radius);
  const dy = Math.abs(y - (rect.y + halfHeight)) - (halfHeight - rect.radius);
  const outside = Math.hypot(Math.max(dx, 0), Math.max(dy, 0));
  return outside + Math.min(Math.max(dx, dy), 0) - rect.radius;
}

/** How much of this pixel the shape covers, from its distance to the edge. */
function coverage(distance) {
  return Math.min(Math.max(0.5 - distance, 0), 1);
}

/**
 * The icon mark's geometry, scaled from the 1024 artboard to a given bar height.
 *
 * The proportions are the ones docs/design/10 Bit Labs Icon.dc.html states —
 * 220×520 bars at a 110px gap, 56px corners, the second one outlined with a 56px
 * border — carried across as ratios so the card and the favicon are the same
 * mark at two sizes rather than two drawings of it.
 */
function markGeometry(barHeight, centreX, centreY) {
  const unit = barHeight / 520;
  const barWidth = 220 * unit;
  const gap = 110 * unit;
  const radius = 56 * unit;
  const border = 56 * unit;

  const left = centreX - (barWidth * 2 + gap) / 2;
  const top = centreY - barHeight / 2;
  const shape = (x) => ({ x, y: top, width: barWidth, height: barHeight, radius });

  return { filled: shape(left), outlined: shape(left + barWidth + gap), border };
}

/** The card's pixels, as one RGB row-major buffer. */
export function drawCard({ bg, accent }) {
  const [bgR, bgG, bgB] = rgb(bg);
  const [accentR, accentG, accentB] = rgb(accent);
  const pixels = Buffer.alloc(WIDTH * HEIGHT * 3);

  /*
    The mark sits at two-thirds the card's height and slightly above the middle,
    with a hairline of accent along the bottom edge. That rule is the card's only
    addition to the icon: without it the image reads as a cropped app icon rather
    than as a card, and it is drawn in the same accent so it cannot drift either.
  */
  const { filled, outlined, border } = markGeometry(CARD.barHeight, CARD.centreX, CARD.centreY);
  const ruleTop = HEIGHT - 10;

  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      // Pixel centres, so a shape edge on a whole coordinate lands half and half.
      const px = x + 0.5;
      const py = y + 0.5;

      const filledCoverage = coverage(roundedRectDistance(px, py, filled));
      /*
        The outline is the shape minus the shape shrunk by one border width —
        drawn inward from the edge, never straddling it. That is what the design's
        `box-sizing: border-box` means, and it is what keeps the zero the same
        outer size as the one: a border centred on the edge would make the zero a
        quarter wider than its neighbour and close the gap between them.

        Shrinking the distance field rather than the rectangle also gives the
        counter sharp corners for free, since a 56px radius less a 56px border is
        nothing — which is exactly what CSS draws.
      */
      const outlineDistance = roundedRectDistance(px, py, outlined);
      const outlineCoverage = coverage(outlineDistance) - coverage(outlineDistance + border);
      const ruleCoverage = py >= ruleTop ? 1 : 0;

      const alpha = Math.min(1, Math.max(filledCoverage, outlineCoverage, ruleCoverage));
      const offset = (y * WIDTH + x) * 3;
      pixels[offset] = Math.round(bgR + (accentR - bgR) * alpha);
      pixels[offset + 1] = Math.round(bgG + (accentG - bgG) * alpha);
      pixels[offset + 2] = Math.round(bgB + (accentB - bgB) * alpha);
    }
  }

  return pixels;
}

/* ── the file ────────────────────────────────────────────────────────────── */

const CRC_TABLE = Uint32Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buffer) {
  let c = 0xffffffff;
  for (const byte of buffer) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/** One PNG chunk: length, type, payload, CRC of the last two. */
function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'latin1'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

/**
 * An 8-bit truecolour PNG of the given RGB buffer.
 *
 * Every scanline is prefixed with filter type 0 — "none". A smarter filter would
 * compress better, but the card is flat colour over flat colour and deflate
 * already takes it to a few kilobytes.
 */
function encodePng(pixels, width, height) {
  const stride = width * 3;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    pixels.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type: truecolour
  // The remaining three bytes are compression, filter and interlace methods,
  // each of which has exactly one defined value, and it is zero.

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

/*
  Importable without running: the tests read the palette out of this module, and
  doing that should not write a file into a dist that may not exist.
*/
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const palette = darkPalette(await readFile('src/styles/global.css', 'utf8'));
  const png = encodePng(drawCard(palette), WIDTH, HEIGHT);
  await writeFile('dist/og.png', png);
  console.log(
    `[og] wrote dist/og.png — ${WIDTH}×${HEIGHT}, ${(png.length / 1024).toFixed(1)}kB, ` +
      `background ${palette.bg}, accent ${palette.accent}`
  );
}
