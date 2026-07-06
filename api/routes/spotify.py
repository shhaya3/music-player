import os, requests, base64, time
from urllib.parse import quote
from flask import Blueprint, jsonify

spotify_bp = Blueprint('spotify', __name__)

_token_cache = {
    'token': None,
    'expires_at': 0
}

def get_spotify_token():
    if _token_cache['token'] and time.time() < _token_cache['expires_at']:
        return _token_cache['token']

    client_id     = os.getenv('SPOTIFY_CLIENT_ID')
    client_secret = os.getenv('SPOTIFY_CLIENT_SECRET')
    creds = base64.b64encode(f'{client_id}:{client_secret}'.encode()).decode()

    res  = requests.post(
        'https://accounts.spotify.com/api/token',
        headers={'Authorization': f'Basic {creds}'},
        data={'grant_type': 'client_credentials'}
    )
    data  = res.json()
    token = data.get('access_token')

    _token_cache['token']      = token
    _token_cache['expires_at'] = time.time() + 3500

    return token


@spotify_bp.route('/api/spotify/artist-image/<path:artist>')
def get_artist_image(artist):
    token = get_spotify_token()
    if not token:
        return jsonify({'image': None})

    res  = requests.get(
        f'https://api.spotify.com/v1/search?q={quote(artist)}&type=artist&limit=1',
        headers={'Authorization': f'Bearer {token}'}
    )
    data    = res.json()
    artists = data.get('artists', {}).get('items', [])

    if not artists or not artists[0].get('images'):
        return jsonify({'image': None})

    return jsonify({'image': artists[0]['images'][0]['url']})