# Developer Guide

This document covers extending the editor, understanding the export pipeline, and development workflow.

---

## Table of contents

- [Development setup](#development-setup)
- [Adding a new visual effect](#adding-a-new-visual-effect)
- [Adding a new transition](#adding-a-new-transition)
- [Adding a new start/end effect](#adding-a-new-startend-effect)
- [Adding a new continuous effect](#adding-a-new-continuous-effect)
- [Adding a new audio sound effect](#adding-a-new-audio-sound-effect)
- [Adding a new export format or codec](#adding-a-new-export-format-or-codec)
- [Export pipeline step by step](#export-pipeline-step-by-step)
- [Logging](#logging)
- [Key files quick reference](#key-files-quick-reference)

---

## Development setup

```bash
pip install -r requirements.txt
python app.py
```

The server auto-reloads are **not** enabled — restart manually after Python changes. Frontend JS/CSS changes take effect on browser refresh (no-cache headers are set by `NoCacheStaticMiddleware`).

To enable auto-reload during development:

```bash
uvicorn app:app --reload --port 7861
```

---

## Adding a new visual effect

Visual effects are color/filter adjustments applied to individual slides.

**1. Register the FFmpeg filter in `routers/imgvid/ffmpeg_utils.py`:**

```python
_EFFECTS = {
    ...
    "my_effect": lambda v: f"some_ffmpeg_filter=param={float(v):.2f}",
}
```

The lambda receives the numeric value from the effect descriptor (`ef.get("value", 0)`) and returns an FFmpeg filter string.

**2. Add it to `static/js/imgvid/constants.js` (`EFFECTS_DEF` array):**

```js
{ type: "my_effect", label: "My Effect", min: 0, max: 100, step: 1, default: 0, toggle: false }
```

Set `toggle: true` for on/off effects (value is ignored, effect is always applied when enabled).

**3. The effect is applied automatically** in `filter_builder.py::build_slide_filter()` and `filter_builder.py::build_pip_filters()` — no changes needed there.

---

## Adding a new transition

Transitions use FFmpeg's `xfade` filter.

**1. Add the mapping in `routers/imgvid/ffmpeg_utils.py`:**

```python
_XFADE = {
    ...
    "my_transition": "xfade_name",  # xfade_name must be a valid FFmpeg xfade transition
}
```

**2. Add to `TRANSITIONS` in `static/js/imgvid/constants.js`:**

```js
{ value: "my_transition", label: "My Transition" }
```

The filter chain in `filter_builder.py::build_transition_filters_fps()` picks up the new entry automatically.

---

## Adding a new start/end effect

Entry and exit effects are per-clip animations applied in the FFmpeg filter chain.

**1. Add a new branch in `_start_effect_filters()` in `routers/imgvid/ffmpeg_utils.py`:**

```python
def _start_effect_filters(se_type, se_dur, dur, w, h):
    ...
    if se_type == "my_start_effect":
        D = max(0.001, se_dur)
        return [
            f"some_filter=param={D:.3f}",
            # additional chained filters...
        ]
    return []
```

For exit effects, add to `_end_effect_filters()` in the same file. Use `st = max(0.0, dur - D)` as the start time for end effects.

**2. Add to `START_EFFECTS` / `END_EFFECTS` in `static/js/imgvid/constants.js`:**

```js
{ value: "my_start_effect", label: "My Start Effect" }
```

---

## Adding a new continuous effect

Continuous effects run for the full clip duration (Ken Burns, pulse, shake, etc.).

**1. Add a branch in `_continuous_effect_filters()` in `routers/imgvid/ffmpeg_utils.py`:**

```python
def _continuous_effect_filters(cont_type, intensity, dur, w, h, fps, clip_type, speed):
    ...
    if cont_type == "my_cont_effect":
        amp = intensity / 100.0
        return False, [
            f"some_filter=param={amp:.4f}",
        ]
```

Return value is `(replaces_scale: bool, filter_list: list)`. Set `replaces_scale=True` only if your effect replaces the normal `scale` filter (like Ken Burns `zoompan`).

**2. Register in `static/js/imgvid/constants.js`** (wherever continuous effects are listed).

---

## Adding a new audio sound effect

Sound effects are applied to individual audio tracks.

**1. Add a branch in `sfx_filter()` in `routers/imgvid/audio_processor.py`:**

```python
def sfx_filter(sfx_type, sfx):
    ...
    if sfx_type == "my_sfx":
        param = float(sfx.get("my_param", 1.0))
        return f"some_audio_filter=param={param:.2f}"
    return None
```

The function returns an FFmpeg audio filter string, or `None` to skip.

**2. Register the effect in the frontend** (audio props panel in `static/js/imgvid/props.js`).

---

## Adding a new export format or codec

### New container format

**1. Add the default codec mapping in `routers/imgvid/codec_selector.py`:**

```python
_FMT_DEFAULT_CODEC = {
    ...
    "newformat": "libx264",  # or whichever encoder suits the container
}
```

**2. Add to the format dropdown** in the export modal (`static/js/imgvid/exp-modal.js`).

### New video codec

**1. Add the alias in `routers/imgvid/codec_selector.py`:**

```python
_CODEC_NAME_MAP = {
    ...
    "mycodec": "ffmpeg_encoder_name",
}
```

**2. Add the FFmpeg argument list in `select_video_codec()`** in the same file:

```python
def select_video_codec(vcodec_name, crf, output_format):
    ...
    if vcodec_name == "ffmpeg_encoder_name":
        return ["-c:v", "ffmpeg_encoder_name", "-crf", str(crf), "-pix_fmt", "yuv420p"]
```

---

## Export pipeline step by step

The full export runs in `routes/export.py::export_video()` in a background thread to avoid blocking the event loop.

```
1. Parse project_json from the multipart form
2. Validate: at least one slide, all slide files exist on disk
3. Resolve PIP layer file paths (_path field)
4. Resolve canvas crop (canvasCrop → pixel crop after scale)

5. Build FFmpeg -i inputs:
   - Images:  -loop 1 -t <dur> -i <path>
   - Videos:  -t <dur> -i <path>
   - Audio tracks: -i <path>
   - PIP images/videos: -i <path>

6. Build per-slide video filters (filter_builder.build_slide_filter)
   - Video trim + speed
   - Image crop + scale + offset
   - Color/visual effects
   - Start/end motion effects
   - Frame position (frameX/Y/W/H)

7. Assemble transition chain (filter_builder.build_transition_filters_fps)
   - xfade with tpad (clone) for additive duration model
   - concat for no-transition slides

8. Apply canvas crop if set

9. Apply PIP overlays (filter_builder.build_pip_filters)
   - Order is controlled by trackOrder

10. Apply subtitle filter (filter_builder.build_subtitle_filter)
    - Writes .ass file to temp dir
    - Returns subtitles= filter string

11. Build audio filter chain (audio_processor.build_audio_chain)
    - Per-track: trim, speed, volume, SFX, fade, start offset
    - Multi-track: amix

12. Select video codec (codec_selector.select_video_codec)
13. Select audio codec (codec_selector.select_audio_codec)

14. Assemble final FFmpeg command:
    [FFMPEG, -y, <inputs>, -filter_complex <all_filters>, -map [vout], -map [aout], <codecs>, <output>]

15. Run subprocess, pipe stderr
16. Parse FFmpeg progress lines (time=HH:MM:SS.cs) → compute percentage
17. Stream SSE events: progress → done / error / cancelled
```

---

## Logging

All server-side log calls go through `core/log.py`:

```python
from core.log import app_log, server_log

app_log("Something happened", "INFO", "MyModule")
server_log("Server started")          # source="Server"
```

Log files are written to `.outputs/logs/YYYY-MM-DD.log`. A new file is created each day.

Frontend log messages arrive at `POST /api/log` and are written with `source="Client"`.

To monitor the log in real time during development:

```powershell
Get-Content ".outputs\logs\$(Get-Date -Format 'yyyy-MM-dd').log" -Wait
```

---

## Key files quick reference

| File | Responsibility |
|------|---------------|
| `app.py` | FastAPI app, lifespan, static files, `/api/log` |
| `core/log.py` | All logging |
| `core/schemas.py` | Shared Pydantic models |
| `middleware/no_cache.py` | Prevent browser caching of JS/CSS |
| `routers/image_video.py` | Mounts all sub-routers under `/api/imgvid` |
| `routers/imgvid/ffmpeg_utils.py` | FFmpeg paths, `_XFADE`, `_EFFECTS`, effect filter generators |
| `routers/imgvid/ass_writer.py` | ASS subtitle file generation |
| `routers/imgvid/codec_selector.py` | Codec name → FFmpeg argument list |
| `routers/imgvid/audio_processor.py` | Audio filter chain building |
| `routers/imgvid/filter_builder.py` | `filter_complex` assembly |
| `routers/imgvid/project_ops.py` | `.project` ZIP pack/unpack |
| `routers/imgvid/routes/export.py` | SSE export endpoint, FFmpeg process management |
| `routers/imgvid/routes/media.py` | File upload/serve |
| `routers/imgvid/routes/projects.py` | Project CRUD |
| `routers/imgvid/routes/templates.py` | Template CRUD |
| `routers/imgvid/routes/project_files.py` | `.project`/`.vproject` archive routes |
| `static/js/imgvid/state.js` | Shared editor state `S`, undo/redo |
| `static/js/imgvid/constants.js` | All effect/transition/codec lists |
| `static/js/imgvid/timeline.js` | Timeline rendering and interactions |
| `static/js/imgvid/export.js` | Export dialog and SSE progress |
