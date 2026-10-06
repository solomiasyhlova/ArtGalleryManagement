import type { Artwork } from '@art-gallery/shared';
import { EllipsisVertical, Pencil, Trash2 } from 'lucide-react';
import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface ArtworkCardMenuProps {
  artwork: Artwork;
  onEdit: (artwork: Artwork) => void;
  onDelete: (artwork: Artwork) => void;
  className?: string;
}

/** The admin Edit / Delete menu of a card. The dialogs live outside it, in the page. */
export function ArtworkCardMenu({ artwork, onEdit, onDelete, className }: ArtworkCardMenuProps) {
  // The chosen action runs once the menu has closed and returned focus to its trigger: the
  // dialog then opens over no other modal layer and gives focus back to the trigger on close.
  const pendingAction = useRef<(() => void) | null>(null);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="secondary"
          size="icon-sm"
          aria-label={`Actions for "${artwork.title}"`}
          className={cn(
            'bg-background/90 shadow-sm backdrop-blur-sm hover:bg-background',
            className,
          )}
        >
          <EllipsisVertical aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        onCloseAutoFocus={() => {
          const action = pendingAction.current;
          pendingAction.current = null;
          action?.();
        }}
      >
        <DropdownMenuItem onSelect={() => (pendingAction.current = () => onEdit(artwork))}>
          <Pencil aria-hidden="true" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          onSelect={() => (pendingAction.current = () => onDelete(artwork))}
        >
          <Trash2 aria-hidden="true" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
