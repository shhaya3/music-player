const API_BASE = 'http://localhost:5000';

function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

// ── Songs ──
export async function fetchSongs() {
  const res = await fetch(`${API_BASE}/api/songs`);
  return res.json();
}

export async function searchSongs(q) {
  const res = await fetch(`${API_BASE}/api/songs/search?q=${encodeURIComponent(q)}`);
  return res.json();
}

export async function fetchArtists() {
  const res = await fetch(`${API_BASE}/api/artists`);
  return res.json();
}

export async function fetchArtistSongs(artist) {
  const res = await fetch(`${API_BASE}/api/artists/songs/${encodeURIComponent(artist)}`);
  return res.json();
}

export async function fetchAlbums() {
  const res = await fetch(`${API_BASE}/api/albums`);
  return res.json();
}

export async function fetchAlbumSongs(album) {
  const res = await fetch(`${API_BASE}/api/albums/songs/${encodeURIComponent(album)}`);
  return res.json();
}

export async function fetchFavourites() {
  const res = await fetch(`${API_BASE}/api/favourites`, { headers: authHeaders() });
  return res.json();
}

export async function addFavourite(songId) {
  const res = await fetch(`${API_BASE}/api/favourites/${songId}`, {
    method: 'POST',
    headers: authHeaders()
  });
  return res.json();
}

export async function scanLibrary() {
  const res = await fetch(`${API_BASE}/api/admin/scan`, { headers: authHeaders() });
  return res.json();
}

// ── Auth ──
export async function login(username, password) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  return { data: await res.json(), ok: res.ok };
}

export async function register(username, email, password) {
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password })
  });
  return { data: await res.json(), ok: res.ok };
}

export async function fetchMe() {
  const res = await fetch(`${API_BASE}/api/auth/me`, { headers: authHeaders() });
  if (!res.ok) return null;
  return res.json();
}

// ── Playlists ──
export async function fetchPlaylists() {
  const res = await fetch(`${API_BASE}/api/playlists`, { headers: authHeaders() });
  if (!res.ok) return [];
  return res.json();
}

export async function createPlaylist(name) {
  const res = await fetch(`${API_BASE}/api/playlists`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ name })
  });
  return res.json();
}

export async function addToPlaylist(playlistId, songId) {
  const res = await fetch(`${API_BASE}/api/playlists/${playlistId}/songs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ song_id: songId })
  });
  return res.json();
}

export async function fetchPlaylistSongs(playlistId) {
  const res = await fetch(`${API_BASE}/api/playlists/${playlistId}/songs`, {
    headers: authHeaders()
  });
  return res.json();
}

// ── Last.fm ──
export async function connectLastfm() {
  const res  = await fetch(`${API_BASE}/api/lastfm/connect`, { headers: authHeaders() });
  const data = await res.json();
  return data.auth_url;
}

export async function scrobble(artist, track) {
  const res = await fetch(`${API_BASE}/api/lastfm/scrobble`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ artist, track })
  });
  return res.json();
}

export async function updateNowPlaying(artist, track) {
  await fetch(`${API_BASE}/api/lastfm/now-playing`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ artist, track })
  });
}

// ── Spotify artist image ──
export async function fetchArtistImage(artist) {
  const CACHE_KEY      = 'artistImageCache';
  const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000;
  const now            = Date.now();

  try {
    const cache  = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    const cached = cache[artist];
    if (cached && now - cached.timestamp < CACHE_DURATION) return cached.url;
  } catch {}

  try {
    const res  = await fetch(`${API_BASE}/api/spotify/artist-image/${encodeURIComponent(artist)}`);
    const data = await res.json();
    const url  = data.image || null;

    const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    cache[artist] = { url, timestamp: now };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));

    return url;
  } catch {
    return null;
  }
}

// ── Helpers ──
export function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

export { authHeaders };