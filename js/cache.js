// cache.js
// Caches Spotify artist images in localStorage for 7 days.
// Depends on: api.js

import { apiFetchArtistImage } from './api.js';

const CACHE_KEY      = 'artistImageCache';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

function loadCache() {
  try   { return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}'); }
  catch { return {}; }
}

function saveCache(cache) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache)); }
  catch (e) { console.warn('Cache save failed:', e); }
}

export async function getCachedArtistImage(artist) {
  let cache  = loadCache();
  const now    = Date.now();
  const cached = cache[artist];

  if (cached && now - cached.timestamp < CACHE_DURATION) {
    return cached.url;
  }

  const url = await apiFetchArtistImage(artist);
  cache = loadCache();
  cache[artist] = { url, timestamp: now };
  saveCache(cache);
  return url;
}