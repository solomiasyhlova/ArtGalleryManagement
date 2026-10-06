import type { ArtworkType } from '@art-gallery/shared';
import { useState } from 'react';
import { ARTWORK_TYPE_STYLES } from '@/lib/artwork-types';
import { cn } from '@/lib/utils';

interface ArtworkImageProps {
  src: string | null;
  alt: string;
  type: ArtworkType;
  /** `eager` for a picture that is on screen right away (the detail page). */
  loading?: 'lazy' | 'eager';
  className?: string;
}

/** A 4:3 picture. With no `src`, or once it fails to load, a placeholder shows the type icon. */
export function ArtworkImage({ src, alt, type, loading = 'lazy', className }: ArtworkImageProps) {
  // The URL that failed, not a boolean, so a new `src` (after an edit) gets its own attempt.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showImage = src !== null && src !== failedSrc;
  const Icon = ARTWORK_TYPE_STYLES[type].icon;

  return (
    <div className={cn('aspect-4/3 overflow-hidden bg-muted', className)}>
      {showImage ? (
        <img
          src={src}
          alt={alt}
          loading={loading}
          decoding="async"
          onError={() => setFailedSrc(src)}
          className="size-full object-cover"
        />
      ) : (
        <div
          role="img"
          aria-label={alt}
          className="flex size-full items-center justify-center text-muted-foreground"
        >
          <Icon className="size-12" strokeWidth={1.5} aria-hidden="true" />
        </div>
      )}
    </div>
  );
}
