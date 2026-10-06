import type { ArtworkType } from '@art-gallery/shared';
import { Badge } from '@/components/ui/badge';
import { ARTWORK_TYPE_STYLES } from '@/lib/artwork-types';
import { cn } from '@/lib/utils';

interface TypeBadgeProps {
  type: ArtworkType;
  className?: string;
}

export function TypeBadge({ type, className }: TypeBadgeProps) {
  const { label, badgeClass } = ARTWORK_TYPE_STYLES[type];
  return <Badge className={cn(badgeClass, className)}>{label}</Badge>;
}
