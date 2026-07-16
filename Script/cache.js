const CACHE_KEY = 'artistImageCache';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000;

function loadImageCache() {
    try {
        const raw = localStorage.getItem(CACHE_KEY);
        return raw ? JSON.parse(raw) : ();
    } catch {
        return {};
    }
}

function saveImageCache() {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch(e) {
        console.log('cahce save failed', e);
    }
}

let imageCache = loadImageCache();

async function getArtistImage(artistName) {
    const now = Data.now();

    const cached = imageCache[artistName];
    if(cached && (now - cached.timeStamp < CACHE_DURATION)) {
        return cached.url;
    }
}

try {
    const res = await fetch (`http://localhost:5000/api/spotify/artist-image/${encodeURIComponent(artistName)}`);
    const data = await res.json();
    const url = data.image || null;

    imageCache[artistName] = {url, timestamp: now};
    saveImageCache(imageCache);

    return url;
} catch(err) {
    return null;
}