import { ARTIST_MAX_LENGTH, ARTWORK_TYPES, PRICE_SORTS } from '@art-gallery/shared';
import { Search } from 'lucide-react';
import { useEffect, useEffectEvent, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { ARTWORK_TYPE_STYLES } from '@/lib/artwork-types';
import type { GalleryFilters } from '@/lib/gallery-params';

const SEARCH_DEBOUNCE_MS = 300;

// Radix Select doesn't allow `""` as an item value, so "no param" gets a sentinel.
const ALL_TYPES = 'all';
const NEWEST = 'newest';

const SORT_OPTIONS = [
  { value: NEWEST, label: 'Newest' },
  { value: 'asc', label: 'Price: Low → High' },
  { value: 'desc', label: 'Price: High → Low' },
] as const;

interface ArtworkToolbarProps {
  filters: GalleryFilters;
  hasFilters: boolean;
  onFiltersChange: (changes: GalleryFilters) => void;
  onArtistChange: (value: string) => void;
  onClear: () => void;
  /** Right-hand slot, e.g. the admin "Add New Artwork" button. */
  actions?: ReactNode;
}

export function ArtworkToolbar({
  filters,
  hasFilters,
  onFiltersChange,
  onArtistChange,
  onClear,
  actions,
}: ArtworkToolbarProps) {
  return (
    <div
      role="search"
      aria-label="Filter artworks"
      className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center"
    >
      <ArtistSearch artist={filters.artist} onCommit={onArtistChange} />
      <Select
        value={filters.type ?? ALL_TYPES}
        onValueChange={(value) => onFiltersChange({ type: ARTWORK_TYPES.find((t) => t === value) })}
      >
        <SelectTrigger aria-label="Filter by type" className="w-full sm:w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_TYPES}>All types</SelectItem>
          {ARTWORK_TYPES.map((type) => (
            <SelectItem key={type} value={type}>
              {ARTWORK_TYPE_STYLES[type].label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={filters.price ?? NEWEST}
        onValueChange={(value) => onFiltersChange({ price: PRICE_SORTS.find((s) => s === value) })}
      >
        <SelectTrigger aria-label="Sort by" className="w-full sm:w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {hasFilters && (
        <Button variant="link" className="self-start px-0 sm:self-auto" onClick={onClear}>
          Clear filters
        </Button>
      )}
      {actions && <div className="sm:ml-auto">{actions}</div>}
    </div>
  );
}

interface ArtistSearchProps {
  /** The artist in the URL. */
  artist: string | undefined;
  onCommit: (value: string) => void;
}

/**
 * Keeps its own input state and commits it after a pause in typing, so the URL round-trip
 * never makes the input lag or the caret jump.
 */
function ArtistSearch({ artist, onCommit }: ArtistSearchProps) {
  const [value, setValue] = useState(artist ?? '');
  const debounced = useDebouncedValue(value, SEARCH_DEBOUNCE_MS);

  // Follow the URL when it changes from outside (Back / Forward, Clear filters). A change that
  // only echoes the last commit is skipped: the input may already hold newer keystrokes.
  const [syncedArtist, setSyncedArtist] = useState(artist);
  if (artist !== syncedArtist) {
    setSyncedArtist(artist);
    if (artist !== (debounced.trim() || undefined)) setValue(artist ?? '');
  }

  // An effect event, so a URL change alone (which also renews `onCommit`) never re-commits a stale value.
  const commit = useEffectEvent((next: string) => onCommit(next));
  useEffect(() => {
    commit(debounced);
  }, [debounced]);

  return (
    <div className="relative w-full sm:w-64">
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        type="search"
        aria-label="Search by artist"
        placeholder="Search by artist…"
        maxLength={ARTIST_MAX_LENGTH}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className="pl-8"
      />
    </div>
  );
}
