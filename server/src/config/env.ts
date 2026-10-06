import { emailSchema, nameSchema, passwordSchema } from '@art-gallery/shared';
import ms, { type StringValue } from 'ms';
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(8000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  // Normalized to the bare origin so it matches the browser's `Origin` header for CORS.
  CLIENT_URL: z.url({ protocol: /^https?$/ }).transform((url) => new URL(url).origin),
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  JWT_SECRET: z.string().min(32, 'Must be at least 32 characters'),
  // Feeds both the JWT `expiresIn` and the cookie `maxAge`. `ms` returns undefined for bad input,
  // and a bare number means milliseconds, so require at least one second.
  JWT_EXPIRES_IN: z
    .string()
    .default('1d')
    .refine((value) => (ms(value as StringValue) ?? 0) >= 1000, 'Must be a duration like 1d or 12h')
    .transform((value) => value as StringValue),
  // Only the seed script needs these.
  ADMIN_EMAIL: emailSchema.optional(),
  ADMIN_PASSWORD: passwordSchema.optional(),
  ADMIN_NAME: nameSchema.optional(),
});

export type Env = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(`Invalid environment variables:\n${z.prettifyError(parsed.error)}`);
  process.exit(1);
}

export const env: Env = parsed.data;
