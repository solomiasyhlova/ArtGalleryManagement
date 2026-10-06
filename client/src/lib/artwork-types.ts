import type { ArtworkType } from '@art-gallery/shared';
import { Amphora, Camera, Monitor, Paintbrush, Pencil, Stamp, type LucideIcon } from 'lucide-react';

export interface ArtworkTypeStyle {
  label: string;
  /** Shown in the image placeholder. */
  icon: LucideIcon;
  /** Card border color, a softened accent like the mockup. Pair it with a border width (`border-2`). */
  borderClass: string;
  /** Badge background and text. */
  badgeClass: string;
}

/**
 * Display data for every artwork type. Class names are complete literals because Tailwind only
 * generates classes it finds whole in the source (`border-type-${type}` would never exist).
 */
export const ARTWORK_TYPE_STYLES: Record<ArtworkType, ArtworkTypeStyle> = {
  painting: {
    label: 'Painting',
    icon: Paintbrush,
    borderClass: 'border-type-painting/50',
    badgeClass: 'bg-type-painting-badge text-type-painting-badge-foreground',
  },
  sculpture: {
    label: 'Sculpture',
    icon: Amphora,
    borderClass: 'border-type-sculpture/50',
    badgeClass: 'bg-type-sculpture-badge text-type-sculpture-badge-foreground',
  },
  photography: {
    label: 'Photography',
    icon: Camera,
    borderClass: 'border-type-photography/50',
    badgeClass: 'bg-type-photography-badge text-type-photography-badge-foreground',
  },
  drawing: {
    label: 'Drawing',
    icon: Pencil,
    borderClass: 'border-type-drawing/50',
    badgeClass: 'bg-type-drawing-badge text-type-drawing-badge-foreground',
  },
  print: {
    label: 'Print',
    icon: Stamp,
    borderClass: 'border-type-print/50',
    badgeClass: 'bg-type-print-badge text-type-print-badge-foreground',
  },
  digital: {
    label: 'Digital Art',
    icon: Monitor,
    borderClass: 'border-type-digital/50',
    badgeClass: 'bg-type-digital-badge text-type-digital-badge-foreground',
  },
};
