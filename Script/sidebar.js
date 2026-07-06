const navItems = document.querySelectorAll('.nav-item');
const views    = document.querySelectorAll('.view');
const tbody    = document.getElementById('artist-list-body');
const albumTbody = document.getElementById('album-list-body');

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}


navItems.forEach(item => {
  item.addEventListener('click', () => {
    navItems.forEach(n => n.classList.remove('active'));
    item.classList.add('active');
    loadView(item.dataset.view);
  });
});

function loadView(viewName) {
  views.forEach(v => v.hidden = true);
  const target = document.getElementById(`view-${viewName}`);
  if (target) target.hidden = false;
  if (viewName === 'artists') loadArtistsView();
}

async function loadArtistsView() {
  const res  = await fetch('/api/artists');
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

const playlists = ["届かない恋", "Summertime", "Shhaya's Classical"];

function renderPlaylists() {
  const ul = document.getElementById('playlist-list');
  ul.innerHTML = '';
  playlists.forEach((name, i) => {
    const li = document.createElement('li');
    li.className = 'nav-item';
    li.innerHTML = `<i class='fa-solid fa-list'></i> ${name}`;
    li.addEventListener('click', () => loadPlaylist(i));
    ul.appendChild(li);
  });
}

document.getElementById('btn-new-playlist').addEventListener('click', () => {
  const name = prompt('Playlist name:');
  if (name) { playlists.push(name); renderPlaylists(); }
});

renderPlaylists();


function loadView(viewName) {
  views.forEach(v => v.hidden = true);
  const target = document.getElementById(`view-${viewName}`);
  if (target) target.hidden = false;
  if (viewName === 'artists') loadArtistsView();
  if (viewName === 'albums')  loadAlbumsView();
}

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