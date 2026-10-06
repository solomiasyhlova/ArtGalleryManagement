import { Link } from 'react-router';
import { Button } from '@/components/ui/button';

export function NotFoundPage() {
  return (
    <section className="flex flex-col items-center gap-4 py-16 text-center">
      <p className="text-sm font-medium text-muted-foreground">404</p>
      <h1 className="text-3xl font-semibold">Page not found</h1>
      <p className="text-muted-foreground">The page you are looking for doesn't exist.</p>
      <Button asChild>
        <Link to="/">Back to the gallery</Link>
      </Button>
    </section>
  );
}
