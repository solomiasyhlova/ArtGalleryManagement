import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api, ApiError } from './api';

const fetchMock = vi.fn<typeof fetch>();

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function catchError(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error('Expected the request to reject');
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
});

describe('api', () => {
  it('sends a credentialed GET to VITE_API_URL + path and returns the JSON body', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ status: 'ok' }));

    await expect(api.get('/health')).resolves.toEqual({ status: 'ok' });

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('http://api.test/health');
    expect(init).toMatchObject({ method: 'GET', credentials: 'include', body: undefined });
    expect(init?.headers).not.toHaveProperty('Content-Type');
  });

  it('serializes the body as JSON for POST and PUT', async () => {
    fetchMock.mockImplementation(async () => jsonResponse({ id: '1' }, 201));
    const payload = { title: 'Tranquil Lake', price: 3500 };

    await api.post('/artworks', payload);
    await api.put('/artworks/1', payload);

    for (const [method, [, init]] of [
      ['POST', fetchMock.mock.calls[0]!],
      ['PUT', fetchMock.mock.calls[1]!],
    ] as const) {
      expect(init).toMatchObject({
        method,
        credentials: 'include',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' },
      });
    }
  });

  it('returns undefined for 204 No Content', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    await expect(api.delete('/artworks/1')).resolves.toBeUndefined();
    expect(fetchMock.mock.calls[0]![1]).toMatchObject({
      method: 'DELETE',
      credentials: 'include',
    });
  });

  it('throws an ApiError parsed from the error body', async () => {
    const details = { price: ['Must be greater than 0'] };
    fetchMock.mockResolvedValue(
      jsonResponse(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid request body', details } },
        400,
      ),
    );

    const error = await catchError(api.post('/artworks', {}));

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'Invalid request body',
      details,
    });
  });

  it('falls back to UNKNOWN_ERROR when the error body has another shape', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ status: 'error', db: 'down' }, 503));

    const error = await catchError(api.get('/health'));

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 503,
      code: 'UNKNOWN_ERROR',
      message: 'Request failed with status 503',
      details: undefined,
    });
  });

  it('falls back to UNKNOWN_ERROR when the error body is not JSON', async () => {
    fetchMock.mockResolvedValue(new Response('Bad Gateway', { status: 502 }));

    await expect(api.get('/health')).rejects.toMatchObject({ status: 502, code: 'UNKNOWN_ERROR' });
  });

  it('throws a NETWORK_ERROR ApiError when fetch fails', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    const error = await catchError(api.get('/health'));

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 0, code: 'NETWORK_ERROR' });
  });
});

describe('api module', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('fails fast on import when VITE_API_URL is missing', async () => {
    vi.stubEnv('VITE_API_URL', '');
    vi.resetModules();

    await expect(import('./api')).rejects.toThrow('VITE_API_URL is not set');
  });
});
