// track.js
// Manages the track list display and view switching (songs, artist, album,
// favourites, playlist). Owns the TRACKS display state.
// Depends on: api.js, queue.js, cache.js

import {
  apiFetchSongs, apiFetchArtistSongs, apiFetchAlbumSongs,
  apiFetchFavourites, apiFetchPlaylistSongs, apiFetchArtistImage,
  apiAddFavourite, apiRemoveFavourite, apiSearchSongs,
  apiAddSongToPlaylist, apiRemoveSongFromPlaylist,
  apiFetchPlaylists, escapeHtml, formatTime, isLoggedIn
} from '../api/api.js';
import { buildQueue, insertIntoQueue, PLAYING_TRACKS, queue, queuePos } from '../states/queue.js';
import { openTrackMenu, showToast } from '../utils/ui.js';

// State 

export const audio = document.getElementById('audio-player');
export let TRACKS  = [];          // what's shown in the current view
let currentView    = 'songs';     // active view name
let currentCtxId   = null;        // playlist id if in playlist view

// DOM elements 

const viewTitle   = document.getElementById('view-title');
const viewMeta    = document.getElementById('view-meta');
const viewCover   = document.querySelector('.view-cover');
const trackBody   = document.getElementById('track-list-body');
const searchInput = document.getElementById('search-input');
const searchClear = document.getElementById('search-clear');


//Search

function clearSearch() {
  if (searchInput) {
    searchInput.value  = '';
    searchClear.hidden = true;
    isSearching        = false;
  }
}

let searchTimer   = null;
let isSearching   = false;

searchInput.addEventListener('input', (e) => {
  clearTimeout(searchTimer);
  const q = e.target.value.trim();

  searchClear.hidden = !q;

  if (!q) {
    isSearching = false;
    loadLibrary();
    return;
  }

  // debounce — wait 300ms after user stops typing
  searchTimer = setTimeout(async () => {
    isSearching = true;
    try {
      const results = await apiSearchSongs(q);
      TRACKS = results;
      viewTitle.textContent = `Results for "${q}"`;
      viewMeta.textContent  = `${results.length} songs`;
      viewCover.src         = '';
      renderTrackList();
    } catch (err) {
      console.error('Search failed:', err);
    }
  }, 300);
});

searchClear.addEventListener('click', () => {
  searchInput.value  = '';
  searchClear.hidden = true;
  isSearching        = false;
  loadLibrary();
});

// Render track list 

export function renderTrackList() {
  trackBody.innerHTML = '';

  const currentPlayingTrack = PLAYING_TRACKS[queue[queuePos]];
  TRACKS.forEach((track, i) => {
    const tr      = document.createElement('tr');
    const isPlaying = currentPlayingTrack && currentPlayingTrack.id === track.id;


    if (isPlaying) {
      tr.classList.add('playing');
    }
    
    tr.innerHTML = `
      <td class="track-num">${i + 1}</td>
      <td>${escapeHtml(track.title)}</td>
      <td>
        <span class="artist-link" data-artist="${escapeHtml(track.artist)}">
          ${escapeHtml(track.artist)}
        </span>
      </td>
      <td class="track-dur">${formatTime(track.duration)}</td>
      <td class="track-menu-cell">
        <button class="track-menu-btn" data-id="${track.id}" data-index="${i}">
          <i class="fa-solid fa-ellipsis-vertical"></i>
        </button>
      </td>
    `;

    // click row — play from this track
    tr.addEventListener('click', e => {
      if (e.target.closest('.track-menu-btn') || e.target.closest('.artist-link')) return;
      buildQueue(TRACKS, i, playTrackAtIndex);
    });

    // click artist name — load artist view
    tr.querySelector('.artist-link').addEventListener('click', e => {
      e.stopPropagation();
      loadArtistSongs(track.artist);
    });

    // three-dot menu
    tr.querySelector('.track-menu-btn').addEventListener('click', e => {
      e.stopPropagation();
      openTrackMenu(e, track.id, i);
    });

    trackBody.appendChild(tr);
  });
}

// Highlight active row 

export function highlightRow(trackIndex) {
  document.querySelectorAll('#track-list-body tr').forEach((tr, i) => {
    tr.classList.toggle('playing', i === trackIndex);
  });
}

// View loaders 

export async function loadLibrary() {
  clearSearch();
  currentView  = 'songs';
  currentCtxId = null;
  try {
    TRACKS = await apiFetchSongs();
    viewTitle.textContent = 'Songs';
    viewMeta.textContent  = `${TRACKS.length} songs`;
    viewCover.src         = 'assest/songs.png';
    renderTrackList();
  } catch (err) {
    console.error('Could not load library:', err);
  }
}

export async function loadArtistSongs(artist) {
  clearSearch();
  currentView  = 'artist';
  currentCtxId = null;
  try {
    TRACKS = await apiFetchArtistSongs(artist);
    viewTitle.textContent = artist;
    viewMeta.textContent  = `${TRACKS.length} songs`;
    const img = await apiFetchArtistImage(artist);
    viewCover.src         = img || '';
    renderTrackList();
  } catch (err) {
    console.error('Could not load artist songs:', err);
  }
}

export async function loadAlbumSongs(album) {
  clearSearch();
  currentView  = 'album';
  currentCtxId = null;
  try {
    TRACKS = await apiFetchAlbumSongs(album);
    viewTitle.textContent = album;
    viewMeta.textContent  = `${TRACKS.length} songs`;
    viewCover.src         = TRACKS[0]?.cover || '';
    viewCover.style.borderRadius = '8px';
    renderTrackList();
  } catch (err) {
    console.error('Could not load album songs:', err);
  }
}

export async function loadFavourites() {
  clearSearch();
  currentView  = 'favourites';
  currentCtxId = null;
  if (!isLoggedIn()) {
    viewTitle.textContent = 'Liked Songs';
    viewMeta.textContent  = 'Please log in to see favourites';
    TRACKS = [];
    renderTrackList();
    return;
  }
  try {
    TRACKS = await apiFetchFavourites();
    viewTitle.textContent = 'Liked Songs';
    viewMeta.textContent  = `${TRACKS.length} songs`;
    viewCover.src         = 'assest/CoverImage/liked.png';
    renderTrackList();
  } catch (err) {
    console.error('Could not load favourites:', err);
  }
}

export async function loadPlaylistSongs(playlistId, playlistName) {
  clearSearch();
  currentView  = 'playlist';
  currentCtxId = playlistId;
  try {
    TRACKS = await apiFetchPlaylistSongs(playlistId);
    viewTitle.textContent = playlistName;
    viewMeta.textContent  = `${TRACKS.length} songs`;
    viewCover.src         = 'assest/songs.png';
    renderTrackList();
    highlightRow();
  } catch (err) {
    console.error('Could not load playlist songs:', err);
  }
}

// Track menu actions 

export async function addToFavourites(songId) {
  if (!isLoggedIn()) { alert('Please log in to add favourites'); return; }
  await apiAddFavourite(songId);
}

export async function removeFromFavourites(songId) {
  await apiRemoveFavourite(songId);
  TRACKS = TRACKS.filter(t => t.id !== parseInt(songId));
  viewMeta.textContent = `${TRACKS.length} songs`;
  renderTrackList();
}

export async function removeFromPlaylist(songId) {
  if (!currentCtxId) return;
  await apiRemoveSongFromPlaylist(currentCtxId, songId);
  TRACKS = TRACKS.filter(t => t.id !== parseInt(songId));
  viewMeta.textContent = `${TRACKS.length} songs`;
  renderTrackList();
}

export function addSongToQueue(displayIndex) {
  // find this track's position in PLAYING_TRACKS
  const song  = TRACKS[displayIndex];
  if (!song) return;

  // find its index in PLAYING_TRACKS
  const ptIndex = PLAYING_TRACKS.findIndex(t => t.id === song.id);

  if (ptIndex !== -1) {
    // song already in playing context — insert that index
    insertIntoQueue(ptIndex);
  } else {
    // song not in current context — add it to PLAYING_TRACKS first
    PLAYING_TRACKS.push(song);
    insertIntoQueue(PLAYING_TRACKS.length - 1);
  }

  // visual feedback
  showToast(`Added "${song.title}" to queue`);
}

export async function showPlaylistPicker(songId, rect) {
  if (!isLoggedIn()) { alert('Please log in to add to playlists'); return; }

  const playlists = await apiFetchPlaylists();
  if (!playlists.length) {
    alert('No playlists found — create one first');
    return;
  }

  document.querySelectorAll('.playlist-picker').forEach(p => p.remove());

  const picker = document.createElement('div');
  picker.className = 'context-menu playlist-picker';
  picker.style.top  = `${rect.bottom + 4}px`;
  picker.style.left = `${Math.max(rect.left - 180, 8)}px`;

  picker.innerHTML = `
    <div class="menu-header">Add to Playlist</div>
    ${playlists.map(p => `
      <button class="menu-item" data-pid="${p.id}">
        <i class="fa-solid fa-list"></i> ${escapeHtml(p.name)}
      </button>
    `).join('')}
  `;

  document.body.appendChild(picker);

  picker.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', async e => {
      e.stopPropagation();
      await apiAddSongToPlaylist(item.dataset.pid, songId);
      picker.remove();
    });
  });

  function closePicker(e) {
    if (!picker.contains(e.target)) {
      picker.remove();
      document.removeEventListener('click', closePicker, true);
    }
  }
  document.addEventListener('click', closePicker, true);
}

// Expose playTrackAtIndex for queue.js callbacks 
// player.js will set this after it initialises

export let playTrackAtIndex = () => {};
export function setPlayTrackCallback(fn) { playTrackAtIndex = fn; }

// Initial load 

loadLibrary();
