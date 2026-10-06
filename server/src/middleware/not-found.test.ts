import type { NextFunction, Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { HttpError } from '../utils/http-error.js';
import { notFound } from './not-found.js';

describe('notFound', () => {
  it('forwards a 404 NOT_FOUND HttpError naming the route', () => {
    const req = { method: 'GET', path: '/nope' } as Request;
    const next = vi.fn() as NextFunction & ReturnType<typeof vi.fn>;

    notFound(req, {} as Response, next);

    expect(next).toHaveBeenCalledOnce();
    const err = next.mock.calls[0]?.[0];
    expect(err).toBeInstanceOf(HttpError);
    expect(err).toMatchObject({
      status: 404,
      code: 'NOT_FOUND',
      message: 'Route GET /nope not found',
    });
  });
});
