import type { ComponentProps } from 'react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

interface SubmitButtonProps extends Omit<ComponentProps<typeof Button>, 'type'> {
  isPending: boolean;
}

/** Disabled with a spinner while the request is pending, so a form can't be sent twice. */
export function SubmitButton({ isPending, disabled, children, ...props }: SubmitButtonProps) {
  return (
    <Button type="submit" disabled={isPending || disabled} aria-busy={isPending} {...props}>
      {isPending && <Spinner data-icon="inline-start" aria-hidden="true" />}
      {children}
    </Button>
  );
}
