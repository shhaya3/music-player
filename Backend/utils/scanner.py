import os
from mutagen.mp3 import MP3
from mutagen.flac import FLAC
from mutagen.id3 import ID3
from mutagen.id3._util import ID3NoHeaderError
from models import db, Songs

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
                    pic = audio.pictures[0]
                    cover_filename = filename.rsplit('.', 1)[0] + '.jpg'
                    cover_path = os.path.join(covers_dir, cover_filename)
                    with open(cover_path, 'wb') as f:
                        f.write(pic.data)
                    cover_url = f'{base_url}/api/covers/{cover_filename}'
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
                        cover_filename = filename.rsplit('.', 1)[0] + '.jpg'
                        cover_path = os.path.join(covers_dir, cover_filename)
                        with open(cover_path, 'wb') as f:
                            f.write(apic.data)
                        cover_url = f'{base_url}/api/covers/{cover_filename}'
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
