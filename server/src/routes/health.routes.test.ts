import type { Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { healthRouter } from './health.routes.js';

const { query } = vi.hoisted(() => ({ query: vi.fn() }));

vi.mock('../db/data-source.js', () => ({ AppDataSource: { query } }));

// Runs the request through the router and resolves once the handler has sent its JSON body.
function getHealth(): Promise<{ status: number; body: unknown }> {
  return new Promise((resolve, reject) => {
    let status = 200;
    const res = {
      status: vi.fn((code: number) => {
        status = code;
        return res;
      }),
      json: vi.fn((body: unknown) => {
        resolve({ status, body });
        return res;
      }),
    };
    const req = { method: 'GET', url: '/health' } as Request;

    healthRouter(req, res as unknown as Response, (err?: unknown) =>
      reject(err ?? new Error('/health fell through to next()')),
    );
  });
}

describe('GET /health', () => {
  beforeEach(() => {
    query.mockReset();
  });

  it('returns ok with db up when SELECT 1 succeeds', async () => {
    query.mockResolvedValue([{ '?column?': 1 }]);

    await expect(getHealth()).resolves.toEqual({ status: 200, body: { status: 'ok', db: 'up' } });
    expect(query).toHaveBeenCalledWith('SELECT 1');
  });

  it('returns 503 with db down when the query fails', async () => {
    query.mockRejectedValue(new Error('connect ECONNREFUSED'));

    await expect(getHealth()).resolves.toEqual({
      status: 503,
      body: { status: 'error', db: 'down' },
    });
  });
});
