import { FieldError } from '@/components/ui/field';

/** A form-level error (React Hook Form's `errors.root`), e.g. "Invalid email or password". */
export function FormRootError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <FieldError className="rounded-lg bg-destructive/10 px-3 py-2 text-center">
      {message}
    </FieldError>
  );
}
