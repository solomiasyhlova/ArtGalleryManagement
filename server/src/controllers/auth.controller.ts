import type { LoginInput } from '@art-gallery/shared';
import type { RequestHandler } from 'express';
import * as authService from '../services/auth.service.js';
import { clearAuthCookie, setAuthCookie } from '../utils/auth-cookie.js';
import { signToken } from '../utils/jwt.js';

export const login: RequestHandler = async (_req, res) => {
  const { email, password } = res.locals.validated.body as LoginInput;
  const user = await authService.login(email, password);
  setAuthCookie(res, signToken({ sub: user.id, role: user.role }));
  res.json(user);
};

export const logout: RequestHandler = (_req, res) => {
  clearAuthCookie(res);
  res.status(204).end();
};

export const me: RequestHandler = (_req, res) => {
  res.json(res.locals.user);
};
