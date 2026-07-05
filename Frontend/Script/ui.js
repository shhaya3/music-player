const playIcon     = document.getElementById("play-icon");
const songDuration = document.getElementById('song-duration');
const currentTime  = document.getElementById("current-time");
const volIcon      = document.getElementById("vol-icon");
const trackSection = document.querySelector('.track-section');
const app          = document.querySelector('.app');
let activeMenu     = null;


function setPlayIcon(isPlaying) {
  const icon = isPlaying ? 'fa-pause' : 'fa-play';
  playIcon.className = `fa-solid ${icon}`;
}


audio.addEventListener('loadedmetadata', () => {
  const d = formatTime(audio.duration);
  songDuration.textContent = d;
});

audio.addEventListener('timeupdate', () => {
    if (!audio.duration) return;
    const pct = (audio.currentTime / audio.duration) * 100;
    progressBar.value = pct;
    currentTime.textContent = formatTime(audio.currentTime);
    songDuration.textContent = formatTime(audio.duration);

    progressBar.style.background = `linear-gradient(to right, #a78bfa ${pct}%, #334155 ${pct}%)`;
});

function applyBackgroundFromCover(imageUrl) {
  app.style.backgroundImage = `url('${imageUrl}')`;
}


function openTrackMenu(event, songId, index) {
  // if same button clicked again — close and return
  if (activeMenu) {
    activeMenu.remove();
    activeMenu = null;
    return;
  }

  const btn  = event.target.closest('.track-menu-btn');
  const rect = btn.getBoundingClientRect();

  const menu = document.createElement('div');
  menu.className = 'context-menu';
  menu.style.top  = `${rect.bottom + 4}px`;
  menu.style.left = `${Math.max(rect.left - 160, 8)}px`;

  menu.innerHTML = `
    <button class="menu-item" data-action="favourite">
      <i class="fa-solid fa-heart"></i> Add to Favourites
    </button>
    <button class="menu-item" data-action="playlist">
      <i class="fa-solid fa-list"></i> Add to Playlist
    </button>
  `;

  document.body.appendChild(menu);
  activeMenu = menu;

  // query items FROM the menu we just created
  menu.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', async (e) => {
      e.stopPropagation();
      const action = item.dataset.action;
      if (action === 'favourite') await addToFavourites(songId);
      else if (action === 'playlist') await showPlaylistPicker(songId, rect);
      menu.remove();
      activeMenu = null;
    });
  });

  // close on outside click
  function handleOutsideClick(e) {
    if (!menu.contains(e.target) && !btn.contains(e.target)) {
      menu.remove();
      activeMenu = null;
      document.removeEventListener('click', handleOutsideClick, true);
    }
  }
  document.addEventListener('click', handleOutsideClick, true);
}