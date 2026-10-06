import { z } from 'zod';

/** bcrypt silently ignores everything after the first 72 bytes, so longer passwords are rejected. */
export const PASSWORD_MAX_BYTES = 72;

export const PASSWORD_MIN_LENGTH = 8;

const PASSWORD_TOO_LONG = `Password must be at most ${PASSWORD_MAX_BYTES} bytes (accented letters and emoji use more than one)`;

/** UTF-8 byte length, the unit bcrypt counts in. Lone surrogates count as 3, like `TextEncoder`. */
export function utf8ByteLength(value: string): number {
  let bytes = 0;
  for (const char of value) {
    const codePoint = char.codePointAt(0) ?? 0;
    bytes += codePoint < 0x80 ? 1 : codePoint < 0x800 ? 2 : codePoint < 0x10000 ? 3 : 4;
  }
  return bytes;
}

const fitsBcrypt = (value: string) => utf8ByteLength(value) <= PASSWORD_MAX_BYTES;

/** Trimmed and lower-cased before validation, so lookups and inserts always match. */
export const emailSchema = z
  .string({ error: 'Email is required' })
  .trim()
  .toLowerCase()
  .pipe(z.email('Enter a valid email address').max(254, 'Email must be at most 254 characters'));

/** Rules for a new password. Login only checks presence and the bcrypt limit. */
export const passwordSchema = z
  .string({ error: 'Password is required' })
  .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
  .refine(fitsBcrypt, PASSWORD_TOO_LONG);

export const nameSchema = z
  .string({ error: 'Name is required' })
  .trim()
  .min(1, 'Name is required')
  .max(50, 'Name must be at most 50 characters');

export const loginSchema = z.object({
  email: emailSchema,
  password: z
    .string({ error: 'Password is required' })
    .min(1, 'Password is required')
    .refine(fitsBcrypt, PASSWORD_TOO_LONG),
});

export type LoginInput = z.infer<typeof loginSchema>;
