// api.js
// All communication with the Flask backend.
// No dependencies — imported by everything else.

const API_BASE = 'http://localhost:5000';
//const API_BASE = 'https://music-player-gcp5.onrender.com';

//Auth helpers 

export function getToken()    { return localStorage.getItem('token'); }
export function isLoggedIn()  { return !!getToken(); }
export function authHeaders() {
  const token = getToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

//Utilities 

export function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

export function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

//Songs 

export async function apiFetchSongs() {
  const res = await fetch(`${API_BASE}/api/songs`);
  return res.json();
}


export async function apiFetchArtists() {
  const res = await fetch(`${API_BASE}/api/artists`);
  return res.json();
}

export async function apiFetchArtistSongs(artist) {
  const res = await fetch(`${API_BASE}/api/artists/songs/${encodeURIComponent(artist)}`);
  return res.json();
}

export async function apiFetchAlbums() {
  const res = await fetch(`${API_BASE}/api/albums`);
  return res.json();
}

export async function apiFetchAlbumSongs(album) {
  const res = await fetch(`${API_BASE}/api/albums/songs/${encodeURIComponent(album)}`);
  return res.json();
}

//Favourites 

export async function apiFetchFavourites() {
  const res = await fetch(`${API_BASE}/api/favourites`, { headers: authHeaders() });
  return res.ok ? res.json() : [];
}

export async function apiAddFavourite(songId) {
  const res = await fetch(`${API_BASE}/api/favourites/${songId}`, {
    method: 'POST', headers: authHeaders()
  });
  return res.json();
}

export async function apiRemoveFavourite(songId) {
  const res = await fetch(`${API_BASE}/api/favourites/${songId}`, {
    method: 'DELETE', headers: authHeaders()
  });
  return res.ok;
}

//Playlists 

export async function apiFetchPlaylists() {
  const res = await fetch(`${API_BASE}/api/playlists`, { headers: authHeaders() });
  return res.ok ? res.json() : [];
}

export async function apiCreatePlaylist(name) {
  const res = await fetch(`${API_BASE}/api/playlists`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ name })
  });
  return res.json();
}

export async function apiDeletePlaylist(id) {
  const res = await fetch(`${API_BASE}/api/playlists/${id}`, {
    method: 'DELETE', headers: authHeaders()
  });
  return res.ok;
}

export async function apiFetchPlaylistSongs(id) {
  const res = await fetch(`${API_BASE}/api/playlists/${id}/songs`, {
    headers: authHeaders()
  });
  return res.json();
}

export async function apiAddSongToPlaylist(playlistId, songId) {
  const res = await fetch(`${API_BASE}/api/playlists/${playlistId}/songs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ song_id: songId })
  });
  return res.json();
}

export async function apiRemoveSongFromPlaylist(playlistId, songId) {
  const res = await fetch(`${API_BASE}/api/playlists/${playlistId}/songs/${songId}`, {
    method: 'DELETE', headers: authHeaders()
  });
  return res.ok;
}

//Auth 

export async function apiLogin(username, password) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  return { data: await res.json(), ok: res.ok };
}

export async function apiRegister(username, email, password) {
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password })
  });
  return { data: await res.json(), ok: res.ok };
}

export async function apiFetchMe() {
  const res = await fetch(`${API_BASE}/api/auth/me`, { headers: authHeaders() });
  return res.ok ? res.json() : null;
}

export async function apiFetch(url, options = {}) {
  const res = await fetch(url, options);
  if (res.status === 401) {
    // token is invalid — clear it and update UI
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    document.dispatchEvent(new CustomEvent('authExpired'));
  }
  return res;
}

//Last.fm 

export async function apiGetLastfmConnectUrl() {
  const res  = await fetch(`${API_BASE}/api/lastfm/connect`, { headers: authHeaders() });
  const data = await res.json();
  return data.auth_url || null;
}

export async function apiScrobble(artist, track, album) {
  await fetch(`${API_BASE}/api/lastfm/scrobble`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ artist, track, album })
  });
}

export async function apiUpdateNowPlaying(artist, track, album) {
  await fetch(`${API_BASE}/api/lastfm/now-playing`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ artist, track, album })
  });
}

//Admin 

export async function apiScanLibrary() {
  const res = await fetch(`${API_BASE}/api/admin/scan`, { headers: authHeaders() });
  return res.json();
}

//Spotify 

export async function apiFetchArtistImage(artist) {
  try {
    const res  = await fetch(`${API_BASE}/api/spotify/artist-image/${encodeURIComponent(artist)}`);
    const data = await res.json();
    return data.image || null;
  } catch {
    return null;
  }
}

//Search 

export async function apiSearchSongs(query) {
  const res = await fetch(
    `${API_BASE}/api/songs/search?q=${encodeURIComponent(query)}`
  );
  return res.json();
}