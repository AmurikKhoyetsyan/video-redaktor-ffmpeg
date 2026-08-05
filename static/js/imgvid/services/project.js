import { toast } from '../../toast.js';
import { log }   from '../../logger.js';

export async function fetchProjects() {
    const r = await fetch('/api/imgvid/projects');
    const d = await r.json();
    return d.projects || [];
}

export async function fetchProject(id) {
    const r = await fetch(`/api/imgvid/projects/${id}`);
    if (!r.ok) return null;
    return r.json();
}

export async function saveProject(body) {
    const isNew = !body.id;
    const url    = isNew ? '/api/imgvid/projects' : `/api/imgvid/projects/${body.id}`;
    const method = isNew ? 'POST' : 'PUT';
    const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const d = await r.json();
    if (!r.ok) { toast(d.detail || 'Ошибка', 'err'); return null; }
    return d;
}

export async function renameProject(id, name) {
    const r = await fetch(`/api/imgvid/projects/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }),
    });
    const d = await r.json();
    if (!r.ok) { toast(d.detail || 'Ошибка', 'err'); return null; }
    return d;
}

export async function deleteProject(id) {
    const r = await fetch(`/api/imgvid/projects/${id}`, { method: 'DELETE' });
    return r.ok;
}

export async function saveAsTemplate(projectId, name) {
    const r = await fetch(`/api/imgvid/projects/${projectId}/save-as-template`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }),
    });
    const d = await r.json();
    if (!r.ok) { toast(d.detail || 'Ошибка', 'err'); return null; }
    return d;
}

export async function saveToPath(pid, dir, filename) {
    const r = await fetch('/api/imgvid/project/save-to-path', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pid, dir, filename }),
    });
    const d = await r.json();
    if (!r.ok) { toast(d.detail || 'Ошибка сохранения', 'err'); return null; }
    return d;
}

export async function unpackProject(file) {
    const fd = new FormData();
    fd.append('file', file);
    const r = await fetch('/api/imgvid/project/unpack', { method: 'POST', body: fd });
    const d = await r.json();
    if (!r.ok) { toast(d.detail || 'Ошибка', 'err'); return null; }
    return d;
}

export async function loadFromPath(filePath) {
    const r = await fetch('/api/imgvid/project/load-from-path', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ file_path: filePath }),
    });
    const d = await r.json();
    if (!r.ok) { toast(d.detail || 'Ошибка', 'err'); return null; }
    return d;
}

export async function browsePath(url, dir) {
    const q = dir ? '?path=' + encodeURIComponent(dir) : '';
    const r = await fetch(url + q);
    if (!r.ok) return null;
    return r.json();
}

export async function extractAudio(file) {
    const r = await fetch('/api/imgvid/extract-audio', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ file }),
    });
    const d = await r.json();
    if (!r.ok) { toast(d.detail || 'Ошибка', 'err'); return null; }
    return d;
}
