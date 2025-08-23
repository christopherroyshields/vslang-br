/**
 * Least Recently Used (LRU) Cache implementation
 * Automatically evicts least recently used items when capacity is reached
 */
export class LRUCache<K, V> {
  private cache: Map<K, V>;
  private accessOrder: K[];
  private maxSize: number;

  constructor(maxSize = 50) {
    this.cache = new Map();
    this.accessOrder = [];
    this.maxSize = maxSize;
  }

  /**
   * Get an item from the cache and update its access time
   */
  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      this.updateAccessOrder(key);
    }
    return value;
  }

  /**
   * Add or update an item in the cache
   */
  set(key: K, value: V): void {
    // If we're at capacity and this is a new key, evict LRU
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const lru = this.accessOrder.shift();
      if (lru !== undefined) {
        this.cache.delete(lru);
        console.log(`LRU Cache: Evicted ${String(lru)}`);
      }
    }

    this.cache.set(key, value);
    this.updateAccessOrder(key);
  }

  /**
   * Check if a key exists in the cache
   */
  has(key: K): boolean {
    return this.cache.has(key);
  }

  /**
   * Remove an item from the cache
   */
  delete(key: K): boolean {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    return this.cache.delete(key);
  }

  /**
   * Clear all items from the cache
   */
  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
  }

  /**
   * Get the current size of the cache
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * Update the access order for LRU tracking
   */
  private updateAccessOrder(key: K): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    this.accessOrder.push(key);
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; maxSize: number; hitRate?: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize
    };
  }
}