import type { NextFunction, Request, Response } from 'express';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpError } from '../utils/http-error.js';
import { errorHandler } from './error-handler.js';

function createRes(headersSent = false) {
  const res = {
    headersSent,
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return res as typeof res & Response;
}

const req = {} as Request;

describe('errorHandler', () => {
  let next: NextFunction & ReturnType<typeof vi.fn>;

  beforeEach(() => {
    next = vi.fn() as typeof next;
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('formats an HttpError with its status, code and message', () => {
    const res = createRes();

    errorHandler(new HttpError(404, 'NOT_FOUND', 'Artwork not found'), req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: { code: 'NOT_FOUND', message: 'Artwork not found' },
    });
  });

  it('includes details when the HttpError has them', () => {
    const res = createRes();
    const details = { price: ['Must be greater than 0'] };

    errorHandler(
      new HttpError(400, 'VALIDATION_ERROR', 'Invalid request body', details),
      req,
      res,
      next,
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: { code: 'VALIDATION_ERROR', message: 'Invalid request body', details },
    });
  });

  it('maps a malformed JSON body to 400 VALIDATION_ERROR', () => {
    const res = createRes();
    const parseError = Object.assign(new SyntaxError('Unexpected token b'), {
      type: 'entity.parse.failed',
      status: 400,
      expose: true,
    });

    errorHandler(parseError, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: { code: 'VALIDATION_ERROR', message: 'Malformed JSON body' },
    });
    expect(console.error).not.toHaveBeenCalled();
  });

  it('keeps the status of other body-parser client errors', () => {
    const res = createRes();
    const tooLarge = Object.assign(new Error('request entity too large'), {
      type: 'entity.too.large',
      status: 413,
      expose: true,
    });

    errorHandler(tooLarge, req, res, next);

    expect(res.status).toHaveBeenCalledWith(413);
    expect(res.json).toHaveBeenCalledWith({
      error: { code: 'VALIDATION_ERROR', message: 'request entity too large' },
    });
    expect(console.error).not.toHaveBeenCalled();
  });

  it('treats body-parser server errors as 500', () => {
    const res = createRes();
    const streamError = Object.assign(new Error('stream encoding should not be set'), {
      type: 'stream.encoding.set',
      status: 500,
      expose: false,
    });

    errorHandler(streamError, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(console.error).toHaveBeenCalledWith(streamError);
  });

  it('maps an undecodable path param to 404 NOT_FOUND', () => {
    const res = createRes();
    const decodeError = Object.assign(new URIError("Failed to decode param '%ZZ'"), {
      status: 400,
    });

    errorHandler(decodeError, req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: { code: 'NOT_FOUND', message: 'Not found' } });
    expect(console.error).not.toHaveBeenCalled();
  });

  it('treats other URIErrors as 500', () => {
    const res = createRes();

    errorHandler(new URIError('URI malformed'), req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('turns unknown errors into a 500 without leaking the message or stack', () => {
    const res = createRes();
    const err = new Error('connection refused at db.internal:5432');

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
    });
    const body = JSON.stringify(res.json.mock.calls[0]?.[0]);
    expect(body).not.toContain('db.internal');
    expect(body).not.toContain('stack');
    expect(console.error).toHaveBeenCalledWith(err);
  });

  it('treats non-Error throwables as 500', () => {
    const res = createRes();

    errorHandler('boom', req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('delegates to next when headers were already sent', () => {
    const res = createRes(true);
    const err = new Error('late failure');

    errorHandler(err, req, res, next);

    expect(next).toHaveBeenCalledWith(err);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});
