import { describe, expect, it } from 'vitest';
import { getPageItems } from './pagination';

describe('getPageItems', () => {
  it('lists nothing without pages', () => {
    expect(getPageItems(1, 0)).toEqual([]);
  });

  it('lists every page up to 7 pages', () => {
    expect(getPageItems(1, 1)).toEqual([1]);
    expect(getPageItems(4, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('puts one gap at the end near the start', () => {
    expect(getPageItems(1, 10)).toEqual([1, 2, 3, 4, 5, 'ellipsis-end', 10]);
    expect(getPageItems(4, 10)).toEqual([1, 2, 3, 4, 5, 'ellipsis-end', 10]);
  });

  it('puts one gap at the start near the end', () => {
    expect(getPageItems(7, 10)).toEqual([1, 'ellipsis-start', 6, 7, 8, 9, 10]);
    expect(getPageItems(10, 10)).toEqual([1, 'ellipsis-start', 6, 7, 8, 9, 10]);
  });

  it('shows the current page and its neighbours between two gaps', () => {
    expect(getPageItems(5, 10)).toEqual([1, 'ellipsis-start', 4, 5, 6, 'ellipsis-end', 10]);
    expect(getPageItems(50, 100)).toEqual([1, 'ellipsis-start', 49, 50, 51, 'ellipsis-end', 100]);
  });

  it('always has 7 items past 7 pages', () => {
    for (let page = 1; page <= 20; page++) {
      expect(getPageItems(page, 20)).toHaveLength(7);
    }
  });

  it('never hides a single page behind an ellipsis', () => {
    expect(getPageItems(5, 8)).toEqual([1, 'ellipsis-start', 4, 5, 6, 7, 8]);
    expect(getPageItems(4, 8)).toEqual([1, 2, 3, 4, 5, 'ellipsis-end', 8]);
  });

  it('clamps an out-of-range current page', () => {
    expect(getPageItems(0, 10)).toEqual(getPageItems(1, 10));
    expect(getPageItems(99, 10)).toEqual(getPageItems(10, 10));
  });
});
