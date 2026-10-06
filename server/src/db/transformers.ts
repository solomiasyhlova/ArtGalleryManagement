import type { ValueTransformer } from 'typeorm';

// `pg` returns `numeric` columns as strings to avoid precision loss; money fits safely in a JS number.
export const numericTransformer: ValueTransformer = {
  to: (value: number | null | undefined) => (value == null ? value : String(value)),
  from: (value: string | null | undefined) => (value == null ? value : Number(value)),
};
