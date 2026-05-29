const TRACKS = [
  { title: 'あぶく', artist: 'Yorushika', duration: '3:54', src: 'Assest/Songs/あぶく.flac', cover: "Assest/CoverImage/Cover.jpg" },
  { title: 'Dasvidaniya', artist: 'Wuthering Waves', duration: '2:56', src: 'Assest/Songs/Dasvidaniya.flac', cover: "Assest/CoverImage/dasvidaniya-cover.jpg"},
];
const trackTable = document.querySelectorAll('.track-table tr');
 
let currentIndex = 0;
 
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