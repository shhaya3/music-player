let TRACKS = [];
let currentIndex = 0;

async function loadLibrary() {
  try{
    const res = await fetch('http://localhost:5000/api/songs');
    TRACKS = await res.json();
    renderTrackList();
    if(TRACKS.length > 0) loadTrack(0);

  } catch(err) {
    console.log('cannot reach backend', err);
  }
}

document.addEventListener('DOMContentLoaded', loadLibrary);
let search = document.getElementById('search');

let searchTimer;
search.addEventListener("imput", e => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(async () => {
    const q = e.target.value.trim();
    if (!q) {loadLibrary(); return; }
    const res = await fetch(`http://localhost:5000/api/songs/search?q=${encodeURIComponent(q)}`);
    TRACKS = await res.json();
    renderTrackList();
  }, 300);
});




const trackTable = document.querySelectorAll('.track-table tr');
 

 
function renderTrackList() {
  const tbody = document.getElementById('track-list-body');
  tbody.innerHTML = '';
  TRACKS.forEach((track, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class='track-num'>${i + 1}</td>
      <td>${track.title}</td>
      <td>${track.artist}</td>
      <td class='track-dur'>${track.duration}</td>
    `;
    tr.addEventListener('click', () => loadTrack(i));
    tbody.appendChild(tr);
  });
}
 
function highlightRow(index) {
  trackTable.forEach((tr, i) => {
    tr.classList.toggle('playing', i === index);
  });
}
 
renderTrackList();