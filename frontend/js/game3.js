/**
 * 8bitIQ - Game 3: Emoji Match
 * Pixel-perfect 4x4 retro matching game matching Figma Phase 4 mockups
 */

(function () {
  'use strict';

  // --- SVG Pixel Art Icons (16x16 pixel grid) ---
  const EMOJI_ICONS = {
    // 1. Nerd / Glasses Face
    'glasses-face': `
      <svg viewBox="0 0 24 24">
        <!-- Head outline -->
        <path d="M7 2h10v2h4v4h1v8h-1v4h-4v2H7v-2H3v-4H2V8h1V4h4V2z" fill="none" stroke="currentColor" stroke-width="2"/>
        <!-- Glasses Left Frame -->
        <rect x="5" y="8" width="5" height="5" fill="none" stroke="currentColor" stroke-width="2"/>
        <!-- Glasses Right Frame -->
        <rect x="14" y="8" width="5" height="5" fill="none" stroke="currentColor" stroke-width="2"/>
        <!-- Glasses Bridge -->
        <line x1="10" y1="10" x2="14" y2="10" stroke="currentColor" stroke-width="2"/>
        <!-- Eyes inside frames -->
        <rect x="7" y="10" width="1" height="1" fill="currentColor"/>
        <rect x="16" y="10" width="1" height="1" fill="currentColor"/>
        <!-- Neutral line mouth -->
        <line x1="9" y1="17" x2="15" y2="17" stroke="currentColor" stroke-width="2"/>
      </svg>
    `,

    // 2. Crown
    'crown': `
      <svg viewBox="0 0 24 24">
        <!-- 3-peaked Crown -->
        <path d="M3 8l3 5 6-7 6 7 3-5v11H3V8z" fill="currentColor"/>
        <!-- Base bar -->
        <rect x="2" y="19" width="20" height="2" fill="currentColor"/>
        <!-- Top Jewels -->
        <rect x="2" y="6" width="2" height="2" fill="currentColor"/>
        <rect x="11" y="4" width="2" height="2" fill="currentColor"/>
        <rect x="20" y="6" width="2" height="2" fill="currentColor"/>
      </svg>
    `,

    // 3. Crying Face
    'crying-face': `
      <svg viewBox="0 0 24 24">
        <!-- Head outline -->
        <path d="M7 2h10v2h4v4h1v8h-1v4h-4v2H7v-2H3v-4H2V8h1V4h4V2z" fill="none" stroke="currentColor" stroke-width="2"/>
        <!-- Closed sad eyes -->
        <path d="M5 8h4 M15 8h4" stroke="currentColor" stroke-width="2"/>
        <!-- Teardrops streaming down -->
        <path d="M6 10v7h2v-7H6z M16 10v7h2v-7h-2z" fill="currentColor"/>
        <!-- Downturned open mouth -->
        <path d="M9 19c0-2 2-3 3-3s3 1 3 3H9z" fill="currentColor"/>
      </svg>
    `,

    // 4. Skull Heart
    'skull-heart': `
      <svg viewBox="0 0 24 24">
        <!-- Heart Silhouette -->
        <path d="M12 21l-8.5-8.5C1.5 10.5 2 6 6 4.5c3-1 5 1 6 3 1-2 3-4 6-3 4 1.5 4.5 6 2.5 8L12 21z" fill="currentColor"/>
        <!-- Inverted Dark Skull Face inside -->
        <!-- Eyes -->
        <rect x="7.5" y="9" width="3" height="3" fill="#020a1c"/>
        <rect x="13.5" y="9" width="3" height="3" fill="#020a1c"/>
        <!-- Nose -->
        <rect x="11" y="13" width="2" height="2" fill="#020a1c"/>
        <!-- Teeth -->
        <rect x="9.5" y="16" width="1.5" height="2" fill="#020a1c"/>
        <rect x="13" y="16" width="1.5" height="2" fill="#020a1c"/>
      </svg>
    `,

    // 5. Broken Heart
    'broken-heart': `
      <svg viewBox="0 0 24 24">
        <!-- Left Half -->
        <path d="M11 4.2C8 3 5 4.5 3.5 7.5c-2 4 1 8 7.5 13.5v-3l2-3-3-3 2-3-2-2 1-1.8z" fill="currentColor"/>
        <!-- Right Half -->
        <path d="M13 4.2C16 3 19 4.5 20.5 7.5c2 4-1 8-7.5 13.5v-3l-2-3 3-3-2-3 2-2-1-1.8z" fill="currentColor"/>
      </svg>
    `,

    // 6. Electric Guitar
    'guitar': `
      <svg viewBox="0 0 24 24">
        <!-- Angled Neck & Headstock -->
        <path d="M18 2l4 4-2 2-1-1-6 6 1 1-2 2-1-1-3 3c-3 0-5 3-5 5 0 2 2 4 4 4 2 0 5-2 5-5l3-3-1-1 2-2 1 1 6-6-1-1 2-2z" fill="currentColor"/>
        <circle cx="9" cy="18" r="1.5" fill="#020a1c"/>
      </svg>
    `,

    // 7. Ghost
    'ghost': `
      <svg viewBox="0 0 24 24">
        <!-- Retro Arcade Ghost -->
        <path d="M5 10c0-4 3-7 7-7s7 3 7 7v10l-2.5-2.5L14 20l-2-2.5L10 20l-2.5-2.5L5 20V10z" fill="currentColor"/>
        <!-- Ghost eyes -->
        <rect x="8" y="9" width="2.5" height="3" fill="#020a1c"/>
        <rect x="13.5" y="9" width="2.5" height="3" fill="#020a1c"/>
      </svg>
    `,

    // 8. Plain Solid Heart
    'plain-heart': `
      <svg viewBox="0 0 24 24">
        <path d="M12 21.5l-9-9C1 10.5 1.5 5.5 6 4c3.5-1 5 1.5 6 3.5 1-2 2.5-4.5 6-3.5 4.5 1.5 5 6.5 3 8.5l-9 9z" fill="currentColor"/>
      </svg>
    `
  };

  // --- Sound Synthesizer (Web Audio API) ---
  let audioCtx = null;

  function getAudioCtx() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) audioCtx = new AudioContextClass();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playSound(type) {
    try {
      const ctx = getAudioCtx();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'flip') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(780, now + 0.05);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === 'match') {
        // High ascending 2-tone chime
        osc.type = 'square';
        osc.frequency.setValueAtTime(659.25, now); // E5
        osc.frequency.setValueAtTime(880, now + 0.07); // A5
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
        osc.start(now);
        osc.stop(now + 0.16);
      } else if (type === 'miss') {
        // Low buzzy mismatch
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.linearRampToValueAtTime(140, now + 0.18);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.start(now);
        osc.stop(now + 0.18);
      } else if (type === 'clear') {
        // Triumphant 3-chord fanfare
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = 'square';
          o.frequency.setValueAtTime(freq, now + idx * 0.08);
          g.gain.setValueAtTime(0.12, now + idx * 0.08);
          g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.18);
          o.connect(g);
          g.connect(ctx.destination);
          o.start(now + idx * 0.08);
          o.stop(now + idx * 0.08 + 0.2);
        });
      }
    } catch {
      // Audio autoplay policy fallback
    }
  }

  // --- Game State ---
  const state = {
    sessionId: null,
    score: 200,
    timeRemaining: 180, // 3 minutes = 03:00
    streak: 0,
    bestStreak: 0,
    gamesCompleted: 3,
    pairsFound: 0,
    misses: 0,
    flippedCards: [],
    lockBoard: false,
    timerInterval: null,
    isFinished: false
  };

  // 8 Pairs (16 cards total)
  const EMOJI_KEYS = [
    'glasses-face',
    'crown',
    'crying-face',
    'skull-heart',
    'broken-heart',
    'guitar',
    'ghost',
    'plain-heart'
  ];

  // DOM Elements
  const gridEl = document.getElementById('emoji-tile-grid');
  const timeHudEl = document.getElementById('hud-time-val');
  const scoreHudEl = document.getElementById('hud-score-val');
  const streakHudEl = document.getElementById('hud-streak-val');
  const gamesHudEl = document.getElementById('hud-games-val');
  const pairsFoundTextEl = document.getElementById('pairs-found-text');
  const clockDisplayEl = document.getElementById('digital-clock');
  const progressBarEl = document.getElementById('progress-bar');
  const playingFooterEl = document.getElementById('playing-footer');
  const finishFooterEl = document.getElementById('finish-footer');
  const clearedBannerEl = document.getElementById('board-cleared-banner');
  const statsSummaryEl = document.getElementById('stats-summary-block');
  const instructionsSubtextEl = document.getElementById('instructions-subtext');

  // Format MM:SS
  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  function formatShortTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  function formatScore(score) {
    return `${score < 1000 ? '0' : ''}${score}`;
  }

  // Update UI Elements
  function updateHud() {
    if (timeHudEl) timeHudEl.textContent = `TIME ${formatTime(state.timeRemaining)}`;
    if (scoreHudEl) scoreHudEl.textContent = `SCORE ${formatScore(state.score)}`;
    if (streakHudEl) streakHudEl.textContent = `STREAK x${state.streak}`;
    if (gamesHudEl) gamesHudEl.textContent = `GAMES ${state.gamesCompleted}`;
    if (pairsFoundTextEl) pairsFoundTextEl.textContent = `PAIRS FOUND ${state.pairsFound}/8`;
    if (clockDisplayEl) clockDisplayEl.textContent = formatShortTime(state.timeRemaining);

    // Progress bar fill based on pairs found or time
    if (progressBarEl) {
      const percent = Math.min(100, Math.max(10, (state.pairsFound / 8) * 100));
      progressBarEl.style.width = `${percent}%`;
    }
  }

  // Shuffle array (Fisher-Yates)
  function shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // Setup / Reset Cards Grid
  function buildGrid() {
    gridEl.innerHTML = '';
    state.flippedCards = [];
    state.lockBoard = false;
    state.pairsFound = 0;
    state.misses = 0;
    state.streak = 0;
    state.bestStreak = 0;
    state.isFinished = false;

    // Duplicate each key to make 16 cards (8 pairs)
    const cardDeck = shuffle([...EMOJI_KEYS, ...EMOJI_KEYS]);

    cardDeck.forEach((key, idx) => {
      const tile = document.createElement('div');
      tile.className = 'tile';
      tile.dataset.key = key;
      tile.dataset.index = idx;

      tile.innerHTML = `
        <span class="tile-question">?</span>
        <div class="tile-emoji">${EMOJI_ICONS[key]}</div>
      `;

      tile.addEventListener('click', () => handleTileClick(tile));
      gridEl.appendChild(tile);
    });

    updateHud();
  }

  // Handle Tile Click
  function handleTileClick(tile) {
    if (state.lockBoard || state.isFinished) return;
    if (tile.classList.contains('revealed') || tile.classList.contains('matched')) return;

    // Reveal tile
    tile.classList.add('revealed');
    playSound('flip');
    state.flippedCards.push(tile);

    if (state.flippedCards.length === 2) {
      checkForMatch();
    }
  }

  // Check if 2 flipped tiles match
  function checkForMatch() {
    state.lockBoard = true;
    const [card1, card2] = state.flippedCards;
    const isMatch = card1.dataset.key === card2.dataset.key;

    if (isMatch) {
      // SUCCESS MATCH
      setTimeout(() => {
        card1.classList.remove('revealed');
        card2.classList.remove('revealed');
        card1.classList.add('matched');
        card2.classList.add('matched');

        state.pairsFound += 1;
        state.streak += 1;
        if (state.streak > state.bestStreak) {
          state.bestStreak = state.streak;
        }
        state.score += 200;

        playSound('match');
        state.flippedCards = [];
        state.lockBoard = false;
        updateHud();

        // Check if all 8 pairs found (Board Cleared!)
        if (state.pairsFound === 8) {
          handleBoardCleared();
        }
      }, 250);
    } else {
      // MISMATCH
      setTimeout(() => {
        // Red glowing border on both cards
        card1.classList.add('mismatch');
        card2.classList.add('mismatch');
        playSound('miss');

        state.streak = 0;
        state.misses += 1;
        updateHud();

        // Wait ~700ms and flip back
        setTimeout(() => {
          card1.classList.remove('revealed', 'mismatch');
          card2.classList.remove('revealed', 'mismatch');
          state.flippedCards = [];
          state.lockBoard = false;
        }, 700);
      }, 250);
    }
  }

  // Win State: Board Cleared (Image 4 Right)
  function handleBoardCleared() {
    state.isFinished = true;
    clearInterval(state.timerInterval);
    playSound('clear');

    // Notify backend
    if (state.sessionId) {
      fetch('/api/game/result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: state.sessionId,
          game: 'game3',
          success: true
        })
      })
        .then((r) => r.json())
        .then((data) => {
          if (data && data.score) {
            state.score = data.score;
          }
        })
        .catch(() => {
          // offline fallback
        });
    }

    // Switch View Elements to Finish Mode (Image 4 Right)
    if (clearedBannerEl) clearedBannerEl.style.display = 'block';
    if (statsSummaryEl) {
      statsSummaryEl.style.display = 'flex';
      document.getElementById('summary-score').textContent = state.score;
      document.getElementById('summary-time').textContent = formatShortTime(state.timeRemaining);
      document.getElementById('summary-best-streak').textContent = state.bestStreak;
      document.getElementById('summary-misses').textContent = state.misses;
    }

    if (instructionsSubtextEl) instructionsSubtextEl.style.display = 'none';
    if (playingFooterEl) playingFooterEl.style.display = 'none';
    if (finishFooterEl) finishFooterEl.style.display = 'block';

    updateHud();
  }

  // Start 1-second countdown clock
  function startTimer() {
    clearInterval(state.timerInterval);
    state.timerInterval = setInterval(() => {
      if (state.timeRemaining > 0 && !state.isFinished) {
        state.timeRemaining -= 1;
        updateHud();
      } else if (state.timeRemaining <= 0) {
        clearInterval(state.timerInterval);
        handleTimeOut();
      }
    }, 1000);
  }

  function handleTimeOut() {
    state.isFinished = true;
    playSound('miss');
    alert('Time is up!');
  }

  // Backend Game Session Setup
  function initGameSession() {
    fetch('/api/game/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId: 'player1' })
    })
      .then((r) => r.json())
      .then((data) => {
        if (data && data.success) {
          state.sessionId = data.sessionId;
          if (data.timeRemaining) state.timeRemaining = data.timeRemaining;
          if (data.score !== undefined) state.score = data.score;
          updateHud();
        }
      })
      .catch(() => {
        // Offline / standalone mode
      });
  }

  // Reset Game
  function resetGame() {
    if (clearedBannerEl) clearedBannerEl.style.display = 'none';
    if (statsSummaryEl) statsSummaryEl.style.display = 'none';
    if (instructionsSubtextEl) instructionsSubtextEl.style.display = 'block';
    if (playingFooterEl) playingFooterEl.style.display = 'flex';
    if (finishFooterEl) finishFooterEl.style.display = 'none';

    state.timeRemaining = 180;
    state.gamesCompleted += 1;
    buildGrid();
    startTimer();
  }

  // Button Listeners
  document.getElementById('btn-exit-game')?.addEventListener('click', () => {
    window.location.href = 'index.html';
  });

  document.getElementById('btn-next-game')?.addEventListener('click', () => {
    try {
      localStorage.setItem('8bitiq_score', state.score);
      localStorage.setItem('8bitiq_streak', state.streak);
      if (state.sessionId) localStorage.setItem('8bitiq_session_id', state.sessionId);
    } catch {
      // Storage fallback
    }
    window.location.href = 'game4.html';
  });

  // Init Game
  buildGrid();
  startTimer();
  initGameSession();

})();
