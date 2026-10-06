import { registerSchema, type RegisterInput } from '@art-gallery/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router';
import { AuthCard } from '@/components/auth/AuthCard';
import { FormRootError } from '@/components/form/FormRootError';
import { FormTextField } from '@/components/form/FormTextField';
import { SubmitButton } from '@/components/form/SubmitButton';
import { FieldGroup } from '@/components/ui/field';
import { useAuth } from '@/hooks/useAuth';
import { applyApiError } from '@/lib/form-errors';

const FIELDS = ['name', 'email', 'password', 'confirmPassword'] as const;

export function RegisterPage() {
  const { register } = useAuth();
  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
    mode: 'onTouched',
  });
  const { isSubmitting, errors } = form.formState;

  // A changed password can fix or break the match, but only re-check a confirmation the user
  // has already filled in, so "Please confirm your password" doesn't show up too early.
  useEffect(
    () =>
      form.subscribe({
        name: 'password',
        formState: { values: true },
        callback: () => {
          if (form.getFieldState('confirmPassword').isTouched) void form.trigger('confirmPassword');
        },
      }),
    [form],
  );

  // The new account is signed in right away, so GuestOnlyRoute sends it to `/`.
  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await register(values);
    } catch (error) {
      applyApiError(error, form.setError, FIELDS);
    }
  });

  return (
    <AuthCard
      title="Create an account"
      description="Register to browse and explore the gallery."
      footer={
        <p>
          Have an account?{' '}
          <Link
            to="/login"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Log in
          </Link>
        </p>
      }
    >
      <form onSubmit={onSubmit} noValidate>
        <FieldGroup>
          <FormRootError message={errors.root?.message} />
          <FormTextField
            control={form.control}
            name="name"
            label="Name"
            autoComplete="name"
            placeholder="Jane Doe"
          />
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
            autoComplete="new-password"
          />
          <FormTextField
            control={form.control}
            name="confirmPassword"
            label="Confirm password"
            type="password"
            autoComplete="new-password"
          />
          <SubmitButton isPending={isSubmitting} size="lg" className="w-full">
            Create account
          </SubmitButton>
        </FieldGroup>
      </form>
    </AuthCard>
  );
}
