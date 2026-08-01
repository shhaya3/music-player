from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key = True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    lastfm_session_key    = db.Column(db.String(200), nullable=True)

    playlists = db.relationship('Playlist', backref='owner', lazy=True, cascade='all, delete')
    favourites = db.relationship('Favourite', backref='user', lazy=True, cascade='all, delete')

class Songs(db.Model):
    __tablename__ = 'songs'

    id          = db.Column(db.Integer,     primary_key=True)
    title       = db.Column(db.String(200), nullable=False)
    artist      = db.Column(db.String(200), default='Unknown')
    all_artists = db.Column(db.String(500), nullable=True)
    album       = db.Column(db.String(200), default='Unknown')
    duration    = db.Column(db.Float,       default=0.0)
    filename    = db.Column(db.String(300), unique=True, nullable=False)
    file_url    = db.Column(db.String(500), nullable=True)
    cover_url   = db.Column(db.String(500), nullable=True)
    title_romaji    = db.Column(db.String(200), nullable=True)   # for search
    artist_romaji   = db.Column(db.String(200), nullable=True)   # for search
    album_romaji    = db.Column(db.String(200), nullable=True)
    uploaded_by = db.Column(db.Integer,     db.ForeignKey('users.id'), nullable=True)
    created_at  = db.Column(db.DateTime,    default=datetime.utcnow)

    def to_dict(self, base_url=''):
        """
        Converts the Song object to a dictionary.
        The frontend receives this as JSON.
        base_url is the server address e.g. http://localhost:5000
        """
        return {
            'id':       self.id,
            'title':    self.title,
            'artist':   self.artist or 'Unknown',
            'all_artists': self.all_artists or self.artist or 'Unknown',
            'album':    self.album,
            'duration': self.duration,
            'src':    f'{base_url}/api/stream/{self.id}',
            'cover':  self.cover_url or f'{base_url}/api/covers/default.jpg',
        }

class Playlist(db.Model):
    __tablename__ = 'playlists'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    songs = db.relationship('PlaylistSongs', backref='playlist', lazy=True, cascade='all, delete')

class PlaylistSongs(db.Model):
    __tablename__ = 'playlist_songs'
 
    id          = db.Column(db.Integer, primary_key=True)
    playlist_id = db.Column(db.Integer, db.ForeignKey('playlists.id'), nullable=False)
    song_id     = db.Column(db.Integer, db.ForeignKey('songs.id'),     nullable=False)
    position    = db.Column(db.Integer, default=0)
    added_at    = db.Column(db.DateTime, default=datetime.utcnow) 

class Favourite(db.Model):
    __tablename__ = 'favourites'
 
    id       = db.Column(db.Integer, primary_key=True)
    user_id  = db.Column(db.Integer, db.ForeignKey('users.id'),  nullable=False)
    song_id  = db.Column(db.Integer, db.ForeignKey('songs.id'),  nullable=False)
    added_at = db.Column(db.DateTime, default=datetime.utcnow)

# This prevents the same song being favourited twice by the same user
    __table_args__ = (db.UniqueConstraint('user_id', 'song_id'),)


class ArtistImageCache(db.Model):
    __tablename__ = 'artist_image_cache'

    id         = db.Column(db.Integer,     primary_key=True)
    artist     = db.Column(db.String(200), unique=True, nullable=False)
    image_url  = db.Column(db.String(500), nullable=True)
    fetched_at = db.Column(db.DateTime,    default=datetime.utcnow)

    def is_expired(self, days=14):
        return (datetime.utcnow() - self.fetched_at).days >= days