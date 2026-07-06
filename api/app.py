import os
from dotenv import load_dotenv
 
load_dotenv()
 
from flask import Flask
from flask_cors import CORS
from models import db
from routes.lastfm import lastfm_bp
 
def create_app():
    app = Flask(__name__)
    app.config['SECRET_KEY']                  = os.getenv('SECRET_KEY')
    app.config['SQLALCHEMY_DATABASE_URI']     = os.getenv('DATABASE_URL')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['MUSIC_DIR']  = os.getenv('MUSIC_DIR',  './MusicV2')
    app.config['COVERS_DIR'] = os.getenv('COVERS_DIR', './covers')
    app.config['BASE_URL']   = os.getenv('BASE_URL',   'http://localhost:5000')
    app.config['FRONTEND_URL'] = os.getenv('FRONTEND_URL', 'http://localhost:3000')
 
    if not app.config['SECRET_KEY']:
        raise RuntimeError('SECRET_KEY environment variable must be set')
 
    # Only allow your actual frontend to call this API, not any website.
    CORS(app, origins=[app.config['FRONTEND_URL']], supports_credentials=True)
    db.init_app(app)
 
    from routes.songs     import songs_bp
    from routes.stream    import stream_bp
    from routes.auth      import auth_bp
    from routes.playlists import playlists_bp
    from routes.spotify import spotify_bp
 
    app.register_blueprint(spotify_bp) 
    app.register_blueprint(songs_bp)
    app.register_blueprint(stream_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(playlists_bp)
    app.register_blueprint(lastfm_bp)
 
 
    with app.app_context():
        from models import Songs, User, Playlist, PlaylistSongs
        db.create_all()
 
    return app
 
if __name__ == '__main__':
    app = create_app()
    debug_mode = os.getenv('FLASK_DEBUG', 'false').lower() == 'true'
    app.run(debug=debug_mode)
