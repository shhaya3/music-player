// player.js
// Controls the HTML5 audio element. Play/pause, next/prev, volume,
// shuffle, repeat, scrobble. Uses queue.js for playback order.
// Depends on: api.js, queue.js, track.js, ui.js

import { apiScrobble, apiUpdateNowPlaying, isLoggedIn, formatTime } from '../api/api.js';
import {
  queue, queuePos, history, isShuffled, repeatMode,
  buildQueue, queueNext, queuePrev, queueEnded,
  toggleShuffle, cycleRepeat, PLAYING_TRACKS
} from '../states/queue.js';
import { audio, highlightRow, setPlayTrackCallback, TRACKS } from '../components/track.js';
import { setPlayIcon, updateVolIcon, applyBackgroundFromCover } from '../utils/ui.js';

// DOM elements

const npCover    = document.getElementById('np-cover');
const npTitle    = document.getElementById('np-title');
const npArtist   = document.getElementById('np-artist');
const playBtn    = document.querySelector('.play-btn');
const prevBtn    = document.getElementById('prev-btn');
const nextBtn    = document.getElementById('next-btn');
const shuffleBtn = document.getElementById('btn-shuffle');
const repeatBtn  = document.getElementById('repeat-btn');
const repeatBadge = document.getElementById('repeat-badge');
const volSlider  = document.getElementById('volume');
const muteBtn    = document.getElementById('mute-btn');

// State

let isMuted      = false;
let hasScrobbled = false;

// Play a track by its index in PLAYING_TRACKS

function playTrackAtIndex(trackIndex) {
  const track = PLAYING_TRACKS[trackIndex];
  if (!track) return;

  audio.src = track.src;
  audio.load();
  audio.play().catch(() => {});

  // update now playing panel
  npCover.crossOrigin  = 'anonymous';
  npCover.src          = track.cover || 'assets/covers/album-placeholder.png';
  npTitle.textContent  = track.title;
  npArtist.textContent = track.artist;

  setPlayIcon(true);
  highlightRow(trackIndex);
  applyBackgroundFromCover(track.cover);
  hasScrobbled = false;

  // Last.fm now playing
  if (isLoggedIn()) {
    apiUpdateNowPlaying(track.artist, track.title, track.album || '');
  }
}

// register callback so track.js can trigger playback when user clicks a row
setPlayTrackCallback(playTrackAtIndex);

// Play / pause

playBtn.addEventListener('click', () => {
  if (audio.paused) { audio.play(); setPlayIcon(true); }
  else              { audio.pause(); setPlayIcon(false); }
});

// Next / prev

nextBtn.addEventListener('click', () => {
  queueNext(playTrackAtIndex);
});

prevBtn.addEventListener('click', () => {
  queuePrev(audio.currentTime, playTrackAtIndex, () => { audio.currentTime = 0; });
});

// Song ended 

audio.addEventListener('ended', () => {
  queueEnded(
    (trackIndex) => playTrackAtIndex(trackIndex),
    () => setPlayIcon(false)
  );
});

// Scrobble at 50% or 4 minutes 

audio.addEventListener('timeupdate', () => {
  if (!audio.duration || hasScrobbled) return;
  const pct = (audio.currentTime / audio.duration) * 100;
  if (pct >= 50 || audio.currentTime >= 240) {
  hasScrobbled = true;
  const track = PLAYING_TRACKS[queue[queuePos]];
  if (track && isLoggedIn()) {
    apiScrobble(track.artist, track.title, track.album || '');
  }
  }
});

//Shuffle

shuffleBtn.addEventListener('click', () => {
  const shuffled = toggleShuffle();
  shuffleBtn.style.color = shuffled ? '#a78bfa' : '';
});

//Repeat

repeatBtn.addEventListener('click', () => {
  const mode = cycleRepeat();
  const icons = { none: '', all: '', one: '1' };
  repeatBtn.style.color        = mode !== 'none' ? '#a78bfa' : '';
  repeatBadge.style.display    = mode === 'one'  ? 'flex'    : 'none';
});

//Volume

const savedVol = parseFloat(localStorage.getItem('volume') || '80');
audio.volume    = savedVol / 100;
volSlider.value = savedVol;
updateVolIcon(savedVol / 100, false);
volSlider.style.background =
  `linear-gradient(to right, #a78bfa ${savedVol}%, #334155 ${savedVol}%)`;

volSlider.addEventListener('input', () => {
  const val = parseFloat(volSlider.value);  // 0-100
  const vol = val / 100;                    // 0-1 for audio
  audio.volume = vol;
  isMuted      = false;
  audio.muted  = false;
  localStorage.setItem('volume', val);
  updateVolIcon(vol, false);
  volSlider.style.background =
    `linear-gradient(to right, #a78bfa ${val}%, #334155 ${val}%)`;
});

muteBtn.addEventListener('click', () => {
  isMuted     = !isMuted;
  audio.muted = isMuted;
  const vol   = parseFloat(volSlider.value) / 100;
  updateVolIcon(vol, isMuted);
  if (isMuted) {
    volSlider.style.background = `linear-gradient(to right, #a78bfa 0%, #334155 0%)`;
  } else {
    const val = parseFloat(volSlider.value);
    volSlider.style.background =
      `linear-gradient(to right, #a78bfa ${val}%, #334155 ${val}%)`;
  }
});

//Keyboard shortcuts

// document.addEventListener('keydown', e => {
//   if (e.target.tagName === 'INPUT') return; // don't fire when typing

//   switch (e.key) {
//     case ' ':
//       e.preventDefault();
//       if (audio.paused) { audio.play(); setPlayIcon(true); }
//       else              { audio.pause(); setPlayIcon(false); }
//       break;
//     case 'ArrowRight': queueNext(playTrackAtIndex); break;
//     case 'ArrowLeft':
//       queuePrev(audio.currentTime, playTrackAtIndex, () => { audio.currentTime = 0; });
//       break;
//     case 'ArrowUp':
//       audio.volume = Math.min(1, audio.volume + 0.05);
//       volSlider.value = audio.volume;
//       updateVolIcon(audio.volume, isMuted);
//       break;
//     case 'ArrowDown':
//       audio.volume = Math.max(0, audio.volume - 0.05);
//       volSlider.value = audio.volume;
//       updateVolIcon(audio.volume, isMuted);
//       break;
//     case 'm':
//       muteBtn.click();
//       break;
//   }
// });