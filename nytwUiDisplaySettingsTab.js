import { saveSettingsDebounced } from '../../../../script.js';
import { queueApplyFonts, scheduleScan } from './nytwCore.js';
import { clampStreamAnimSpeed, normalizeStreamAnimEffect, normalizeStreamRenderMode, settings } from './nytwState.js';

export function initDisplaySettingsTab() {
    const renderModeSelectEls = [
        document.getElementById('nytw_stream_render_mode_display'),
        // Backward compatibility: older layouts used these IDs in other tabs.
        document.getElementById('nytw_stream_render_mode_settings'),
        document.getElementById('nytw_stream_render_mode_import'),
    ].filter((el) => el instanceof HTMLSelectElement);

    const syncRenderModeUi = (mode) => {
        const normalized = normalizeStreamRenderMode(mode);
        renderModeSelectEls.forEach((el) => { el.value = normalized; });

        // Sync Segmented Control UI
        const controlContainer = document.getElementById('nytw_render_mode_control');
        if (controlContainer) {
            const options = controlContainer.querySelectorAll('.nytw-segment-option');
            options.forEach(opt => {
                if (opt.dataset.value === normalized) {
                    opt.classList.add('active');
                } else {
                    opt.classList.remove('active');
                }
            });
        }
    };

    const streamAnimSectionEl = document.getElementById('nytw_stream_anim_section');
    const streamAnimHintEl = document.getElementById('nytw_stream_anim_hint');
    const streamAnimEffectEl = document.getElementById('nytw_stream_anim_effect');
    const streamAnimSpeedRowEl = document.getElementById('nytw_stream_anim_speed_row');
    const streamAnimSpeedEl = document.getElementById('nytw_stream_anim_speed');
    const streamAnimSpeedValueEl = document.getElementById('nytw_stream_anim_speed_value');
    const streamAnimCursorRowEl = document.getElementById('nytw_stream_anim_cursor_row');
    const streamAnimCursorEl = document.getElementById('nytw_stream_anim_cursor');

    const syncStreamAnimUi = () => {
        const mode = normalizeStreamRenderMode(settings.streamRenderMode);
        const isBuffer = mode === 'buffer';

        if (streamAnimSectionEl) {
            streamAnimSectionEl.classList.toggle('is-disabled', !isBuffer);
        }

        const effect = normalizeStreamAnimEffect(settings.streamAnimEffect);
        if (streamAnimEffectEl instanceof HTMLSelectElement) {
            streamAnimEffectEl.value = effect;
        }

        const showTypewriter = effect === 'typewriter';
        if (streamAnimSpeedRowEl) streamAnimSpeedRowEl.style.display = showTypewriter ? '' : 'none';
        if (streamAnimCursorRowEl) streamAnimCursorRowEl.style.display = showTypewriter ? '' : 'none';

        const speed = clampStreamAnimSpeed(settings.streamAnimSpeed);
        if (streamAnimSpeedEl instanceof HTMLInputElement) {
            streamAnimSpeedEl.value = String(speed);
        }
        if (streamAnimSpeedValueEl) {
            streamAnimSpeedValueEl.textContent = `${speed}ms/字`;
        }

        if (streamAnimCursorEl instanceof HTMLInputElement) {
            streamAnimCursorEl.checked = Boolean(settings.streamAnimCursor);
        }

        if (streamAnimHintEl) {
            streamAnimHintEl.textContent = isBuffer
                ? '仅作用于正在生成的流式消息；不额外增加复杂监听。'
                : '切换为“实时显示”后可启用流式动画效果。';
        }
    };

    const applyRenderMode = (mode) => {
        settings.streamRenderMode = normalizeStreamRenderMode(mode);
        syncRenderModeUi(settings.streamRenderMode);
        syncStreamAnimUi();
        saveSettingsDebounced();
        queueApplyFonts();
        scheduleScan({ full: true });
    };

    syncRenderModeUi(settings.streamRenderMode);
    syncStreamAnimUi();
    
    // Listeners for Select elements
    renderModeSelectEls.forEach((el) => {
        el.addEventListener('change', () => applyRenderMode(el.value));
    });

    // Listeners for Segmented Control
    const controlContainer = document.getElementById('nytw_render_mode_control');
    if (controlContainer) {
        const options = controlContainer.querySelectorAll('.nytw-segment-option');
        options.forEach(opt => {
            opt.addEventListener('click', () => {
                applyRenderMode(opt.dataset.value);
            });
        });
    }

    // Stream animation controls
    if (streamAnimEffectEl instanceof HTMLSelectElement) {
        streamAnimEffectEl.addEventListener('change', () => {
            settings.streamAnimEffect = normalizeStreamAnimEffect(streamAnimEffectEl.value);
            syncStreamAnimUi();
            saveSettingsDebounced();
            scheduleScan({ full: false });
        });
    }

    if (streamAnimSpeedEl instanceof HTMLInputElement) {
        const updateSpeed = () => {
            const speed = clampStreamAnimSpeed(streamAnimSpeedEl.value);
            settings.streamAnimSpeed = speed;
            if (streamAnimSpeedValueEl) streamAnimSpeedValueEl.textContent = `${speed}ms/字`;
            saveSettingsDebounced();
            scheduleScan({ full: false });
        };

        streamAnimSpeedEl.addEventListener('input', updateSpeed);
        streamAnimSpeedEl.addEventListener('change', updateSpeed);
    }

    if (streamAnimCursorEl instanceof HTMLInputElement) {
        streamAnimCursorEl.addEventListener('change', () => {
            settings.streamAnimCursor = streamAnimCursorEl.checked;
            saveSettingsDebounced();
            scheduleScan({ full: false });
        });
    }
}
