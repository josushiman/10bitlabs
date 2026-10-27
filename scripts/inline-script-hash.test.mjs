import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import { inlineScriptHash } from './inline-script-hash.mjs';

const body = '\n  window.theme = "İ &amp; 🎨";\n';
const theme = `<script>${body}</script>`;
const expectedHash = `'sha256-${createHash('sha256').update(body, 'utf8').digest('base64')}'`;
const hash = (html) => inlineScriptHash(html, 'fixture.html');

test('hashes the exact script source without trimming, decoding, or reserialization', () => {
  assert.equal(hash(`<!doctype html><p>🎨</p>${theme}`), expectedHash);
});

for (const [name, html] of [
  ['uppercase tags', `<SCRIPT>${body}</SCRIPT>`],
  ['mixed-case tags', `<ScRiPt>${body}</sCrIpT>`],
  ['attributes on the closing tag', `<script>${body}</script data-ignored>`],
  ['whitespace on the closing tag', `<script>${body}</script \n>`],
  ['quoted greater-than signs', `<script data-text="a > b">${body}</script>`],
  ['mixed-case JavaScript MIME type', `<script TYPE="TEXT/JAVASCRIPT">${body}</script>`],
  ['module script', `<script type=module>${body}</script>`]
]) {
  test(`recognizes ${name}`, () => assert.equal(hash(html), expectedHash));
}

test('uses parsed source and type attributes, including spaces and character references', () => {
  assert.equal(
    hash(`${theme}<SCRIPT SRC = "/app.js"></SCRIPT>
      <script TyPe = "application/ld&#43;json">{"a":1}</script>`),
    expectedHash
  );
  assert.equal(hash(`${theme}<script src></script>`), expectedHash);
});

test('JSON-LD changes do not add hashes to the executable script policy', () => {
  assert.equal(hash(`${theme}<script type="application/ld+json">{"name":"one"}</script>`), expectedHash);
  assert.equal(hash(`${theme}<script type="application/ld+json">{"name":"two"}</script>`), expectedHash);
});

test('ignores fake script tags in comments, text, and inert template contents', () => {
  assert.equal(
    hash(`${theme}
      <!-- <script>fake()</script> -->
      <textarea><script>fake()</script></textarea>
      <template><script>fake()</script></template>
      <noscript><script>fake()</script></noscript>`),
    expectedHash
  );
});

test('rejects extra executable scripts regardless of tag syntax', () => {
  for (const extra of [
    '<SCRIPT>extra()</SCRIPT>',
    '<script>extra()</script data-x>',
    '<script data-text="a > b">extra()</script>',
    '<script type=module>extra()</script>'
  ]) {
    assert.throws(
      () => hash(theme + extra),
      /Expected exactly one executable inline script.*found 2/
    );
  }
});

test('rejects missing or unclosed inline scripts', () => {
  assert.throws(() => hash('<script src="/app.js"></script>'), /No executable inline script/);
  assert.throws(() => hash('<script>theme()'), /Unclosed inline script/);
});

test('fails closed on unsupported data blocks instead of authorizing their bodies', () => {
  for (const type of ['application/json', 'importmap', 'speculationrules', 'text/plain']) {
    assert.throws(() => hash(`${theme}<script type="${type}">{}</script>`), /Unexpected inline script type/);
  }
});

test('fails closed on SVG scripts instead of treating their src as an HTML source attribute', () => {
  assert.throws(
    () => hash(`${theme}<svg><script src="/unused.js">extra()</script></svg>`),
    /Unexpected non-HTML script/
  );
});
