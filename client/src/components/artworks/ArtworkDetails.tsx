import type { Artwork } from '@art-gallery/shared';
import type { ReactNode, Ref } from 'react';
import { formatDate, formatPrice } from '@/lib/format';
import { ArtworkImage } from './ArtworkImage';
import { AvailabilityBadge } from './AvailabilityBadge';
import { TypeBadge } from './TypeBadge';

interface ArtworkDetailsProps {
  artwork: Artwork;
  /** Gets focus from script only, e.g. after a dialog whose opener is gone. */
  headingRef?: Ref<HTMLHeadingElement>;
  /** Controls under the details (the admin Edit and Delete buttons). */
  actions?: ReactNode;
}

/** The large picture next to every field of the artwork; stacked below `lg`. */
export function ArtworkDetails({ artwork, headingRef, actions }: ArtworkDetailsProps) {
  const { title, artist, type, price, availability, imageUrl, createdAt } = artwork;

  return (
    <article className="grid gap-8 lg:grid-cols-2 lg:gap-12">
      <ArtworkImage
        src={imageUrl}
        alt={`${title} by ${artist}`}
        type={type}
        loading="eager"
        className="rounded-lg border"
      />
      <div className="flex min-w-0 flex-col gap-6">
        <div className="space-y-2">
          <h1
            ref={headingRef}
            tabIndex={-1}
            className="text-3xl font-semibold wrap-break-word outline-none"
          >
            {title}
          </h1>
          <p className="wrap-break-word text-muted-foreground">By {artist}</p>
        </div>
        <p className="text-4xl font-bold">{formatPrice(price)}</p>
        <dl className="grid grid-cols-[auto_1fr] items-center gap-x-8 gap-y-4 text-sm">
          <dt className="text-muted-foreground">Type</dt>
          <dd>
            <TypeBadge type={type} />
          </dd>
          <dt className="text-muted-foreground">Availability</dt>
          <dd className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <AvailabilityBadge availability={availability} />
            <span>
              {availability ? 'Available for purchase' : 'On display for exhibition only'}
            </span>
          </dd>
          <dt className="text-muted-foreground">Added</dt>
          <dd>
            <time dateTime={createdAt}>{formatDate(createdAt)}</time>
          </dd>
        </dl>
        {actions}
      </div>
    </article>
  );
}
