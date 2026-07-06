import os
from flask import Flask
from models import db, User, Songs, Playlist, PlaylistSongs, Favourite
from dotenv import load_dotenv

# Load the DATABASE_URL from your .env file
load_dotenv()

app = Flask(__name__)

# Fetch the URL you just pasted into the .env file
database_url = os.getenv("DATABASE_URL")

# SQLAlchemy requires 'postgresql://' not 'postgres://'
if database_url and database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)

app.config['SQLALCHEMY_DATABASE_URI'] = database_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

with app.app_context():
    print("Connecting to Neon database...")
    # This is the magic command that actually builds the tables!
    db.create_all()
    print("Success! Tables created.")