import type { StorageAdapter, StorageValue } from "../src/lib/storage";

export class MemoryStorage implements StorageAdapter {
  private readonly values = new Map<string, StorageValue>();

  async getItem(key: string) {
    return this.values.get(key);
  }

  async setItem(key: string, value: StorageValue) {
    this.values.set(key, value);
  }

  async removeItem(key: string) {
    this.values.delete(key);
  }

  async allItems() {
    return Object.fromEntries(this.values);
  }
}
