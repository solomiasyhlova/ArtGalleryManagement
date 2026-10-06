import type { MouseEvent } from 'react';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { cn } from '@/lib/utils';
import { getPageItems } from '@/lib/pagination';

interface GalleryPaginationProps {
  page: number;
  totalPages: number;
  /** The query string of a page under the current filters. */
  pageSearch: (page: number) => string;
  /** Called when a page link navigates in this tab. */
  onNavigate: () => void;
}

/** Previous / page numbers / Next as links, so every page has a shareable URL. Hidden for one page. */
export function GalleryPagination({
  page,
  totalPages,
  pageSearch,
  onNavigate,
}: GalleryPaginationProps) {
  if (totalPages <= 1) return null;

  function handleClick(event: MouseEvent) {
    // Modified clicks open a new tab or window and leave this page where it is.
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    onNavigate();
  }

  function edgeLinkProps(target: number, disabled: boolean) {
    return disabled
      ? {
          to: { search: pageSearch(page) },
          'aria-disabled': true,
          tabIndex: -1,
          className: 'pointer-events-none opacity-50',
        }
      : { to: { search: pageSearch(target) }, onClick: handleClick };
  }

  return (
    <Pagination aria-label="Pagination">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious {...edgeLinkProps(page - 1, page <= 1)} />
        </PaginationItem>
        {getPageItems(page, totalPages).map((item) =>
          typeof item === 'number' ? (
            <PaginationItem key={item}>
              <PaginationLink
                to={{ search: pageSearch(item) }}
                isActive={item === page}
                aria-label={`Page ${item}`}
                onClick={handleClick}
                className={cn(item === page && 'pointer-events-none')}
              >
                {item}
              </PaginationLink>
            </PaginationItem>
          ) : (
            <PaginationItem key={item}>
              <PaginationEllipsis />
            </PaginationItem>
          ),
        )}
        <PaginationItem>
          <PaginationNext {...edgeLinkProps(page + 1, page >= totalPages)} />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
