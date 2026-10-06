import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface HealthResponse {
  status: string;
  db: string;
}

function useApiHealth() {
  return useQuery({
    queryKey: ['health'],
    queryFn: () => api.get<HealthResponse>('/health'),
  });
}

export function GalleryPage() {
  const health = useApiHealth();

  let statusText = 'API: checking…';
  if (health.isError) statusText = `API: unavailable (${health.error.message})`;
  else if (health.isSuccess) statusText = `API: ${health.data.status}`;

  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-semibold">Explore Our Collection</h1>
      <p
        role="status"
        className={cn('text-sm', health.isError ? 'text-destructive' : 'text-muted-foreground')}
      >
        {statusText}
      </p>
    </section>
  );
}
