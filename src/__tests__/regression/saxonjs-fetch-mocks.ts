import createFetchMock from 'vitest-fetch-mock';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import SaxonJS from '../../saxon-js/SaxonJS3.rt';

export const serve = async (rel: string): Promise<string> => {
  const u = new URL(rel, import.meta.url);
  return readFile(fileURLToPath(u), 'utf8');
};

export function setupMocks(): void {
  const fetchMock = createFetchMock(vi);
  fetchMock.enableMocks();

  fetchMock.mockIf((req) => req.url.endsWith('timemap.sef.json'), async () => ({
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    body: await serve('../fixtures/timemap.sef.json'),
  }));

  fetchMock.mockIf((req) => req.url.endsWith('smufl.json'), async () => ({
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  }));

  fetchMock.mockIf((req) => req.url.endsWith('test-timemap.xsl'), async () => ({
    status: 200,
    headers: { 'Content-Type': 'application/xml' },
    body: await serve('../fixtures/test-timemap.xsl'),
  }));

  fetchMock.mockIf((req) => req.url.endsWith('unroll.xsl'), async () => ({
    status: 200,
    headers: { 'Content-Type': 'application/xml' },
    body: await serve('../fixtures/test-unroll.xsl'),
  }));

  // Also map explicitly named test-unroll.xsl
  fetchMock.mockIf((req) => req.url.endsWith('test-unroll.xsl'), async () => ({
    status: 200,
    headers: { 'Content-Type': 'application/xml' },
    body: await serve('../fixtures/test-unroll.xsl'),
  }));

  fetchMock.mockReject(() => new Error('Unexpected fetch'));

  const originalGetResource = SaxonJS.getResource;
  SaxonJS.getResource = async (opts: any) => {
    const href = String(opts?.href ?? opts?.location ?? '');
    if (href.endsWith('timemap.sef.json')) {
      return { text: await serve('../fixtures/timemap.sef.json'), mediaType: 'application/json' };
    }
    if (href.endsWith('test-timemap.xsl')) {
      return { text: await serve('../fixtures/test-timemap.xsl'), mediaType: 'application/xml' };
    }
    if (href.endsWith('unroll.xsl')) {
      return { text: await serve('../fixtures/test-unroll.xsl'), mediaType: 'application/xml' };
    }
    if (href.endsWith('test-unroll.xsl')) {
      return { text: await serve('../fixtures/test-unroll.xsl'), mediaType: 'application/xml' };
    }
    if (href.endsWith('smufl.json')) {
      return { text: '{}', mediaType: 'application/json' };
    }
    return originalGetResource(opts);
  };
}


