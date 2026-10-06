import type { ReactNode } from 'react';

interface SocialLink {
  label: string;
  href: string;
  /** Stroke paths on a 24×24 grid. lucide 1.x dropped its brand icons. */
  paths: ReactNode;
}

const SOCIAL_LINKS: SocialLink[] = [
  {
    label: 'Facebook',
    href: 'https://www.facebook.com',
    paths: <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />,
  },
  {
    label: 'X',
    href: 'https://x.com',
    paths: (
      <>
        <path d="M4 4l11.733 16H20L8.267 4z" />
        <path d="M4 20l6.768-6.768m2.46-2.46L20 4" />
      </>
    ),
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com',
    paths: (
      <>
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <path d="M17.5 6.5h.01" />
      </>
    ),
  },
];

export function Footer() {
  return (
    <footer className="bg-footer text-footer-foreground">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div className="space-y-1">
          <p className="text-lg font-semibold">ArtGalleryManager</p>
          <p className="text-sm text-footer-foreground/70">
            Your go-to platform for managing and exploring exquisite art pieces.
          </p>
        </div>
        <ul className="flex items-center gap-2">
          {SOCIAL_LINKS.map(({ label, href, paths }) => (
            <li key={label}>
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                aria-label={label}
                className="flex size-9 items-center justify-center rounded-md outline-none transition-colors hover:bg-footer-foreground/10 focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="size-5"
                  aria-hidden="true"
                >
                  {paths}
                </svg>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
