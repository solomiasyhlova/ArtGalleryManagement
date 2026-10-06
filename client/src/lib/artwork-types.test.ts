import { ARTWORK_TYPES } from '@art-gallery/shared';
import { describe, expect, it } from 'vitest';
import { ARTWORK_TYPE_STYLES } from './artwork-types';

describe('ARTWORK_TYPE_STYLES', () => {
  it('maps exactly the types in ARTWORK_TYPES', () => {
    expect(Object.keys(ARTWORK_TYPE_STYLES).sort()).toEqual([...ARTWORK_TYPES].sort());
  });

  it.each(ARTWORK_TYPES)('gives %s a label, an icon and its own color classes', (type) => {
    const style = ARTWORK_TYPE_STYLES[type];

    expect(style.label.trim()).not.toBe('');
    expect(style.icon).toBeDefined();
    expect(style.borderClass).toBe(`border-type-${type}/50`);
    expect(style.badgeClass).toBe(`bg-type-${type}-badge text-type-${type}-badge-foreground`);
  });

  it('uses a different label for every type', () => {
    const labels = Object.values(ARTWORK_TYPE_STYLES).map((style) => style.label);

    expect(new Set(labels).size).toBe(labels.length);
  });
});
