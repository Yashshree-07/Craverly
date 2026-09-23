import { vi } from "vitest";

function createLocalStorageMock() {
  const store = new Map<string, string>();
  return {
    getItem: vi.fn((key: string) => (store.has(key) ? store.get(key) ?? null : null)),
    setItem: vi.fn((key: string, value: string) => {
      store.set(key, String(value));
    }),
    removeItem: vi.fn((key: string) => {
      store.delete(key);
    }),
    clear: vi.fn(() => {
      store.clear();
    }),
    key: vi.fn((index: number) => [...store.keys()][index] ?? null),
    get length() {
      return store.size;
    },
  };
}

vi.stubGlobal("localStorage", createLocalStorageMock());