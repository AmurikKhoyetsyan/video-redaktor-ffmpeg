import { S } from './state.js';
import { synthesizeStream } from '../api.js';
import { toast } from '../toast.js';
import { log }  from '../logger.js';

let _dom = {};
let _cb  = {}; // callbacks: buildTracksMetadata

export function init(dom, callbacks) {
    _dom = dom;
    _cb  = callbacks;
}

export async function startExport() {
    if (!S.clips.length) { toast('Нет клипов для экспорта', 'warn'); return; }

    const settings    = _dom.expModal.getSettings();
    const fmtVal      = settings.format;
    const isAudioOnly = fmtVal.startsWith('audio:');
    const audioFmt    = isAudioOnly ? fmtVal.slice(6) : '';

    _dom.exportBtn.disabled = true;
    _dom.exportProg.hidden  = false;
    if (_dom.cancelExportBtn) _dom.cancelExportBtn.style.display = '';
    _dom.exportStatus.textContent = 'Подготовка…';
    _dom.exportStatus.className   = 'status busy';
    _dom.progFill.style.width = '2%';
    _dom.progPct.textContent  = '0%';

    const projectPayload = JSON.stringify({
        slides: S.clips, audio: S.audioTracks, subtitles: S.subtitles,
        pip: S.pipLayers.filter(p => !p._empty),
        trackOrder: S.trackOrder,
        tracks: _cb.buildTracksMetadata(),
        canvasCrop: S.canvasCrop || null,
    });

    if (isAudioOnly) {
        if (!S.audioTracks.length) {
            _dom.exportBtn.disabled = false;
            toast('Нет аудиодорожек для экспорта', 'warn');
            return;
        }
        const fd = new FormData();
        fd.append('project_json', projectPayload);
        fd.append('audio_format', audioFmt);
        try {
            await synthesizeStream('/api/imgvid/export-audio', { method: 'POST', body: fd }, {
                progress(val, desc) { _onProgress(val, desc); },
                done(payload) {
                    _onDone();
                    toast('Аудио экспортировано!', 'ok');
                    log('Аудио экспортировано: ' + payload.filename, 'done');
                    const url = payload.audio_url || payload.video_url;
                    _download(url, payload.filename);
                    setTimeout(() => { _dom.exportProg.hidden = true; }, 5000);
                },
                error(msg) { _onError(msg); },
                cancelled() { _onCancelled(); },
            });
        } catch (err) { _dom.exportBtn.disabled = false; toast(err.message, 'err'); }
        return;
    }

    const fd = new FormData();
    fd.append('project_json',  projectPayload);
    fd.append('output_format', fmtVal);
    fd.append('codec',         settings.codec);
    fd.append('resolution',    settings.resolution);
    fd.append('fps',           settings.fps);
    fd.append('quality',       settings.quality);
    fd.append('audio_codec',   settings.audioCodec);
    fd.append('audio_bitrate', settings.audioBitrate);
    fd.append('audio_sr',      settings.audioSR);
    fd.append('audio_ch',      settings.audioCh);
    if (S.canvasCrop) {
        const c = S.canvasCrop;
        const { w: expW, h: expH } = _dom.expModal.getResolution();
        const sx = c.resW ? expW / c.resW : 1;
        const sy = c.resH ? expH / c.resH : 1;
        fd.append('canvas_crop', `${Math.round(c.x*sx)},${Math.round(c.y*sy)},${Math.round(c.w*sx)},${Math.round(c.h*sy)}`);
    }
    try {
        await synthesizeStream('/api/imgvid/export', { method: 'POST', body: fd }, {
            progress(val, desc) { _onProgress(val, desc); },
            done(payload) {
                _onDone();
                toast('Экспорт завершён!', 'ok');
                log('Видео экспортировано: ' + payload.filename, 'done');
                _download(payload.video_url, payload.filename);
                setTimeout(() => { _dom.exportProg.hidden = true; }, 5000);
            },
            error(msg) { _onError(msg); },
            cancelled() { _onCancelled(); },
        });
    } catch (err) { _dom.exportBtn.disabled = false; toast(err.message, 'err'); }
}

function _onProgress(val, desc) {
    if (val !== null && isFinite(val)) {
        const pct = Math.round(val * 100);
        _dom.progFill.style.width = pct + '%';
        _dom.progPct.textContent  = pct + '%';
    }
    _dom.exportStatus.textContent = (typeof desc === 'string' && desc.length < 80) ? (desc || 'Обработка…') : 'Обработка…';
}

function _onDone() {
    _dom.exportBtn.disabled = false;
    if (_dom.cancelExportBtn) _dom.cancelExportBtn.style.display = 'none';
    _dom.progFill.style.width = '100%';
    _dom.progPct.textContent  = '100%';
    _dom.exportStatus.textContent = '✓ Готово';
    _dom.exportStatus.className   = 'status ok';
}

function _onError(msg) {
    _dom.exportBtn.disabled = false;
    if (_dom.cancelExportBtn) _dom.cancelExportBtn.style.display = 'none';
    _dom.exportStatus.textContent = msg;
    _dom.exportStatus.className   = 'status err';
    toast(msg, 'err');
    log(msg, 'err');
    setTimeout(() => { _dom.exportProg.hidden = true; }, 8000);
}

function _onCancelled() {
    _dom.exportBtn.disabled = false;
    if (_dom.cancelExportBtn) _dom.cancelExportBtn.style.display = 'none';
    _dom.exportStatus.textContent = 'Отменено';
    _dom.exportStatus.className   = 'status';
    _dom.progFill.style.width = '0%';
    _dom.progPct.textContent  = '0%';
    toast('Экспорт отменён', 'info');
    log('Export cancelled by user', 'warn');
    setTimeout(() => { _dom.exportProg.hidden = true; }, 3000);
}

function _download(url, filename) {
    const a = Object.assign(document.createElement('a'), { href: url, download: filename });
    document.body.appendChild(a);
    a.click();
    a.remove();
}

export function getSettings() {
    return _dom.expModal.getSettings();
}

export function applySettings(s) {
    if (!s) return;
    _dom.expModal.applySettings(s);
}
