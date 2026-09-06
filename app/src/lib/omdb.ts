import { useEffect, useState } from "react";

const CACHE_KEY = "k-tracker:posters:v1";

type CacheEntry = string | null; // poster URL, or null for a confirmed miss

function loadCache(): Record<string, CacheEntry> {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, CacheEntry>) : {};
  } catch {
    return {};
  }
}

let cache = loadCache();

function saveCache() {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // ignore — poster cache is a nicety, not critical state
  }
}

function cacheKey(title: string, year?: number) {
  return `${title.toLowerCase().trim()}|${year ?? ""}`;
}

export type PosterStatus = "no-key" | "loading" | "ready" | "miss" | "error";

const inflight = new Map<string, Promise<CacheEntry>>();

async function fetchPoster(title: string, year: number | undefined, apiKey: string): Promise<CacheEntry> {
  const params = new URLSearchParams({ t: title, apikey: apiKey });
  if (year) params.set("y", String(year));
  const res = await fetch(`https://www.omdbapi.com/?${params.toString()}`);
  if (!res.ok) throw new Error(`OMDb HTTP ${res.status}`);
  const data = await res.json();
  if (data.Response === "False") return null;
  const poster = typeof data.Poster === "string" ? data.Poster : null;
  return poster && poster !== "N/A" ? poster : null;
}

/** Poster URL for a title via the OMDb API, cached in localStorage across sessions.
 *  Falls back to the typographic cover (handled by the Poster component) whenever
 *  there's no key, no match, or the request fails. */
export function usePoster(title: string, year: number | undefined, apiKey: string) {
  const key = cacheKey(title, year);
  const [status, setStatus] = useState<PosterStatus>(() => {
    if (!apiKey) return "no-key";
    if (key in cache) return cache[key] ? "ready" : "miss";
    return "loading";
  });
  const [url, setUrl] = useState<string | null>(() => cache[key] ?? null);

  useEffect(() => {
    if (!apiKey) {
      setStatus("no-key");
      setUrl(null);
      return;
    }
    if (key in cache) {
      setUrl(cache[key]);
      setStatus(cache[key] ? "ready" : "miss");
      return;
    }
    let cancelled = false;
    setStatus("loading");
    let p = inflight.get(key);
    if (!p) {
      p = fetchPoster(title, year, apiKey).catch(() => null);
      inflight.set(key, p);
      p.finally(() => inflight.delete(key));
    }
    p.then((result) => {
      cache = { ...cache, [key]: result };
      saveCache();
      if (cancelled) return;
      setUrl(result);
      setStatus(result ? "ready" : "miss");
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, apiKey]);

  return { url, status };
}
