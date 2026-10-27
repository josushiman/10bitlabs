import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { downloadFont, renderFontCss, vendorFonts } from './fetch-fonts.mjs';
import { FONTS } from './fonts-manifest.mjs';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const FONT = FONTS[0];
const fixtures = new Map(
  await Promise.all(
    FONTS.map(async (font) => [font.url, await readFile(join(ROOT, 'public/fonts', font.file))])
  )
);
const css = await readFile(join(ROOT, 'src/styles/fonts.css'), 'utf8');

function fontResponse(bytes, options = {}) {
  return new Response(bytes, { headers: { 'content-type': 'font/woff2' }, ...options });
}

function validFetch(url) {
  assert.ok(fixtures.has(url), `Unexpected request to ${url}`);
  return Promise.resolve(fontResponse(fixtures.get(url)));
}

test('font pins describe the existing committed assets and preserve all CSS, including IBM Plex Mono', () => {
  for (const font of FONTS) {
    const bytes = fixtures.get(font.url);
    assert.equal(bytes.length, font.bytes, font.file);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), font.sha256, font.file);
  }
  assert.equal(renderFontCss(), css);
});

test('rejects untrusted URLs before making a request', async () => {
  for (const url of [
    FONT.url.replace('https:', 'http:'),
    FONT.url.replace('fonts.gstatic.com', 'fonts.gstatic.com.attacker.example'),
    FONT.url.replace('fonts.gstatic.com', 'other.fonts.gstatic.com'),
    FONT.url.replace('fonts.gstatic.com', 'attacker.example'),
    FONT.url.replace('fonts.gstatic.com', 'user:password@fonts.gstatic.com'),
    FONT.url.replace('fonts.gstatic.com', 'fonts.gstatic.com:8443'),
    FONT.url.replace('.woff2', '.js'),
    `${FONT.url}?other=1`,
    `${FONT.url}#fragment`,
    'file:///tmp/font.woff2',
    'data:font/woff2;base64,d09GMg=='
  ]) {
    await assert.rejects(
      downloadFont(
        { ...FONT, url },
        {
          fetchImpl: () => assert.fail(`Fetched untrusted URL: ${url}`)
        }
      ),
      /Untrusted font URL/
    );
  }
});

test('uses an expiring AbortSignal and disables redirects', async () => {
  const bytes = await downloadFont(FONT, {
    fetchImpl: async (url, options) => {
      assert.equal(url, FONT.url);
      assert.equal(options.redirect, 'error');
      assert.ok(options.signal instanceof AbortSignal);
      assert.equal(options.signal.aborted, false);
      return fontResponse(fixtures.get(url));
    }
  });
  assert.deepEqual(bytes, fixtures.get(FONT.url));
});

test('propagates timeout and redirect failures without falling back to unverified data', async () => {
  for (const name of ['TimeoutError', 'TypeError']) {
    await assert.rejects(
      downloadFont(FONT, {
        fetchImpl: async () => {
          throw new DOMException('Download failed', name);
        }
      }),
      { name }
    );
  }
  const response = fontResponse(fixtures.get(FONT.url));
  Object.defineProperty(response, 'redirected', { value: true });
  await assert.rejects(downloadFont(FONT, { fetchImpl: async () => response }), /download failed/);
});

test('rejects unsuccessful or non-WOFF2 HTTP responses', async () => {
  for (const response of [
    new Response('missing', { status: 404 }),
    new Response('upstream failure', { status: 500 }),
    new Response(fixtures.get(FONT.url), { headers: { 'content-type': 'text/html' } })
  ]) {
    await assert.rejects(
      downloadFont(FONT, { fetchImpl: async () => response }),
      /download failed|Expected a WOFF2/
    );
  }
});

test('rejects unexpected response URLs', async () => {
  const response = fontResponse(fixtures.get(FONT.url));
  Object.defineProperty(response, 'url', { value: 'https://attacker.example/font.woff2' });
  await assert.rejects(downloadFont(FONT, { fetchImpl: async () => response }), /download failed/);
});

test('bounds a response before reading it when Content-Length exceeds the cap', async () => {
  const response = fontResponse(fixtures.get(FONT.url), {
    headers: { 'content-type': 'font/woff2', 'content-length': '10000000' }
  });
  await assert.rejects(downloadFont(FONT, { fetchImpl: async () => response }), /too large/);
});

test('cancels an oversized stream even when Content-Length is missing or false', async () => {
  for (const contentLength of [null, '1']) {
    let canceled = false;
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array(FONT.bytes));
        controller.enqueue(new Uint8Array(1));
      },
      cancel() {
        canceled = true;
      }
    });
    const headers = { 'content-type': 'font/woff2' };
    if (contentLength !== null) headers['content-length'] = contentLength;
    await assert.rejects(
      downloadFont(FONT, {
        fetchImpl: async () => new Response(stream, { headers })
      }),
      /too large/
    );
    assert.equal(canceled, true);
  }
});

test('rejects empty, truncated, and non-WOFF2 bytes', async () => {
  const nonFont = Buffer.from(fixtures.get(FONT.url));
  nonFont.write('HTML', 0);
  for (const bytes of [Buffer.alloc(0), fixtures.get(FONT.url).subarray(0, 100), nonFont]) {
    await assert.rejects(
      downloadFont(FONT, {
        fetchImpl: async () => fontResponse(bytes)
      }),
      /Invalid WOFF2/
    );
  }
});

test('rejects same-length, valid-signature bytes if any pinned font byte changes', async () => {
  const changed = Buffer.from(fixtures.get(FONT.url));
  changed[changed.length - 1] ^= 1;
  await assert.rejects(
    downloadFont(FONT, {
      fetchImpl: async () => fontResponse(changed)
    }),
    /checksum mismatch/
  );
});

test('a late validation failure leaves every existing font and stylesheet untouched', async (t) => {
  const root = await mkdtemp(join(tmpdir(), '10bitlabs-font-failure-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, 'public/fonts'), { recursive: true });
  await mkdir(join(root, 'src/styles'), { recursive: true });
  for (const font of FONTS) {
    await writeFile(join(root, 'public/fonts', font.file), `original ${font.file}`);
  }
  await writeFile(join(root, 'src/styles/fonts.css'), 'original CSS');
  let requestCount = 0;
  await assert.rejects(
    vendorFonts({
      root,
      fetchImpl: async (url) => {
        requestCount++;
        const bytes = Buffer.from(fixtures.get(url));
        if (requestCount === FONTS.length) bytes[bytes.length - 1] ^= 1;
        return fontResponse(bytes);
      }
    }),
    /checksum mismatch/
  );
  assert.equal(requestCount, FONTS.length);
  for (const font of FONTS) {
    assert.equal(
      await readFile(join(root, 'public/fonts', font.file), 'utf8'),
      `original ${font.file}`
    );
  }
  assert.equal(await readFile(join(root, 'src/styles/fonts.css'), 'utf8'), 'original CSS');
  assert.deepEqual((await readdir(root)).sort(), ['public', 'src']);
});

test('successful offline vendoring reproduces the exact committed assets and stylesheet', async (t) => {
  const root = await mkdtemp(join(tmpdir(), '10bitlabs-font-success-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await vendorFonts({ root, fetchImpl: validFetch });
  for (const font of FONTS) {
    assert.deepEqual(await readFile(join(root, 'public/fonts', font.file)), fixtures.get(font.url));
  }
  assert.equal(await readFile(join(root, 'src/styles/fonts.css'), 'utf8'), css);
  assert.deepEqual((await readdir(root)).sort(), ['public', 'src']);
});
