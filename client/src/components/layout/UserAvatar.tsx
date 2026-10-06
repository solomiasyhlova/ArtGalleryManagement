import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getInitials } from '@/lib/initials';

interface UserAvatarProps {
  name: string;
  className?: string;
}

/** The user's initials in a circle. Decorative: the name is always shown next to it. */
export function UserAvatar({ name, className }: UserAvatarProps) {
  return (
    <Avatar className={className} aria-hidden="true">
      <AvatarFallback className="bg-primary font-medium text-primary-foreground">
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
