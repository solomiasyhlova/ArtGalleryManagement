import express, { type NextFunction, type Request, type Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { spaFallback } from './spa-fallback.js';

const INDEX_FILE = '/app/client/dist/index.html';
const BROWSER_NAVIGATION =
  'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8';

function run(method: string, accept?: string, headersSent = false) {
  // Express's own request prototype, so `req.accepts` negotiates exactly as in the app.
  const req = Object.assign(Object.create(express.request) as Request, {
    method,
    headers: accept === undefined ? {} : { accept },
  });
  const res = { headersSent, setHeader: vi.fn(), sendFile: vi.fn() };
  const next = vi.fn() as NextFunction & ReturnType<typeof vi.fn>;
  spaFallback(INDEX_FILE)(req, res as unknown as Response, next);
  return { res, next };
}

describe('spaFallback', () => {
  it.each(['GET', 'HEAD'])(
    'sends index.html with no-cache to a %s browser navigation',
    (method) => {
      const { res, next } = run(method, BROWSER_NAVIGATION);

      expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-cache');
      expect(res.sendFile).toHaveBeenCalledWith(INDEX_FILE, expect.any(Function));
      expect(next).not.toHaveBeenCalled();
    },
  );

  it.each([
    ['an API call', 'application/json'],
    ['any type', '*/*'],
    ['an <img> request', 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'],
    ['neither JSON nor HTML', 'application/xml'],
    ['no Accept header', undefined],
  ])('passes %s on', (_name, accept) => {
    const { res, next } = run('GET', accept);

    expect(next).toHaveBeenCalledWith();
    expect(res.sendFile).not.toHaveBeenCalled();
    expect(res.setHeader).not.toHaveBeenCalled();
  });

  it.each(['POST', 'PUT', 'DELETE'])('passes a %s that prefers HTML on', (method) => {
    const { res, next } = run(method, BROWSER_NAVIGATION);

    expect(next).toHaveBeenCalledWith();
    expect(res.sendFile).not.toHaveBeenCalled();
  });

  it('forwards a send error before the response started', () => {
    const { res, next } = run('GET', BROWSER_NAVIGATION);
    const error = Object.assign(new Error('ENOENT'), { code: 'ENOENT' });

    res.sendFile.mock.calls[0]?.[1](error);

    expect(next).toHaveBeenCalledWith(error);
  });

  it('ignores a send error after the response started', () => {
    const { res, next } = run('GET', BROWSER_NAVIGATION, true);

    res.sendFile.mock.calls[0]?.[1](new Error('ECONNABORTED'));

    expect(next).not.toHaveBeenCalled();
  });
});
