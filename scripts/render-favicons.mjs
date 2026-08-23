// Rasterises public/favicon.svg into the PNG sizes that browsers still ask for.
//
// Run by hand after the SVG changes — the outputs are committed, so the build
// stays a plain `astro build` with no image toolchain in it. Chromium comes from
// the Playwright install the tests already need, which is why there is no
// separate rasteriser dependency.
//
//   node scripts/render-favicons.mjs
import { readFile, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const SVG = 'public/favicon.svg';
// 180 is what iOS wants for apple-touch-icon; 32 is the classic favicon size and
// the payload inside favicon.ico.
const PNGS = [
  { size: 180, path: 'public/apple-touch-icon.png' },
  { size: 32, path: null }
];

const svg = await readFile(SVG, 'utf8');
const browser = await chromium.launch();
const rendered = new Map();

for (const { size } of PNGS) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.setContent(
    `<style>html,body{margin:0}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`
  );
  rendered.set(size, await page.screenshot({ omitBackground: false }));
  await page.close();
}
await browser.close();

for (const { size, path } of PNGS) {
  if (path) await writeFile(path, rendered.get(size));
}

// An ICO wrapping a PNG: every browser that still requests /favicon.ico reads
// PNG-in-ICO, so there is no need to emit a BMP payload.
const png = rendered.get(32);
const header = Buffer.alloc(6 + 16);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type: icon
header.writeUInt16LE(1, 4); // one image
header.writeUInt8(32, 6); // width
header.writeUInt8(32, 7); // height
header.writeUInt8(0, 8); // palette colours: none
header.writeUInt8(0, 9); // reserved
header.writeUInt16LE(1, 10); // colour planes
header.writeUInt16LE(32, 12); // bits per pixel
header.writeUInt32LE(png.length, 14);
header.writeUInt32LE(header.length, 18); // offset to the payload
await writeFile('public/favicon.ico', Buffer.concat([header, png]));

console.log('[favicons] wrote apple-touch-icon.png and favicon.ico from', SVG);
