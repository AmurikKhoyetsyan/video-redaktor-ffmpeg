import { toast } from '../../toast.js';
import { log }   from '../../logger.js';
import { uid }   from '../utils.js';
import { probeAudioDuration } from '../waveform.js';

export async function uploadImages(files, defaultDur = 4) {
    const results = [];
    for (const file of files) {
        try {
            const fd = new FormData();
            fd.append('file', file);
            const r = await fetch('/api/imgvid/images', { method: 'POST', body: fd });
            const d = await r.json();
            if (!r.ok) { toast(d.detail || 'Ошибка загрузки', 'err'); continue; }
            results.push({
                id: uid(), type: 'image',
                file: d.name, fileUrl: d.url, thumbUrl: d.url, original: d.original,
                duration: defaultDur,
                transition: { type: 'fade', duration: 0.5 },
                startEffect: { type: 'none', duration: 1.0 },
                endEffect:   { type: 'none', duration: 1.0 },
                continuousEffect: { type: 'none', intensity: 30 },
                effects: [], subtitles: [],
                imgScale: 100, imgOffsetX: 0, imgOffsetY: 0, crop: null,
            });
            log('Изображение добавлено: ' + d.original, 'done');
        } catch (e) { toast(e.message, 'err'); }
    }
    return results;
}

export async function uploadClip(file) {
    try {
        toast('Загрузка видео…', 'info');
        const fd = new FormData();
        fd.append('file', file);
        const r = await fetch('/api/imgvid/clips', { method: 'POST', body: fd });
        const d = await r.json();
        if (!r.ok) { toast(d.detail || 'Ошибка', 'err'); return null; }
        log('Видеоклип добавлен: ' + d.original, 'done');
        return {
            id: uid(), type: 'video',
            file: d.name, fileUrl: d.url, thumbUrl: d.thumb_url || '', original: d.original,
            duration: d.duration || 5, originalDuration: d.duration || 5,
            transition: { type: 'fade', duration: 0.5 },
            startEffect: { type: 'none', duration: 1.0 },
            endEffect:   { type: 'none', duration: 1.0 },
            continuousEffect: { type: 'none', intensity: 30 },
            effects: [], subtitles: [],
        };
    } catch (e) { toast(e.message, 'err'); return null; }
}

export async function uploadAudio(file) {
    try {
        const fd = new FormData();
        fd.append('file', file);
        const r = await fetch('/api/imgvid/audio', { method: 'POST', body: fd });
        const d = await r.json();
        if (!r.ok) { toast(d.detail || 'Ошибка', 'err'); return null; }
        log('Аудио добавлено: ' + d.original, 'done');
        return { id: uid(), file: d.name, fileUrl: d.url, original: d.original, volume: 1, fadeIn: 0, fadeOut: 0, trimIn: 0, url: d.url };
    } catch (e) { toast(e.message, 'err'); return null; }
}

export async function uploadPip(file) {
    try {
        const isVideo = file.type.startsWith('video/') || /\.(mp4|mov|mkv|webm|avi)$/i.test(file.name);
        const endpoint = isVideo ? '/api/imgvid/clips' : '/api/imgvid/images';
        const fd = new FormData();
        fd.append('file', file);
        const r = await fetch(endpoint, { method: 'POST', body: fd });
        const d = await r.json();
        if (!r.ok) { toast(d.detail || 'Ошибка', 'err'); return null; }
        return { file: d.name, fileUrl: d.url, thumbUrl: d.thumb_url || d.url, original: d.original, type: isVideo ? 'video' : 'image', duration: d.duration };
    } catch (e) { toast(e.message, 'err'); return null; }
}

export { probeAudioDuration };
