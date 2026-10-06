import { loginSchema, type LoginInput } from '@art-gallery/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router';
import { AuthCard } from '@/components/auth/AuthCard';
import { FormRootError } from '@/components/form/FormRootError';
import { FormTextField } from '@/components/form/FormTextField';
import { SubmitButton } from '@/components/form/SubmitButton';
import { FieldGroup } from '@/components/ui/field';
import { useAuth } from '@/hooks/useAuth';
import { applyApiError } from '@/lib/form-errors';
import { isUnauthenticated } from '@/lib/query-client';

const FIELDS = ['email', 'password'] as const;

export function LoginPage() {
  const { login } = useAuth();
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onTouched',
  });
  const { isSubmitting, errors } = form.formState;

  // On success, GuestOnlyRoute sees the user and goes to `?redirect=` or `/`.
  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await login(values);
    } catch (error) {
      if (isUnauthenticated(error)) {
        form.setError('root', { type: 'server', message: 'Invalid email or password' });
      } else {
        applyApiError(error, form.setError, FIELDS);
      }
    }
  });

  return (
    <AuthCard
      title="Log in"
      description="Sign in to explore the collection."
      footer={
        <p>
          No account?{' '}
          <Link
            to="/register"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Register
          </Link>
        </p>
      }
    >
      <form onSubmit={onSubmit} noValidate>
        <FieldGroup>
          <FormRootError message={errors.root?.message} />
          <FormTextField
            control={form.control}
            name="email"
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
          />
          <FormTextField
            control={form.control}
            name="password"
            label="Password"
            type="password"
            autoComplete="current-password"
          />
          <SubmitButton isPending={isSubmitting} size="lg" className="w-full">
            Log in
          </SubmitButton>
        </FieldGroup>
      </form>
    </AuthCard>
  );
}
