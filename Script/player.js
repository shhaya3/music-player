const playPrev    = document.querySelector('#prev-btn');
const playNext    = document.querySelector('#next-btn');
const shuffleBtn  = document.getElementById('btn-shuffle');
const npCover     = document.getElementById('np-cover');
const npTitle     = document.getElementById('np-title');
const npArtist    = document.getElementById('np-artist');
const progressBar = document.getElementById('progress-bar');
const repeatBtn   = document.querySelector('#repeat-btn');
const repeatBadge = document.getElementById('repeat-badge');
const playBtn     = document.querySelector('.play-btn');
const muteBtn     = document.getElementById('mute-btn');
const volSlider   = document.getElementById('volume');

let queue          = [];
let queuePos       = 0;
let history        = [];
let isShuffled     = false;
let isMuted        = false;
let hasScrobbled   = false;
let repeatMode     = 'none';

function playFromQueue() {
  const trackIndex = queue[queuePos];
  const track      = PLAYING_TRACKS[trackIndex];
  if (!track) return;

  currentIndex = trackIndex;

  audio.src = track.src;
  audio.load();
  audio.play().catch(() => {});
  setPlayIcon(true);

  npCover.crossOrigin  = 'anonymous';
  npCover.src          = track.cover || 'Assest/CoverImage/album-placeholder.png';
  npTitle.textContent  = track.title;
  npArtist.textContent = track.artist;

  highlightRow(trackIndex);
  applyBackgroundFromCover(npCover.src);

  // Last.fm now playing
  if (localStorage.getItem('token')) {
    fetch('http://localhost:5000/api/lastfm/now-playing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ artist: track.artist, track: track.title })
    }).catch(() => {});
  }

  hasScrobbled = false;
}

function loadTrack(i) {
  // if queue already built for this context, jump to that position
  const posInQueue = queue.indexOf(i);
  if (posInQueue !== -1) {
    history.push(queuePos);
    queuePos = posInQueue;
  } else {
    // fallback — rebuild queue from current PLAYING_TRACKS
    buildQueue(PLAYING_TRACKS, i);
    return;
  }
  playFromQueue();
}


function highlightRow(index) {
  document.querySelectorAll('#track-list-body tr').forEach((tr, i) => {
    tr.classList.toggle('playing', i === index);
  });
}

audio.addEventListener('timeupdate', () => {
  if (!audio.duration) return;
  const pct = (audio.currentTime / audio.duration) * 100;

  // progress bar
  progressBar.value = pct;
  currentTime.textContent    = formatTime(audio.currentTime);
  songDuration.textContent   = formatTime(audio.duration);
  progressBar.style.background = `linear-gradient(to right, #a78bfa ${pct}%, #334155 ${pct}%)`;

  // scrobble
  const fourMinutes = 240;
  if (!hasScrobbled && (pct >= 50 || audio.currentTime >= fourMinutes)) {
    hasScrobbled = true;
    const track = PLAYING_TRACKS[currentIndex];
    if (!track) return;
    fetch('http://localhost:5000/api/lastfm/scrobble', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ artist: track.artist, track: track.title })
    }).then(r => r.json()).then(d => console.log('SCROBBLE RESPONSE:', d));
  }
});

//play and pause function
playBtn.addEventListener("click", () => {
    if (audio.paused) {
        audio.play();
        setPlayIcon(true);
    }
    else {
        audio.pause();
        setPlayIcon(false);
    }
})

//previous btn function
playPrev.addEventListener('click', () => {
  if (audio.currentTime > 3) {
    audio.currentTime = 0;
    return;
  }
  if (history.length > 0) {
    queuePos = history.pop();  // go back to previously played position
    playFromQueue();
  } else {
    // nothing in history — restart current song
    audio.currentTime = 0;
  }
});

//next btn function 
playNext.addEventListener('click', () => {
  history.push(queuePos);
  queuePos = (queuePos + 1) % queue.length;
  playFromQueue();
});

// shuffle 
shuffleBtn.addEventListener('click', () => {
  isShuffled = !isShuffled;
  shuffleBtn.style.color = isShuffled ? '#a78bfa' : '';

  if (isShuffled) {
    // shuffle everything after current position, keep history intact
    const current   = queue[queuePos];
    const remaining = queue.slice(queuePos + 1);
    const shuffled  = fisherYates(remaining);
    queue = [...queue.slice(0, queuePos + 1), ...shuffled];
  } else {
    // restore natural order from current track onwards
    const current     = queue[queuePos];
    const naturalOrder = PLAYING_TRACKS.map((_, i) => i);
    const currentPos  = naturalOrder.indexOf(current);
    const before      = naturalOrder.slice(0, currentPos);
    const after       = naturalOrder.slice(currentPos + 1);
    queue    = [...queue.slice(0, queuePos + 1), ...after, ...before];
  }
});

//Volume change
volSlider.addEventListener("input", () => {
    const vol = volSlider.value;
    audio.volume = vol / 100;

    if (vol == 0) {
        volIcon.className = "fa-solid fa-volume-xmark";
    }
    else if (vol < 50) {
        volIcon.className = "fa-solid fa-volume-low";
    }
    else {
        volIcon.className = "fa-solid fa-volume-high";
    }
    localStorage.setItem('volume', vol);
})

//Audio mute and icon change
muteBtn.addEventListener("click", () => {
    isMuted = !isMuted;
    audio.muted = isMuted;

    volIcon.className = !isMuted
        ? 'fa-solid fa-volume-xmark'
        : volSlider.value < 50
            ? 'fa-solid fa-volume-low'
            : 'fa-solid fa-volume-high';
})

//Jumping to a diff point in song using progress bar
progressBar.addEventListener("input", () => {
    if (!audio.duration || isNaN(audio.duration)) return;
    audio.currentTime = (progressBar.value / 100) * audio.duration;
})

//repeat function
repeatBtn.addEventListener("click", () => {
    const modes = ["none", "all", "one"];
    const next = modes[(modes.indexOf(repeatMode) + 1) % modes.length];
    repeatMode = next;

    const icon = repeatBtn.querySelector('i');

    if (repeatMode === 'none') {
        icon.className = 'fa-solid fa-repeat';
        repeatBtn.style.color = '';
        repeatBadge.style.display  = 'none';
    } else if (repeatMode === 'all') {
        icon.className = 'fa-solid fa-repeat';
        repeatBtn.style.color = '#a78bfa';
        repeatBadge.style.display  = 'none';
    } else if (repeatMode === 'one') {
        icon.className = 'fa-solid fa-repeat';
        repeatBtn.style.color = '#a78bfa';
        repeatBadge.style.display  = 'flex';   
    }
})


audio.addEventListener('ended', () => {
  if (repeatMode === 'one') {
    audio.currentTime = 0;
    audio.play();
    return;
  }

  history.push(queuePos);

  if (queuePos < queue.length - 1) {
    queuePos++;
    playFromQueue();
  } else if (repeatMode === 'all') {
    // rebuild queue for another round
    if (isShuffled) {
      queue    = fisherYates(PLAYING_TRACKS.map((_, i) => i));
      queuePos = 0;
    } else {
      queuePos = 0;
    }
    playFromQueue();
  } else {
    setPlayIcon(false);
  }
});