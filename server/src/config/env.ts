import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(8000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  // Normalized to the bare origin so it matches the browser's `Origin` header for CORS.
  CLIENT_URL: z.url({ protocol: /^https?$/ }).transform((url) => new URL(url).origin),
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
});

export type Env = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(`Invalid environment variables:\n${z.prettifyError(parsed.error)}`);
  process.exit(1);
}

export const env: Env = parsed.data;
