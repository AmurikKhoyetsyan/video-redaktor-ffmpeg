import { S } from './state.js';

let _dom = {};
let _cb  = {}; // callbacks: getResolution

export function init(dom, callbacks) {
    _dom = dom;
    _cb  = callbacks;
}

export function applyZoom(mode, pct) {
    S.previewMode = mode;
    const { previewContent, zoomDisplay, zoomPct, zoomSign } = _dom;

    if (mode === 'fit') {
        S.previewZoom = 1;
        previewContent.style.transform = '';
        previewContent.style.transformOrigin = '';
        zoomDisplay.textContent = 'Fit';
        if (zoomPct)  zoomPct.style.display  = 'none';
        if (zoomSign) zoomSign.style.display = 'none';
        updatePreviewSize();
    } else if (mode === 'original') {
        S.previewZoom = 1;
        previewContent.style.transform = '';
        previewContent.style.transformOrigin = '';
        zoomDisplay.textContent = '100%';
        if (zoomPct)  zoomPct.style.display  = 'none';
        if (zoomSign) zoomSign.style.display = 'none';
        updatePreviewSize();
    } else if (mode === 'cover') {
        S.previewZoom = 1;
        previewContent.style.transform = '';
        previewContent.style.transformOrigin = '';
        zoomDisplay.textContent = 'Cover';
        if (zoomPct)  zoomPct.style.display  = 'none';
        if (zoomSign) zoomSign.style.display = 'none';
        updatePreviewSize();
    } else {
        const scale = Math.max(0.1, Math.min(8, pct / 100));
        S.previewZoom = scale;
        previewContent.style.transform = `scale(${scale})`;
        zoomDisplay.textContent = Math.round(scale * 100) + '%';
        if (zoomPct) zoomPct.value = Math.round(scale * 100);
        updatePreviewSize();
    }
}

export function updatePreviewSize() {
    const resVal = _cb.getResolution();
    const parts  = resVal.split('x').map(Number);
    const resW   = parts[0] || 1920;
    const resH   = parts[1] || 1080;

    const { previewInner, previewContent, previewMediaWrap, previewContentNext, transOverlayEl, subContainer } = _dom;

    const crop  = S.canvasCrop;
    const cropSx = (crop && crop.resW) ? resW / crop.resW : 1;
    const cropSy = (crop && crop.resH) ? resH / crop.resH : 1;
    const viewW  = (crop && crop.w > 0) ? Math.round(crop.w * cropSx) : resW;
    const viewH  = (crop && crop.h > 0) ? Math.round(crop.h * cropSy) : resH;

    let w, h;
    if (S.previewMode === 'original') {
        w = viewW; h = viewH;
    } else {
        const cW = previewInner.clientWidth  || 640;
        const cH = previewInner.clientHeight || 360;
        const sc = S.previewMode === 'cover'
            ? Math.max(cW / viewW, cH / viewH)
            : Math.min(cW / viewW, cH / viewH);
        w = Math.floor(viewW * sc);
        h = Math.floor(viewH * sc);
    }
    previewContent.style.width  = w + 'px';
    previewContent.style.height = h + 'px';
    S.previewH = h;
    S.previewW = w;

    if (crop && crop.w > 0 && crop.h > 0) {
        const scale = w / viewW;
        if (previewMediaWrap) {
            previewMediaWrap.style.left   = (-Math.round(crop.x * scale)) + 'px';
            previewMediaWrap.style.top    = (-Math.round(crop.y * scale)) + 'px';
            previewMediaWrap.style.right  = 'auto';
            previewMediaWrap.style.bottom = 'auto';
            previewMediaWrap.style.width  = Math.round(resW * scale) + 'px';
            previewMediaWrap.style.height = Math.round(resH * scale) + 'px';
        }
    } else if (previewMediaWrap) {
        previewMediaWrap.style.left = previewMediaWrap.style.top = '';
        previewMediaWrap.style.right = previewMediaWrap.style.bottom = '';
        previewMediaWrap.style.width = previewMediaWrap.style.height = '';
    }

    if (previewContentNext) {
        const iW   = previewInner.clientWidth  || 640;
        const iH   = previewInner.clientHeight || 360;
        const left = Math.floor((iW - w) / 2);
        const top  = Math.floor((iH - h) / 2);
        previewContentNext.style.width  = w + 'px';
        previewContentNext.style.height = h + 'px';
        previewContentNext.style.left   = left + 'px';
        previewContentNext.style.top    = top  + 'px';
        if (transOverlayEl) {
            transOverlayEl.style.width  = w + 'px';
            transOverlayEl.style.height = h + 'px';
            transOverlayEl.style.left   = left + 'px';
            transOverlayEl.style.top    = top  + 'px';
        }
        if (subContainer) {
            subContainer.style.width  = w + 'px';
            subContainer.style.height = h + 'px';
            subContainer.style.left   = left + 'px';
            subContainer.style.top    = top  + 'px';
        }
    }
}
