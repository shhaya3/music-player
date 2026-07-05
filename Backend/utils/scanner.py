import os
import hashlib
from mutagen.mp3 import MP3
from mutagen.flac import FLAC
from mutagen.id3 import ID3
from mutagen.id3._util import ID3NoHeaderError
from models import db, Songs


def get_image_has(image_data):
    """Returns a short hash of image bytes — used to detect duplicate covers."""
    return hashlib.md5(image_data).hexdigest()[:16]

def save_cover(image_data, cover_dir, base_url):
    """
    Saves cover image using its content hash as the filename.
    If a cover with the same content already exists, reuses it instead of saving again.
    Returns the full cover URL.
    """
    image_hash = get_image_has(image_data)
    cover_filename = f'{image_hash}.jpg'
    cover_path = os.path.join(cover_dir, cover_filename)

    if not os.path.exists(cover_path):
        with open(cover_path, 'wb') as f:
            f.write(image_data)
    
    return f'{base_url}/api/covers/{cover_filename}'


def scan_music_folder(music_dir, covers_dir, base_url=''):
    if not os.path.exists(music_dir):
        return 0, ['Music folder does not exist']

    os.makedirs(covers_dir, exist_ok=True)

    added = 0
    errors = []

    for filename in os.listdir(music_dir):
        ext = filename.lower().split('.')[-1]
        if ext not in ('mp3', 'flac', 'ogg', 'm4a'):
            continue
        if Songs.query.filter_by(filename=filename).first():
            continue

        filepath = os.path.join(music_dir, filename)
        cover_url = None

        try:
            if ext == 'flac':
                audio = FLAC(filepath)
                duration = audio.info.length
                title    = audio.get('title',  [filename[:-5]])[0]
                artist   = audio.get('artist', ['Unknown'])[0]
                album    = audio.get('album',  ['Unknown'])[0]

                if audio.pictures:
                    cover_url = save_cover(audio.pictures[0].data, covers_dir, base_url)
            else:
                audio = MP3(filepath)
                duration = audio.info.length
                try:
                    tags   = ID3(filepath)
                    title  = str(tags.get('TIT2', filename[:-4]))
                    artist = str(tags.get('TPE1', 'Unknown'))
                    album  = str(tags.get('TALB', 'Unknown'))
                    apic = tags.get('APIC:') or tags.get('APIC')

                    if apic:
                        cover_url = save_cover(apic.data, covers_dir, base_url)

                except ID3NoHeaderError:
                    title, artist, album = filename[:-4], 'Unknown', 'Unknown'

        except Exception as e:
            errors.append(f'{filename}: {str(e)}')
            continue

        song = Songs(
            title     = str(title),
            artist    = str(artist),
            album     = str(album),
            duration  = float(duration),
            filename  = filename,
            file_url  = f'{base_url}/api/stream/{filename}',
            cover_url = cover_url
        )
        db.session.add(song)
        added += 1

    db.session.commit()
    return added, errors


def cleanup_missing_songs(music_dir): 
    
    """
    Remove database entiers for songs that are not present in the disk anymore.
    Return the number of songs removed.
    """
    all_songs = Songs.query.all()
    removed = 0

    for song in all_songs:
        filepath = os.path.join(music_dir, song.filename)

        if not os.path.exists(filepath):
            db.session.delete(song)
            removed += 1

    db.session.commit()
    return removed