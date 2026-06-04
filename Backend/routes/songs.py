from flask import Blueprint, jsonify, request, current_app
from models import db, Songs, Favourite
from routes.auth import token_required
from models import Favourite

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

@songs_bp.route('/api/artists')
def get_artists():
    artists = db.session.query(Songs.artist).distinct().order_by(Songs.artist).all()
    return jsonify([a[0] for a in artists])

@songs_bp.route('/api/albums')
def get_albums():
    albums = db.session.query(Songs.album).distinct().order_by(Songs.album).all()
    return jsonify([{'album':a[0], 'artist':a[1]}for a in albums]) 

@songs_bp.route('/api/favourites')
@token_required
def get_facourites(current_user):
    favs = Favourite.query.filter_by(user_id = current_user.id).all()
    base_url = current_app.config['BASE_URL']
    songs = [Songs.query.get(f.songs_id).to_dict(base_url) for f in favs]
    return jsonify(songs)

@songs_bp.route('/api/facourites/<int:song_id>',methods=['POST'])
@token_required
def add_favourite(current_user, song_id):
    fav = Favourite(user_id=current_user.id, song_id=song_id)
    db.session.add(fav)
    try:
        db.session.commit()
    except Exception:
        db.session.rollback
    return jsonify({'message:''Added To Favourites'})

@songs_bp.route('/api/admin/scan')
def scan():
    from utils.scanner import scan_music_folder
    added, errors = scan_music_folder(
        current_app.config['MUSIC_DIR'],
        current_app.config['COVERS_DIR'],
        current_app.config['BASE_URL']
    )

    return jsonify({'added':added, 'errors': errors})
