import { useEffect, useState } from 'react';
import { addFavourite, fetchPlaylists, addToPlaylist } from '../api';

export default function TrackMenu({ songId, x, y, user, onClose }) {
  const [playlists,     setPlaylists]     = useState([]);
  const [showPlaylists, setShowPlaylists] = useState(false);

  useEffect(() => {
    if (user) fetchPlaylists().then(setPlaylists);

    function handleClick(e) {
      if (!e.target.closest('.context-menu')) onClose();
    }
    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, []);

  async function handleFavourite() {
    if (!user) { alert('Please log in to add favourites'); onClose(); return; }
    await addFavourite(songId);
    onClose();
  }

  async function handleAddToPlaylist(pid) {
    await addToPlaylist(pid, songId);
    onClose();
  }

  return (
    <div
      className="context-menu"
      style={{ position: 'fixed', top: y, left: x, zIndex: 3000 }}
      onClick={e => e.stopPropagation()}
    >
      <button className="menu-item" onClick={handleFavourite}>
        <i className="fa-solid fa-heart" /> Add to Favourites
      </button>

      <button className="menu-item" onClick={() => setShowPlaylists(p => !p)}>
        <i className="fa-solid fa-list" /> Add to Playlist
      </button>

      {showPlaylists && (
        <>
          <div className="menu-header">Choose Playlist</div>
          {playlists.length === 0
            ? <div className="menu-header">No playlists yet</div>
            : playlists.map(pl => (
                <button
                  key={pl.id}
                  className="menu-item"
                  onClick={() => handleAddToPlaylist(pl.id)}
                >
                  <i className="fa-solid fa-list" /> {pl.name}
                </button>
              ))
          }
        </>
      )}
    </div>
  );
}