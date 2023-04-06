/**
 * Binary search in an array.
 * https://stackoverflow.com/a/29018745/209184
 *
 * @param ar: elements array that is sorted
 * @param el: target element
 * @param comp: comparison function (a,b) => n with
 *        n > 0 if a > b
 *        n < 0 if a < b
 *        n = 0 if a = b
 * @returns index m >= 0 if match is found, m < 0 if not found with insertion point = -m-1.
 */
export function binarySearch<T>(ar: ReadonlyArray<T>, el: T, comp: (a: T, b: T) => number): number {
  let m = 0;
  let n = ar.length - 1;
  while (m <= n) {
    const k = (n + m) >> 1;
    const cmp = comp(el, ar[k]);
    if (cmp > 0) {
      m = k + 1;
    } else if (cmp < 0) {
      n = k - 1;
    } else {
      return k;
    }
  }
  return ~m;
}

/**
 * Fetch wrapper to throw an error if the response is not ok.
 * Why indeed? https://github.com/whatwg/fetch/issues/18
 */
export async function fetchex(input: RequestInfo | URL, init?: RequestInit | undefined): Promise<Response> {
  const response = await fetch(input, init);
  if (!response.ok) throw new Error(response.statusText);
  return response;
}
