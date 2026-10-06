import jwt from 'jsonwebtoken';
import { describe, expect, it, vi } from 'vitest';
import { signToken, verifyToken } from './jwt.js';

const SECRET = 'test-secret-that-is-at-least-32-characters-long';
const USER_ID = '0b8e4a4e-5c1d-4e0a-9a3b-1f2e3d4c5b6a';

vi.mock('../config/env.js', () => ({
  env: { JWT_SECRET: 'test-secret-that-is-at-least-32-characters-long', JWT_EXPIRES_IN: '1d' },
}));

describe('signToken', () => {
  it('signs an HS256 token with sub, role and a JWT_EXPIRES_IN expiry', () => {
    const token = signToken({ sub: USER_ID, role: 'admin' });

    const { header, payload } = jwt.decode(token, { complete: true }) as jwt.Jwt & {
      payload: jwt.JwtPayload;
    };
    expect(header.alg).toBe('HS256');
    expect(payload).toMatchObject({ sub: USER_ID, role: 'admin' });
    expect(payload.exp! - payload.iat!).toBe(24 * 60 * 60);
  });
});

describe('verifyToken', () => {
  it('returns the payload of a token it signed', () => {
    expect(verifyToken(signToken({ sub: USER_ID, role: 'user' }))).toEqual({
      sub: USER_ID,
      role: 'user',
    });
  });

  it('rejects a token signed with another secret', () => {
    const token = jwt.sign({ role: 'admin' }, 'another-secret-another-secret-123', {
      subject: USER_ID,
    });

    expect(verifyToken(token)).toBeNull();
  });

  it('rejects an expired token', () => {
    const token = jwt.sign({ role: 'admin', exp: Math.floor(Date.now() / 1000) - 10 }, SECRET, {
      subject: USER_ID,
    });

    expect(verifyToken(token)).toBeNull();
  });

  it('rejects an unsigned (alg: none) token', () => {
    const token = jwt.sign({ role: 'admin' }, '', { algorithm: 'none', subject: USER_ID });

    expect(verifyToken(token)).toBeNull();
  });

  it('rejects another HMAC algorithm, even with the right secret', () => {
    const token = jwt.sign({ role: 'admin' }, SECRET, { algorithm: 'HS512', subject: USER_ID });

    expect(verifyToken(token)).toBeNull();
  });

  it('rejects a correctly signed token with an unexpected payload', () => {
    const token = jwt.sign({ role: 'superuser' }, SECRET, { subject: 'not-a-uuid' });

    expect(verifyToken(token)).toBeNull();
  });

  it('rejects garbage', () => {
    expect(verifyToken('not.a.jwt')).toBeNull();
  });
});
