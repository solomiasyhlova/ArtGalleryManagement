import { ArrowLeft } from 'lucide-react';
import type { MouseEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { cameFromGallery } from '@/lib/location-state';

/**
 * Links to the gallery. Opened from a gallery card, a plain click goes back in history instead,
 * so the gallery's filters, page and scroll position come back with it.
 */
export function BackToGalleryLink() {
  const { state } = useLocation();
  const navigate = useNavigate();

  function handleClick(event: MouseEvent) {
    // Modified clicks open the gallery in a new tab or window.
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    if (!cameFromGallery(state)) return;
    event.preventDefault();
    void navigate(-1);
  }

  return (
    <Button variant="ghost" size="sm" asChild className="-ml-2.5 text-muted-foreground">
      <Link to="/" onClick={handleClick}>
        <ArrowLeft data-icon="inline-start" aria-hidden="true" />
        Back to gallery
      </Link>
    </Button>
  );
}
