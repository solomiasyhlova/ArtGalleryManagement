import { Palette } from 'lucide-react';
import { Link } from 'react-router';
import { UserMenu } from './UserMenu';

export function Header() {
  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="flex items-center gap-2 rounded-md text-lg font-semibold text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <Palette className="size-6" aria-hidden="true" />
          ArtGalleryManager
        </Link>
        <UserMenu />
      </div>
    </header>
  );
}
