/**
 * 8bitIQ - Game 4: Quick Math
 * Pixel-perfect retro math mini-game matching Figma Phase 4 mockups
 */

(function () {
  'use strict';

  // Math problems from Figma mockups
  const PROBLEMS = [
    {
      expression: '19 + 3( 3 × 3 ) =',
      options: ['46', '-41', '31', '198'],
      correct: '46',
      solution: '19 + 3( 3 × 3 )\n= 46'
    },
    {
      expression: '9 / 2 - 3 + 9(0) =',
      options: ['-9', '-1', '1.5', '24'],
      correct: '1.5',
      solution: '9 / 2 - 3 + 9(0)\n= 1.5'
    },
    {
      expression: '8 × 4 - 12 / 3 =',
      options: ['28', '20', '-4', '35'],
      correct: '28',
      solution: '8 × 4 - 12 / 3\n= 28'
    }
  ];

  // Sound Synthesizer (Web Audio API)
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

      if (type === 'click') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(660, now + 0.05);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === 'correct') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.setValueAtTime(880, now + 0.08); // A5
        gain.gain.setValueAtTime(0.14, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.start(now);
        osc.stop(now + 0.18);
      } else if (type === 'wrong') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.linearRampToValueAtTime(110, now + 0.2);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (type === 'clear') {
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

  // Load carried-over session values if present
  const storedScore = parseInt(localStorage.getItem('8bitiq_score') || '300', 10);
  const storedStreak = parseInt(localStorage.getItem('8bitiq_streak') || '0', 10);

  // Game State
  const state = {
    sessionId: localStorage.getItem('8bitiq_session_id') || null,
    score: storedScore,
    timeRemaining: 32, // 00:32 as in mockups
    streak: storedStreak,
    bestStreak: storedStreak,
    gamesCompleted: 4,
    currentProblemIndex: 0,
    misses: 0,
    lockInput: false,
    timerInterval: null,
    isFinished: false
  };

  // DOM Elements
  const hudTimeEl = document.getElementById('hud-time-val');
  const hudScoreEl = document.getElementById('hud-score-val');
  const hudStreakEl = document.getElementById('hud-streak-val');
  const hudGamesEl = document.getElementById('hud-games-val');
  const clockDisplayEl = document.getElementById('digital-clock');
  const equationTextEl = document.getElementById('math-equation-text');
  const optionsGridEl = document.getElementById('math-options-grid');
  const feedbackMsgEl = document.getElementById('feedback-message');
  const subtextEl = document.getElementById('instructions-subtext');
  const playingCardEl = document.getElementById('playing-problem-area');
  const finishCardEl = document.getElementById('finish-answers-area');
  const playingFooterEl = document.getElementById('playing-footer');
  const finishFooterEl = document.getElementById('finish-footer');

  function formatTime(secs) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  }

  function formatShortClock(secs) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  function formatScore(score) {
    return `${score < 1000 ? '0' : ''}${score}`;
  }

  function updateHud() {
    if (hudTimeEl) hudTimeEl.textContent = `TIME ${formatTime(state.timeRemaining)}`;
    if (hudScoreEl) hudScoreEl.textContent = `SCORE ${formatScore(state.score)}`;
    if (hudStreakEl) hudStreakEl.textContent = `STREAK x${state.streak}`;
    if (hudGamesEl) hudGamesEl.textContent = `GAMES ${state.gamesCompleted}`;
    if (clockDisplayEl) clockDisplayEl.textContent = formatShortClock(state.timeRemaining);
  }

  // Load Problem
  function loadProblem(index) {
    state.lockInput = false;
    const problem = PROBLEMS[index % PROBLEMS.length];

    if (equationTextEl) {
      equationTextEl.innerHTML = `${problem.expression}<span class="question-mark">?</span>`;
    }

    if (feedbackMsgEl) {
      feedbackMsgEl.textContent = '';
      feedbackMsgEl.className = 'feedback-message';
    }

    if (subtextEl) {
      subtextEl.textContent = 'Calculate the math problem';
    }

    if (optionsGridEl) {
      optionsGridEl.innerHTML = '';
      problem.options.forEach((opt) => {
        const btn = document.createElement('button');
        btn.className = 'math-option-btn';
        btn.textContent = opt;
        btn.dataset.val = opt;

        btn.addEventListener('click', () => handleOptionClick(btn, opt, problem.correct));
        optionsGridEl.appendChild(btn);
      });
    }

    updateHud();
  }

  // Handle Answer Click
  function handleOptionClick(button, selectedVal, correctVal) {
    if (state.lockInput || state.isFinished) return;
    state.lockInput = true;

    const isCorrect = selectedVal === correctVal;

    // Disable option buttons
    document.querySelectorAll('.math-option-btn').forEach((b) => b.classList.add('disabled'));

    if (isCorrect) {
      button.classList.add('correct');
      playSound('correct');

      state.score += 100;
      state.streak += 1;
      if (state.streak > state.bestStreak) {
        state.bestStreak = state.streak;
      }

      if (feedbackMsgEl) {
        feedbackMsgEl.textContent = 'CORRECT!';
        feedbackMsgEl.className = 'feedback-message correct-text';
      }

      submitResultToBackend(true);

      setTimeout(() => {
        if (state.currentProblemIndex < PROBLEMS.length - 1) {
          state.currentProblemIndex += 1;
          loadProblem(state.currentProblemIndex);
        } else {
          showFinishState();
        }
      }, 1000);
    } else {
      button.classList.add('wrong');
      playSound('wrong');

      state.streak = 0;
      state.misses += 1;

      if (feedbackMsgEl) {
        feedbackMsgEl.textContent = 'WRONG!';
        feedbackMsgEl.className = 'feedback-message wrong-text';
      }

      if (subtextEl) {
        subtextEl.textContent = 'Better luck next time!';
      }

      submitResultToBackend(false);

      setTimeout(() => {
        if (state.currentProblemIndex < PROBLEMS.length - 1) {
          state.currentProblemIndex += 1;
          loadProblem(state.currentProblemIndex);
        } else {
          showFinishState();
        }
      }, 1200);
    }

    updateHud();
  }

  // Show Time Is Up / Answers Cleared Finish State (Image 2 Right)
  function showFinishState() {
    state.isFinished = true;
    clearInterval(state.timerInterval);
    playSound('clear');

    if (playingCardEl) playingCardEl.style.display = 'none';
    if (finishCardEl) finishCardEl.style.display = 'block';

    document.getElementById('summary-score').textContent = formatScore(state.score);
    document.getElementById('summary-time').textContent = formatShortClock(state.timeRemaining);
    document.getElementById('summary-best-streak').textContent = state.bestStreak;
    document.getElementById('summary-misses').textContent = state.misses;

    if (subtextEl) subtextEl.style.display = 'none';
    if (playingFooterEl) playingFooterEl.style.display = 'none';
    if (finishFooterEl) finishFooterEl.style.display = 'block';

    updateHud();
  }

  // Countdown timer
  function startTimer() {
    clearInterval(state.timerInterval);
    state.timerInterval = setInterval(() => {
      if (state.timeRemaining > 0 && !state.isFinished) {
        state.timeRemaining -= 1;
        updateHud();
      } else if (state.timeRemaining <= 0) {
        clearInterval(state.timerInterval);
        showFinishState();
      }
    }, 1000);
  }

  // Backend Integration
  function submitResultToBackend(success) {
    if (state.sessionId) {
      fetch('/api/game/result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: state.sessionId,
          game: 'game4',
          success
        })
      })
        .then((r) => r.json())
        .then((data) => {
          if (data && data.score !== undefined) {
            state.score = data.score;
            updateHud();
          }
        })
        .catch(() => {});
    }
  }

  // Button Listeners
  document.getElementById('btn-exit-game')?.addEventListener('click', () => {
    window.location.href = 'index.html';
  });

  document.getElementById('btn-next-action')?.addEventListener('click', () => {
    // Round complete - return to settings or play again
    window.location.href = 'index.html';
  });

  // Init
  loadProblem(0);
  startTimer();

})();
