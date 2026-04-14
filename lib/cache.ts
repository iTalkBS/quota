type CacheEntry = {
  data: any
  timestamp: number
}

const cache: Record<string, CacheEntry> = {}
const TTL = 60 * 1000

export function getCached(key: string): any | null {
  const entry = cache[key]
  if (!entry) return null
  if (Date.now() - entry.timestamp > TTL) {
    delete cache[key]
    return null
  }
  return entry.data
}

export function setCached(key: string, data: any) {
  cache[key] = { data, timestamp: Date.now() }
}

export function clearCache(key?: string) {
  if (key) {
    delete cache[key]
  } else {
    Object.keys(cache).forEach(k => delete cache[k])
  }
}