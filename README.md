# Music Player
 
A self-hosted, Spotify-inspired music streaming player for your local library.
Built with React, Flask, and PostgreSQL.
 
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
```
git clone https://github.com/shhaya3/music-player
cd music-player
cp .env.example .env
# Edit .env — set SECRET_KEY, POSTGRES_PASSWORD, MUSIC_DIR
docker compose up -d
# Open http://localhost:3000
```
 
## Live Demo
https://music-player-sigma-lime.vercel.app/
 
## Setup Guide
See DEPLOYMENT.md for full setup instructions.