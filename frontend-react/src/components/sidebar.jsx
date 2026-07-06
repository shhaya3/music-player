import { useState, useEffect } from 'react';
import { fetchArtists, fetchAlbums, fetchPlaylists, createPlaylist, scanLibrary, connectLastfm } from '../api';

export default function Sidebar({ auth, onViewChange, onLoginClick }) {
  const [artists,   setArtists]   = useState([]);
  const [albums,    setAlbums]    = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [activeView, setActiveView] = useState('songs');
  const [profileOpen, setProfileOpen] = useState(false);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    fetchArtists().then(setArtists);
    fetchAlbums().then(setAlbums);
    if (auth.user) fetchPlaylists().then(setPlaylists);
  }, [auth.user]);

  function handleNav(viewName) {
    setActiveView(viewName);
    onViewChange(viewName);
  }

  async function handleScan() {
    setScanning(true);
    const data = await scanLibrary();
    alert(`Added: ${data.added} | Removed: ${data.removed}`);
    setScanning(false);
    onViewChange('songs');
  }

  async function handleNewPlaylist() {
    const name = prompt('Playlist name:');
    if (!name) return;
    const pl = await createPlaylist(name);
    setPlaylists(prev => [...prev, pl]);
  }

  async function handleConnectLastfm() {
    const url = await connectLastfm();
    if (url) window.location.href = url;
  }

  return (
    <aside className="side-bar">

      {/* Profile */}
      <div className="profile-section">
        {auth.user ? (
          <>
            <button
              className="profile-info"
              onClick={() => setProfileOpen(p => !p)}
            >
              <i className="fa-solid fa-circle-user" />
              <span>{auth.user.username}</span>
              <i className={`fa-solid fa-chevron-down ${profileOpen ? 'rotated' : ''}`} id="profile-chevron" />
            </button>

            {profileOpen && (
              <div className="profile-dropdown">
                <button className={`lastfm-btn ${auth.user.lastfm_connected ? 'connected' : ''}`} onClick={handleConnectLastfm}>
                  <i className="fa-brands fa-lastfm" />
                  {auth.user.lastfm_connected ? 'Last.fm Connected' : 'Connect Last.fm'}
                </button>
                <button className="scan-btn" onClick={handleScan} disabled={scanning}>
                  <i className={`fa-solid fa-arrows-rotate ${scanning ? 'fa-spin' : ''}`} />
                  {scanning ? 'Scanning...' : 'Scan Library'}
                </button>
                <button className="logout-btn" onClick={auth.logout}>
                  <i className="fa-solid fa-right-from-bracket" />
                  Logout
                </button>
              </div>
            )}
          </>
        ) : (
          <button className="profile-btn" onClick={onLoginClick}>
            <i className="fa-solid fa-user" /> Login
          </button>
        )}
      </div>

      {/* Library */}
      <div className="sidebar-section">
        <h3 className="sidebar-heading">Library</h3>
        <ul className="sidebar-nav">
          {[
            { view: 'songs',      icon: 'fa-music',        label: 'Songs' },
            { view: 'artists',    icon: 'fa-microphone',   label: 'Artists' },
            { view: 'albums',     icon: 'fa-record-vinyl', label: 'Albums' },
            { view: 'favourites', icon: 'fa-heart',        label: 'Favourites' },
          ].map(item => (
            <li
              key={item.view}
              className={`nav-item ${activeView === item.view ? 'active' : ''}`}
              onClick={() => handleNav(item.view)}
            >
              <i className={`fa-solid ${item.icon}`} />
              {item.label}
            </li>
          ))}
        </ul>
      </div>

      {/* Playlists */}
      <div className="sidebar-section">
        <div className="sidebar-heading-row">
          <h3 className="sidebar-heading">Playlist</h3>
          <button id="btn-new-playlist" onClick={handleNewPlaylist}>
            <i className="fa-solid fa-plus" />
          </button>
        </div>
        <ul className="sidebar-nav">
          {playlists.map(pl => (
            <li
              key={pl.id}
              className={`nav-item ${activeView === `pl-${pl.id}` ? 'active' : ''}`}
              onClick={() => { setActiveView(`pl-${pl.id}`); onViewChange('playlist', pl.id); }}
            >
              <i className="fa-solid fa-list" />
              {pl.name}
            </li>
          ))}
        </ul>
      </div>

    </aside>
  );
}