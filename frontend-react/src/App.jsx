import { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { fetchSongs, fetchArtistSongs, fetchAlbumSongs, fetchFavourites, fetchArtistImage } from './api';
import Sidebar    from './components/sidebar';
import TrackList  from './components/tracklist';
import NowPlaying from './components/nowPlaying';
import AuthModal  from './components/authModel';
import './index.css';

export default function App() {
  const auth   = useAuth();

  const [tracks,       setTracks]       = useState([]);
  const [view,         setView]         = useState('songs');
  const [viewTitle,    setViewTitle]    = useState('Songs');
  const [viewMeta,     setViewMeta]     = useState('');
  const [viewCover,    setViewCover]    = useState('');
  const [showModal,    setShowModal]    = useState(false);
  const [bgImage,      setBgImage]      = useState('');

  const player = useAudioPlayer(tracks);

  // load songs on start
  useEffect(() => {
    loadView('songs');
  }, []);

  // set background from current track cover
  useEffect(() => {
    if (player.currentTrack?.cover) {
      setBgImage(player.currentTrack.cover);
    }
  }, [player.currentTrack]);

  async function loadView(viewName, param) {
    setView(viewName);
    let data = [];

    if (viewName === 'songs') {
      data = await fetchSongs();
      setViewTitle('Songs');
      setViewMeta(`${data.length} songs`);
      setViewCover('');
    } else if (viewName === 'artist') {
      data = await fetchArtistSongs(param);
      setViewTitle(param);
      setViewMeta(`${data.length} songs`);
      const img = await fetchArtistImage(param);
      setViewCover(img || '');
    } else if (viewName === 'album') {
      data = await fetchAlbumSongs(param);
      setViewTitle(param);
      setViewMeta(`${data.length} songs`);
      setViewCover(data[0]?.cover || '');
    } else if (viewName === 'favourites') {
      data = await fetchFavourites();
      setViewTitle('Liked Songs');
      setViewMeta(`${data.length} songs`);
      setViewCover('');
    }

    setTracks(data);
    if (data.length > 0) player.loadTrack(0);
  }

  return (
    <>
      {/* blurred background */}
      <div
        className="app"
        style={bgImage ? { backgroundImage: `url('${bgImage}')` } : {}}
      >
        <Sidebar
          auth={auth}
          onViewChange={loadView}
          onLoginClick={() => setShowModal(true)}
        />

        <main className="main-content">
          <TrackList
            tracks={tracks}
            viewTitle={viewTitle}
            viewMeta={viewMeta}
            viewCover={viewCover}
            currentIndex={player.currentIndex}
            isPlaying={player.isPlaying}
            onTrackClick={(i) => player.loadTrack(i)}
            onArtistClick={(artist) => loadView('artist', artist)}
            user={auth.user}
          />

          <NowPlaying
            track={player.currentTrack}
            isPlaying={player.isPlaying}
            progress={player.progress}
            currentTime={player.currentTime}
            duration={player.duration}
            volume={player.volume}
            isMuted={player.isMuted}
            isShuffled={player.isShuffled}
            repeatMode={player.repeatMode}
            onPlayPause={player.playPause}
            onNext={player.next}
            onPrev={player.prev}
            onSeek={player.seek}
            onVolumeChange={player.setVolume}
            onMute={player.toggleMute}
            onShuffle={player.toggleShuffle}
            onRepeat={player.cycleRepeat}
          />
        </main>
      </div>

      {showModal && (
        <AuthModal
          auth={auth}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}