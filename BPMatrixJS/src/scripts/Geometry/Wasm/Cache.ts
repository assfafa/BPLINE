/** Bounded LRU storage with conservative retained-memory accounting. */
class TextCache<T> {
    private readonly _entries = new Map<string, { value: T; bytes: number }>();
    private _bytes = 0;
    public hits = 0;
    public misses = 0;

    /** @param key 完整生成参数 @example cache.get(key); @returns 缓存结果，并更新最近使用顺序。 */
    public get(key: string): T | undefined {
        const entry = this._entries.get(key);
        // Refresh LRU order without copying internal immutable data.
        if (entry) {
            this.hits += 1;
            this._entries.delete(key);
            this._entries.set(key, entry);
            return entry.value;
        } else {
            this.misses += 1;
            return undefined;
        }
    }

    /** @param key 参数键 @param value 结果 @param bytes 内存估算 @example cache.set(key, value, 1024); @returns 无返回值。 */
    public set(key: string, value: T, bytes: number): void {
        const previous = this._entries.get(key);
        // Remove old accounting before replacing a result.
        if (previous !== undefined) {
            this._entries.delete(key);
            this._bytes -= previous.bytes;
        }
        // Large one-off results remain usable without displacing the entire cache.
        if (bytes <= 16 * 1024 * 1024) {
            // Cap entry count as well as retained bytes during precision changes.
            while (this._entries.size >= 64 || this._bytes + bytes > 16 * 1024 * 1024) {
                const oldest = this._entries.entries().next().value;
                // An entry exists whenever the budget requires eviction.
                if (oldest !== undefined) {
                    this._entries.delete(oldest[0]);
                    this._bytes -= oldest[1].bytes;
                }
            }
            this._entries.set(key, { value, bytes });
            this._bytes += bytes;
        }
    }

    /** @example cache.clear(); @returns 释放缓存并重置统计。 */
    public clear(): void {
        this._entries.clear();
        this._bytes = 0;
        this.hits = 0;
        this.misses = 0;
    }

    /** @example cache.bytes; @returns 当前估算字节数。 */
    public get bytes(): number {
        return this._bytes;
    }
}

export { TextCache };
