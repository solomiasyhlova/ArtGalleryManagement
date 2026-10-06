import { ArtworkGrid } from '@/components/artworks/ArtworkGrid';
import { useArtworks } from '@/hooks/useArtworks';

export function GalleryPage() {
  const { data, error, refetch, isFetching } = useArtworks();

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-semibold">Explore Our Collection</h1>
      <ArtworkGrid
        artworks={data?.data}
        error={error}
        onRetry={() => void refetch()}
        isRetrying={isFetching}
      />
    </section>
  );
}
