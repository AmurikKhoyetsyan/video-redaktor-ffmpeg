// Extracted from image-video.js — do not edit logic
export const TRANSITIONS = [
    { value: 'none', label: 'Нет' }, { value: 'fade', label: 'Fade' },
    { value: 'crossfade', label: 'Cross Fade' }, { value: 'dissolve', label: 'Dissolve' },
    { value: 'fadeblack', label: 'Fade Black' }, { value: 'fadewhite', label: 'Fade White' },
    { value: 'slideleft', label: 'Slide Left' }, { value: 'slideright', label: 'Slide Right' },
    { value: 'slideup', label: 'Slide Up' }, { value: 'slidedown', label: 'Slide Down' },
    { value: 'wipeleft', label: 'Wipe Left' }, { value: 'wiperight', label: 'Wipe Right' },
    { value: 'wipeup', label: 'Wipe Up' }, { value: 'wipedown', label: 'Wipe Down' },
    { value: 'zoomin', label: 'Zoom In' }, { value: 'pixelize', label: 'Pixelize' },
    { value: 'hblur', label: 'Blur' }, { value: 'circlecrop', label: 'Circle' },
    { value: 'radial', label: 'Radial' }, { value: 'fadegrays', label: 'Fade Grays' },
    { value: 'hlslice', label: 'H Slice' }, { value: 'vuslice', label: 'V Slice' },
];

// Color/filter effects applied per-clip (brightness, blur, etc.)
export const EFFECTS_DEF = [
    // Basic adjustments
    { key: 'brightness', label: 'Яркость',    min: -100, max: 100, step: 1,   def: 0, category: 'basic' },
    { key: 'contrast',   label: 'Контраст',   min: -100, max: 100, step: 1,   def: 0, category: 'basic' },
    { key: 'saturation', label: 'Насыщение',  min: -100, max: 100, step: 1,   def: 0, category: 'basic' },
    { key: 'exposure',   label: 'Экспозиция', min: -100, max: 100, step: 1,   def: 0, category: 'basic' },
    { key: 'gamma',      label: 'Гамма',      min: -50,  max: 50,  step: 1,   def: 0, category: 'basic' },
    { key: 'temperature',label: 'Темп-ра',    min: -100, max: 100, step: 1,   def: 0, category: 'basic' },
    // Detail
    { key: 'blur',       label: 'Размытие',   min: 0,    max: 20,  step: 0.5, def: 0, category: 'detail' },
    { key: 'sharpen',    label: 'Резкость',   min: 0,    max: 50,  step: 1,   def: 0, category: 'detail' },
    // Style
    { key: 'filmgrain',  label: 'Зернист.',   min: 0,    max: 50,  step: 1,   def: 0, category: 'style' },
    { key: 'noise',      label: 'Шум',        min: 0,    max: 50,  step: 1,   def: 0, category: 'style' },
    // Toggle effects
    { key: 'grayscale',  label: 'Ч/Б',        toggle: true, def: 0, category: 'toggle' },
    { key: 'sepia',      label: 'Сепия',      toggle: true, def: 0, category: 'toggle' },
    { key: 'vignette',   label: 'Виньетка',   toggle: true, def: 0, category: 'toggle' },
    { key: 'invert',     label: 'Инверсия',   toggle: true, def: 0, category: 'toggle' },
    { key: 'vintage',    label: 'Винтаж',     toggle: true, def: 0, category: 'toggle' },
    { key: 'noir',       label: 'Нуар',       toggle: true, def: 0, category: 'toggle' },
];

export const FONTS = ['Arial', 'Times New Roman', 'Georgia', 'Courier New', 'Verdana', 'Impact', 'Trebuchet MS'];
export const ANIMS = ['none', 'fade-in', 'fade-out', 'slide-up', 'slide-down', 'typewriter', 'zoom-in'];

// Unified effects list used for BOTH start and end of clips
export const CLIP_EFFECTS = [
    { value: 'none',        label: 'Нет',          category: 'appearance' },
    { value: 'fade',        label: 'Fade',          category: 'appearance' },
    { value: 'zoom-in',     label: 'Zoom In',       category: 'appearance' },
    { value: 'zoom-out',    label: 'Zoom Out',      category: 'appearance' },
    { value: 'pop',         label: 'Pop',           category: 'appearance' },
    { value: 'bounce',      label: 'Bounce',        category: 'appearance' },
    { value: 'elastic',     label: 'Elastic',       category: 'appearance' },
    { value: 'slide-left',  label: 'Slide Left',    category: 'movement' },
    { value: 'slide-right', label: 'Slide Right',   category: 'movement' },
    { value: 'slide-up',    label: 'Slide Up',      category: 'movement' },
    { value: 'slide-down',  label: 'Slide Down',    category: 'movement' },
    { value: 'blur',        label: 'Blur',          category: 'special' },
    { value: 'rotate',      label: 'Rotate',        category: 'special' },
    { value: 'flip-h',      label: 'Flip H',        category: 'special' },
    { value: 'flip-v',      label: 'Flip V',        category: 'special' },
    { value: 'center',      label: 'Center',        category: 'special' },
];

// Keep old arrays as aliases for backwards compatibility
export const START_EFFECTS = CLIP_EFFECTS;
export const END_EFFECTS   = CLIP_EFFECTS;

// CONTINUOUS (loop) effects for video/image clips
export const CONTINUOUS_EFFECTS = [
    { value: 'none',          label: 'Нет' },
    // Ken Burns
    { value: 'ken-burns-in',  label: 'Ken Burns (приближение)' },
    { value: 'ken-burns-out', label: 'Ken Burns (удаление)' },
    { value: 'ken-burns-lr',  label: 'Ken Burns (лево→право)' },
    { value: 'ken-burns-rl',  label: 'Ken Burns (право→лево)' },
    // Scale
    { value: 'zoom-breathe',  label: 'Дыхание' },
    { value: 'pulse',         label: 'Пульсация' },
    { value: 'heartbeat',     label: 'Сердцебиение' },
    // Movement
    { value: 'shake',         label: 'Тряска' },
    { value: 'wiggle',        label: 'Покачивание' },
    { value: 'float',         label: 'Парение' },
    { value: 'drift',         label: 'Дрейф' },
    // Rotation
    { value: 'rotate-slow',   label: 'Вращение' },
    { value: 'swing',         label: 'Маятник' },
    { value: 'spin-fast',     label: 'Быстрое вращение' },
];

// Unified PIP effects list (no full-canvas slides) for BOTH start and end
export const PIP_EFFECTS = [
    { value: 'none',        label: 'Нет',          category: 'appearance' },
    { value: 'fade',        label: 'Fade',          category: 'appearance' },
    { value: 'zoom-in',     label: 'Zoom In',       category: 'appearance' },
    { value: 'zoom-out',    label: 'Zoom Out',      category: 'appearance' },
    { value: 'pop',         label: 'Pop',           category: 'appearance' },
    { value: 'bounce',      label: 'Bounce',        category: 'appearance' },
    { value: 'elastic',     label: 'Elastic',       category: 'appearance' },
    { value: 'blur',        label: 'Blur',          category: 'special' },
    { value: 'rotate',      label: 'Rotate',        category: 'special' },
    { value: 'flip-h',      label: 'Flip H',        category: 'special' },
    { value: 'flip-v',      label: 'Flip V',        category: 'special' },
    { value: 'center',      label: 'Center',        category: 'special' },
];

// Keep old aliases for backwards compatibility
export const PIP_START_EFFECTS = PIP_EFFECTS;
export const PIP_END_EFFECTS   = PIP_EFFECTS;

// PIP-specific CONTINUOUS effects
export const PIP_CONTINUOUS_EFFECTS = [
    { value: 'none',          label: 'Нет' },
    { value: 'zoom-breathe',  label: 'Дыхание' },
    { value: 'pulse',         label: 'Пульсация' },
    { value: 'heartbeat',     label: 'Сердцебиение' },
    { value: 'shake',         label: 'Тряска' },
    { value: 'wiggle',        label: 'Покачивание' },
    { value: 'float',         label: 'Парение' },
    { value: 'rotate-slow',   label: 'Вращение' },
    { value: 'swing',         label: 'Маятник' },
];

// Track type definitions for the Add Track modal
export const TRACK_TYPES = [
    { type: 'video',      icon: '🎬', label: 'Video',      desc: 'Видеоклип на основной дорожке',      action: 'upload-video' },
    { type: 'image',      icon: '🖼',  label: 'Image',      desc: 'Изображение на основной дорожке',    action: 'upload-image' },
    { type: 'audio',      icon: '🎵', label: 'Audio',      desc: 'Звуковая дорожка (музыка, голос)',    action: 'upload-audio' },
    { type: 'subtitle',   icon: '📝', label: 'Subtitle',   desc: 'Текстовые субтитры на таймлайне',    action: 'add-subtitle' },
    { type: 'pip',        icon: '📺', label: 'PIP',        desc: 'Наложение картинки/видео поверх',    action: 'upload-pip' },
    { type: 'effect',     icon: '✨', label: 'Effect',     desc: 'Визуальный эффект для всего видео',  action: 'add-effect' },
    { type: 'overlay',    icon: '🎨', label: 'Overlay',    desc: 'Полупрозрачный слой/наложение',     action: 'upload-overlay' },
    { type: 'background', icon: '🌄', label: 'Background', desc: 'Фоновое изображение или видео',      action: 'upload-background' },
];
