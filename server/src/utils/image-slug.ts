import path from 'node:path';

export const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.avif'] as const;

/** Whether a file name or URL path ends in one of `IMAGE_EXTENSIONS` (any case). */
export function hasImageExtension(fileName: string): boolean {
  return (IMAGE_EXTENSIONS as readonly string[]).includes(
    path.posix.extname(fileName).toLowerCase(),
  );
}

/**
 * Lower-case, accents removed, every run of other characters → `-`, no leading or trailing `-`.
 * `"Abstract Vibrance"` → `abstract-vibrance`, `"Élan (No. 2)"` → `elan-no-2`.
 */
export function toImageSlug(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/\p{Mark}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export interface ImageIndex {
  /** Slug → the file used for it. */
  files: Map<string, string>;
  /** Slugs that more than one file maps to, with every candidate (the first one is used). */
  duplicates: Map<string, string[]>;
}

/**
 * Maps image files to slugs of their names, so `Abstract Vibrance.JPG` and `abstract-vibrance.jpg`
 * both match the title "Abstract Vibrance". Other files are ignored. With several files for one
 * slug, the first in sorted order wins.
 */
export function indexImageFiles(fileNames: readonly string[]): ImageIndex {
  const candidates = new Map<string, string[]>();

  for (const fileName of [...fileNames].sort()) {
    if (!hasImageExtension(fileName)) continue;

    const slug = toImageSlug(path.parse(fileName).name);
    if (!slug) continue;
    candidates.set(slug, [...(candidates.get(slug) ?? []), fileName]);
  }

  const files = new Map<string, string>();
  const duplicates = new Map<string, string[]>();
  for (const [slug, names] of candidates) {
    files.set(slug, names[0] as string);
    if (names.length > 1) duplicates.set(slug, names);
  }
  return { files, duplicates };
}

/** The public URL of a file in the images folder; the name is percent-encoded. */
export function imageUrl(publicUrl: string, route: string, fileName: string): string {
  return `${publicUrl}${route}/${encodeURIComponent(fileName)}`;
}
