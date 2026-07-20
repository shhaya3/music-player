from flask import Blueprint, jsonify, request, current_app
from models import db, Songs, Favourite
from routes.auth import token_required
from models import Favourite
import re

songs_bp = Blueprint('songs', __name__)


@songs_bp.route('/api/songs')
def get_all_songs():
    songs = Songs.query.order_by(Songs.artist, Songs.title).all()
    base_url = current_app.config['BASE_URL']
    return jsonify([s.to_dict(base_url) for s in songs])


# Usage: GET /api/songs/search?q=yorushika
@songs_bp.route('/api/songs/search')
def search():
    q = request.args.get('q','').strip()
    if not q:
        return jsonify([])
    
    results = Songs.query.filter(
        db.or_(
            Songs.title.ilike(f'%{q}'),
            Songs.artist.ilike(f'%{q}'),
            Songs.album.ilike(f'%{q}')
        )
    ).all()
    base_url = current_app.config['BASE_URL']
    return jsonify([s.to_dict(base_url) for s in results])


ARTIST_SPLIT_RE = re.compile(r'\s*[;・]\s*')
@songs_bp.route('/api/artists')
def get_artists():
    rows = db.session.query(Songs.artist).all()
    counts = {}
    for (artist_field,) in rows:
        main = ARTIST_SPLIT_RE.split(artist_field, maxsplit=1)[0].strip()
        counts[main] = counts.get(main, 0) + 1

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

# @song_bp.route('/api/favourites/<int:song_id>', methods=['DELETE'])
# @token_required
# def remove_favorites(current_user, song_id):
#     fav = Favourite.query.filter_by(
#         user_id=current_user.id, song_id=song_id
#     ).first()
#     if fav:
#         db.session.delete(fav)
#         db.session.commit()
#         return jsonify({'message': 'Removed from favourites'})

@songs_bp.route('/api/admin/scan')
@token_required
def scan(current_user):
    from utils.scanner import scan_music_folder, cleanup_missing_songs

    removed = cleanup_missing_songs(current_app.config['MUSIC_DIR'])

    added, errors = scan_music_folder(
        current_app.config['MUSIC_DIR'],
        current_app.config['COVERS_DIR'],
        current_app.config['BASE_URL']
    )

    return jsonify({
        'added':added,
        'removed': removed,
        'errors': errors
    })
