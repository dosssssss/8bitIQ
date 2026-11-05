/**
 * 8bitIQ Settings Application
 * Retro 8-bit sound synth, screen navigation, and persistent settings
 */

(function () {
  'use strict';

  // --- Sound Synthesizer (Web Audio API) ---
  let audioCtx = null;

  function getAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playRetroBeep(type = 'click') {
    try {
      const sfxVol = parseInt(document.getElementById('slider-sfx')?.value || '80', 10) / 100;
      if (sfxVol <= 0) return;

      const ctx = getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;

      if (type === 'click') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.05);
        gain.gain.setValueAtTime(0.12 * sfxVol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === 'toggle') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.setValueAtTime(880, now + 0.04); // A5
        gain.gain.setValueAtTime(0.15 * sfxVol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'switch') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(640, now + 0.08);
        gain.gain.setValueAtTime(0.1 * sfxVol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'danger') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.linearRampToValueAtTime(110, now + 0.15);
        gain.gain.setValueAtTime(0.2 * sfxVol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      }
    } catch {
      // Audio autoplay policy fallback
    }
  }

  // --- Toast Notifications ---
  let toastTimer = null;
  function showToast(msg) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2200);
  }

  // --- View Navigation ---
  const views = document.querySelectorAll('.view-panel');

  function switchView(targetId) {
    views.forEach((v) => {
      if (v.id === targetId) {
        v.classList.add('active');
      } else {
        v.classList.remove('active');
      }
    });

    playRetroBeep('switch');
  }

  // Nav items inside screens
  document.querySelectorAll('[data-nav]').forEach((el) => {
    el.addEventListener('click', () => {
      const target = el.getAttribute('data-nav');
      if (target) switchView(target);
    });
  });

  // Back buttons inside headers
  document.querySelectorAll('.btn-back').forEach((btn) => {
    btn.addEventListener('click', () => {
      switchView('view-settings-all');
    });
  });

  // Bottom Nav Settings button
  document.getElementById('nav-settings')?.addEventListener('click', () => {
    switchView('view-settings-all');
  });

  // --- Sliders Progress Fill ---
  function updateSliderFill(slider) {
    if (!slider) return;
    const val = slider.value;
    const min = slider.min || 0;
    const max = slider.max || 100;
    const percent = ((val - min) / (max - min)) * 100;
    slider.style.background = `linear-gradient(to right, #00efa0 0%, #00efa0 ${percent}%, #092147 ${percent}%, #092147 100%)`;
  }

  const musicSlider = document.getElementById('slider-music');
  const sfxSlider = document.getElementById('slider-sfx');

  if (musicSlider) {
    updateSliderFill(musicSlider);
    musicSlider.addEventListener('input', () => {
      updateSliderFill(musicSlider);
      saveSetting('musicVol', musicSlider.value);
    });
  }

  if (sfxSlider) {
    updateSliderFill(sfxSlider);
    sfxSlider.addEventListener('input', () => {
      updateSliderFill(sfxSlider);
      saveSetting('sfxVol', sfxSlider.value);
      playRetroBeep('click');
    });
  }

  // --- Difficulty Segmented Control ---
  const diffBtns = document.querySelectorAll('#difficulty-group .segmented-btn');
  diffBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      diffBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      saveSetting('difficulty', btn.dataset.diff);
      playRetroBeep('click');
      showToast(`Difficulty set to ${btn.dataset.diff}`);
    });
  });

  // --- Visibility Segmented Control ---
  const visBtns = document.querySelectorAll('#visibility-group .segmented-btn');
  visBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      visBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      saveSetting('profileVisibility', btn.dataset.vis);
      playRetroBeep('click');
      showToast(`Visibility set to ${btn.dataset.vis}`);
    });
  });

  // --- Switches & Toggles Sound & Storage ---
  const toggleMap = [
    { id: 'toggle-vibration', key: 'vibration' },
    { id: 'toggle-question-timer', key: 'questionTimer' },
    { id: 'toggle-hints', key: 'showHints' },
    { id: 'toggle-auto-next', key: 'autoNext' },
    { id: 'toggle-push-notif', key: 'pushNotif' },
    { id: 'toggle-news', key: 'newsNotif' },
    { id: 'toggle-rank', key: 'rankWarning' },
    { id: 'toggle-dnd', key: 'dnd' },
    { id: 'toggle-2fa', key: 'twoFactor' },
    { id: 'toggle-show-leaderboard', key: 'showOnLeaderboard' },
  ];

  toggleMap.forEach(({ id, key }) => {
    const el = document.getElementById(id);
    if (!el) return;

    // Load saved state
    const saved = localStorage.getItem(`8bitiq_setting_${key}`);
    if (saved !== null) {
      el.checked = saved === 'true';
    }

    el.addEventListener('change', () => {
      localStorage.setItem(`8bitiq_setting_${key}`, el.checked);
      playRetroBeep('toggle');
      if (el.checked && id === 'toggle-vibration' && navigator.vibrate) {
        navigator.vibrate(40);
      }
    });
  });

  function saveSetting(key, val) {
    try {
      localStorage.setItem(`8bitiq_setting_${key}`, val);
    } catch {
      // LocalStorage access fallback
    }
  }

  // --- Language Selector ---
  const langHeader = document.getElementById('lang-toggle-header');
  const langList = document.getElementById('lang-options-list');
  const langLabel = document.getElementById('selected-lang-label');
  const langRows = document.querySelectorAll('.lang-option-row');

  langHeader?.addEventListener('click', () => {
    const isHidden = langList.style.display === 'none';
    langList.style.display = isHidden ? 'block' : 'none';
    playRetroBeep('click');
  });

  langRows.forEach((row) => {
    row.addEventListener('click', () => {
      langRows.forEach((r) => r.classList.remove('selected'));
      row.classList.add('selected');
      const lang = row.dataset.lang;
      if (langLabel) langLabel.textContent = lang;
      saveSetting('language', lang);
      playRetroBeep('click');
      showToast(`Language: ${lang}`);
    });
  });

  // --- Modals Logic ---
  function openModal(id) {
    const m = document.getElementById(id);
    if (m) {
      m.classList.add('open');
      playRetroBeep('switch');
    }
  }

  function closeModal(m) {
    if (m) {
      m.classList.remove('open');
      playRetroBeep('click');
    }
  }

  // Action rows
  document.getElementById('btn-change-password')?.addEventListener('click', () => openModal('modal-change-password'));
  document.getElementById('btn-delete-account')?.addEventListener('click', () => openModal('modal-delete-account'));
  document.getElementById('btn-edit-dnd')?.addEventListener('click', () => openModal('modal-edit-dnd'));

  // Close buttons
  document.querySelectorAll('.btn-close-modal, .btn-modal-close-action').forEach((btn) => {
    btn.addEventListener('click', () => {
      const modal = btn.closest('.modal-overlay');
      closeModal(modal);
    });
  });

  // Close modal on click outside
  document.querySelectorAll('.modal-overlay').forEach((m) => {
    m.addEventListener('click', (e) => {
      if (e.target === m) closeModal(m);
    });
  });

  // Confirm password update
  document.getElementById('btn-save-password')?.addEventListener('click', () => {
    const curr = document.getElementById('input-curr-pwd')?.value;
    const next = document.getElementById('input-new-pwd')?.value;
    if (!next) {
      showToast('Please enter new password');
      return;
    }
    closeModal(document.getElementById('modal-change-password'));
    showToast('Password updated successfully');
  });

  // Confirm delete account
  document.getElementById('btn-confirm-delete')?.addEventListener('click', () => {
    closeModal(document.getElementById('modal-delete-account'));
    playRetroBeep('danger');
    showToast('Account scheduled for deletion');
  });

  // Save DND Schedule
  document.getElementById('btn-save-dnd')?.addEventListener('click', () => {
    const start = document.getElementById('input-dnd-start')?.value || '10:00 PM';
    const end = document.getElementById('input-dnd-end')?.value || '9:00 AM';
    const combined = `${start} TO ${end}`;
    const txt = document.getElementById('dnd-time-text');
    if (txt) txt.textContent = combined;
    saveSetting('dndSchedule', combined);
    closeModal(document.getElementById('modal-edit-dnd'));
    showToast('Quiet hours updated');
  });

  // Check backend health without interfering
  fetch('/api/health')
    .then((r) => r.json())
    .then((data) => {
      if (data && data.success) {
        console.log('[8bitIQ] Backend connection healthy');
      }
    })
    .catch(() => {
      // Standalone static mode
    });

})();
