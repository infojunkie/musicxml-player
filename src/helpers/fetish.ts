/**
 * Fetch wrapper to throw an error if the response is not ok.
 * Why indeed? https://github.com/whatwg/fetch/issues/18
 */
export async function fetish(
  input: RequestInfo | URL,
  init?: RequestInit | undefined,
): Promise<Response> {
  const response = await fetch(input, init);
  if (!response.ok) throw new Error(response.statusText);
  return response;
}
