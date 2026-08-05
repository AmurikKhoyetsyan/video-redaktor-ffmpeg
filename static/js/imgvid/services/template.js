import { toast } from '../../toast.js';
import { log }   from '../../logger.js';

export async function fetchTemplates() {
    const r = await fetch('/api/imgvid/templates');
    const d = await r.json();
    return d.templates || [];
}

export async function fetchTemplate(id) {
    const r = await fetch(`/api/imgvid/templates/${id}`);
    if (!r.ok) return null;
    return r.json();
}

export async function saveTemplate(id, body) {
    const r = await fetch(`/api/imgvid/templates/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    const d = await r.json();
    if (!r.ok) { toast(d.detail || 'Ошибка', 'err'); return null; }
    return d;
}

export async function renameTemplate(id, name) {
    const r = await fetch(`/api/imgvid/templates/${id}/rename`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }),
    });
    const d = await r.json();
    if (!r.ok) { toast(d.detail || 'Ошибка', 'err'); return null; }
    return d;
}

export async function deleteTemplate(id) {
    const r = await fetch(`/api/imgvid/templates/${id}`, { method: 'DELETE' });
    return r.ok;
}

export async function duplicateTemplate(id) {
    const r = await fetch(`/api/imgvid/templates/${id}/duplicate`, { method: 'POST' });
    const d = await r.json();
    if (!r.ok) { toast(d.detail || 'Ошибка', 'err'); return null; }
    return d;
}

export async function saveToVproject(tid, dir, filename) {
    const r = await fetch('/api/imgvid/template/save-to-vproject', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tid, dir, filename }),
    });
    const d = await r.json();
    if (!r.ok) { toast(d.detail || 'Ошибка сохранения', 'err'); return null; }
    return d;
}

export async function unpackVproject(file) {
    const fd = new FormData();
    fd.append('file', file);
    const r = await fetch('/api/imgvid/template/unpack', { method: 'POST', body: fd });
    const d = await r.json();
    if (!r.ok) { toast(d.detail || 'Ошибка', 'err'); return null; }
    return d;
}

export async function loadFromVproject(filePath) {
    const r = await fetch('/api/imgvid/template/load-from-vproject', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ file_path: filePath }),
    });
    const d = await r.json();
    if (!r.ok) { toast(d.detail || 'Ошибка', 'err'); return null; }
    return d;
}
