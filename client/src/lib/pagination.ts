/** A page number, or a gap in the page list. The two gaps have distinct values so they can be keys. */
export type PageItem = number | 'ellipsis-start' | 'ellipsis-end';

/** Up to this many pages are listed without a gap. */
const MAX_ITEMS = 7;

function range(from: number, to: number): number[] {
  return Array.from({ length: to - from + 1 }, (_, index) => from + index);
}

/**
 * The page list for a pagination bar: the first and last page, the current page with one
 * neighbour on each side, and an ellipsis for each gap. Past 7 pages the list always has
 * 7 items, so the bar keeps its width while paging. `current` is clamped to `1..total`.
 */
export function getPageItems(current: number, total: number): PageItem[] {
  if (total <= MAX_ITEMS) return range(1, Math.max(total, 0));

  const page = Math.min(Math.max(current, 1), total);
  if (page <= 4) return [...range(1, 5), 'ellipsis-end', total];
  if (page >= total - 3) return [1, 'ellipsis-start', ...range(total - 4, total)];
  return [1, 'ellipsis-start', page - 1, page, page + 1, 'ellipsis-end', total];
}
