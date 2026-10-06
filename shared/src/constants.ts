export const ARTWORK_TYPES = [
  'painting',
  'sculpture',
  'photography',
  'drawing',
  'print',
  'digital',
] as const;

export type ArtworkType = (typeof ARTWORK_TYPES)[number];

export const USER_ROLES = ['user', 'admin'] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const DEFAULT_PAGE_SIZE = 12;

export const MAX_PAGE_SIZE = 50;
