// queue.js
// Manages playback queue, history stack, and Fisher-Yates shuffle.
// Exports state and functions used by player.js and track.js.

// State 

export let PLAYING_TRACKS = [];  // the active track list being played from
export let queue          = [];  // ordered indices into PLAYING_TRACKS
export let queuePos       = 0;   // current position in queue
export let history        = [];  // stack of previous positions (for prev)
export let isShuffled     = false;
export let repeatMode     = 'none'; // 'none' | 'all' | 'one'

// Fisher-Yates shuffle 

export function fisherYates(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Build queue 
// Call when user picks a new context (artist, album, playlist, songs).
// startIndex = index of the track the user clicked.

export function buildQueue(tracks, startIndex, onPlay) {
  PLAYING_TRACKS = [...tracks];

  if (isShuffled) {
    const rest = PLAYING_TRACKS.map((_, i) => i).filter(i => i !== startIndex);
    queue = [startIndex, ...fisherYates(rest)];
  } else {
    const from   = PLAYING_TRACKS.map((_, i) => i).filter(i => i >= startIndex);
    const before = PLAYING_TRACKS.map((_, i) => i).filter(i => i < startIndex);
    queue = [...from, ...before];
  }

  queuePos = 0;
  history  = [];
  onPlay(queue[queuePos]);
}

// Navigation 

export function queueNext(onPlay) {
  history.push(queuePos);
  queuePos = (queuePos + 1) % queue.length;
  onPlay(queue[queuePos]);
}

export function queuePrev(currentTime, onPlay, onRestart) {
  if (currentTime > 3) { onRestart(); return; }
  if (history.length > 0) {
    queuePos = history.pop();
    onPlay(queue[queuePos]);
  } else {
    onRestart();
  }
}

export function queueEnded(onPlay, onStop) {
  if (repeatMode === 'one') {
    onPlay(queue[queuePos]);
    return;
  }
  history.push(queuePos);
  if (queuePos < queue.length - 1) {
    queuePos++;
    onPlay(queue[queuePos]);
  } else if (repeatMode === 'all') {
    if (isShuffled) queue = fisherYates(PLAYING_TRACKS.map((_, i) => i));
    queuePos = 0;
    onPlay(queue[queuePos]);
  } else {
    onStop();
  }
}

// Add to queue 
// Inserts a track right after the current position.

export function insertIntoQueue(trackIndex) {
  if (!queue.length) {
    console.warn('Queue is empty — load a track first');
    return;
  }
  queue.splice(queuePos + 1, 0, trackIndex);
}

// Toggle shuffle 

export function toggleShuffle() {
  isShuffled = !isShuffled;
  if (isShuffled) {
    const remaining = fisherYates(queue.slice(queuePos + 1));
    queue = [...queue.slice(0, queuePos + 1), ...remaining];
  } else {
    const current    = queue[queuePos];
    const natural    = PLAYING_TRACKS.map((_, i) => i);
    const currentPos = natural.indexOf(current);
    queue = [
      ...queue.slice(0, queuePos + 1),
      ...natural.filter(i => i > currentPos),
      ...natural.filter(i => i < currentPos)
    ];
  }
  return isShuffled;
}

// Cycle repeat mode 

export function cycleRepeat() {
  const modes = ['none', 'all', 'one'];
  repeatMode  = modes[(modes.indexOf(repeatMode) + 1) % modes.length];
  return repeatMode;
}
