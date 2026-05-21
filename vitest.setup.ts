import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock IndexedDB
const mockIDBRequest = {
  onsuccess: null,
  onerror: null,
  onupgradeneeded: null,
  result: {
    createObjectStore: vi.fn(),
    transaction: vi.fn(() => ({
      objectStore: vi.fn(() => ({
        put: vi.fn(() => ({ onsuccess: null, onerror: null })),
        get: vi.fn(() => ({ onsuccess: null, onerror: null })),
        getAll: vi.fn(() => ({ onsuccess: null, onerror: null })),
        clear: vi.fn(() => ({ onsuccess: null, onerror: null })),
      })),
      oncomplete: null,
      onerror: null,
    })),
    close: vi.fn(),
  },
};

const indexedDB = {
  open: vi.fn(() => {
    setTimeout(() => {
      if (mockIDBRequest.onsuccess) {
        (mockIDBRequest.onsuccess as any)({ target: mockIDBRequest });
      }
    }, 0);
    return mockIDBRequest;
  }),
  deleteDatabase: vi.fn(),
};

Object.defineProperty(window, 'indexedDB', {
  value: indexedDB,
});
