import { describe, expect, it } from 'vitest';
import {
  emailSchema,
  loginSchema,
  nameSchema,
  passwordSchema,
  registerSchema,
  utf8ByteLength,
} from './auth.js';

describe('emailSchema', () => {
  it('trims and lower-cases before validating', () => {
    expect(emailSchema.parse('  Admin@Gallery.LOCAL ')).toBe('admin@gallery.local');
  });

  it.each(['', 'admin', 'admin@localhost', 'a b@gallery.local'])('rejects %j', (value) => {
    expect(emailSchema.safeParse(value).success).toBe(false);
  });

  it('accepts up to 254 characters', () => {
    const email = (lastLabel: number) =>
      `${'a'.repeat(64)}@${'b'.repeat(63)}.${'c'.repeat(63)}.${'d'.repeat(lastLabel)}.com`;

    expect(email(57)).toHaveLength(254);
    expect(emailSchema.safeParse(email(57)).success).toBe(true);
    expect(emailSchema.safeParse(email(58)).success).toBe(false);
  });
});

describe('utf8ByteLength', () => {
  it.each([
    ['', 0],
    ['a', 1],
    ['é', 2],
    ['€', 3],
    ['😀', 4],
    ['\uD800', 3],
    ['aé€😀', 10],
  ])('%j is %i bytes', (value, bytes) => {
    expect(utf8ByteLength(value)).toBe(bytes);
  });
});

describe('passwordSchema', () => {
  it('accepts 8 characters up to 72 bytes', () => {
    expect(passwordSchema.safeParse('a'.repeat(8)).success).toBe(true);
    expect(passwordSchema.safeParse('a'.repeat(72)).success).toBe(true);
    expect(passwordSchema.safeParse('é'.repeat(36)).success).toBe(true);
    expect(passwordSchema.safeParse('😀'.repeat(18)).success).toBe(true);
  });

  it('rejects fewer than 8 characters', () => {
    expect(passwordSchema.safeParse('a'.repeat(7)).success).toBe(false);
  });

  it('rejects more than 72 bytes, even when it is 72 characters or fewer', () => {
    expect(passwordSchema.safeParse('a'.repeat(73)).success).toBe(false);
    expect(passwordSchema.safeParse('😀'.repeat(19)).success).toBe(false);

    const result = passwordSchema.safeParse('é'.repeat(72));
    expect(result.error?.issues.map((issue) => issue.message)).toEqual([
      'Password must be at most 72 bytes (accented letters and emoji use more than one)',
    ]);
  });
});

describe('nameSchema', () => {
  it('trims and requires 1 to 50 characters', () => {
    expect(nameSchema.parse('  Gallery Admin ')).toBe('Gallery Admin');
    expect(nameSchema.safeParse('   ').success).toBe(false);
    expect(nameSchema.safeParse('a'.repeat(51)).success).toBe(false);
  });
});

describe('loginSchema', () => {
  it('normalizes the email and keeps the password as typed', () => {
    expect(loginSchema.parse({ email: ' Admin@Gallery.local', password: ' pass ' })).toEqual({
      email: 'admin@gallery.local',
      password: ' pass ',
    });
  });

  it('accepts short passwords so login never leaks the password policy', () => {
    expect(loginSchema.safeParse({ email: 'a@b.co', password: 'x' }).success).toBe(true);
  });

  it('requires both fields with field-level messages', () => {
    const result = loginSchema.safeParse({ email: '', password: '' });

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => [issue.path[0], issue.message])).toEqual([
      ['email', 'Enter a valid email address'],
      ['password', 'Password is required'],
    ]);
  });

  it('rejects passwords over the 72-byte bcrypt limit', () => {
    expect(loginSchema.safeParse({ email: 'a@b.co', password: 'a'.repeat(73) }).success).toBe(
      false,
    );
    expect(loginSchema.safeParse({ email: 'a@b.co', password: 'é'.repeat(37) }).success).toBe(
      false,
    );
  });

  it('strips unknown keys', () => {
    expect(loginSchema.parse({ email: 'a@b.co', password: 'x', role: 'admin' })).not.toHaveProperty(
      'role',
    );
  });
});

describe('registerSchema', () => {
  const valid = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
    confirmPassword: 'password123',
  };

  const fieldErrors = (input: unknown) =>
    registerSchema
      .safeParse(input)
      .error?.issues.map((issue) => [issue.path.join('.'), issue.message]);

  it('trims the name and normalizes the email', () => {
    expect(
      registerSchema.parse({ ...valid, name: ' Test User ', email: ' Test@Example.com' }),
    ).toEqual(valid);
  });

  it('strips a role from the body', () => {
    expect(registerSchema.parse({ ...valid, role: 'admin' })).not.toHaveProperty('role');
  });

  it('reports mismatched passwords on confirmPassword', () => {
    expect(fieldErrors({ ...valid, confirmPassword: 'password124' })).toEqual([
      ['confirmPassword', 'Passwords do not match'],
    ]);
  });

  it('reports a mismatch alongside errors in other fields', () => {
    expect(
      fieldErrors({ email: 'test@example.com', password: 'password123', confirmPassword: 'x' }),
    ).toEqual([
      ['name', 'Name is required'],
      ['confirmPassword', 'Passwords do not match'],
    ]);
  });

  it('asks for the confirmation instead of reporting a mismatch when it is empty', () => {
    expect(fieldErrors({ ...valid, confirmPassword: '' })).toEqual([
      ['confirmPassword', 'Please confirm your password'],
    ]);
    expect(fieldErrors({ ...valid, confirmPassword: undefined })).toEqual([
      ['confirmPassword', 'Please confirm your password'],
    ]);
  });

  it('applies the new-password rules', () => {
    expect(fieldErrors({ ...valid, password: 'short', confirmPassword: 'short' })).toEqual([
      ['password', 'Password must be at least 8 characters'],
    ]);
    const tooLong = 'é'.repeat(37);
    expect(
      registerSchema.safeParse({ ...valid, password: tooLong, confirmPassword: tooLong }).success,
    ).toBe(false);
  });

  it('rejects an invalid email', () => {
    expect(fieldErrors({ ...valid, email: 'not-an-email' })).toEqual([
      ['email', 'Enter a valid email address'],
    ]);
  });

  it('rejects a name longer than 50 characters', () => {
    expect(registerSchema.safeParse({ ...valid, name: 'a'.repeat(51) }).success).toBe(false);
  });

  it.each([undefined, null, 'nope'])('rejects %j as the body without throwing', (input) => {
    expect(fieldErrors(input)).toEqual([
      ['', expect.stringMatching(/^Invalid input: expected object/)],
    ]);
  });
});
