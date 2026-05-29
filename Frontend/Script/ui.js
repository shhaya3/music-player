const playIcon = document.getElementById("play-icon")
const songDuration = document.getElementById('song-duration');
const currentTime = document.getElementById("current-time");
const volIcon = document.getElementById("vol-icon")

function setPlayIcon(isPlaying) {
  const icon = isPlaying ? 'fa-pause' : 'fa-play';
  playIcon.className = `fa-solid ${icon}`;
}


audio.addEventListener('loadedmetadata', () => {
  const d = formatTime(audio.duration);
  songDuration.textContent = d;
});

function formatTime(s) {
  const m = Math.floor(s / 60);
  return `${m}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
}
