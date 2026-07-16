const navItems = document.querySelectorAll('.nav-item');
const views    = document.querySelectorAll('.view');
const tbody    = document.getElementById('artist-list-body');
const albumTbody = document.getElementById('album-list-body');

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

function clearActiveNav() {
  // clears ALL nav items including dynamically added playlist ones
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
}


navItems.forEach(item => {
  item.addEventListener('click', () => {
    clearActiveNav();
    item.classList.add('active');
    loadView(item.dataset.view);
  });
});

function loadView(viewName) {
  views.forEach(v => v.hidden = true);
  const target = document.getElementById(`view-${viewName}`);
  if (target) target.hidden = false;

  if (viewName === 'artists')    loadArtistsView();
  if (viewName === 'albums')     loadAlbumsView();
  if (viewName === 'favourites') {
    // favourites reuses the songs view
    document.getElementById('view-songs').hidden = false;
    loadFavourites();
  }
  if (viewName === 'songs')      loadLibrary();
}


async function loadArtistsView() {
  const res  = await fetch('http://localhost:5000/api/artists');
  const data = await res.json();
  tbody.innerHTML = '';
  data.forEach(a => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escapeHtml(a.artist)}</td>
      <td>${a.count} songs</td>
    `;
    tr.style.cursor = 'pointer';
    tr.addEventListener('click', () => {
      loadArtistSongs(a.artist);
      views.forEach(v => v.hidden = true);
      document.getElementById('view-songs').hidden = false;
      navItems.forEach(n => n.classList.remove('active'));
      document.querySelector('[data-view="songs"]').classList.add('active');
    });
    tbody.appendChild(tr);
  });
}

async function loadPlaylists() {
  if (!localStorage.getItem('token')) {
    renderPlaylists([]);
    return;
  }
  try {
    const res  = await fetch('http://localhost:5000/api/playlists', { headers: authHeaders() });
    const data = await res.json();
    renderPlaylists(data);
  } catch(err) {
    console.log('could not load playlists', err);
  }
}

function renderPlaylists(playlists) {
  const ul = document.getElementById('playlist-list');
  ul.innerHTML = '';
  playlists.forEach(pl => {
    const li = document.createElement('li');
    li.className = 'nav-item';
    li.dataset.playlistId = pl.id;
    li.innerHTML = `<i class='fa-solid fa-list'></i> ${escapeHtml(pl.name)}`;
    li.addEventListener('click', () => {
      clearActiveNav();
      navItems.forEach(n => n.classList.remove('active'));
      li.classList.add('active');
      loadPlaylistSongs(pl.id, pl.name);
    });
    ul.appendChild(li);
  });
}

document.getElementById('btn-new-playlist').addEventListener('click', async () => {
  if (!localStorage.getItem('token')) {
    alert('Please log in to create playlists');
    return;
  }
  const name = prompt('Playlist name:');
  if (!name) return;

  try {
    const res = await fetch('http://localhost:5000/api/playlists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ name })
    });
    if (res.ok) {
      loadPlaylists(); // refresh list from backend
    }
  } catch(err) {
    console.log('could not create playlist', err);
  }
});

// call on page load and after login
loadPlaylists();
renderPlaylists();



async function loadAlbumsView() {
  const res  = await fetch('http://localhost:5000/api/albums');
  const data = await res.json();
  albumTbody.innerHTML = '';

  data.forEach(a => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escapeHtml(a.album)}</td>
      <td>${escapeHtml(a.artist)}</td>
      <td>${a.count} songs</td>
    `;
    tr.style.cursor = 'pointer';
    tr.addEventListener('click', () => {
      loadAlbumSongs(a.album);
      views.forEach(v => v.hidden = true);
      document.getElementById('view-songs').hidden = false;
      navItems.forEach(n => n.classList.remove('active'));
      document.querySelector('[data-view="songs"]').classList.add('active');
    });
    albumTbody.appendChild(tr);
  });
}


async function connectLastfm() {
  const res  = await fetch('http://localhost:5000/api/lastfm/connect', {
    headers: authHeaders()
  });
  const data = await res.json();
  window.location.href = data.auth_url;  // redirect to Last.fm
}
