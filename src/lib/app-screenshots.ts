import type { ImageMetadata } from 'astro';

interface ScreenshotModule {
  default: ImageMetadata;
}

export interface AppScreenshot {
  image: ImageMetadata;
  label: string;
  path: string;
}

/*
  The path is deliberately static so Vite can discover the files at build time.
  Adding an image under one App's screenshots directory is enough to put it in
  that App's gallery; there is no manifest to keep in sync.
*/
const screenshotModules = import.meta.glob<ScreenshotModule>(
  '/src/assets/apps/*/screenshots/*.{avif,jpeg,jpg,png,webp}',
  { eager: true }
);

function labelFrom(path: string, index: number): string {
  const filename = path.split('/').at(-1)?.replace(/\.[^.]+$/, '') ?? '';
  const words = filename.replace(/^\d+[\s_-]*/, '').replace(/[-_]+/g, ' ').trim();
  if (!words) return `Screen ${index + 1}`;
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** Screenshots for one App, ordered by their filename prefix. */
export function screenshotsFor(appId: string): AppScreenshot[] {
  const directory = `/src/assets/apps/${appId}/screenshots/`;
  return Object.entries(screenshotModules)
    .filter(([path]) => path.startsWith(directory))
    .sort(([left], [right]) => left.localeCompare(right, 'en', { numeric: true }))
    .map(([path, module], index) => ({
      image: module.default,
      label: labelFrom(path, index),
      path
    }));
}
