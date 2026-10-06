import { Spinner } from '@/components/ui/spinner';

export function FullPageSpinner() {
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <Spinner className="size-8 text-muted-foreground" />
    </div>
  );
}
