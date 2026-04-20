type CacheEntry = {
  data: any
  timestamp: number
  ttl: number
}

const cache: Record<string, CacheEntry> = {}

const TTLS: Record<string, number> = {
  profile: 10 * 60 * 1000,
  dashboard: 60 * 1000,
  documents: 60 * 1000,
  clients: 60 * 1000,
}

const DEFAULT_TTL = 60 * 1000

export function getCached(key: string): any | null {
  const entry = cache[key]
  if (!entry) return null
  const ttl = entry.ttl || DEFAULT_TTL
  if (Date.now() - entry.timestamp > ttl) {
    delete cache[key]
    return null
  }
  return entry.data
}

export function setCached(key: string, data: any) {
  cache[key] = {
    data,
    timestamp: Date.now(),
    ttl: TTLS[key] || DEFAULT_TTL,
  }
}

export function clearCache(key?: string) {
  if (key) {
    delete cache[key]
  } else {
    Object.keys(cache).forEach(k => delete cache[k])
  }
}