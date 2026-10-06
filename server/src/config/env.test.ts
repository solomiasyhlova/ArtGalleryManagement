import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const REQUIRED = {
  CLIENT_URL: 'http://localhost:5173',
  DATABASE_URL: 'postgres://postgres:secret@localhost:5432/art_gallery',
  JWT_SECRET: 'x'.repeat(32),
};

// `env.ts` parses `process.env` on import, so each test stubs the variables and imports it fresh.
async function loadEnv(vars: Record<string, string | undefined>) {
  for (const [name, value] of Object.entries({ ...REQUIRED, PORT: undefined, ...vars })) {
    vi.stubEnv(name, value);
  }
  vi.resetModules();
  const { env } = await import('./env.js');
  return env;
}

describe('env PUBLIC_URL', () => {
  beforeEach(() => {
    vi.stubEnv('PUBLIC_URL', undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('defaults to localhost on the default port', async () => {
    expect((await loadEnv({})).PUBLIC_URL).toBe('http://localhost:8000');
  });

  it('defaults to localhost on the configured port', async () => {
    expect((await loadEnv({ PORT: '9000' })).PUBLIC_URL).toBe('http://localhost:9000');
  });

  it('uses an explicit value without trailing slashes', async () => {
    const env = await loadEnv({ PUBLIC_URL: 'https://api.gallery.example/v1//' });

    expect(env.PUBLIC_URL).toBe('https://api.gallery.example/v1');
  });

  it.each(['not a url', 'ftp://files.gallery.example'])('rejects %j and exits', async (value) => {
    const exit = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit');
    });
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(loadEnv({ PUBLIC_URL: value })).rejects.toThrow('process.exit');
    expect(exit).toHaveBeenCalledWith(1);
  });
});
