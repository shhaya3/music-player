from flask import Blueprint, jsonify, request, current_app
from models import db, Playlist, PlaylistSongs, Songs
from routes.auth import token_required
 
playlists_bp = Blueprint('playlists', __name__)
 
 
@playlists_bp.route('/api/playlists')
@token_required
def get_playlists(current_user):
    playlists = Playlist.query.filter_by(user_id=current_user.id).all()
    return jsonify([{'id': p.id, 'name': p.name} for p in playlists])
 
 
@playlists_bp.route('/api/playlists', methods=['POST'])
@token_required
def create_playlist(current_user):
    data     = request.get_json()
    playlist = Playlist(name=data['name'], user_id=current_user.id)
    db.session.add(playlist)
    db.session.commit()
    return jsonify({'id': playlist.id, 'name': playlist.name}), 201
 
 
@playlists_bp.route('/api/playlists/<int:pid>/songs')
@token_required
def get_playlist_songs(current_user, pid):
    playlist = Playlist.query.get_or_404(pid)
    if playlist.user_id != current_user.id:
        return jsonify({'error': 'Forbidden'}), 403
    entries  = PlaylistSongs.query.filter_by(playlist_id=pid).order_by(PlaylistSongs.position).all()
    base_url = current_app.config['BASE_URL']
    songs    = [Songs.query.get(e.song_id).to_dict(base_url) for e in entries]
    return jsonify(songs)
 
 
@playlists_bp.route('/api/playlists/<int:pid>/songs', methods=['POST'])
@token_required
def add_to_playlist(current_user, pid):
    playlist = Playlist.query.get_or_404(pid)
    if playlist.user_id != current_user.id:
        return jsonify({'error': 'Forbidden'}), 403
    data  = request.get_json()
    entry = PlaylistSongs(playlist_id=pid, song_id=data['song_id'])
    db.session.add(entry)
    db.session.commit()
    return jsonify({'message': 'Song added'}), 201
 
 
@playlists_bp.route('/api/playlists/<int:pid>', methods=['DELETE'])
@token_required
def delete_playlist(current_user, pid):
    playlist = Playlist.query.get_or_404(pid)
    if playlist.user_id != current_user.id:
        return jsonify({'error': 'Forbidden'}), 403
    db.session.delete(playlist)
    db.session.commit()
    return jsonify({'message': 'Deleted'})