import { S } from './state.js';
import { toast } from '../toast.js';

const _stack = [];
let _idx    = -1;
let _minIdx = 0;
let _timer  = null;

export function push() {
    if (_idx >= 0 && _stack[_idx]) {
        const prev = _stack[_idx];
        if (
            prev.clips.length       === S.clips.length       &&
            prev.audioTracks.length === S.audioTracks.length &&
            prev.subtitles.length   === S.subtitles.length   &&
            prev.pipLayers.length   === S.pipLayers.length   &&
            JSON.stringify(prev) === JSON.stringify({
                clips: S.clips, audioTracks: S.audioTracks,
                subtitles: S.subtitles, pipLayers: S.pipLayers,
                trackOrder: S.trackOrder,
            })
        ) return;
    }
    _stack.length = _idx + 1;
    _stack.push({
        clips:       JSON.parse(JSON.stringify(S.clips)),
        audioTracks: JSON.parse(JSON.stringify(S.audioTracks)),
        subtitles:   JSON.parse(JSON.stringify(S.subtitles)),
        pipLayers:   JSON.parse(JSON.stringify(S.pipLayers)),
        trackOrder:  [...S.trackOrder],
    });
    if (_stack.length > 50) {
        _stack.shift();
        _idx = 49;
        _minIdx = Math.max(0, _minIdx - 1);
    } else {
        _idx = _stack.length - 1;
    }
}

export function undo(onRestore) {
    if (_timer) { clearTimeout(_timer); _timer = null; push(); }
    if (_idx <= _minIdx) { toast('Нечего отменять', 'info'); return; }
    _idx--;
    _restore(_stack[_idx], onRestore);
    toast('Отменено', 'ok');
}

export function redo(onRestore) {
    clearTimeout(_timer); _timer = null;
    if (_idx >= _stack.length - 1) { toast('Нечего повторять', 'info'); return; }
    _idx++;
    _restore(_stack[_idx], onRestore);
    toast('Повторено', 'ok');
}

function _restore(snap, cb) {
    S.clips       = JSON.parse(JSON.stringify(snap.clips));
    S.audioTracks = JSON.parse(JSON.stringify(snap.audioTracks));
    S.subtitles   = JSON.parse(JSON.stringify(snap.subtitles));
    S.pipLayers   = JSON.parse(JSON.stringify(snap.pipLayers));
    if (snap.trackOrder) S.trackOrder = [...snap.trackOrder];
    S.dirty = true;
    if (cb) cb();
}

export function schedulePush(fn, ms = 700) {
    clearTimeout(_timer);
    _timer = setTimeout(() => { push(); _timer = null; if (fn) fn(); }, ms);
}

export function cancelTimer() { clearTimeout(_timer); _timer = null; }

export function clear() { _stack.length = 0; _idx = -1; _minIdx = 0; }

export function setStack(arr, idx) {
    _stack.length = 0;
    (arr || []).forEach(h => _stack.push(h));
    _idx = idx ?? -1;
    _minIdx = 0;
}

export function getStack() { return _stack; }
export function getIdx()   { return _idx;   }
