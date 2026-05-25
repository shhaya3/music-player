const navItems = document.querySelectorAll('.nav-item');
 
navItems.forEach(item => {
  item.addEventListener('click', () => {
    // Remove active from all
    navItems.forEach(n => n.classList.remove('active'));
    // Set active on clicked
    item.classList.add('active');
    // Switch the main content view
    const view = item.dataset.view;  // 'songs' | 'artists' | 'albums' | 'favourites'
    loadView(view);
  });
});
 
function loadView(view) {
  // Hide all views, show the selected one
  document.querySelectorAll('.view').forEach(v => v.hidden = true);
  document.getElementById(`view-${view}`).hidden = false;
}

// Playlist data (later will come from backend)
const playlists = ['Chill Vibes', 'Workout Mix', 'Late Night'];
 
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
 
// New playlist button
document.getElementById('btn-new-playlist').addEventListener('click', () => {
  const name = prompt('Playlist name:');
  if (name) { playlists.push(name); renderPlaylists(); }
});
 
renderPlaylists();