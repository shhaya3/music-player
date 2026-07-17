// ─────────────────────────────────────────────────────────────────────────────
// sidebar.js
// Sidebar navigation, artists/albums lists, playlist management.
// Depends on: api.js, track.js, ui.js
// ─────────────────────────────────────────────────────────────────────────────

import { apiFetchArtists, apiFetchAlbums, apiFetchPlaylists, apiCreatePlaylist, apiDeletePlaylist, escapeHtml } from './api.js';
import { loadLibrary, loadArtistSongs, loadAlbumSongs, loadFavourites, loadPlaylistSongs } from './track.js';
import { setMenuContext } from './ui.js';
import { getCachedArtistImage } from './cache.js';

// ── DOM elements ──────────────────────────────────────────────────────────────

const navItems   = document.querySelectorAll('.nav-item');
const views      = document.querySelectorAll('.view');
const artistBody = document.getElementById('artist-list-body');
const albumBody  = document.getElementById('album-list-body');


// ── Clear active nav ──────────────────────────────────────────────────────────

function clearActiveNav() {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
}

// ── Switch views ──────────────────────────────────────────────────────────────

function showView(viewName) {
  views.forEach(v => v.hidden = true);
  // artists and albums have their own views
  // everything else reuses view-songs
  if (viewName === 'artists' || viewName === 'albums') {
    document.getElementById(`view-${viewName}`).hidden = false;
  } else {
    document.getElementById('view-songs').hidden = false;
  }
}

// ── Library nav items ─────────────────────────────────────────────────────────

navItems.forEach(item => {
  item.addEventListener('click', () => {
    clearActiveNav();
    item.classList.add('active');
    const viewName = item.dataset.view;
    showView(viewName);
    setMenuContext(viewName, null);

    if      (viewName === 'songs')      loadLibrary();
    else if (viewName === 'artists')    loadArtistsView();
    else if (viewName === 'albums')     loadAlbumsView();
    else if (viewName === 'favourites') loadFavourites();
  });
});

// ── Artists view ──────────────────────────────────────────────────────────────

async function loadArtistsView() {
  const data = await apiFetchArtists();
  artistBody.innerHTML = '';

  data.forEach(a => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="artist-thumb-cell">
        <img class="artist-thumb" src="" data-artist="${escapeHtml(a.artist)}"
          style="width:36px;height:36px;border-radius:50%;object-fit:cover;margin-right:10px;vertical-align:middle;" />
        ${escapeHtml(a.artist)}
      </td>
      <td class="track-dur">${a.count} songs</td>
    `;
    tr.style.cursor = 'pointer';
    tr.addEventListener('click', () => {
      clearActiveNav();
      document.querySelector('[data-view="songs"]').classList.add('active');
      showView('songs');
      setMenuContext('artist', null);
      loadArtistSongs(a.artist);
    });
    artistBody.appendChild(tr);
  });

  // lazy-load artist images
  const observer = new IntersectionObserver(entries => {
    entries.forEach(async entry => {
      if (!entry.isIntersecting) return;
      const img    = entry.target;
      const artist = img.dataset.artist;
      observer.unobserve(img);
      const url = await getCachedArtistImage(artist);
      if (url) img.src = url;
    });
  });

  document.querySelectorAll('.artist-thumb').forEach(img => observer.observe(img));
}

// ── Albums view ───────────────────────────────────────────────────────────────

async function loadAlbumsView() {
  const data = await apiFetchAlbums();
  albumBody.innerHTML = '';

  data.forEach(a => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escapeHtml(a.album)}</td>
      <td>${escapeHtml(a.artist)}</td>
      <td class="track-dur">${a.count} songs</td>
    `;
    tr.style.cursor = 'pointer';
    tr.addEventListener('click', () => {
      clearActiveNav();
      document.querySelector('[data-view="songs"]').classList.add('active');
      showView('songs');
      setMenuContext('album', null);
      loadAlbumSongs(a.album);
    });
    albumBody.appendChild(tr);
  });
}

// ── Playlists ─────────────────────────────────────────────────────────────────

export async function loadPlaylists() {
  const data = await apiFetchPlaylists();
  renderPlaylists(data);
}

function renderPlaylists(playlists) {
  const ul = document.getElementById('playlist-list');
  ul.innerHTML = '';

  playlists.forEach(pl => {
    const li = document.createElement('li');
    li.className = 'nav-item';
    li.innerHTML = `
      <i class="fa-solid fa-list"></i>
      <span>${escapeHtml(pl.name)}</span>
      <button class="delete-playlist-btn" title="Delete playlist">
        <i class="fa-solid fa-trash"></i>
      </button>
    `;

    li.addEventListener('click', e => {
      if (e.target.closest('.delete-playlist-btn')) return;
      clearActiveNav();
      li.classList.add('active');
      showView('playlist');
      setMenuContext('playlist', pl.id);
      loadPlaylistSongs(pl.id, pl.name);
    });

    li.querySelector('.delete-playlist-btn').addEventListener('click', async e => {
      e.stopPropagation();
      if (!confirm(`Delete "${pl.name}"?`)) return;
      const ok = await apiDeletePlaylist(pl.id);
      if (ok) loadPlaylists();
    });

    ul.appendChild(li);
  });
}

document.getElementById('btn-new-playlist').addEventListener('click', async () => {
  const name = prompt('Playlist name:');
  if (!name) return;
  await apiCreatePlaylist(name);
  loadPlaylists();
});

// ── React to auth events ──────────────────────────────────────────────────────

document.addEventListener('userLoggedIn',  () => loadPlaylists());
document.addEventListener('userLoggedOut', () => renderPlaylists([]));
document.addEventListener('libraryScanned', () => loadLibrary());

// ── Initial load ──────────────────────────────────────────────────────────────

loadPlaylists();