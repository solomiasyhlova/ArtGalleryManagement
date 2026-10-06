import type { ArtworkType, UserRole } from './constants.js';

/** A user as returned by the API. The password hash is never included. */
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

/** An artwork as returned by the API. `availability`: true = for sale, false = exhibition only. */
export interface Artwork {
  id: string;
  title: string;
  artist: string;
  type: ArtworkType;
  price: number;
  availability: boolean;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** One page of a list endpoint. A page past the end has empty `data` and the real `meta`. */
export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}

export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  EMAIL_TAKEN: 'EMAIL_TAKEN',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

/** Per-field messages, e.g. `{ price: ['Must be greater than 0'] }`. */
export type ErrorDetails = Record<string, string[]>;

export interface ApiErrorBody {
  error: {
    code: ErrorCode;
    message: string;
    details?: ErrorDetails;
  };
}
