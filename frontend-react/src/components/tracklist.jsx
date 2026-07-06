import { useState } from 'react';
import { formatTime, addFavourite, fetchPlaylists, addToPlaylist } from '../api';
import TrackMenu from './trackMenu';

export default function TrackList({
  tracks, viewTitle, viewMeta, viewCover,
  currentIndex, isPlaying, onTrackClick, onArtistClick, user
}) {
  const [menuState, setMenuState] = useState(null); // { songId, x, y }

  function openMenu(e, songId) {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuState({
      songId,
      x: Math.max(rect.left - 160, 8),
      y: rect.bottom + 4
    });
  }

  return (
    <div className="track-section">
      <div className="view-header">
        {viewCover && (
          <img
            className="view-cover"
            src={viewCover}
            alt=""
            style={{ borderRadius: viewCover ? '50%' : '8px' }}
          />
        )}
        {!viewCover && <div className="view-cover" style={{ background: 'rgba(255,255,255,0.05)' }} />}
        <div>
          <p className="view-label">Songs</p>
          <h1 className="view-title">{viewTitle}</h1>
          <p className="view-meta">{viewMeta}</p>
        </div>
      </div>

      <table className="track-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Title</th>
            <th>Artist</th>
            <th><i className="fa-regular fa-clock" /></th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {tracks.map((track, i) => (
            <tr
              key={track.id}
              className={currentIndex === i ? 'playing' : ''}
              onClick={() => onTrackClick(i)}
            >
              <td className="track-num">
                {currentIndex === i && isPlaying
                  ? <i className="fa-solid fa-volume-high" style={{ fontSize: '11px' }} />
                  : i + 1
                }
              </td>
              <td>{track.title}</td>
              <td>
                <span
                  className="artist-link"
                  onClick={e => { e.stopPropagation(); onArtistClick(track.artist); }}
                >
                  {track.artist}
                </span>
              </td>
              <td className="track-dur">{formatTime(track.duration)}</td>
              <td className="track-menu-cell">
                <button
                  className="track-menu-btn"
                  onClick={e => openMenu(e, track.id)}
                >
                  <i className="fa-solid fa-ellipsis-vertical" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {menuState && (
        <TrackMenu
          songId={menuState.songId}
          x={menuState.x}
          y={menuState.y}
          user={user}
          onClose={() => setMenuState(null)}
        />
      )}
    </div>
  );
}