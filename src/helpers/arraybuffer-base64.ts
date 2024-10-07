/**
 * Decode base64 to ArrayBuffer
 * https://stackoverflow.com/a/41106346/209184
 *
 */
export function atoab(base64: string) {
  return Uint8Array.from(atob(base64), c => c.charCodeAt(0)).buffer;
}
