import os, hashlib, requests
from flask import Blueprint, jsonify, redirect, request, current_app
from routes.auth import token_required
from models import db, User
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
import re
 
lastfm_bp = Blueprint('lastfm', __name__)
api_key = os.getenv('LASTFM_API_KEY')
secret  = os.getenv('LASTFM_SHARED_SECRET')
 
ARTIST_SPLIT_RE = re.compile(r'\s*[;・]\s*')
 
def get_main_artist(artist_field):
    if not artist_field:
        return artist_field
    return ARTIST_SPLIT_RE.split(artist_field, maxsplit=1)[0].strip()
 
def _serializer():
    return URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
 
def _lastfm_configured():
    """Returns an error response if Last.fm creds aren't loaded, else None."""
    if not api_key or not secret:
        return jsonify({'error': 'Last.fm integration is not configured on the server'}), 503
    return None
 
def get_api_sig(params, secret):
    """Last.fm requires a signed request — this builds that signature."""
    sorted_params = sorted(params.items())
    sig_string = ''.join(f'{k}{v}' for k, v in sorted_params)
    sig_string += secret
    return hashlib.md5(sig_string.encode('utf-8')).hexdigest()
 
@lastfm_bp.route('/api/lastfm/connect')
@token_required
def lastfm_connect(current_user):
    cfg_error = _lastfm_configured()
    if cfg_error:
        return cfg_error
    # Sign the user id so it can't be swapped out for someone else's in the callback.
    state = _serializer().dumps(current_user.id)
    callback_url = f"{current_app.config['BASE_URL']}/api/lastfm/callback?state={state}"
    auth_url = f'https://www.last.fm/api/auth/?api_key={api_key}&cb={callback_url}'
    return jsonify({'auth_url':auth_url})
 
@lastfm_bp.route('/api/lastfm/callback')
def lastfm_callback():
    cfg_error = _lastfm_configured()
    if cfg_error:
        return cfg_error
 
    token = request.args.get('token')
    state = request.args.get('state')
 
    try:
        # max_age in seconds — the whole connect-flow has 10 minutes to complete
        user_id = _serializer().loads(state, max_age=600)
    except (BadSignature, SignatureExpired, TypeError):
        return jsonify({'error': 'Invalid or expired request'}), 400
 
    # Exchange token for session key
    params = {
        'method': 'auth.getSession',
        'api_key': api_key,
        'token': token
    }
 
    params['api_sig'] = get_api_sig(params, secret)
    params['format'] = 'json'
 
    res = requests.get('https://ws.audioscrobbler.com/2.0/', params=params)
    data = res.json()
 
    session_key = data.get('session', {}).get('key')
    if not session_key:
        return jsonify({'error':'Could not connect to last.fm'}), 400
    
    # save session key to user
 
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    user.lastfm_session_key= session_key
    db.session.commit()
 
    return redirect(f"{current_app.config.get('FRONTEND_URL', 'http://localhost:3000')}?lastfm=connected")
 
@lastfm_bp.route('/api/lastfm/scrobble', methods=['POST'])
@token_required
def scrobble(current_user):
    cfg_error = _lastfm_configured()
    if cfg_error:
        return cfg_error
    if not current_user.lastfm_session_key:
        return jsonify({'error': 'last.fm not connected'}), 400
    
    data = request.get_json()
    artist = get_main_artist(data.get('artist'))
    track = data.get('track')
    album  = data.get('album', '')
 
    params = {
        'method' : 'track.scrobble', 
        'api_key' : api_key,
        'sk': current_user.lastfm_session_key,
        'artist': artist,
        'track': track,
        'timestamp': str(int(__import__('time').time()))
    }
    if album:
        params['album'] = album

    params['api_sig'] = get_api_sig(params, secret)
    params['format'] = 'json'
 
    res = requests.post('https://ws.audioscrobbler.com/2.0/', data=params)
    data = res.json()

    if data.get('error') == 9:
        current_user.lastfm_session_key = None
        db.session.commit()
        return jsonify({'error': 'lastfm_reauth_required'}), 401

    return jsonify(data)
 
@lastfm_bp.route('/api/lastfm/now-playing', methods=['POST'])
@token_required
def now_playing(current_user):
    cfg_error = _lastfm_configured()
    if cfg_error:
        return cfg_error
    if not current_user.lastfm_session_key:
        return jsonify({'error': 'Last.fm not connected'}), 400
 
    data   = request.get_json()
    artist = get_main_artist(data.get('artist'))
    track  = data.get('track')
    album  = data.get('album', '')
 
    params = {
        'method': 'track.updateNowPlaying',
        'api_key': api_key,
        'sk': current_user.lastfm_session_key,
        'artist': artist,
        'track': track
    }
    if album:
        params['album'] = album
        
    params['api_sig'] = get_api_sig(params, secret)
    params['format']  = 'json'
 
    res = requests.post('https://ws.audioscrobbler.com/2.0/', data=params)
    return jsonify(res.json())
