import { formatTime } from '../api';

export default function NowPlaying({
  track, isPlaying, progress, currentTime, duration,
  volume, isMuted, isShuffled, repeatMode,
  onPlayPause, onNext, onPrev, onSeek,
  onVolumeChange, onMute, onShuffle, onRepeat
}) {
  const repeatIcons = { none: '', all: '', one: '1' };

  function getVolIcon() {
    if (isMuted || volume === 0) return 'fa-volume-xmark';
    if (volume < 0.5) return 'fa-volume-low';
    return 'fa-volume-high';
  }

  return (
    <section className="now-playing">
      <img
        className="np-cover"
        src={track?.cover || 'Assest/CoverImage/album-placeholder.png'}
        alt=""
        crossOrigin="anonymous"
      />

      <div className="np-info">
        <h2>{track?.title || 'Track Title'}</h2>
        <p>{track?.artist || 'Artist'}</p>
      </div>

      <div className="progress-bar">
        <span>{formatTime(currentTime)}</span>
        <input
          type="range"
          value={progress || 0}
          min="0"
          max="100"
          onChange={e => onSeek(parseFloat(e.target.value))}
          style={{
            background: `linear-gradient(to right, #a78bfa ${progress}%, #334155 ${progress}%)`
          }}
        />
        <span>{formatTime(duration)}</span>
      </div>

      <div className="np-controls">
        <button
          className={`ctrl-btn ${isShuffled ? 'lit' : ''}`}
          onClick={onShuffle}
        >
          <i className="fa-solid fa-shuffle" />
        </button>

        <button className="ctrl-btn" onClick={onPrev}>
          <i className="fa-solid fa-backward-step" />
        </button>

        <button className="ctrl-btn play-btn" onClick={onPlayPause}>
          <i className={`fa-solid ${isPlaying ? 'fa-pause' : 'fa-play'}`} />
        </button>

        <button className="ctrl-btn" onClick={onNext}>
          <i className="fa-solid fa-forward-step" />
        </button>

        <button
          className={`ctrl-btn ${repeatMode !== 'none' ? 'lit' : ''}`}
          onClick={onRepeat}
          style={{ position: 'relative' }}
        >
          <i className="fa-solid fa-repeat" />
          {repeatMode === 'one' && (
            <span id="repeat-badge" style={{ display: 'flex' }}>1</span>
          )}
        </button>
      </div>

      <div className="np-volume">
        <button className="ctrl-btn" onClick={onMute}>
          <i className={`fa-solid ${getVolIcon()}`} />
        </button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={isMuted ? 0 : volume}
          onChange={e => onVolumeChange(parseFloat(e.target.value))}
          style={{
            background: `linear-gradient(to right, #a78bfa ${(isMuted ? 0 : volume) * 100}%, #334155 ${(isMuted ? 0 : volume) * 100}%)`
          }}
        />
      </div>
    </section>
  );
}