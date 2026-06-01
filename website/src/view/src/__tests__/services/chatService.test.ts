import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { sendMessage, getChatHistory } from '@/services/chatService';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('sendMessage', () => {
  it('returns an answer string', async () => {
    const promise = sendMessage('What is the grading policy?');
    await vi.runAllTimersAsync();
    const result = await promise;
    expect(typeof result.answer).toBe('string');
    expect(result.answer.length).toBeGreaterThan(0);
  });

  it('returns a sources array', async () => {
    const promise = sendMessage('What are the attendance rules?');
    await vi.runAllTimersAsync();
    const result = await promise;
    expect(Array.isArray(result.sources)).toBe(true);
  });

  it('includes the question text in the answer', async () => {
    const question = 'Can I retake a failed exam?';
    const promise = sendMessage(question);
    await vi.runAllTimersAsync();
    const result = await promise;
    expect(result.answer).toContain(question);
  });
});

describe('getChatHistory', () => {
  it('returns an array', async () => {
    const promise = getChatHistory();
    await vi.runAllTimersAsync();
    const result = await promise;
    expect(Array.isArray(result)).toBe(true);
  });

  it('each item has id, title, and timestamp fields', async () => {
    const promise = getChatHistory();
    await vi.runAllTimersAsync();
    const result = await promise;
    expect(result.length).toBeGreaterThan(0);
    for (const item of result) {
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('title');
      expect(item).toHaveProperty('timestamp');
    }
  });
});
