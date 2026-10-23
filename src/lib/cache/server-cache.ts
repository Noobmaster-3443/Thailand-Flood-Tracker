/**
 * Server-side Cache with Stale-While-Revalidate and Last-Known-Good Retention
 * Prevents redundant calls to external government APIs and provides graceful fallback without fake data.
 */

import { DataResult, DataStatus } from '../providers/types';

interface CacheEntry<T> {
  dataResult: DataResult<T>;
  expiresAt: number;
}

// Global cache storage per key
const memoryCache = new Map<string, CacheEntry<any>>();

export interface CacheOptions {
  ttlSeconds?: number;
}

/**
 * Fetch with server cache.
 * If fresh, returns cached data.
 * If expired or missing, calls fetcher().
 * If fetcher succeeds, updates cache with status = 'LIVE' or status as returned.
 * If fetcher throws or fails and cached data exists, returns cached data with status = 'STALE' and preserves original observedAt.
 */
export async function getWithCache<T>(
  key: string,
  fetcher: () => Promise<DataResult<T>>,
  options: CacheOptions = {}
): Promise<DataResult<T>> {
  const ttlMs = (options.ttlSeconds ?? 300) * 1000;
  const now = Date.now();
  const existing = memoryCache.get(key) as CacheEntry<T> | undefined;

  // 1. Return fresh cached data if still within TTL
  if (existing && existing.expiresAt > now && existing.dataResult.status !== 'UNAVAILABLE') {
    return existing.dataResult;
  }

  // 2. Try fetching fresh data from provider
  try {
    const freshResult = await fetcher();

    if (freshResult.status === 'LIVE' || (freshResult.data !== null && freshResult.status !== 'UNAVAILABLE')) {
      memoryCache.set(key, {
        dataResult: freshResult,
        expiresAt: now + ttlMs,
      });
      return freshResult;
    }

    // Provider returned error or unavailable: if we have last-known-good data, retain as STALE
    if (existing && existing.dataResult.data !== null) {
      const staleResult: DataResult<T> = {
        ...existing.dataResult,
        status: 'STALE',
        fetchedAt: existing.dataResult.fetchedAt,
        observedAt: existing.dataResult.observedAt, // Retain original observedAt!
        error: freshResult.error || 'Provider returned incomplete data, serving last known good observation',
      };
      return staleResult;
    }

    return freshResult;
  } catch (err: any) {
    // If fetch threw an exception:
    if (existing && existing.dataResult.data !== null) {
      const staleResult: DataResult<T> = {
        ...existing.dataResult,
        status: 'STALE',
        fetchedAt: existing.dataResult.fetchedAt,
        observedAt: existing.dataResult.observedAt, // Retain original observedAt!
        error: `Fetch error (${err?.message || 'network timeout'}), serving cached data`,
      };
      return staleResult;
    }

    return {
      data: null,
      source: key,
      status: 'UNAVAILABLE',
      fetchedAt: new Date().toISOString(),
      observedAt: null,
      error: err?.message || 'Failed to fetch from provider',
    };
  }
}

/**
 * Manually set or invalidate a cache entry (useful for tests or webhooks)
 */
export function setCache<T>(key: string, dataResult: DataResult<T>, ttlSeconds: number = 300) {
  memoryCache.set(key, {
    dataResult,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

export function clearCache(key?: string) {
  if (key) {
    memoryCache.delete(key);
  } else {
    memoryCache.clear();
  }
}
