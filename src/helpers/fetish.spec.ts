import { fetish } from './fetish';

function jsonNotOk() {
  const mockResponse = new Response('not found', {
    status: 404,
    statusText: 'not found',
  });
  return Promise.resolve(mockResponse);
}

function jsonOk() {
  const mockResponse = new Response('found', {
    status: 200,
  });
  return Promise.resolve(mockResponse);
}

describe('fetish', () => {
  let fetchMock;

  beforeEach(() => {
    fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonNotOk())
      .mockResolvedValueOnce(jsonOk());
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('should throw if not ok', async () => {
    await expect(fetish('call(0)')).rejects.toBeInstanceOf(Error);
    await expect(fetish('call(1)')).resolves.toBeDefined();
  });
});


