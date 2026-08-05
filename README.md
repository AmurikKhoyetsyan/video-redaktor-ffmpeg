# VideoRedaktor

A standalone, offline image/video editor — build slideshows and video projects from images and video clips, add subtitles, audio tracks, PIP layers, transitions, and visual effects, then export to MP4, WebM, GIF, and other formats via FFmpeg.

---

## Table of contents

- [Requirements](#requirements)
- [Quick start](#quick-start)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Output directories](#output-directories)
- [FFmpeg setup](#ffmpeg-setup)
- [Documentation](#documentation)
- [Troubleshooting](#troubleshooting)

---

## Requirements

- **Python 3.10+** (3.13 recommended)
- **FFmpeg** — in `PATH` or in the `ffmpeg/` folder (see [FFmpeg setup](#ffmpeg-setup))

---

## Quick start

**Windows — one command:**

```bat
install.bat
run.bat
```

**Or manually:**

```bash
pip install -r requirements.txt
python app.py
```

The server starts on **http://127.0.0.1:7861** and opens a browser tab automatically.

> Port 7861 is used to avoid conflict with TTS apps that typically run on 7860.

---

## Features

| Category | Details |
|----------|---------|
| **Timeline** | Multi-track: video/images, audio tracks, subtitles, PIP layers |
| **Transitions** | 23 types — fade, dissolve, slide, wipe, zoom, pixelize, radial, hblur, fadegrays, circle, and more |
| **Visual effects** | 16 effects — brightness, contrast, saturation, exposure, gamma, temperature, blur, sharpen, grayscale, sepia, vignette, invert, film grain, noise, vintage, noir |
| **Start/End effects** | 16 per-clip entry/exit animations: fade, zoom, slide, rotate, bounce, pop, elastic, flip (H+V), blur, reveal |
| **Continuous effects** | 15 effects — Ken Burns (4 variants), pulse, heartbeat, shake, wiggle, float, drift, zoom-breathe, rotate-slow, swing, spin-fast |
| **Subtitles** | Full styling, positioning, 7 animations (fade, slide, typewriter, zoom-in), karaoke word-timing |
| **Audio** | Multiple tracks, volume, speed, fade, trim, start offset, 14 sound effects, per-track audio channels and sample rate |
| **PIP** | Picture-in-picture layers with opacity, position, effects, time window |
| **Canvas crop** | Crop output canvas to any region before export |
| **Export formats** | MP4, MOV, MKV, M4V, WebM, AVI, GIF, OGV, FLV, WMV, MPEG; audio-only: MP3, WAV, FLAC, AAC, OGG, M4A, Opus |
| **Codecs** | H.264, H.265 (HEVC), VP9, VP8, AV1, ProRes, MPEG-4, Theora, WMV2, MPEG-2 |
| **Projects** | Save/load JSON, export/import `.project` archives (ZIP with embedded media) |
| **Templates** | Save as reusable template, apply with drag-and-drop slot filling, `.vproject` archive format |

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Backend | [FastAPI](https://fastapi.tiangolo.com/) + [Uvicorn](https://www.uvicorn.org/) |
| Video processing | [FFmpeg](https://ffmpeg.org/) (subprocess) |
| Subtitles | ASS format via libass (burned in by FFmpeg) |
| Frontend | Vanilla ES modules, no build step |
| Storage | Local filesystem (`.outputs/`) |

---

## Project structure

```
VideoRedaktor/
├── app.py                      — FastAPI entry point (port 7861)
├── requirements.txt
├── install.bat / run.bat       — Windows helpers
├── ffmpeg/                     — Optional: bundled FFmpeg binaries
│   ├── ffmpeg.exe
│   └── ffprobe.exe
├── core/
│   ├── log.py                  — Logging: app_log, server_log, print_progress
│   └── schemas.py              — Shared Pydantic schemas
├── middleware/
│   └── no_cache.py             — No-cache ASGI middleware for JS/CSS
├── routers/
│   ├── image_video.py          — Router aggregator (/api/imgvid)
│   └── imgvid/
│       ├── ffmpeg_utils.py     — FFmpeg paths, transition/effect maps, helpers
│       ├── ass_writer.py       — ASS subtitle file generator
│       ├── codec_selector.py   — Codec name resolution, FFmpeg argument lists
│       ├── audio_processor.py  — Audio filter chains, sound effects, amix
│       ├── filter_builder.py   — filter_complex assembly (scale, PIP, transitions)
│       ├── project_ops.py      — .project ZIP pack/unpack helpers
│       └── routes/
│           ├── media.py        — Image, clip, audio upload/serve
│           ├── projects.py     — Project CRUD
│           ├── templates.py    — Template CRUD
│           ├── project_files.py — .project/.vproject archive routes
│           └── export.py       — SSE video/audio export, progress streaming
├── static/
│   ├── index.html
│   ├── css/
│   └── js/
│       ├── imgvid/             — Editor core modules (state, timeline, preview…)
│       └── …
└── docs/
    ├── api.md                  — REST API reference
    ├── architecture.md         — Backend & frontend architecture
    ├── EDITOR.md               — User guide (Russian)
    └── DEVELOPMENT.md          — Developer guide
```

---

## Output directories

Created automatically at first run under `.outputs/`:

```
.outputs/
├── imgvid/
│   ├── images/         — uploaded images (UUID filenames)
│   ├── clips/          — uploaded video clips
│   ├── audio/          — uploaded audio tracks
│   ├── thumbs/         — clip thumbnails (extracted at upload time)
│   ├── output/         — exported video and audio files
│   ├── projects/       — project JSON files ({id}.json)
│   └── templates/      — template JSON files ({id}.json)
├── saved_projects/     — .project archives saved to disk
├── saved_templates/    — .vproject archives saved to disk
└── logs/               — server log files (YYYY-MM-DD.log)
```

---

## FFmpeg setup

FFmpeg is required for video export, thumbnail extraction, and audio extraction.

**Option 1 — System PATH** (recommended):  
Install FFmpeg and ensure `ffmpeg.exe` and `ffprobe.exe` are available in `PATH`.

**Option 2 — Local folder**:  
Place the binaries in `ffmpeg/` next to `app.py`:

```
VideoRedaktor/
├── ffmpeg/
│   ├── ffmpeg.exe
│   └── ffprobe.exe
└── app.py
```

The app detects the local binaries automatically on startup.

FFmpeg builds for Windows: https://www.gyan.dev/ffmpeg/builds/ (download "full" release)

---

## Documentation

| File | Contents |
|------|---------|
| [`docs/api.md`](docs/api.md) | Complete REST API reference with request/response schemas |
| [`docs/architecture.md`](docs/architecture.md) | Backend modules, export pipeline, frontend state |
| [`docs/EDITOR.md`](docs/EDITOR.md) | User guide: step-by-step, hotkeys, all effects and transitions |
| [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) | Developer guide: extending effects, codecs, debug |

---

## Troubleshooting

**Browser does not open automatically**  
Navigate to http://127.0.0.1:7861 manually.

**`ffmpeg` not found / export fails immediately**  
Make sure FFmpeg is installed and available. Run `ffmpeg -version` in a terminal. If it works there, restart the server. If not, place binaries in `ffmpeg/` as described above.

**Port 7861 already in use**  
Another instance is running. Close it or change the port in `app.py` (`uvicorn.run(..., port=7861)`).

**Exported file is audio-only / corrupted (H.264 lossless)**  
This is a known FFmpeg/Windows issue with `libx264 CRF=0`. The app works around it by using `CRF=1` instead (visually identical). If you see it with other codecs, report it as a bug.

**libass crash on Windows (subtitle export)**  
The app automatically creates a safe fonts directory containing only `.ttf`/`.otf` files to avoid a crash in libass when scanning the Windows Fonts directory (which contains `.fon` bitmap fonts). If subtitles still fail, check the log in `.outputs/logs/`.
