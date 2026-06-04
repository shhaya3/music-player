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

function loadTrack(i) {
    const track = TRACKS[i];
    currentIndex = i;

    //update audio file
    audio.src = track.src;

    //update right panel 
    document.getElementById("np-cover").src = track.cover || "Assests/coverImage/default.jpg";
    document.getElementById("np-title").textContent = track.title;
    document.getElementById("np-artist").textContent = track.artist;


    //highlight the now playing song 
    activeTrack.forEach((tr, i) => {
        tr.classList.toggle("playing", i === i)
    })

    audio.play();
    setPlayIcon(true);
}

//audioupdate
audio.addEventListener('timeupdate', () => {
    if (!audio.duration) return;
    const pct = (audio.currentTime / audio.duration) * 100;
    progressBar.value = pct;
    currentTime.textContent = formatTime(audio.currentTime);

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
    currentIndex = (currentIndex + 1) % TRACKS.length;
    loadTrack(currentIndex);
    audio.play();
    setPlayIcon(true);
})

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

isMuted = false;
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
