import { expect } from '@esm-bundle/chai';
import { binarySearch } from '../../dist/musicxml-player.esm';

describe('binary-search', () => {
  it('should correctly search', () => {
    // https://stackoverflow.com/a/29018745/209184
    const ar = [
      1, 2, 2, 2, 5, 9, 11, 12, 12, 12, 12, 15, 20, 20, 20, 25, 40, 41, 41, 41,
      41, 41, 41, 41, 41, 41, 41, 41, 41, 41, 80,
    ];
    for (let i = 0; i <= 100; i++) {
      const n = binarySearch(ar, i, (a, b) => a - b);
      expect(
        (n >= 0 && ar[n] !== i) ||
          (n < 0 && ~n < ar.length && ar[~n] <= i) ||
          (n < 0 && ~n - 1 >= 0 && ar[~n - 1] >= i),
      ).to.equal(false);
    }
  });
});
