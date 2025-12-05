export class LocalStorageMock {
  private store: Map<string, string> = new Map();

  getItem(key: string): string | null {
    return this.store.get(key) || null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  get length(): number {
    return this.store.size;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] || null;
  }
}

export function setupLocalStorage(authToken?: { type?: string; value: string; provider?: string }) {
  const mockStorage = new LocalStorageMock();

  if (authToken) {
    mockStorage.setItem('@app/auth/token', JSON.stringify(authToken));
  }

  global.localStorage = mockStorage as any;

  return mockStorage;
}
