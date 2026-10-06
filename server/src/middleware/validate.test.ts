import type { NextFunction, Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { HttpError } from '../utils/http-error.js';
import { validate } from './validate.js';

const bodySchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  price: z.number().gt(0, 'Must be greater than 0'),
});

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
});

const paramsSchema = z.object({ id: z.uuid() });

function createReq(parts: Partial<Pick<Request, 'body' | 'query' | 'params'>>) {
  return { body: undefined, query: {}, params: {}, ...parts } as Request;
}

function createRes() {
  return { locals: {} } as Response;
}

describe('validate', () => {
  let next: NextFunction & ReturnType<typeof vi.fn>;

  beforeEach(() => {
    next = vi.fn() as typeof next;
  });

  it('stores parsed values in res.locals.validated and calls next()', async () => {
    const req = createReq({ body: { title: '  Sunset ', price: 4500 }, query: { page: '2' } });
    const res = createRes();

    await validate({ body: bodySchema, query: querySchema })(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(res.locals.validated).toEqual({
      body: { title: 'Sunset', price: 4500 },
      query: { page: 2 },
    });
  });

  it('does not mutate req', async () => {
    const query = { page: '2' };
    const req = createReq({ query });

    await validate({ query: querySchema })(req, createRes(), next);

    expect(req.query).toBe(query);
    expect(req.query).toEqual({ page: '2' });
  });

  it('strips unknown body keys', async () => {
    const req = createReq({ body: { title: 'Sunset', price: 10, role: 'admin' } });
    const res = createRes();

    await validate({ body: bodySchema })(req, res, next);

    expect(res.locals.validated).toEqual({ body: { title: 'Sunset', price: 10 } });
  });

  it('forwards a 400 VALIDATION_ERROR with per-field details', async () => {
    const req = createReq({ body: { title: '   ', price: 0 } });
    const res = createRes();

    await validate({ body: bodySchema })(req, res, next);

    const err = next.mock.calls[0]?.[0];
    expect(err).toBeInstanceOf(HttpError);
    expect(err).toMatchObject({
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'Invalid request body',
      details: { title: ['Title is required'], price: ['Must be greater than 0'] },
    });
    expect(res.locals.validated).toBeUndefined();
  });

  it('keys errors on the part itself by the part name', async () => {
    const req = createReq({ body: undefined });

    await validate({ body: bodySchema })(req, createRes(), next);

    const err = next.mock.calls[0]?.[0] as HttpError;
    expect(err.details).toHaveProperty('body');
    expect(err.details?.body).toHaveLength(1);
  });

  it('collects errors from several parts into one response', async () => {
    const req = createReq({
      body: { title: 'Sunset', price: -1 },
      params: { id: 'not-a-uuid' },
    });

    await validate({ body: bodySchema, params: paramsSchema })(req, createRes(), next);

    const err = next.mock.calls[0]?.[0] as HttpError;
    expect(err.message).toBe('Invalid request');
    expect(Object.keys(err.details ?? {}).sort()).toEqual(['id', 'price']);
  });

  it('passes through when no schemas are given', async () => {
    const res = createRes();

    await validate({})(createReq({}), res, next);

    expect(next).toHaveBeenCalledWith();
    expect(res.locals.validated).toEqual({});
  });
});
