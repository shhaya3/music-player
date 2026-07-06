import { useRef, useState, useEffect, useCallback } from 'react';
import { scrobble, updateNowPlaying } from '../api';

export function useAudioPlayer(tracks) {
  const audioRef       = useRef(new Audio());
  const hasScrobbledRef = useRef(false);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying,    setIsPlaying]    = useState(false);
  const [progress,     setProgress]     = useState(0);
  const [currentTime,  setCurrentTime]  = useState(0);
  const [duration,     setDuration]     = useState(0);
  const [volume,       setVolumeState]  = useState(() => {
    return parseFloat(localStorage.getItem('volume') || '0.8');
  });
  const [isMuted,      setIsMuted]      = useState(false);
  const [isShuffled,   setIsShuffled]   = useState(false);
  const [repeatMode,   setRepeatMode]   = useState('none');

  const audio = audioRef.current;

  // set initial volume
  useEffect(() => {
    audio.volume = volume;
  }, []);

  const loadTrack = useCallback((index) => {
    if (!tracks.length) return;
    const track = tracks[index];
    audio.src = track.src;
    audio.load();
    audio.play().catch(() => {});
    setCurrentIndex(index);
    setIsPlaying(true);
    hasScrobbledRef.current = false;

    updateNowPlaying(track.artist, track.title);
  }, [tracks]);

  const playPause = useCallback(() => {
    if (audio.paused) {
      audio.play().catch(() => {});
      setIsPlaying(true);
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  }, []);

  const next = useCallback(() => {
    if (!tracks.length) return;
    let nextIndex;
    if (isShuffled) {
      do { nextIndex = Math.floor(Math.random() * tracks.length); }
      while (nextIndex === currentIndex && tracks.length > 1);
    } else {
      nextIndex = (currentIndex + 1) % tracks.length;
    }
    loadTrack(nextIndex);
  }, [currentIndex, tracks, isShuffled, loadTrack]);

  const prev = useCallback(() => {
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    loadTrack((currentIndex - 1 + tracks.length) % tracks.length);
  }, [currentIndex, tracks, loadTrack]);

  const seek = useCallback((pct) => {
    if (!audio.duration || isNaN(audio.duration)) return;
    audio.currentTime = (pct / 100) * audio.duration;
  }, []);

  const setVolume = useCallback((val) => {
    audio.volume = val;
    setVolumeState(val);
    localStorage.setItem('volume', val);
  }, []);

  const toggleMute = useCallback(() => {
    audio.muted = !audio.muted;
    setIsMuted(prev => !prev);
  }, []);

  const toggleShuffle = useCallback(() => setIsShuffled(p => !p), []);

  const cycleRepeat = useCallback(() => {
    setRepeatMode(p => p === 'none' ? 'all' : p === 'all' ? 'one' : 'none');
  }, []);

  // timeupdate
  useEffect(() => {
    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      setProgress((audio.currentTime / audio.duration) * 100 || 0);

      const pct = (audio.currentTime / audio.duration) * 100;
      const fourMin = 240;
      if (!hasScrobbledRef.current && (pct >= 50 || audio.currentTime >= fourMin)) {
        hasScrobbledRef.current = true;
        const track = tracks[currentIndex];
        if (track) scrobble(track.artist, track.title);
      }
    };
    audio.addEventListener('timeupdate', onTimeUpdate);
    return () => audio.removeEventListener('timeupdate', onTimeUpdate);
  }, [tracks, currentIndex]);

  // loadedmetadata
  useEffect(() => {
    const onMeta = () => setDuration(audio.duration);
    audio.addEventListener('loadedmetadata', onMeta);
    return () => audio.removeEventListener('loadedmetadata', onMeta);
  }, []);

  // ended
  useEffect(() => {
    const onEnded = () => {
      if (repeatMode === 'one') {
        audio.currentTime = 0;
        audio.play();
      } else if (repeatMode === 'all') {
        next();
      } else {
        if (currentIndex < tracks.length - 1) next();
        else setIsPlaying(false);
      }
    };
    audio.addEventListener('ended', onEnded);
    return () => audio.removeEventListener('ended', onEnded);
  }, [repeatMode, currentIndex, tracks, next]);

  return {
    currentIndex, isPlaying, progress, currentTime, duration,
    volume, isMuted, isShuffled, repeatMode,
    loadTrack, playPause, next, prev, seek,
    setVolume, toggleMute, toggleShuffle, cycleRepeat,
    currentTrack: tracks[currentIndex] || null
  };
}