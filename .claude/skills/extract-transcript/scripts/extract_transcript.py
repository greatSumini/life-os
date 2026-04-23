#!/usr/bin/env python3
"""
YouTube transcript extractor.
Tries youtube-transcript-api first, falls back to yt-dlp + Whisper API.

Usage:
  python3 extract_transcript.py <URL> [--output-dir DIR] [--whisper-api-key KEY]

Output (JSON to stdout):
  {
    "success": true,
    "method": "transcript_api" | "whisper",
    "file": "transcripts/title.txt",
    "title": "Video Title",
    "char_count": 85000,
    "sample": "..."
  }
  or
  {
    "success": false,
    "error": "...",
    "error_type": "no_captions" | "private_video" | "api_key_missing" | "unknown"
  }
"""

import sys
import json
import os
import re
import argparse
import subprocess
import tempfile


def get_video_id(url):
    patterns = [
        r'(?:v=|/v/|youtu\.be/|/embed/)([a-zA-Z0-9_-]{11})',
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None


def sanitize_filename(name):
    name = re.sub(r'[<>:"/\\|?*\n\r\t]', '', name)
    name = re.sub(r'\s+', '_', name.strip())
    return name[:80] or 'transcript'


def get_video_title(url):
    try:
        result = subprocess.run(
            ['yt-dlp', '--get-title', '--no-playlist', url],
            capture_output=True, text=True, timeout=30
        )
        if result.returncode == 0:
            return result.stdout.strip()
    except Exception:
        pass
    return None


def extract_sample(text, front_chars=2000, num_chunks=3, chunk_size=1000):
    """앞부분 + 균등 분포 샘플 추출"""
    parts = [text[:front_chars]]
    remaining = text[front_chars:]
    if len(remaining) > chunk_size and num_chunks > 0:
        available = len(remaining) - chunk_size
        step = available // (num_chunks + 1)
        for i in range(1, num_chunks + 1):
            pos = step * i
            parts.append(f"\n[...중략...]\n{remaining[pos:pos + chunk_size]}")
    return '\n'.join(parts)


def try_transcript_api(video_id):
    """방식 1: youtube-transcript-api로 자막 추출"""
    try:
        from youtube_transcript_api import (
            YouTubeTranscriptApi,
            NoTranscriptFound,
            TranscriptsDisabled,
        )
    except ImportError:
        return None, 'youtube_transcript_api not installed'

    try:
        transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)

        transcript = None
        for lang in ['ko', 'en']:
            try:
                transcript = transcript_list.find_transcript([lang])
                break
            except Exception:
                pass

        if not transcript:
            try:
                transcript = transcript_list.find_generated_transcript(['ko', 'en'])
            except Exception:
                all_transcripts = list(transcript_list)
                if all_transcripts:
                    transcript = all_transcripts[0]

        if not transcript:
            return None, 'no_transcript'

        data = transcript.fetch()
        text = ' '.join(entry['text'] for entry in data)

        # HTML 엔티티 정리
        text = re.sub(r'&#(\d+);', lambda m: chr(int(m.group(1))), text)
        text = text.replace('&amp;', '&').replace('&quot;', '"').replace('&apos;', "'")
        # [음악], [박수] 등 제거
        text = re.sub(r'\[.*?\]', '', text)
        text = re.sub(r'\s+', ' ', text).strip()

        return text, None

    except TranscriptsDisabled:
        return None, 'transcripts_disabled'
    except NoTranscriptFound:
        return None, 'no_transcript'
    except Exception as e:
        msg = str(e)
        if 'private' in msg.lower():
            return None, 'private_video'
        return None, msg


def try_whisper(url, api_key):
    """방식 2: yt-dlp로 오디오 추출 후 Whisper API 전사"""
    try:
        import openai
    except ImportError:
        return None, 'openai package not installed. Run: pip install openai'

    with tempfile.TemporaryDirectory() as tmpdir:
        # 16kHz mono mp3로 추출 (파일 크기 최소화)
        result = subprocess.run(
            [
                'yt-dlp', '-x', '--audio-format', 'mp3', '--no-playlist',
                '--postprocessor-args', 'FFmpegExtractAudio:-ar 16000 -ac 1',
                '-o', os.path.join(tmpdir, 'audio.%(ext)s'),
                url,
            ],
            capture_output=True, text=True, timeout=600,
        )

        if result.returncode != 0:
            if 'private' in result.stderr.lower():
                return None, 'private_video'
            return None, f'yt-dlp error: {result.stderr[:300]}'

        mp3_files = [f for f in os.listdir(tmpdir) if f.endswith('.mp3')]
        if not mp3_files:
            return None, 'Audio file not created after yt-dlp extraction'
        audio_path = os.path.join(tmpdir, mp3_files[0])

        file_size = os.path.getsize(audio_path)
        max_size = 25 * 1024 * 1024  # 25MB

        client = openai.OpenAI(api_key=api_key)

        if file_size <= max_size:
            with open(audio_path, 'rb') as f:
                response = client.audio.transcriptions.create(model='whisper-1', file=f)
            return response.text, None

        # 25MB 초과 시 10분 단위 청크 분할
        probe = subprocess.run(
            ['ffprobe', '-v', 'error', '-show_entries', 'format=duration',
             '-of', 'json', audio_path],
            capture_output=True, text=True,
        )
        duration = float(json.loads(probe.stdout)['format']['duration'])
        chunk_duration = 600  # 10분
        num_chunks = int(duration / chunk_duration) + 1

        texts = []
        for i in range(num_chunks):
            chunk_path = os.path.join(tmpdir, f'chunk_{i}.mp3')
            subprocess.run(
                ['ffmpeg', '-i', audio_path,
                 '-ss', str(i * chunk_duration), '-t', str(chunk_duration),
                 '-c', 'copy', chunk_path, '-y'],
                capture_output=True,
            )
            if os.path.exists(chunk_path) and os.path.getsize(chunk_path) > 0:
                with open(chunk_path, 'rb') as f:
                    resp = client.audio.transcriptions.create(model='whisper-1', file=f)
                texts.append(resp.text)

        return ' '.join(texts), None


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('url')
    parser.add_argument('--output-dir', default='transcripts')
    parser.add_argument('--whisper-api-key', default=os.environ.get('OPENAI_API_KEY'))
    args = parser.parse_args()

    video_id = get_video_id(args.url)
    if not video_id:
        print(json.dumps({
            'success': False,
            'error': 'Invalid YouTube URL',
            'error_type': 'invalid_url',
        }))
        sys.exit(1)

    title = get_video_title(args.url) or video_id

    # 방식 1 시도
    text, error = try_transcript_api(video_id)
    method = 'transcript_api'

    if text is None:
        # 방식 2 fallback
        if not args.whisper_api_key:
            print(json.dumps({
                'success': False,
                'error': 'No captions available and OPENAI_API_KEY is not set.',
                'error_type': 'api_key_missing',
                'transcript_error': error,
            }, ensure_ascii=False))
            sys.exit(1)

        text, error = try_whisper(args.url, args.whisper_api_key)
        method = 'whisper'

        if text is None:
            error_type = 'private_video' if error == 'private_video' else 'unknown'
            print(json.dumps({
                'success': False,
                'error': error,
                'error_type': error_type,
            }, ensure_ascii=False))
            sys.exit(1)

    # 파일 저장
    os.makedirs(args.output_dir, exist_ok=True)
    filename = sanitize_filename(title) + '.txt'
    filepath = os.path.join(args.output_dir, filename)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(text)

    print(json.dumps({
        'success': True,
        'method': method,
        'file': filepath,
        'title': title,
        'char_count': len(text),
        'sample': extract_sample(text),
    }, ensure_ascii=False))


if __name__ == '__main__':
    main()