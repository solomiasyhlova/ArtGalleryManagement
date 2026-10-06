import { ChevronDown, LogOut } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Spinner } from '@/components/ui/spinner';
import { useAuth } from '@/hooks/useAuth';
import { getErrorMessage } from '@/lib/form-errors';
import { UserAvatar } from './UserAvatar';

export function UserMenu() {
  const { user, isAdmin, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  if (!user) return null;

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (error) {
      toast.error('Could not log out', { description: getErrorMessage(error) });
      setIsLoggingOut(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-auto gap-2 px-1 py-1.5 sm:px-2.5"
          aria-label={`Account menu for ${user.name} (${isAdmin ? 'Admin' : 'User'})`}
        >
          <UserAvatar name={user.name} />
          <span className="hidden max-w-40 truncate font-medium sm:inline">{user.name}</span>
          {isAdmin ? (
            <Badge>Admin</Badge>
          ) : (
            // Dark-on-light reads lighter than the Admin badge's light-on-dark at the same weight.
            <Badge variant="secondary" className="font-semibold">
              User
            </Badge>
          )}
          <ChevronDown className="hidden text-muted-foreground sm:block" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="truncate text-sm font-medium text-foreground">{user.name}</span>
          <span className="truncate text-xs font-normal text-muted-foreground">{user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={isLoggingOut}
          onSelect={(event) => {
            // Keep the menu open so the spinner shows until the request finishes.
            event.preventDefault();
            void handleLogout();
          }}
        >
          {isLoggingOut ? <Spinner aria-hidden="true" /> : <LogOut aria-hidden="true" />}
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
