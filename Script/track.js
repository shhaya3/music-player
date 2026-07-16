let TRACKS = [];
let currentIndex = 0;
title = document.querySelector('.view-title');
songNo = document.querySelector('.view-meta');
const artistImg = document.querySelector('.view-cover');
const audio = document.getElementById('audio-player');
let PLAYING_TRACKS = [];


function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}


async function getArtistImg(artistName) {
  try {
  const res = await fetch(`http://localhost:5000/api/spotify/artist-image/${encodeURIComponent(artistName)}`);
  const data = await res.json();

  return data.image || null;
  }

  catch(err) {
    return null;
  }
}

async function loadAlbumSongs(album) {
  try {
    const res = await fetch(`http://localhost:5000/api/albums/songs/${encodeURIComponent(album)}`);
    TRACKS = await res.json();

    title.textContent = album;
    songNo.textContent  = `${TRACKS.length} songs`;

    renderTrackList();
  } catch(err) {
    console.log('could not load album songs', err);
  }
}

async function loadArtistSongs(artist) {
  try {
    const res = await fetch(`http://localhost:5000/api/artists/songs/${encodeURIComponent(artist)}`);
    TRACKS = await res.json();
    title.textContent = artist;
    songNo.textContent = `${TRACKS.length} songs`;


    renderTrackList();
    
    const imgUrl = await getArtistImg(artist);
    if(imgUrl) {
      artistImg.src = imgUrl;
      //applyBackgroundFromCover(imgUrl);
    }
    else {
      artistImg.src = 'Assest/CoverImage/default.jpg';
    }
  } catch(err) {
    console.log('could not load artist songs', err);
  }
}


async function loadLibrary() {
  try {
    const res = await fetch('http://localhost:5000/api/songs');
    TRACKS = await res.json();
    if (PLAYING_TRACKS.length === 0 && TRACKS.length > 0) {
      PLAYING_TRACKS = [...TRACKS];
      queue    = PLAYING_TRACKS.map((_, i) => i);
      queuePos = 0;
      history  = [];
    }
    renderTrackList();
  } catch(err) {
    console.log('cannot reach backend', err);
  }
}


function fisherYates(array){
    const arr = [...array]; // never mutate original
    for(let i = arr.length - 1; i>0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function buildQueue(tracks, startIndex) {
  PLAYING_TRACKS = [...tracks];

  if (isShuffled) {
    // put startIndex first, shuffle the rest
    const rest = PLAYING_TRACKS
      .map((_, i) => i)
      .filter(i => i !== startIndex);
    queue    = [startIndex, ...fisherYates(rest)];
  } else {
    // natural order starting from startIndex
    const before = PLAYING_TRACKS.map((_, i) => i).filter(i => i < startIndex);
    const from   = PLAYING_TRACKS.map((_, i) => i).filter(i => i >= startIndex);
    queue    = [...from, ...before];
  }

  queuePos = 0;
  history  = [];
  playFromQueue();
}

function renderTrackList() {
  const tbody = document.getElementById('track-list-body');
  tbody.innerHTML = '';
  TRACKS.forEach((track, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class='track-num'>${i + 1}</td>
      <td>${escapeHtml(track.title)}</td>
      <td><span class="artist-link" data-artist="${escapeHtml(track.artist)}">${escapeHtml(track.artist)}</span></td>
      <td class='track-dur'>${formatTime(track.duration)}</td>
      <td class='track-menu-cell'>
        <button class='track-menu-btn' data-id="${track.id}" data-index="${i}">
          <i class='fa-solid fa-ellipsis-vertical'></i>
        </button>
      </td>
    `;
    tr.addEventListener('click', (e) => {
      if (e.target.closest('.track-menu-btn')) return;
      buildQueue(TRACKS, i);  // ← builds queue from this view's tracks
    });
    tbody.appendChild(tr);
  });

  document.querySelectorAll('.track-menu-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      openTrackMenu(e, btn.dataset.id, parseInt(btn.dataset.index));
    });
  });
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

document.addEventListener('DOMContentLoaded', () => {
  loadLibrary();

  document.getElementById('track-list-body').addEventListener('click', async (e) => {
    if (e.target.classList.contains('artist-link')) {
      e.stopPropagation();
      const artist = e.target.dataset.artist;
      await loadArtistSongs(artist);
    }
  });
});

async function addToFavourites(songId) {
  try {
    const res  = await fetch(`http://localhost:5000/api/favourites/${songId}`, {
      method: 'POST',
      headers: authHeaders()
    });
    const data = await res.json();
    if (res.status === 401) {
      alert('Please log in to add favourites');
      return;
    }
    console.log(data.message);
  } catch(err) {
    console.log('could not add favourite', err);
  }
}

async function loadFavourites() {
  if (!localStorage.getItem('token')) {
    title.textContent  = 'Liked Songs';
    songNo.textContent = 'Please log in to see favourites';
    // artistImg.src      = "Assest/CoverImage/liked.png";
    TRACKS = [];
    renderTrackList();
    return;
  }

  try {
    const res = await fetch('http://localhost:5000/api/favourites', {
      headers: authHeaders()
    });

    if (!res.ok) {
      console.log('favourites fetch failed:', res.status);
      return;
    }

    TRACKS = await res.json();
    title.textContent  = 'Liked Songs';
    songNo.textContent = `${TRACKS.length} songs`;
    artistImg.src      = 'Assest/CoverImage/liked.png';

    renderTrackList();
  } catch(err) {
    console.log('could not load favourite songs', err);
  }
}



async function showPlaylistPicker(songId) {
  if (!localStorage.getItem('token')) {
    alert('Please log in to add to playlists');
    return;
  }

  const res       = await fetch('http://localhost:5000/api/playlists', { headers: authHeaders() });
  const playlists = await res.json();

  if (!playlists.length) {
    alert('No playlists found — create one first using the + button in the sidebar');
    return;
  }

  // remove existing picker if open
  document.querySelectorAll('.playlist-picker').forEach(p => p.remove());

  const picker = document.createElement('div');
  picker.className = 'context-menu playlist-picker';
  picker.style.top  = document.querySelector('.context-menu')?.style.top || '200px';
  picker.style.left = document.querySelector('.context-menu')?.style.left || '200px';

  picker.innerHTML = `
    <div class="menu-header">Add to Playlist</div>
    ${playlists.map(p => `
      <button class="menu-item" data-playlist-id="${p.id}">
        <i class="fa-solid fa-list"></i> ${escapeHtml(p.name)}
      </button>
    `).join('')}
  `;

  document.body.appendChild(picker);

  picker.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', async (e) => {
      e.stopPropagation();
      const pid = item.dataset.playlistId;
      await fetch(`http://localhost:5000/api/playlists/${pid}/songs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ song_id: parseInt(songId) })
      });
      picker.remove();
    });
  });

  setTimeout(() => {
    document.addEventListener('click', function closePicker() {
      picker.remove();
      document.removeEventListener('click', closePicker);
    });
  }, 0);
}

async function loadPlaylistSongs(playlistId, playlistName) {
  // switch to songs view
  document.querySelectorAll('.view').forEach(v => v.hidden = true);
  document.getElementById('view-songs').hidden = false;

  if (!localStorage.getItem('token')) {
    title.textContent  = playlistName;
    songNo.textContent = 'Please log in';
    TRACKS = [];
    renderTrackList();
    return;
  }

  try {
    const res = await fetch(`http://localhost:5000/api/playlists/${playlistId}/songs`, {
      headers: authHeaders()
    });
    TRACKS = await res.json();
    title.textContent  = playlistName;
    songNo.textContent = `${TRACKS.length} songs`;
    artistImg.src      = '';
    renderTrackList();
  } catch(err) {
    console.log('could not load playlist songs', err);
  }
}