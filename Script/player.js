const audio = document.getElementById("audio-player");
const activeTrack = document.querySelectorAll(".track-table tr");
const playBtn = document.querySelector(".play-btn");
const playPrev = document.querySelector("#prev-btn");
const playNext = document.querySelector("#next-btn");
const volSlider = document.getElementById("volume");
const muteBtn = document.getElementById("mute-btn");
const progressBar = document.getElementById("progress-bar");
const repeatBtn = document.querySelector("#repeat-btn");
const repeatBadge = document.getElementById("repeat-badge");
const npCover = document.getElementById("np-cover");
const npTitle = document.getElementById("np-title");
const npArtist = document.getElementById("np-artist");
const shuffleBtn = document.getElementById('btn-shuffle');


let hasScrobbled = true; 

function loadTrack(i) {
    const track = TRACKS[i];
    currentIndex = i;

    audio.src = track.src;

    npCover.src = track.cover || "Assests/coverImage/default.jpg";
    applyBackgroundFromCover(track.cover);

    npTitle.textContent = track.title;
    npArtist.textContent = track.artist;

    highlightRow(i);

    audio.play();
    setPlayIcon(true);

    fetch('http://localhost:5000/api/lastfm/now-playing', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ artist: track.artist, track: track.title })
})
.then(r => r.json())
.then(data => {
  if (data.error === 'lastfm_reauth_required') {
    // update the sidebar button to show disconnected
    const statusEl = document.getElementById('lastfm-status');
    if (statusEl) statusEl.textContent = 'Reconnect Last.fm';
    const btn = document.getElementById('btn-lastfm');
    if (btn) btn.classList.remove('connected');
    console.log('Last.fm session expired — please reconnect');
  }
});

  hasScrobbled = false;
}

function highlightRow(index) {
  document.querySelectorAll('#track-list-body tr').forEach((tr, i) => {
    tr.classList.toggle('playing', i === index);
  });
}

audio.addEventListener('timeupdate', () => {
  if (!audio.duration) return;
  const pct = (audio.currentTime / audio.duration) * 100;

  const fourMinutes = 240;
  if (!hasScrobbled && (pct >= 50 || audio.currentTime >= fourMinutes)) {
    hasScrobbled = true;
    console.log('SCROBBLE TRIGGERED');  // add this
    const track = TRACKS[currentIndex];
    fetch('http://localhost:5000/api/lastfm/scrobble', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ artist: track.artist, track: track.title })
    }).then(r => r.json()).then(d => console.log('SCROBBLE RESPONSE:', d));  // add this
  }
});

//audioupdate
audio.addEventListener('timeupdate', () => {
    if (!audio.duration) return;
    const pct = (audio.currentTime / audio.duration) * 100;
    progressBar.value = pct;
    currentTime.textContent = formatTime(audio.currentTime);
    songDuration.textContent = formatTime(audio.duration);
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
playPrev.addEventListener("click", () => {
    currentIndex = (currentIndex - 1 + TRACKS.length) % TRACKS.length;
    loadTrack(currentIndex);
    audio.play();
    setPlayIcon(true);
})


//next btn function 
playNext.addEventListener("click", () => {
    if (isShuffled) {
    // pick a random track that isn't the current one
    let random;
    do { random = Math.floor(Math.random() * TRACKS.length); }
    while (random === currentIndex && TRACKS.length > 1);
    currentIndex = random;
    } else {
        currentIndex = (currentIndex + 1) % TRACKS.length;
    }
    loadTrack(currentIndex);
    audio.play();
    setPlayIcon(true);
});


// shuffle 
let isShuffled = false;
shuffleBtn.addEventListener("click", () => {
    isShuffled = !isShuffled;
    shuffleBtn.style.color = isShuffled ? '#a78bfa' : '';
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

isMuted = true;
muteBtn.addEventListener("click", () => {
    isMuted = !isMuted;
    audio.volume = isMuted;

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

let repeatMode = "none";
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

audio.addEventListener("ended", () => {
    if (repeatMode === "one") {
        audio.currentTime = 0;
        audio.play();
    }
    else if (repeatMode === "all") {
        currentIndex = (currentIndex + 1) % TRACKS.length;
        loadTrack(currentIndex);
        audio.play();
    } else {
        if (currentIndex < TRACKS.length - 1) {
            currentIndex++;
            loadTrack(currentIndex);
            audio.play();
        } else {
            setPlayIcon(false);
        }
    }
})


