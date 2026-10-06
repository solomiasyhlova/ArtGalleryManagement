import type { Artwork } from '@art-gallery/shared';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { ARTWORK_TYPE_STYLES } from '@/lib/artwork-types';
import { formatPrice } from '@/lib/format';
import { cn } from '@/lib/utils';
import { ArtworkImage } from './ArtworkImage';
import { AvailabilityBadge } from './AvailabilityBadge';
import { TypeBadge } from './TypeBadge';

interface ArtworkCardProps {
  artwork: Artwork;
  /** Controls over the top right of the image (the admin menu), kept outside the card link. */
  actions?: ReactNode;
}

export function ArtworkCard({ artwork, actions }: ArtworkCardProps) {
  const { id, title, artist, type, price, availability, imageUrl } = artwork;

  // The lift is on the wrapper, so hovering the actions keeps the card raised with them.
  return (
    <div className="group relative h-full transition-[translate] motion-safe:hover:-translate-y-0.5">
      <Link
        to={`/artworks/${id}`}
        className={cn(
          'block h-full overflow-hidden rounded-lg border-2 bg-card text-card-foreground shadow-sm transition-shadow outline-none group-hover:shadow-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          ARTWORK_TYPE_STYLES[type].borderClass,
        )}
      >
        <ArtworkImage
          src={imageUrl}
          alt={`${title} by ${artist}`}
          type={type}
          className="m-3 mb-0 rounded-md"
        />
        <div className="space-y-2 p-3">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="truncate font-semibold" title={title}>
              {title}
            </h2>
            <p className="shrink-0 font-bold">{formatPrice(price)}</p>
          </div>
          <p className="truncate text-sm text-muted-foreground">By: {artist}</p>
          <div className="flex flex-wrap gap-2">
            <TypeBadge type={type} />
            <AvailabilityBadge availability={availability} />
          </div>
        </div>
      </Link>
      {actions && <div className="absolute top-5 right-5">{actions}</div>}
    </div>
  );
}
