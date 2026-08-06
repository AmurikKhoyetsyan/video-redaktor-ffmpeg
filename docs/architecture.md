# Architecture

## Overview

`VideoRedaktor` is a single-page FastAPI application. The backend serves a REST API under `/api/imgvid/` and the frontend is plain ES modules served as static files.

```
VideoRedaktor/
  app.py                   — FastAPI entry point, port 7861
  requirements.txt
  routers/
    image_video.py         — APIRouter aggregator (mounts sub-routers)
    imgvid/
      __init__.py
      ffmpeg_utils.py      — FFmpeg binary resolution, transition/effect maps, ffprobe helpers, thumbnail extraction
      ass_writer.py        — ASS subtitle generator with karaoke word-timing and per-subtitle animations
      codec_selector.py    — Maps human codec names to FFmpeg encoder argument lists; CRF quality scaling
      audio_processor.py   — 14 sound effects (sfx_filter), per-track filter chains, multi-track amix
      filter_builder.py    — Assembles filter_complex: scale, slide effects, xfade transitions, PIP overlays, subtitle filter
      project_ops.py       — Pack/unpack .project ZIP archives; rewrites fileUrl fields on import
      routes/
        __init__.py
        media.py           — Image, video clip, audio upload/serve routes
        projects.py        — Project CRUD routes
        templates.py       — Template CRUD routes
        project_files.py   — .project archive pack/unpack/browse/load routes
        export.py          — SSE-streamed video export, audio export, audio extraction
  core/
    log.py                 — app_log(), server_log(), print_progress() — writes to stdout and .outputs/logs/
    schemas.py             — Pydantic models (RenameBody, SaveSRTBody)
  middleware/
    no_cache.py            — Pure-ASGI no-cache middleware for /static/js/ and /static/css/ responses
  static/
    index.html             — Single page — imgvid section + modals + logger
    css/                   — base, tabs, forms, audio, modal, logger, custom-select, file-upload, loader, image-video, exp-modal
    js/
      app.js               — Entry point — imports logger, tabs, initialises the editor
      api.js               — fetch helpers (getJSON, postJSON, putJSON, del, uploadForm, synthesizeStream)
      audio-manager.js     — Singleton: only one AudioPlayer plays at a time
      audio-player.js      — Custom audio wrapper with waveform drag-to-scrub, seekbar
      wave-renderer.js     — Canvas waveform renderer used by AudioPlayer
      custom-select.js     — Dropdown component with optional action icons
      file-upload.js       — Drag-and-drop single-file upload component
      loader.js            — withLoader() spinner overlay + makeSkeleton() helpers
      events.js            — Cross-tab EventTarget bus
      icons.js             — Inline SVG strings (single source of truth)
      logger.js            — Floating draggable panel + progress bar
      modal.js             — Promise-based openConfirm() / openPrompt()
      tabs.js              — Stub (single-tab app)
      toast.js             — Transient notifications (info/ok/warn/err)
      tabs/
        image-video.js     — Editor coordinator: initialises DOM, wires events, delegates to imgvid/ modules
      imgvid/
        state.js           — Shared state singleton S; _audioEls pool; syncAudio(), pauseAllAudio()
        history.js         — Undo/redo stack: push(), undo(), redo(), clear(), setStack(), getStack()
        preview.js         — Preview zoom & size: init(), applyZoom(), updatePreviewSize()
        export.js          — Full export logic: init(), startExport(), SSE progress handlers
        constants.js       — TRANSITIONS (23), EFFECTS_DEF, FONTS, ANIMS, START_EFFECTS, END_EFFECTS, CONTINUOUS_EFFECTS
        utils.js           — uid, eh, fmt, fmtShort, totalDur, clipAtTime, buildCSSFilter, snap
        waveform.js        — drawWaveform() with cached peaks, probeAudioDuration()
        props.js           — Property panels: slide / audio / subtitle / PIP
        timeline.js        — Timeline render, drag-drop, resize, snap, context menus
        playback.js        — togglePlay, seek, updateTransportUI
        pip.js             — Picture-in-Picture overlay management and controls
        preview-render.js  — Canvas renderer: images, video frames, crop/scale/effects/subtitle overlays
        media-list.js      — Media browser: list clips and audio tracks, handle delete
        exp-modal.js       — Export dialog UI: format / resolution / fps / quality / codec
        services/
          upload.js        — File upload API: uploadImages(), uploadClip(), uploadAudio(), uploadPip()
          project.js       — Project API: fetchProjects/fetchProject/saveProject/renameProject/deleteProject/saveAsTemplate/saveToPath/unpackProject/loadFromPath/browsePath/extractAudio
          template.js      — Template API: fetchTemplates/fetchTemplate/saveTemplate/renameTemplate/deleteTemplate/duplicateTemplate/saveToVproject/unpackVproject/loadFromVproject
```

---

## Backend: API Router

`routers/image_video.py` mounts all sub-routers under the `/api/imgvid` prefix:

```python
router = APIRouter(prefix="/api/imgvid", tags=["imgvid"])
router.include_router(media.router)
router.include_router(projects.router)
router.include_router(templates.router)
router.include_router(project_files.router)
router.include_router(export.router)
```

---

## Backend: Service Modules

### `ffmpeg_utils.py`

- Resolves FFmpeg/FFprobe binaries (PATH or local `ffmpeg/` folder)
- Defines `_XFADE` (22 xfade transition names) and `_EFFECTS` (16 colour/filter effects)
- `_probe_duration_clip(path)` — ffprobe duration query
- `_extract_thumb(video_path, thumb_path)` — extract first frame thumbnail
- `_compute_video_dur(slides)` — sum of all clip durations
- `_start_effect_filters(type, dur, clip_dur, w, h)` — per-clip entry animation filter chains
- `_end_effect_filters(type, dur, clip_dur, w, h)` — per-clip exit animation filter chains
- `_continuous_effect_filters(type, intensity, dur, w, h, fps, clip_type, speed)` — Ken Burns, pulse, shake, float, zoom-breathe, rotate-slow, wiggle, drift, heartbeat, swing, spin-fast

### `ass_writer.py`

- `_write_ass(subs, path, width, height)` — generate ASS subtitle file
- Supports: custom font/size/color/bold/italic/underline, outline/shadow, background box, per-subtitle positioning (x%, y%), text alignment (left/center/right), rotation
- Animations: fade-in, fade-out, slide-up, slide-down, zoom-in, typewriter (character-by-character)
- Karaoke: word-by-word or cumulative highlight; typewriter-per-word; zoom word; highlight marker; show-only-active-word

### `codec_selector.py`

- `resolve_codec_name(codec, format)` — maps user codec name to FFmpeg encoder
- `select_video_codec(codec, crf, format)` — returns FFmpeg video codec argument list
- `select_audio_codec(codec, bitrate, has_audio)` — returns FFmpeg audio codec argument list
- Supported video codecs: H.264, H.265, VP9, VP8, AV1, ProRes, Theora, WMV2, MPEG-2, MPEG-4, GIF

### `audio_processor.py`

- `sfx_filter(type, params)` — returns FFmpeg audio filter string for one sound effect
  - Supported: echo, reverb, bassboost, treble, compressor, phone, radio, lowpass, highpass, chorus, flanger, distortion, noise (gate), pitch
- `build_audio_filter(track, input_idx, out_label, total_dur)` — per-track filter chain (volume, trim, speed, fade in/out, sound effects, start offset)
- `build_audio_chain(valid_audio, start_idx, total_dur)` — multi-track mix using amix

### `filter_builder.py`

- `build_scale_filter(w, h, fps)` — standard scale/pad/format filter
- `build_slide_filter(i, slide, fps, w, h)` — full per-slide filter including crop, scale, effects, start/end effects, frame positioning
- `build_transition_filters_fps(slides, filter_parts, fps)` — xfade / concat transition chain
- `build_pip_filters(valid_pip, start_idx, base_label, w, h, total_dur, fps)` — PIP overlay layers
- `build_subtitle_filter(subs, tmp_dir, w, h)` — write ASS file and return subtitles= filter string

### `project_ops.py`

- `_make_project_buf(project)` — pack project JSON + media files into a ZIP buffer
- `_extract_project_zip(zf)` — unpack .project archive and restore media files
- `_finalize_project(project)` — assign UUID, write project JSON to disk
- `_finalize_template(project)` — same as `_finalize_project` but sets `is_template=True`
- `_collect_media_filenames(project)` — return set of all media filenames referenced by a project
- `delete_orphaned_media(deleted_project)` — remove media files no longer referenced after a project/template is deleted

---

## Export Pipeline

`routes/export.py::export_video()` runs in a background thread:

1. Validates slides, resolution, format, and checks all files exist
2. Resolves PIP layers to file paths
3. Builds `-i` input list (images with `-loop 1 -t`, video clips with `-t`, audio tracks, PIP inputs)
4. Builds per-slide video filters via `filter_builder`
5. Applies canvas crop if set
6. Applies PIP overlays and subtitle filter (order controlled by `trackOrder`)
7. Builds audio filter chain via `audio_processor`
8. Selects codec via `codec_selector`
9. Runs FFmpeg subprocess with the assembled `-filter_complex`
10. Streams progress back via SSE frames (`event: progress`, `event: done`, `event: error`, `event: cancelled`)

---

## Output Directories

```
.outputs/
  imgvid/
    images/      — uploaded images (UUID filenames)
    clips/       — uploaded video clips
    audio/       — uploaded audio tracks
    thumbs/      — video clip thumbnails
    output/      — exported video and audio files
    projects/    — project JSON files ({id}.json)
    templates/   — template JSON files ({id}.json)
  saved_projects/  — .project archives saved to disk
  saved_templates/ — .vproject archives saved to disk
  logs/            — server log files (YYYY-MM-DD.log)
```

---

## Logging (`core/log.py`)

All server-side logging goes through `core/log.py`. It writes to both stdout and to a daily log file in `.outputs/logs/YYYY-MM-DD.log`.

```
[2026-01-15 10:23:45] [INFO] [Server]
Server started

[2026-01-15 10:24:01] [INFO] [ImgVid]
Project saved: My Project
```

| Function | Description |
|----------|-------------|
| `app_log(msg, level, source)` | Main logging function. Writes to stdout + log file with a timestamp, level, and source label. Thread-safe (mutex-protected file write). |
| `server_log(msg, level)` | Alias for `app_log` with `source="Server"` |
| `write_log(line, level)` | Backward-compatible alias with `source="App"` |
| `print_progress(pct, prefix)` | Prints an ASCII progress bar to terminal (overwrites current line). Used during FFmpeg export. |

The frontend sends client-side log messages to `POST /api/log` which calls `app_log(..., source="Client")`.

---

## Middleware

`middleware/no_cache.py` — pure ASGI middleware that adds `no-cache` headers to all `/static/js/` and `/static/css/` responses. Uses the raw ASGI interface (not `BaseHTTPMiddleware`) to avoid `CancelledError` noise on shutdown.

---

## Frontend Architecture

The frontend uses a **module coordinator + service layer** pattern. All backend API calls are isolated in `imgvid/services/`. All editor logic is split into focused modules. The coordinator `tabs/image-video.js` wires DOM events and delegates to the modules.

```
tabs/image-video.js          ← coordinator (init, event wiring)
  ├── imgvid/state.js        ← shared state singleton S
  ├── imgvid/history.js      ← undo/redo stack
  ├── imgvid/preview.js      ← preview zoom & size
  ├── imgvid/export.js       ← export logic & SSE progress
  └── imgvid/services/
        ├── upload.js        ← POST /api/imgvid/{images,clips,audio}
        ├── project.js       ← /api/imgvid/projects/* CRUD + archives
        └── template.js      ← /api/imgvid/templates/* CRUD + archives
```

### Shared State (`state.js`)

`static/js/imgvid/state.js` exports a single shared state object `S`:

```js
S = {
  projectId: null,
  projectName: 'Новый проект',
  clips: [],           // video/image clips on the timeline
  audioTracks: [],     // audio tracks
  subtitles: [],       // subtitle objects
  pipLayers: [],       // PIP layers

  // Single selection (index into respective array, -1 = none)
  selIdx: -1,
  selAudioIdx: -1,
  selSubIdx: -1,
  selPipIdx: -1,

  // Multi-selection (Set of indices, populated on Ctrl+click)
  selIdxs: new Set(),
  selSubIdxs: new Set(),
  selPipIdxs: new Set(),
  selAudioIdxs: new Set(),

  activeTab: 'slide',  // current property-panel tab
  dirty: false,        // unsaved changes flag

  // Playback
  currentTime: 0,
  isPlaying: false,

  // Timeline
  pxPerSec: 80,        // zoom: pixels per second

  // Preview
  previewMode: 'fit',  // 'fit' | 'original' | 'cover' | 'custom'
  previewZoom: 1.0,    // CSS scale factor
  previewW: 0,
  previewH: 0,

  // Canvas crop (null = no crop)
  canvasCrop: null,

  // Template edit mode
  isTemplateMode: false,
  editingTemplateId: null,
}
```

Also exported from `state.js`: `_audioEls` (Map of active HTMLAudioElement instances), `syncAudio(t, force)`, `pauseAllAudio()`.

### Undo/Redo (`history.js`)

`static/js/imgvid/history.js` manages the undo/redo stack independently of the state module.

| Export | Description |
|--------|-------------|
| `push()` | Push a deep-clone snapshot of `S` (clips, audioTracks, subtitles, pipLayers, trackOrder) |
| `undo(onRestore)` | Restore previous snapshot, call `onRestore()` for DOM cleanup |
| `redo(onRestore)` | Re-apply next snapshot, call `onRestore()` for DOM cleanup |
| `schedulePush(fn, ms)` | Debounced push (default 700 ms) — used for slider changes |
| `clear()` | Reset the stack (on project load) |
| `setStack(arr, idx)` | Restore a saved stack (tab switching) |
| `getStack() / getIdx()` | Snapshot the stack for tab state serialization |

### Preview (`preview.js`)

`static/js/imgvid/preview.js` handles preview sizing. Initialised with `init(dom, { getResolution })`.

| Export | Description |
|--------|-------------|
| `applyZoom(mode, pct)` | Set zoom mode: `'fit'`, `'original'`, `'cover'`, or a numeric percentage |
| `updatePreviewSize()` | Recalculate and apply preview dimensions, respecting canvas crop |

### Export (`export.js`)

`static/js/imgvid/export.js` handles the full export flow. Initialised with `init(dom, { buildTracksMetadata })`.

| Export | Description |
|--------|-------------|
| `startExport()` | Collects export settings, POSTs to `/api/imgvid/export` or `/api/imgvid/export-audio`, streams SSE progress |
| `getSettings()` / `applySettings(s)` | Read/write export modal settings |

### Service Layer (`services/`)

Each service module handles one API domain. All errors are toasted internally; functions return `null` on failure.

**`services/upload.js`**

| Function | Endpoint |
|----------|---------|
| `uploadImages(files, defaultDur)` | `POST /api/imgvid/images` — returns array of clip objects |
| `uploadClip(file)` | `POST /api/imgvid/clips` — returns a clip object |
| `uploadAudio(file)` | `POST /api/imgvid/audio` — returns a track object |
| `uploadPip(file)` | `POST /api/imgvid/images` or `/clips` — returns a PIP data object |

**`services/project.js`**

| Function | Endpoint |
|----------|---------|
| `fetchProjects()` | `GET /api/imgvid/projects` |
| `fetchProject(id)` | `GET /api/imgvid/projects/{id}` |
| `saveProject(body)` | `POST` or `PUT /api/imgvid/projects/{id}` |
| `renameProject(id, name)` | `PATCH /api/imgvid/projects/{id}` |
| `deleteProject(id)` | `DELETE /api/imgvid/projects/{id}` |
| `saveAsTemplate(pid, name)` | `POST /api/imgvid/projects/{pid}/save-as-template` |
| `saveToPath(pid, dir, filename)` | `POST /api/imgvid/project/save-to-path` |
| `unpackProject(file)` | `POST /api/imgvid/project/unpack` |
| `loadFromPath(filePath)` | `POST /api/imgvid/project/load-from-path` |
| `browsePath(url, dir)` | `GET <url>?path=<dir>` |
| `extractAudio(file)` | `POST /api/imgvid/extract-audio` |

**`services/template.js`**

| Function | Endpoint |
|----------|---------|
| `fetchTemplates()` | `GET /api/imgvid/templates` |
| `fetchTemplate(id)` | `GET /api/imgvid/templates/{id}` |
| `saveTemplate(id, body)` | `PUT /api/imgvid/templates/{id}` |
| `renameTemplate(id, name)` | `PATCH /api/imgvid/templates/{id}/rename` |
| `deleteTemplate(id)` | `DELETE /api/imgvid/templates/{id}` |
| `duplicateTemplate(id)` | `POST /api/imgvid/templates/{id}/duplicate` |
| `saveToVproject(tid, dir, filename)` | `POST /api/imgvid/template/save-to-vproject` |
| `unpackVproject(file)` | `POST /api/imgvid/template/unpack` |
| `loadFromVproject(filePath)` | `POST /api/imgvid/template/load-from-vproject` |
