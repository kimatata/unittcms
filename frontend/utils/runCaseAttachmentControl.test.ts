import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest';
import {
  fetchRunCaseAttachments,
  createRunCaseAttachments,
  deleteRunCaseAttachment,
} from '@/utils/runCaseAttachmentControl';

const jwt = 'test-token';

function mockFetch(response: Partial<Response>) {
  const fetchMock = vi.fn().mockResolvedValue(response);
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('run case attachment control', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('fetchRunCaseAttachments', () => {
    test('requests the attachments of a run case with the bearer token', async () => {
      const attachments = [{ id: 11, title: 'screenshot.png' }];
      const fetchMock = mockFetch({ ok: true, json: async () => attachments } as Response);

      const result = await fetchRunCaseAttachments(jwt, 5);

      expect(result).toEqual(attachments);
      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toBe('/api/runcaseattachments?runCaseId=5');
      expect(options.method).toBe('GET');
      expect(options.headers.Authorization).toBe(`Bearer ${jwt}`);
    });

    test('returns an empty list when the request fails', async () => {
      mockFetch({ ok: false, status: 403 } as Response);

      expect(await fetchRunCaseAttachments(jwt, 5)).toEqual([]);
    });
  });

  describe('createRunCaseAttachments', () => {
    test('posts every file under the "files" field without a Content-Type header', async () => {
      const created = [{ id: 11, title: 'screenshot.png' }];
      const fetchMock = mockFetch({ ok: true, json: async () => created } as Response);
      const files = [
        new File(['a'], 'screenshot.png', { type: 'image/png' }),
        new File(['b'], 'log.txt', { type: 'text/plain' }),
      ];

      const result = await createRunCaseAttachments(jwt, 5, files);

      expect(result).toEqual(created);
      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toBe('/api/runcaseattachments?runCaseId=5');
      expect(options.method).toBe('POST');
      expect(options.headers.Authorization).toBe(`Bearer ${jwt}`);
      // the browser has to set the multipart boundary itself
      expect(options.headers['Content-Type']).toBeUndefined();
      expect((options.body as FormData).getAll('files')).toHaveLength(2);
    });

    test('returns null when the upload fails', async () => {
      mockFetch({ ok: false, status: 413 } as Response);
      const files = [new File(['a'], 'huge.png', { type: 'image/png' })];

      expect(await createRunCaseAttachments(jwt, 5, files)).toBeNull();
    });
  });

  describe('deleteRunCaseAttachment', () => {
    test('scopes the delete to the run case', async () => {
      const fetchMock = mockFetch({ ok: true } as Response);

      await deleteRunCaseAttachment(jwt, 5, 11);

      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toBe('/api/runcaseattachments/11?runCaseId=5');
      expect(options.method).toBe('DELETE');
      expect(options.headers.Authorization).toBe(`Bearer ${jwt}`);
    });

    test('throws when the delete fails so the caller can surface it', async () => {
      mockFetch({ ok: false, status: 404 } as Response);

      await expect(deleteRunCaseAttachment(jwt, 5, 11)).rejects.toThrow('HTTP error! Status: 404');
    });
  });
});
