import os, requests, base64, time
from urllib.parse import quote
from datetime import datetime, timedelta
from flask import Blueprint, jsonify, current_app
from models import db, ArtistImageCache, Songs



spotify_bp = Blueprint('spotify', __name__)

# Token cache 

_token_cache = {'token': None, 'expires_at': 0}

def get_spotify_token():
    if _token_cache['token'] and time.time() < _token_cache['expires_at']:
        return _token_cache['token']

    client_id     = os.getenv('SPOTIFY_CLIENT_ID')
    client_secret = os.getenv('SPOTIFY_CLIENT_SECRET')

    if not client_id or not client_secret:
        return None

    creds = base64.b64encode(f'{client_id}:{client_secret}'.encode()).decode()
    res   = requests.post(
        'https://accounts.spotify.com/api/token',
        headers={'Authorization': f'Basic {creds}'},
        data={'grant_type': 'client_credentials'}
    )
    data  = res.json()
    token = data.get('access_token')
    if token:
        _token_cache['token']      = token
        _token_cache['expires_at'] = time.time() + 3500
    return token


def fetch_from_spotify(artist):
    token = get_spotify_token()
    if not token:
        return None
    try:
        print(f"🔥 CALLING SPOTIFY API FOR: {artist}")
        res  = requests.get(
            f'https://api.spotify.com/v1/search?q={quote(artist)}&type=artist&limit=1',
            headers={'Authorization': f'Bearer {token}'}
        )
        data    = res.json()
        artists = data.get('artists', {}).get('items', [])
        if not artists or not artists[0].get('images'):
            return None
        return artists[0]['images'][0]['url']
    except Exception:
        return None


# Artist image endpoint 

@spotify_bp.route('/api/spotify/artist-image/<path:artist>')
def get_artist_image(artist):
    cached = ArtistImageCache.query.filter_by(artist=artist).first()

    if cached and not cached.is_expired(days=14):
        return jsonify({'image': cached.image_url})

    song = Songs.query.filter(
        (Songs.artist == artist) | (Songs.artist_romaji == artist)
    ).first()

    search_query = artist
    if song and song.artist_romaji:
        search_query = song.artist_romaji

    image_url = fetch_from_spotify(search_query)

    if not image_url and search_query != artist:
        image_url = fetch_from_spotify(artist)

    if cached:
        cached.image_url  = image_url
        cached.fetched_at = datetime.utcnow()
    else:
        cached = ArtistImageCache(artist=artist, image_url=image_url)
        db.session.add(cached)

    db.session.commit()
    return jsonify({'image': image_url})


# Cleanup cache for removed artists 

@spotify_bp.route('/api/spotify/cache/cleanup', methods=['POST'])
def cleanup_artist_cache():
    # use Songs (with capital S) to match your model name
    active_artists = {
        row[0] for row in db.session.query(Songs.artist).distinct().all()
    }

    all_cached = ArtistImageCache.query.all()
    removed    = 0

    for entry in all_cached:
        if entry.artist not in active_artists:
            db.session.delete(entry)
            removed += 1

    db.session.commit()
    return jsonify({'removed': removed})


# Expire old cache entries 

@spotify_bp.route('/api/spotify/cache/expire', methods=['POST'])
def expire_old_cache():
    cutoff  = datetime.utcnow() - timedelta(days=14)
    expired = ArtistImageCache.query.filter(
        ArtistImageCache.fetched_at < cutoff
    ).all()
    count = len(expired)
    for entry in expired:
        db.session.delete(entry)
    db.session.commit()
    return jsonify({'expired': count})