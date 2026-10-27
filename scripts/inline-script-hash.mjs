import { createHash } from 'node:crypto';
import { parse } from 'parse5';

// The legacy MIME types are executable too; an unfamiliar data block must not
// quietly become another body admitted by script-src.
const JAVASCRIPT_TYPES = new Set([
  'application/ecmascript',
  'application/javascript',
  'application/x-ecmascript',
  'application/x-javascript',
  'text/ecmascript',
  'text/javascript',
  'text/javascript1.0',
  'text/javascript1.1',
  'text/javascript1.2',
  'text/javascript1.3',
  'text/javascript1.4',
  'text/javascript1.5',
  'text/jscript',
  'text/livescript',
  'text/x-ecmascript',
  'text/x-javascript'
]);

function* scriptsIn(node) {
  if (node.tagName === 'script') yield node;
  // Template contents and noscript text are inert, so only visit the live tree.
  for (const child of node.childNodes ?? []) yield* scriptsIn(child);
}

export function inlineScriptHash(html, file) {
  const bodies = [];
  for (const script of scriptsIn(parse(html, { sourceCodeLocationInfo: true }))) {
    // SVG scripts have different attribute and text rules. The site does not
    // use them; reject them rather than silently misclassifying or hashing one.
    if (script.namespaceURI !== 'http://www.w3.org/1999/xhtml') {
      throw new Error(`Unexpected non-HTML script in ${file}.`);
    }
    const attrs = new Map(script.attrs.map(({ name, value }) => [name, value]));
    if (attrs.has('src')) continue;
    const type = (attrs.get('type') ?? '').trim().toLowerCase();
    // JSON-LD is data, not JavaScript. Changing it must not widen script-src.
    if (type === 'application/ld+json') continue;
    if (type && type !== 'module' && !JAVASCRIPT_TYPES.has(type)) {
      throw new Error(
        `Unexpected inline script type ${JSON.stringify(type)} in ${file}. Only JSON-LD data blocks are supported.`
      );
    }
    const location = script.sourceCodeLocation;
    if (!location?.startTag || !location.endTag) {
      throw new Error(`Unclosed inline script in ${file}.`);
    }
    // Use source offsets, not serialized HTML or decoded/trimmed text: every
    // character in the shipped script contributes to its CSP hash.
    bodies.push(html.slice(location.startTag.endOffset, location.endTag.startOffset));
  }
  if (bodies.length === 0) {
    throw new Error(`No executable inline script found in ${file} — the theme script should be there.`);
  }
  if (bodies.length !== 1) {
    throw new Error(
      `Expected exactly one executable inline script in ${file}, found ${bodies.length}. The theme script is meant to be the only one.`
    );
  }
  return `'sha256-${createHash('sha256').update(bodies[0], 'utf8').digest('base64')}'`;
}
