from flask import Blueprint, jsonify, request, current_app
from models import db, Songs, Favourite
from routes.auth import token_required
from models import Favourite
import re
from sqlalchemy import or_, func, cast, String

songs_bp = Blueprint('songs', __name__)


@songs_bp.route('/api/songs')
def get_all_songs():
    songs = Songs.query.order_by(Songs.artist, Songs.title).all()
    base_url = current_app.config['BASE_URL']
    return jsonify([s.to_dict(base_url) for s in songs])


# Usage: GET /api/songs/search?q=yorushika
@songs_bp.route('/api/songs/search')
def search_songs():
    q = request.args.get('q', '').strip()
    if not q:
        return jsonify([])

    base_url = current_app.config['BASE_URL']
    q_parts = q.lower().split()

    def word_conditions(word):
        return or_(
            Songs.title.ilike(f'%{word}%'),
            Songs.artist.ilike(f'%{word}%'),
            Songs.all_artists.ilike(f'%{word}%'),
            Songs.album.ilike(f'%{word}%'),
            Songs.title_romaji.ilike(f'%{word}%'),
            Songs.artist_romaji.ilike(f'%{word}%'),
            Songs.album_romaji.ilike(f'%{word}%'),
        )

    conditions = [word_conditions(word) for word in q_parts]

    results = Songs.query.filter(
        *conditions
    ).order_by(
        Songs.title.ilike(f'{q}%').desc(),
        Songs.artist.ilike(f'{q}%').desc(),
        Songs.title
    ).limit(100).all()

    return jsonify([s.to_dict(base_url) for s in results])

@songs_bp.route('/api/artists/search')
def search_artists():
    q = request.args.get('q', '').strip()
    if not q:
        return jsonify([])

    results = db.session.query(
        Songs.artist,
        func.count(Songs.id).label('count')
    ).filter(
        or_(
            Songs.artist.ilike(f'%{q}%'),
            Songs.artist_romaji.ilike(f'%{q}%')
        )
    ).group_by(Songs.artist).order_by(Songs.artist).all()

    return jsonify([{'artist': r[0], 'count': r[1]} for r in results])

@songs_bp.route('/api/albums/search')
def search_albums():
    q = request.args.get('q', '').strip()
    if not q:
        return jsonify([])

    results = db.session.query(
        Songs.album,
        Songs.artist,
        func.count(Songs.id).label('count')
    ).filter(
        or_(
            Songs.album.ilike(f'%{q}%'),
            Songs.album_romaji.ilike(f'%{q}%')
        )
    ).group_by(Songs.album, Songs.artist).order_by(Songs.album).all()

    return jsonify([{'album': r[0], 'artist': r[1], 'count': r[2]} for r in results])


ARTIST_SPLIT_RE = re.compile(r'[;,&]|\bfeat\.?\b|\bft\.?\b|\bvs\.?\b|\bx\b', re.IGNORECASE)
@songs_bp.route('/api/artists')
def get_artists():
    rows = db.session.query(Songs.artist, Songs.all_artists).all()
    counts = {}
    for artist_field, all_artists_field in rows:
        target_string = artist_field or all_artists_field or 'Unknown'
        # Split on commas, ampersands, feat, etc., and take the first artist
        parts = ARTIST_SPLIT_RE.split(target_string)
        main_artist = parts[0].strip() if parts else 'Unknown'

        if main_artist:
            counts[main_artist] = counts.get(main_artist, 0) + 1

    artists = sorted(counts.items(), key=lambda kv: kv[0].lower())
    return jsonify([{'artist': a, 'count': c} for a, c in artists])

@songs_bp.route('/api/artists/songs/<path:artist>')
def get_artists_songs(artist):
    songs = Songs.query.filter(Songs.artist.ilike(f'%{artist}%')).order_by(Songs.title).all()
    base_url = current_app.config['BASE_URL']
    return jsonify([s.to_dict(base_url)for s in songs])

@songs_bp.route('/api/albums')
def get_albums():
    albums = db.session.query(
        Songs.album,
        db.func.min(Songs.artist),
        db.func.count(Songs.id).label('count')
    ).group_by(Songs.album).order_by(Songs.album).all()
    return jsonify([{
        'album': a[0], 
        'artist': ARTIST_SPLIT_RE.split(a[1], maxsplit=1)[0].strip() if a[1] else "Unknown Artist",
        'count': a[2]} 
        for a in albums
    ])

@songs_bp.route('/api/albums/songs/<path:album>')
def get_album_songs(album):
    songs    = Songs.query.filter(Songs.album.ilike(f'%{album}%')).order_by(Songs.title).all()
    base_url = current_app.config['BASE_URL']
    return jsonify([s.to_dict(base_url) for s in songs])

@songs_bp.route('/api/favourites')
@token_required
def get_favourites(current_user):
    favs = Favourite.query.filter_by(user_id = current_user.id).all()
    base_url = current_app.config['BASE_URL']
    songs = [Songs.query.get(f.song_id).to_dict(base_url) for f in favs]
    return jsonify(songs)

@songs_bp.route('/api/favourites/<int:song_id>',methods=['POST'])
@token_required
def add_favourite(current_user, song_id):
    fav = Favourite(user_id=current_user.id, song_id=song_id)
    db.session.add(fav)
    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
    return jsonify({'message': 'Added To Favourites'})

@songs_bp.route('/api/favourites/<int:song_id>',methods=['DELETE'])
@token_required
def remove_favorites(current_user, song_id):
    fav = Favourite.query.filter_by(
        user_id=current_user.id, song_id=song_id
    ).first()
    if fav:
        db.session.delete(fav)
        db.session.commit()
        return jsonify({'message': 'Removed from favourites'})

@songs_bp.route('/api/admin/scan')
@token_required
def scan(current_user):
    from utils.scanner import scan_music_folder, cleanup_missing_songs
    import requests as req
    removed = cleanup_missing_songs(current_app.config['MUSIC_DIR'])
    

    added, errors = scan_music_folder(
        current_app.config['MUSIC_DIR'],
        current_app.config['COVERS_DIR'],
        current_app.config['BASE_URL']
    )

    try:
        req.post(f"{current_app.config['BASE_URL']}/api/spotify/cache/cleanup")
    except Exception:
        pass

    return jsonify({
        'added':added,
        'removed': removed,
        'errors': errors
    })
