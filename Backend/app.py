import os
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
from models import db

load_dotenv()

def create_app():

    #configuration 
    app = Flask(__name__)
    app.config['SECRET_KEY']              = os.getenv('SECRET_KEY')
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['MUSIC_DIR']   = os.getenv('MUSIC_DIR',  './music')
    app.config['COVERS_DIR']  = os.getenv('COVERS_DIR', './covers')
    app.config['BASE_URL']    = os.getenv('BASE_URL',   'http://localhost:5000')

    #CORS
    CORS(app)

    #database
    db.init_app(app)

    from routes.songs     import songs_bp
    from routes.stream    import stream_bp
    from routes.auth      import auth_bp
    from routes.playlists import playlists_bp
    app.register_blueprint(songs_bp)
    app.register_blueprint(stream_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(playlists_bp)


    with app.app_context():
        db.create_all()

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=os.getenv('DEBUG') == 'True')