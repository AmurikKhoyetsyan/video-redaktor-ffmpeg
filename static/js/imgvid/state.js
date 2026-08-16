// ── Shared application state ───────────────────────────────────────────────
export const S = {
    projectId: null, projectName: 'Новый проект',
    clips: [], audioTracks: [], subtitles: [],
    selIdx: -1, selAudioIdx: -1, selSubIdx: -1, selPipIdx: -1, selIdxs: new Set(),
    selSubIdxs: new Set(), selPipIdxs: new Set(), selAudioIdxs: new Set(),
    activeTab: 'slide', dirty: false,
    // Playback
    currentTime: 0, isPlaying: false,
    _playStartReal: 0, _playStartProject: 0, _rafId: null, _syncTick: 0,
    // Timeline
    pxPerSec: 80,
    // Preview zoom
    previewMode: 'fit',   // 'fit' | 'original' | 'custom'
    previewZoom: 1.0,     // actual CSS scale factor
    // PIP layers
    pipLayers: [],
    // Audio lane indices
    audioLanes: [],
    // Track display order
    trackOrder: ['video', 'audio', 'subtitle', 'pip'],
    // Canvas crop: {x, y, w, h, resW, resH} in canvas pixels, or null
    canvasCrop: null,
    // Preview dimensions (set by updatePreviewSize, used for subtitle scaling)
    previewH: 0, previewW: 0,
    // Template edit mode
    isTemplateMode: false, editingTemplateId: null,
};

// ── Undo/Redo history ────────────────────────────────────────────────────────
export const _historyStack = [];
// Wrapper object so _hist.idx is mutable across module imports
export const _hist = { idx: -1 };

// ── Audio element pool + Web Audio API gain nodes ─────────────────────────────
export const _audioEls   = new Map(); // trackId → HTMLAudioElement
export const _audioGains = new Map(); // trackId → GainNode  (allows volume > 100%)

let _audioCtx = null;
const _audioSrcs = new Map(); // trackId → MediaElementAudioSourceNode

function _ensureAudioCtx() {
    if (!_audioCtx || _audioCtx.state === 'closed') {
        // Old gain nodes belong to the closed context — clear them so they get rebuilt
        _audioGains.clear();
        _audioSrcs.clear();
        _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (_audioCtx.state === 'suspended') {
        _audioCtx.resume().catch(e => console.warn('[Audio] resume failed:', e.message));
    }
    return _audioCtx;
}

export function syncAudio(t, force = false) {
    const allIds = new Set(S.audioTracks.map(x => x.id));
    // Prune removed tracks
    for (const [id, el] of _audioEls) {
        if (!allIds.has(id)) {
            el.pause();
            _audioEls.delete(id);
            _audioGains.delete(id);
            _audioSrcs.delete(id);
        }
    }
    for (const track of S.audioTracks) {
        let el = _audioEls.get(track.id);
        if (!el) {
            el = new Audio(track.fileUrl);
            _audioEls.set(track.id, el);
        }
        // Connect to Web Audio graph for gain control (supports volume > 1.0)
        if (!_audioGains.has(track.id)) {
            try {
                const ctx = _ensureAudioCtx();
                const src = ctx.createMediaElementSource(el);
                const gain = ctx.createGain();
                src.connect(gain);
                gain.connect(ctx.destination);
                _audioSrcs.set(track.id, src);
                _audioGains.set(track.id, gain);
            } catch (e) {
                console.warn('[Audio] gain node failed, using el.volume fallback:', e.message);
            }
        }
        // Apply volume — gain node handles actual level, el.volume stays at 1
        const vol = toPerceptualGain(Math.max(0, track.volume ?? 1));
        const gain = _audioGains.get(track.id);
        if (gain) {
            gain.gain.value = vol;
            el.volume = 1;
        } else {
            el.volume = Math.min(1, vol);
        }
        const speed = track.speed ?? 1;
        if (el.playbackRate !== speed) el.playbackRate = speed;
        const trackT = t - (track.startOffset || 0);
        if (trackT < 0) { if (!el.paused) el.pause(); continue; }
        if (track.duration !== undefined && trackT >= track.duration) { if (!el.paused) el.pause(); continue; }
        const audioFileT = trackT * speed + (track.trimIn || 0);
        if (force || Math.abs(el.currentTime - audioFileT) > 0.3) {
            el.currentTime = Math.max(0, audioFileT);
        }
        if (S.isPlaying && el.paused) el.play().catch(() => {});
        if (!S.isPlaying && !el.paused) el.pause();
    }
}

export function pauseAllAudio() {
    for (const el of _audioEls.values()) el.pause();
}

// Perceptual (logarithmic) gain curve — equal slider steps = equal perceived loudness.
// Quadratic for 0–100% (each +10% ≈ +3 dB), linear pass-through for the 100–200% boost range.
export function toPerceptualGain(linear) {
    if (linear <= 0) return 0;
    if (linear <= 1) return linear * linear;
    return linear;
}
