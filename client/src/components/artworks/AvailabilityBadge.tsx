import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface AvailabilityBadgeProps {
  availability: boolean;
  className?: string;
}

export function AvailabilityBadge({ availability, className }: AvailabilityBadgeProps) {
  return (
    <Badge
      className={cn(
        availability
          ? 'bg-success-badge text-success-badge-foreground'
          : // --muted-foreground text on --muted is 4.4:1, just under AA; the dot keeps the muted color.
            'bg-muted text-secondary-foreground',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn('size-1.5 rounded-full', availability ? 'bg-success' : 'bg-muted-foreground')}
      />
      {availability ? 'For sale' : 'Exhibition only'}
    </Badge>
  );
}
