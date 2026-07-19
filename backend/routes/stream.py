import os
from flask import Blueprint, current_app, send_file, abort
from models import Songs

stream_bp = Blueprint('stream', __name__)


def _is_within(path, root):
    """
    True only if `path` is actually inside `root` — not just string-prefixed by it.
    (e.g. '/app/covers_evil' starts with '/app/covers' as a string, but isn't inside it.)
    """
    return path == root or path.startswith(root + os.sep)


@stream_bp.route('/api/stream/<int:song_id>')
def stream_audio(song_id):
    """
    Serves an audio file to browser.
    conditional=True enables Range requests — allows seeking in the player.
    """

    song = Songs.query.get(song_id)
    if not song:
        abort(404)


    music_dir  = current_app.config['MUSIC_DIR']
    filepath   = os.path.join(music_dir, song.filename)
    safe_path  = os.path.realpath(filepath)
    safe_music = os.path.realpath(music_dir)

    if not _is_within(safe_path, safe_music):
        abort(403)

    if not os.path.exists(safe_path):
        abort(404)

    ext      = song.filename.lower().split('.')[-1]
    mimetypes = {
        'mp3':  'audio/mpeg',
        'flac': 'audio/flac',
        'ogg':  'audio/ogg',
        'wav':  'audio/wav',
        'm4a':  'audio/mp4',
    }
    mimetype = mimetypes.get(ext, 'audio/mpeg')

    return send_file(
        safe_path,
        mimetype=mimetype,
        conditional=True
    )


@stream_bp.route('/api/covers/<path:filename>')
def serve_cover(filename):
    covers_dir  = current_app.config['COVERS_DIR']
    filepath    = os.path.join(covers_dir, filename)
    safe_path   = os.path.realpath(filepath)
    safe_covers = os.path.realpath(covers_dir)

    if not _is_within(safe_path, safe_covers):
        abort(403)

    if not os.path.exists(safe_path):
        abort(404)

    return send_file(safe_path)