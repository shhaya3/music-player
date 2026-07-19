// ─────────────────────────────────────────────────────────────────────────────
// ui.js
// DOM helpers: play icon, background blur, context menu.
// Depends on: api.js, track.js
// ─────────────────────────────────────────────────────────────────────────────

import { formatTime } from '../api/api.js';
import {
  addToFavourites, removeFromFavourites, removeFromPlaylist,
  addSongToQueue, showPlaylistPicker, TRACKS
} from '../components/track.js';
//import { audio } from './track.js';

// ── DOM elements ──────────────────────────────────────────────────────────────

const playIcon    = document.getElementById('play-icon');
const songDuration = document.getElementById('song-duration');
const currentTime  = document.getElementById('current-time');
const volIcon      = document.getElementById('vol-icon');
const progressBar  = document.getElementById('progress-bar');
const appEl        = document.querySelector('.app');
const audio        = document.getElementById('audio-player');

// ── Play icon ─────────────────────────────────────────────────────────────────

export function setPlayIcon(isPlaying) {
  playIcon.className = `fa-solid ${isPlaying ? 'fa-pause' : 'fa-play'}`;
}

// ── Progress bar ──────────────────────────────────────────────────────────────

audio.addEventListener('timeupdate', () => {
  if (!audio.duration) return;
  const pct = (audio.currentTime / audio.duration) * 100;
  progressBar.value = pct;
  currentTime.textContent  = formatTime(audio.currentTime);
  songDuration.textContent = formatTime(audio.duration);
  progressBar.style.background =
    `linear-gradient(to right, #a78bfa ${pct}%, #334155 ${pct}%)`;
});

audio.addEventListener('loadedmetadata', () => {
  songDuration.textContent = formatTime(audio.duration);
});

progressBar.addEventListener('input', () => {
  if (!audio.duration || isNaN(audio.duration)) return;
  audio.currentTime = (progressBar.value / 100) * audio.duration;
});

// ── Volume icon helper ────────────────────────────────────────────────────────

export function updateVolIcon(volume, muted) {
  if (muted || volume === 0) volIcon.className = 'fa-solid fa-volume-xmark';
  else if (volume < 0.5)     volIcon.className = 'fa-solid fa-volume-low';
  else                        volIcon.className = 'fa-solid fa-volume-high';
}

// ── Background from cover ─────────────────────────────────────────────────────

export function applyBackgroundFromCover(imageUrl) {
  if (imageUrl) appEl.style.backgroundImage = `url('${imageUrl}')`;
}

// ── Context menu ──────────────────────────────────────────────────────────────

let activeMenu    = null;
let currentCtxView = 'songs';
let currentCtxPlaylistId = null;

export function setMenuContext(viewName, playlistId) {
  currentCtxView       = viewName;
  currentCtxPlaylistId = playlistId || null;
}

export function openTrackMenu(event, songId, trackIndex) {
  // close existing menu if open
  if (activeMenu) { activeMenu.remove(); activeMenu = null; return; }

  const btn  = event.target.closest('.track-menu-btn');
  const rect = btn.getBoundingClientRect();

  const menu = document.createElement('div');
  menu.className = 'context-menu';
  menu.style.top  = `${rect.bottom + 4}px`;
  menu.style.left = `${Math.max(rect.left - 180, 8)}px`;

  menu.innerHTML = `
    ${currentCtxView === 'favourites' ? `
      <button class="menu-item menu-item-danger" data-action="unfavourite">
        <i class="fa-solid fa-heart-crack"></i> Remove from Favourites
      </button>
    ` : `
      <button class="menu-item" data-action="favourite">
        <i class="fa-solid fa-heart"></i> Add to Favourites
      </button>
    `}
    <button class="menu-item" data-action="queue">
      <i class="fa-solid fa-circle-plus"></i> Add to Queue
    </button>
    <button class="menu-item" data-action="playlist">
      <i class="fa-solid fa-list"></i> Add to Playlist
    </button>
    ${currentCtxView === 'playlist' && currentCtxPlaylistId ? `
      <button class="menu-item menu-item-danger" data-action="remove-playlist">
        <i class="fa-solid fa-minus"></i> Remove from Playlist
      </button>
    ` : ''}
  `;

  document.body.appendChild(menu);
  activeMenu = menu;

  menu.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', async e => {
      e.stopPropagation();
      const action = item.dataset.action;
      if      (action === 'favourite')       await addToFavourites(songId);
      else if (action === 'unfavourite')     await removeFromFavourites(songId);
      else if (action === 'queue')           addSongToQueue(trackIndex);
      else if (action === 'playlist')        await showPlaylistPicker(songId, rect);
      else if (action === 'remove-playlist') await removeFromPlaylist(songId);
      menu.remove();
      activeMenu = null;
    });
  });

  function handleOutsideClick(e) {
    if (!menu.contains(e.target) && !btn.contains(e.target)) {
      menu.remove();
      activeMenu = null;
      document.removeEventListener('click', handleOutsideClick, true);
    }
  }
  document.addEventListener('click', handleOutsideClick, true);
}

export function showToast(message) {
  document.querySelectorAll('.toast').forEach(t => t.remove());

  const toast = document.createElement('div');
  toast.className   = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  // fade out after 2.5 seconds
  setTimeout(() => toast.classList.add('toast-hide'), 2000);
  setTimeout(() => toast.remove(), 2500);
}