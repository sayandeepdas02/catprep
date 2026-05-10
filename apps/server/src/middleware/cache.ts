import { Request, Response, NextFunction } from 'express';

interface CacheEntry {
  data: unknown;
  timestamp: number;
  ttl: number;
}

const memoryCache = new Map<string, CacheEntry>();
const CLEANUP_INTERVAL = 60000;
let cleanupTimer: NodeJS.Timeout | null = null;

export function setCache(key: string, data: unknown, ttlSeconds = 300): void {
  memoryCache.set(key, {
    data,
    timestamp: Date.now(),
    ttl: ttlSeconds * 1000,
  });
}

export function getCache(key: string): unknown | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;

  if (Date.now() - entry.timestamp > entry.ttl) {
    memoryCache.delete(key);
    return null;
  }

  return entry.data;
}

export function deleteCache(key: string): void {
  memoryCache.delete(key);
}

export function clearCache(pattern?: string): void {
  if (!pattern) {
    memoryCache.clear();
    return;
  }

  const regex = new RegExp(pattern);
  for (const key of memoryCache.keys()) {
    if (regex.test(key)) {
      memoryCache.delete(key);
    }
  }
}

function startCleanup(): void {
  if (cleanupTimer) return;

  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of memoryCache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        memoryCache.delete(key);
      }
    }
  }, CLEANUP_INTERVAL);
}

startCleanup();

export function cacheMiddleware(ttlSeconds = 300) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = `${req.originalUrl || req.url}`;

    const cached = getCache(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cached);
    }

    const originalJson = res.json.bind(res);
    res.json = function(data: unknown) {
      setCache(cacheKey, data, ttlSeconds);
      res.setHeader('X-Cache', 'MISS');
      return originalJson(data);
    };

    next();
  };
}

export function invalidateCache(pattern: string): void {
  clearCache(pattern);
}

export const cacheStats = {
  size: () => memoryCache.size,
  keys: () => Array.from(memoryCache.keys()),
};
