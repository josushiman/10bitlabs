// Checksums and byte lengths were taken from the reviewed, committed font assets,
// not from new downloads. The Google-hosted URLs were checked against those pins.
// Updating a URL, font, CSS range, or checksum requires an explicit source review.
// Google Fonts CSS is deliberately not a runtime input to the download script.
const LATIN =
  'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, ' +
  'U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, ' +
  'U+2212, U+2215, U+FEFF, U+FFFD';
const LATIN_EXT =
  'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, ' +
  'U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, ' +
  'U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF';

export const FONTS = Object.freeze(
  [
    {
      family: 'IBM Plex Mono',
      weight: '600',
      file: 'ibm-plex-mono-latin-600.woff2',
      url: 'https://fonts.gstatic.com/s/ibmplexmono/v20/-F6qfjptAgt5VM-kVkqdyU8n3vAOwlBFgsAXHNk.woff2',
      bytes: 10120,
      sha256: 'ad4580d8cb4b5f627c2d18457656732f7f7b070f7837fbc380e08054157e6f6c',
      unicodeRange: LATIN,
      comment: 'The Sira artwork is supplied with this exact embedded IBM Plex Mono face.'
    },
    {
      family: 'JetBrains Mono',
      weight: '400 600',
      file: 'jetbrains-mono-latin-ext.woff2',
      url: 'https://fonts.gstatic.com/s/jetbrainsmono/v24/tDbv2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKwBNntkaToggR7BYRbKPx7cwgknk-6nFg.woff2',
      bytes: 11596,
      sha256: '9c38cb2d0d2d93c1ee6e21fa78db76f13ea7e15e15cc64214c7ca89b6aaa35c4',
      unicodeRange: LATIN_EXT
    },
    {
      family: 'JetBrains Mono',
      weight: '400 600',
      file: 'jetbrains-mono-latin.woff2',
      url: 'https://fonts.gstatic.com/s/jetbrainsmono/v24/tDbv2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKwBNntkaToggR7BYRbKPxDcwgknk-4.woff2',
      bytes: 31340,
      sha256: '2c32b9b3ee358c119e210f6f5195f9bd34894d78a785ff2e95d60e718e400af4',
      unicodeRange: LATIN
    },
    {
      family: 'Space Grotesk',
      weight: '500 700',
      file: 'space-grotesk-latin-ext.woff2',
      url: 'https://fonts.gstatic.com/s/spacegrotesk/v22/V8mDoQDjQSkFtoMM3T6r8E7mPb94C_k3HqUtEw.woff2',
      bytes: 18924,
      sha256: '054c266fbb441ee059365dba0885d206f67ca05b375de869b88e02ebfccc9b9d',
      unicodeRange: LATIN_EXT
    },
    {
      family: 'Space Grotesk',
      weight: '500 700',
      file: 'space-grotesk-latin.woff2',
      url: 'https://fonts.gstatic.com/s/spacegrotesk/v22/V8mDoQDjQSkFtoMM3T6r8E7mPbF4C_k3HqU.woff2',
      bytes: 22320,
      sha256: 'a0d054c4af557de20afd6ca59f47ab353bcaec49c63ff04b6c9d39d0f8910557',
      unicodeRange: LATIN
    }
  ].map(Object.freeze)
);
