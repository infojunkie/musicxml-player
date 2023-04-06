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
export declare function binarySearch<T>(ar: ReadonlyArray<T>, el: T, comp: (a: T, b: T) => number): number;
/**
 * Fetch wrapper to throw an error if the response is not ok.
 * Why indeed? https://github.com/whatwg/fetch/issues/18
 */
export declare function fetchex(input: RequestInfo | URL, init?: RequestInit | undefined): Promise<Response>;
//# sourceMappingURL=helpers.d.ts.map