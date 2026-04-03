import yt_dlp
from flask import Flask, request, jsonify, Response, stream_with_context
from flask_cors import CORS
import subprocess
import logging
import os
import json

app = Flask(__name__)
CORS(app) # Enable CORS for flexibility

def get_ydl_opts(url=None, is_info=True):
    opts = {
        'no_check_certificate': True,
        'quiet': True,
        'no_warnings': True,
        'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    }
    if url: opts['referer'] = url
    if is_info:
        opts.update({
            'dumpjson': True,
            'extract_flat': False,
        })
    return opts

@app.route('/api/process', methods=['POST'])
def process_video():
    data = request.json
    url = data.get('url')
    action = data.get('action', 'info')
    # Prioritize the format string sent from the Node.js controller
    format_str = data.get('formatStr')
    quality = data.get('format', '1080')
    is_audio = data.get('type') == 'audio'
    title = data.get('title', 'download')
    
    if not url:
        return jsonify({"error": "URL is required"}), 400

    if action == 'info':
        try:
            # Use a fresh options set for info to avoid conflicts
            opts = get_ydl_opts(url=url, is_info=True)
            with yt_dlp.YoutubeDL(opts) as ydl:
                info = ydl.extract_info(url, download=False)
                
                # Format the response to match Home.jsx expectations
                formats = []
                for f in info.get('formats', []):
                    if f.get('vcodec') != 'none' and f.get('height'):
                        # Use filesize if available, otherwise filesize_approx
                        size_bytes = f.get('filesize') or f.get('filesize_approx') or 0
                        formats.append({
                            'quality': f'{f["height"]}p',
                            'format': 'MP4 Video with Audio' if f.get('acodec') != 'none' else 'Video Only',
                            'size': f'{round(size_bytes / 1024 / 1024, 1)}MB' if size_bytes > 0 else 'Variable',
                            'sizeBytes': size_bytes,
                            'height': f['height'],
                            'acodec': f.get('acodec'),
                            'vcodec': f.get('vcodec')
                        })
                
                # Filter out duplicates and keep highest bitrate for each height
                
                # Sort formats by quality
                formats.sort(key=lambda x: x['height'], reverse=True)

                return jsonify({
                    "title": info.get('title', 'Untitled'),
                    "thumbnail": info.get('thumbnail'),
                    "duration": info.get('duration_string'),
                    "platform": "YouTube" if "youtube" in url else "Other",
                    "formats": formats,
                    "author": info.get('uploader')
                })
        except Exception as e:
            print(f"Info extraction error: {str(e)}")
            return jsonify({"error": str(e)}), 500

    elif action == 'download':
        # Determine the final format string to use
        if not format_str:
            if is_audio:
                format_str = 'bestaudio/best'
            else:
                height = quality.replace('p', '') if 'p' in quality else '1080'
                format_str = f'bestvideo[vcodec^=avc1][height<={height}][ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4][height<={height}]/bestvideo[height<={height}]+bestaudio/best'

        print(f"Downloading: {url} | Format: {format_str}")

        # To stream in Flask, it's often more reliable to use subprocess 
        # so we can pipe stdout directly to the response generator
        def generate():
            cmd = [
                'yt-dlp',
                '--format', format_str,
                '--output', '-',  # Output to stdout
                '--no-playlist',
                '--no-warnings',
                '--no-check-certificates',
                '--concurrent-fragments', '5',
                '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
                '--referer', url, # Adding referer helps with Pinterest/Instagram
                url
            ]
            
            # Only add ffmpeg merging args for video. 
            # Note: Merging requires ffmpeg to be in your PATH.
            # If ffmpeg is missing, this is the #1 cause of 0-byte downloads.
            if not is_audio: # Always apply ffmpeg post-processing for video to ensure MP4 output
                cmd.extend([
                    '--merge-output-format', 'mp4',
                    # Force H.264 and AAC for maximum compatibility across all devices
                    '--postprocessor-args', 'ffmpeg:-c:v libx264 -preset superfast -c:a aac -f mp4 -movflags frag_keyframe+empty_moov+default_base_moof',
                    '--no-part',             # Do not use .part files
                    '--no-cache-dir'         # Avoid disk writes
                ])
            
            # Capture stderr to log errors if the stream is empty (0-byte)
            proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            
            try:
                while True:
                    chunk = proc.stdout.read(1024 * 64) # 64kb chunks
                    if not chunk:
                        err = proc.stderr.read().decode()
                        if err: app.logger.error(f"yt-dlp error: {err}") # Use app.logger for Flask
                        break
                    yield chunk
            except Exception as e:
                print(f"Streaming error: {e}")
            finally:
                if proc.poll() is None:
                    proc.terminate()
                proc.stdout.close()

        safe_title = "".join([c for c in title if c.isalnum() or c in (' ', '-', '_')]).strip()

        return Response(
            stream_with_context(generate()),
            headers={
                "Content-Type": "video/mp4" if not is_audio else "audio/mpeg",
                "Content-Disposition": f"attachment; filename=\"{safe_title}.{'mp3' if is_audio else 'mp4'}\"",
                "Transfer-Encoding": "chunked"
            }
        )

if __name__ == '__main__':
    app.run(port=5000, debug=True)