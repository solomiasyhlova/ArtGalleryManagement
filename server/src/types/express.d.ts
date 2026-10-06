import type { User } from '@art-gallery/shared';

declare global {
  namespace Express {
    interface Locals {
      /** The signed-in user, set by `requireAuth`. */
      user?: User;
    }
  }
}

export {};
