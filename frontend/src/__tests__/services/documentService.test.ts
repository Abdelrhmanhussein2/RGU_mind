import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { uploadDocuments, getDocuments } from '@/services/documentService';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

function makeFile(name: string, type = 'application/pdf'): File {
  return new File(['content'], name, { type });
}

describe('uploadDocuments', () => {
  it('returns an array with the same length as the input files', async () => {
    const files = [makeFile('regs.pdf'), makeFile('policy.docx')];
    const promise = uploadDocuments(files);
    await vi.runAllTimersAsync();
    const result = await promise;
    expect(result).toHaveLength(2);
  });

  it('result items carry the correct file names', async () => {
    const files = [makeFile('academic-regs.pdf'), makeFile('grading.docx')];
    const promise = uploadDocuments(files);
    await vi.runAllTimersAsync();
    const result = await promise;
    expect(result[0].name).toBe('academic-regs.pdf');
    expect(result[1].name).toBe('grading.docx');
  });

  it('result items have status=processing', async () => {
    const files = [makeFile('test.pdf')];
    const promise = uploadDocuments(files);
    await vi.runAllTimersAsync();
    const result = await promise;
    expect(result[0].status).toBe('processing');
  });
});

describe('getDocuments', () => {
  it('returns an array', async () => {
    const promise = getDocuments();
    await vi.runAllTimersAsync();
    const result = await promise;
    expect(Array.isArray(result)).toBe(true);
  });

  it('each item has id, name, status, and uploadedAt', async () => {
    const promise = getDocuments();
    await vi.runAllTimersAsync();
    const result = await promise;
    expect(result.length).toBeGreaterThan(0);
    for (const doc of result) {
      expect(doc).toHaveProperty('id');
      expect(doc).toHaveProperty('name');
      expect(doc).toHaveProperty('status');
      expect(doc).toHaveProperty('uploadedAt');
    }
  });
});
