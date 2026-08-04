# Music Player
 
A self-hosted, Spotify-inspired music streaming player for your local library.
Built with React, Flask, and PostgreSQL.

# DEMO VIDEO

https://github.com/user-attachments/assets/6cbc8f40-90eb-4663-89ac-800bcb5ca130

 
## Features
- Stream your local MP3/FLAC music files easily.
- Artist and album browsing. 
- Last.fm scrobbling & artist image fetching using spotify.
- User accounts with JWT authentication. 
- Favourites and playlists. 
- Dynamic background change based on playing song cover art.
 
## Tech Stack
- Frontend: Vanilla JS, CSS/HTML
- Backend:  Python, Flask, SQLAlchemy
- Database: PostgreSQL
- Auth:     JWT, bcrypt
- APIs:     Spotify Web API, Last.fm API
- Deploy:   Docker, Nginx
 
## Quick Start (Docker)

Copy the Github Repo and go into the repo folder
```
git clone https://github.com/shhaya3/music-player
cd music-player
```

Edit .env — set SECRET_KEY, POSTGRES_PASSWORD, MUSIC_DIR in your .env file
```
cp .env.example .env
```

Run the docker cmd to start the application
```
docker compose up -d
```

Open http://localhost:3000

 
## Live Demo
https://music-player-sigma-lime.vercel.app/
 
## Setup Guide
See DEPLOYMENT.md for full setup instructions.
