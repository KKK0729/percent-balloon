/**
 * Main Application Controller for Percent Balloon
 * Manages game state, step transitions, balloon popping loop, history/undo, and UI controls.
 */
document.addEventListener('DOMContentLoaded', () => {
    const engine = new BalloonEngine('balloon-canvas');
    const sound = window.soundEngine;

    // Game State
    const state = {
        totalQuestions: 5,
        initialBalloons: 100,
        perfectBonus: 10,
        currentQuestion: 1,
        remainingBalloons: 100,
        phase: 'SETUP', // SETUP | INPUT_ANSWER | ANSWER_LOCKED | CORRECT_REVEALED | POPPING | QUESTION_DONE | GAME_OVER | GAME_CLEAR
        currentAnswer: null,
        currentCorrect: null,
        currentRespondent: '',
        currentQuestionText: '',
        historyLogs: [],      // Completed question records
        undoSnapshots: []     // Snapshots for Undo button
    };

    let activeTimer = null;

    // DOM Elements
    const el = {
        // HUD
        currentQNum: document.getElementById('current-q-num'),
        totalQNum: document.getElementById('total-q-num'),
        remainingQCount: document.getElementById('remaining-q-count'),
        questionDots: document.getElementById('question-dots'),
        questionTextBanner: document.getElementById('question-text-banner'),
        displayRespondentBadge: document.getElementById('display-respondent-badge'),
        displayQuestionText: document.getElementById('display-question-text'),
        balloonCounterCard: document.getElementById('balloon-counter-card'),
        remainingBalloonsNum: document.getElementById('remaining-balloons-num'),
        balloonGaugeBar: document.getElementById('balloon-gauge-bar'),

        // Monitors
        playerMonitor: document.getElementById('player-monitor'),
        playerMonitorTitle: document.getElementById('player-monitor-title'),
        displayAnswerVal: document.getElementById('display-answer-val'),
        correctMonitor: document.getElementById('correct-monitor'),
        displayCorrectVal: document.getElementById('display-correct-val'),
        diffCenterBadge: document.getElementById('diff-center-badge'),
        displayDiffVal: document.getElementById('display-diff-val'),

        // History Ticker
        historyList: document.getElementById('history-list'),

        // Setup Modal
        setupModal: document.getElementById('setup-modal'),
        setupTotalQuestions: document.getElementById('setup-total-questions'),
        setupInitialBalloons: document.getElementById('setup-initial-balloons'),
        setupPerfectBonus: document.getElementById('setup-perfect-bonus'),
        btnStartGame: document.getElementById('btn-start-game'),

        // Result & Cut-ins
        cutinPerfect: document.getElementById('cutin-perfect'),
        perfectBonusText: document.getElementById('perfect-bonus-text'),
        resultModal: document.getElementById('result-modal'),
        resultCard: document.getElementById('result-card'),
        resultBadge: document.getElementById('result-badge'),
        resultTitle: document.getElementById('result-title'),
        resultSubtitle: document.getElementById('result-subtitle'),
        finalBalloonsStat: document.getElementById('final-balloons-stat'),
        finalQuestionsStat: document.getElementById('final-questions-stat'),
        resultLogTable: document.getElementById('result-log-table'),
        btnResultUndo: document.getElementById('btn-result-undo'),
        btnPlayAgain: document.getElementById('btn-play-again'),

        // Operator Dock
        controlDock: document.getElementById('control-dock'),
        dockPhaseIndicator: document.getElementById('dock-phase-indicator'),
        chkBlindCorrect: document.getElementById('chk-blind-correct'),
        btnRunTest: document.getElementById('btn-run-test'),
        btnUndo: document.getElementById('btn-undo'),
        btnMute: document.getElementById('btn-mute'),
        btnOpenSetup: document.getElementById('btn-open-setup'),
        btnToggleDock: document.getElementById('btn-toggle-dock'),
        btnRestoreDock: document.getElementById('btn-restore-dock'),

        inputRespondent: document.getElementById('input-respondent'),
        inputQuestionText: document.getElementById('input-question-text'),
        inputAnswer: document.getElementById('input-answer'),
        inputCorrect: document.getElementById('input-correct'),

        btnLockAnswer: document.getElementById('btn-lock-answer'),
        btnRevealCorrect: document.getElementById('btn-reveal-correct'),
        btnPopBalloons: document.getElementById('btn-pop-balloons'),
        btnNextQuestion: document.getElementById('btn-next-question')
    };

    // Initialize preview balloons in background
    engine.initBalloons(100);

    // =========================================
    // SETUP & INITIALIZATION
    // =========================================
    document.querySelectorAll('.stepper-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            sound.playClick();
            const targetId = btn.getAttribute('data-target');
            const step = parseInt(btn.getAttribute('data-step'), 10);
            const input = document.getElementById(targetId);
            if (!input) return;

            const min = parseInt(input.min, 10) || 0;
            const max = parseInt(input.max, 10) || 200;
            let val = parseInt(input.value, 10) || 0;
            val = Math.max(min, Math.min(max, val + step));
            input.value = val;
        });
    });

    el.btnStartGame.addEventListener('click', () => {
        sound.playClick();
        startNewGame();
    });

    el.btnOpenSetup.addEventListener('click', () => {
        sound.playClick();
        clearActiveTimer();
        el.resultModal.classList.add('hidden');
        el.setupModal.classList.remove('hidden');
    });

    el.btnPlayAgain.addEventListener('click', () => {
        sound.playClick();
        clearActiveTimer();
        el.resultModal.classList.add('hidden');
        el.setupModal.classList.remove('hidden');
    });

    function startNewGame() {
        clearActiveTimer();

        const qCount = clampInt(el.setupTotalQuestions.value, 1, 50, 5);
        const bCount = clampInt(el.setupInitialBalloons.value, 1, 300, 100);
        const pBonus = clampInt(el.setupPerfectBonus.value, 0, 100, 10);

        state.totalQuestions = qCount;
        state.initialBalloons = bCount;
        state.perfectBonus = pBonus;
        state.currentQuestion = 1;
        state.remainingBalloons = bCount;
        state.historyLogs = [];
        state.undoSnapshots = [];

        engine.initBalloons(bCount);
        el.setupModal.classList.add('hidden');
        el.resultModal.classList.add('hidden');
        el.cutinPerfect.classList.add('hidden');

        prepareQuestionRound();
        updateAllHUD();
    }

    function prepareQuestionRound() {
        state.phase = 'INPUT_ANSWER';
        state.currentAnswer = null;
        state.currentCorrect = null;

        el.inputAnswer.value = '';
        el.inputCorrect.value = '';
        el.inputQuestionText.value = '';
        // Keep respondent or clear so operator can type fresh
        el.inputRespondent.value = '';

        el.displayAnswerVal.textContent = '--';
        el.displayCorrectVal.textContent = '?';
        el.playerMonitor.classList.remove('active-glow');
        el.correctMonitor.classList.remove('active-glow');
        el.diffCenterBadge.classList.add('hidden');
        el.diffCenterBadge.classList.remove('perfect-diff');

        syncOptionalBanner();
        updateControlButtons();
        updateAllHUD();
        el.inputAnswer.focus();
    }

    // =========================================
    // SNAPSHOT / UNDO MANAGEMENT
    // =========================================
    function saveSnapshot() {
        state.undoSnapshots.push({
            currentQuestion: state.currentQuestion,
            remainingBalloons: state.remainingBalloons,
            phase: state.phase,
            currentAnswer: state.currentAnswer,
            currentCorrect: state.currentCorrect,
            currentRespondent: el.inputRespondent.value,
            currentQuestionText: el.inputQuestionText.value,
            historyLogs: JSON.parse(JSON.stringify(state.historyLogs))
        });
        el.btnUndo.disabled = false;
    }

    function performUndo() {
        if (state.undoSnapshots.length === 0) return;
        clearActiveTimer();
        sound.stopDrumroll();
        sound.playClick();

        const snap = state.undoSnapshots.pop();
        state.currentQuestion = snap.currentQuestion;
        state.remainingBalloons = snap.remainingBalloons;
        state.phase = snap.phase;
        state.currentAnswer = snap.currentAnswer;
        state.currentCorrect = snap.currentCorrect;
        state.historyLogs = snap.historyLogs;

        el.inputRespondent.value = snap.currentRespondent || '';
        el.inputQuestionText.value = snap.currentQuestionText || '';
        el.inputAnswer.value = snap.currentAnswer !== null ? snap.currentAnswer : '';
        el.inputCorrect.value = snap.currentCorrect !== null ? snap.currentCorrect : '';

        // Rebuild balloons in Canvas to match restored count
        engine.initBalloons(state.remainingBalloons);
        engine.maxBalloons = state.initialBalloons;
        engine.recalculateBalloonLayout();

        // Hide modals/cutins
        el.resultModal.classList.add('hidden');
        el.cutinPerfect.classList.add('hidden');

        // Restore monitor displays
        el.displayAnswerVal.textContent = state.currentAnswer !== null ? state.currentAnswer : '--';
        el.displayCorrectVal.textContent = state.currentCorrect !== null ? state.currentCorrect : '?';

        if (state.currentAnswer !== null && state.currentCorrect !== null) {
            const diff = Math.abs(state.currentAnswer - state.currentCorrect);
            el.displayDiffVal.textContent = diff;
            el.diffCenterBadge.classList.remove('hidden');
            el.diffCenterBadge.classList.toggle('perfect-diff', diff === 0);
        } else {
            el.diffCenterBadge.classList.add('hidden');
        }

        syncOptionalBanner();
        updateAllHUD();
        updateControlButtons();
        el.btnUndo.disabled = state.undoSnapshots.length === 0;
    }

    el.btnUndo.addEventListener('click', performUndo);
    el.btnResultUndo.addEventListener('click', performUndo);

    // =========================================
    // STEP 1: LOCK & DISPLAY RESPONDENT ANSWER
    // =========================================
    function syncOptionalBanner() {
        const resp = el.inputRespondent.value.trim();
        const qText = el.inputQuestionText.value.trim();

        if (resp) {
            el.playerMonitorTitle.textContent = `${resp} の回答予想`;
            el.displayRespondentBadge.textContent = resp;
            el.displayRespondentBadge.classList.remove('hidden');
        } else {
            el.playerMonitorTitle.textContent = 'ANSWER（回答予想）';
            el.displayRespondentBadge.classList.add('hidden');
        }

        if (qText || resp) {
            el.displayQuestionText.textContent = qText || `第${state.currentQuestion}問`;
            el.questionTextBanner.classList.remove('hidden');
        } else {
            el.questionTextBanner.classList.add('hidden');
        }
    }

    el.inputRespondent.addEventListener('input', syncOptionalBanner);
    el.inputQuestionText.addEventListener('input', syncOptionalBanner);

    el.btnLockAnswer.addEventListener('click', lockAnswer);
    el.inputAnswer.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            lockAnswer();
        }
    });

    function lockAnswer() {
        if (state.phase === 'POPPING') return;
        const raw = el.inputAnswer.value.trim();
        if (raw === '' || isNaN(Number(raw))) {
            shakeInput(el.inputAnswer);
            return;
        }

        saveSnapshot();
        const val = clampInt(raw, 0, 100, 50);
        el.inputAnswer.value = val;
        state.currentAnswer = val;
        state.phase = 'ANSWER_LOCKED';

        syncOptionalBanner();
        el.displayAnswerVal.textContent = val;
        el.playerMonitor.classList.add('active-glow');
        el.correctMonitor.classList.remove('active-glow');

        // Reset correct display if re-locking answer
        el.displayCorrectVal.textContent = '?';
        el.diffCenterBadge.classList.add('hidden');

        sound.playAnswerLock();
        updateControlButtons();
        el.inputCorrect.focus();
    }

    // =========================================
    // STEP 2: REVEAL CORRECT ANSWER (DRUMROLL)
    // =========================================
    el.btnRevealCorrect.addEventListener('click', revealCorrectAnswer);
    el.inputCorrect.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (!el.btnRevealCorrect.disabled) {
                revealCorrectAnswer();
            } else if (!el.btnPopBalloons.disabled) {
                startBalloonMeasurement();
            }
        }
    });

    function revealCorrectAnswer() {
        if (state.currentAnswer === null || state.phase === 'POPPING') return;
        const raw = el.inputCorrect.value.trim();
        if (raw === '' || isNaN(Number(raw))) {
            shakeInput(el.inputCorrect);
            return;
        }

        saveSnapshot();
        const correctVal = clampInt(raw, 0, 100, 50);
        el.inputCorrect.value = correctVal;
        state.currentCorrect = correctVal;
        state.phase = 'POPPING'; // Temporarily lock during drumroll
        updateControlButtons();

        el.playerMonitor.classList.remove('active-glow');
        el.correctMonitor.classList.add('active-glow');

        // Drumroll number roulette for 0.9 seconds
        sound.startDrumroll();
        let ticks = 0;
        const maxTicks = 18;
        clearActiveTimer();

        activeTimer = setInterval(() => {
            ticks++;
            if (ticks < maxTicks) {
                el.displayCorrectVal.textContent = Math.floor(Math.random() * 101);
            } else {
                clearActiveTimer();
                el.displayCorrectVal.textContent = correctVal;
                sound.playRevealHit();
                engine.shake(6);

                const diff = Math.abs(state.currentAnswer - state.currentCorrect);
                el.displayDiffVal.textContent = diff;
                el.diffCenterBadge.classList.remove('hidden');
                el.diffCenterBadge.classList.toggle('perfect-diff', diff === 0);

                state.phase = 'CORRECT_REVEALED';
                updateControlButtons();
                el.btnPopBalloons.focus();
            }
        }, 45);
    }

    // =========================================
    // STEP 3: POP BALLOONS BY DIFFERENCE
    // =========================================
    el.btnPopBalloons.addEventListener('click', startBalloonMeasurement);

    function startBalloonMeasurement() {
        if (state.phase !== 'CORRECT_REVEALED') return;

        saveSnapshot();
        state.phase = 'POPPING';
        updateControlButtons();

        const diff = Math.abs(state.currentAnswer - state.currentCorrect);

        // Case A: PERFECT!! (0% Difference)
        if (diff === 0) {
            handlePerfectBonus();
            return;
        }

        // Case B: Pop balloons 1 by 1
        let poppedSoFar = 0;

        function popStep() {
            // Check if no balloons left
            if (state.remainingBalloons <= 0) {
                finishQuestionRound(poppedSoFar, diff, false);
                return;
            }

            // Check if all diff balloons have been popped
            if (poppedSoFar >= diff) {
                finishQuestionRound(poppedSoFar, diff, false);
                return;
            }

            // Pop 1 balloon
            state.remainingBalloons = Math.max(0, state.remainingBalloons - 1);
            poppedSoFar++;

            engine.popOneBalloon();
            const ratio = state.remainingBalloons / Math.max(state.initialBalloons, 1);
            sound.playBalloonPop(ratio);

            if (state.remainingBalloons > 0 && state.remainingBalloons <= 10) {
                sound.playDangerBeep();
            }

            // Update remaining diff countdown & HUD
            el.displayDiffVal.textContent = diff - poppedSoFar;
            bumpBalloonCard();
            updateAllHUD();

            if (state.remainingBalloons <= 0 || poppedSoFar >= diff) {
                activeTimer = setTimeout(() => {
                    finishQuestionRound(poppedSoFar, diff, false);
                }, 400);
                return;
            }

            // Dynamic pacing: faster in the middle of big diffs, dramatic slow-down on last 3 pops or danger zone
            const remainingToPop = diff - poppedSoFar;
            let delay = 115;
            if (diff > 35) delay = 65;
            else if (diff > 20) delay = 85;

            if (remainingToPop <= 3 || state.remainingBalloons <= 5) {
                delay = 220; // Dramatic tension slow-down
            }

            activeTimer = setTimeout(popStep, delay);
        }

        popStep();
    }

    function handlePerfectBonus() {
        sound.playPerfectFanfare();
        engine.spawnConfetti(70);

        const bonus = state.perfectBonus;
        if (bonus > 0) {
            el.perfectBonusText.textContent = `ボーナス風船 +${bonus}個！`;
        } else {
            el.perfectBonusText.textContent = `風船キープ！ノーダメージ！`;
        }
        el.cutinPerfect.classList.remove('hidden');

        activeTimer = setTimeout(() => {
            if (bonus > 0) {
                engine.addBonusBalloons(
                    bonus,
                    (addedIdx) => {
                        state.remainingBalloons++;
                        sound.playBalloonAdd(addedIdx);
                        bumpBalloonCard();
                        updateAllHUD();
                    },
                    () => {
                        setTimeout(() => {
                            el.cutinPerfect.classList.add('hidden');
                            finishQuestionRound(0, 0, true);
                        }, 900);
                    }
                );
            } else {
                setTimeout(() => {
                    el.cutinPerfect.classList.add('hidden');
                    finishQuestionRound(0, 0, true);
                }, 1300);
            }
        }, 900);
    }

    function finishQuestionRound(poppedCount, actualDiff, isPerfect) {
        clearActiveTimer();
        el.displayDiffVal.textContent = actualDiff;

        // Record history
        state.historyLogs.push({
            qNum: state.currentQuestion,
            respondent: el.inputRespondent.value.trim() || `回答者${state.currentQuestion}`,
            questionText: el.inputQuestionText.value.trim() || `第${state.currentQuestion}問`,
            answer: state.currentAnswer,
            correct: state.currentCorrect,
            diff: actualDiff,
            popped: poppedCount,
            isPerfect,
            afterBalloons: state.remainingBalloons
        });
        updateAllHUD();

        // 1. Check GAME OVER (0 Balloons Left)
        if (state.remainingBalloons <= 0) {
            triggerGameOver();
            return;
        }

        // 2. Check GAME CLEAR (All Questions Completed with >= 1 Balloon)
        if (state.currentQuestion >= state.totalQuestions) {
            triggerGameClear();
            return;
        }

        // 3. Otherwise ready for next question
        state.phase = 'QUESTION_DONE';
        updateControlButtons();
        el.btnNextQuestion.focus();
    }

    // =========================================
    // NEXT QUESTION / GAME OVER / GAME CLEAR
    // =========================================
    el.btnNextQuestion.addEventListener('click', () => {
        if (state.phase !== 'QUESTION_DONE') return;
        sound.playClick();
        saveSnapshot();
        state.currentQuestion++;
        prepareQuestionRound();
    });

    function triggerGameOver() {
        state.phase = 'GAME_OVER';
        updateControlButtons();
        engine.triggerGameOverFall();
        sound.playGameOver();

        activeTimer = setTimeout(() => {
            showResultModal(false);
        }, 1500);
    }

    function triggerGameClear() {
        state.phase = 'GAME_CLEAR';
        updateControlButtons();
        engine.triggerGameClearRise();
        sound.playGameClear();

        activeTimer = setTimeout(() => {
            showResultModal(true);
        }, 1500);
    }

    function showResultModal(isClear) {
        el.resultCard.classList.toggle('gameover-theme', !isClear);
        if (isClear) {
            el.resultBadge.textContent = '🎉 CONGRATULATIONS 🎉';
            el.resultTitle.textContent = 'GAME CLEAR!!';
            el.resultSubtitle.textContent = `全${state.totalQuestions}問を突破し、風船を${state.remainingBalloons}個守り抜きました！`;
            el.finalQuestionsStat.textContent = `${state.totalQuestions} / ${state.totalQuestions}`;
        } else {
            el.resultBadge.textContent = '💥 BALLOONS ALL POPPED 💥';
            el.resultTitle.textContent = 'GAME OVER...';
            el.resultSubtitle.textContent = `第${state.currentQuestion}問で風船がすべて割れてしまいました…！`;
            el.finalQuestionsStat.textContent = `${Math.max(0, state.currentQuestion - 1)} / ${state.totalQuestions}`;
        }

        el.finalBalloonsStat.textContent = state.remainingBalloons;

        // Populate log rows
        el.resultLogTable.innerHTML = '';
        state.historyLogs.forEach(item => {
            const row = document.createElement('div');
            row.className = 'log-row';
            const diffBadge = item.isPerfect
                ? `<span style="color:#00E676;font-weight:900;">PERFECT! (+${state.perfectBonus})</span>`
                : `<span style="color:#FF8A80;font-weight:900;">-${item.popped}個 (誤差${item.diff}%)</span>`;
            row.innerHTML = `
                <span><strong>Q.${item.qNum}</strong> ${escapeHtml(item.respondent)}</span>
                <span>予想 <strong>${item.answer}%</strong> ／ 正解 <strong>${item.correct}%</strong></span>
                <span>${diffBadge} ➡ 残${item.afterBalloons}個</span>
            `;
            el.resultLogTable.appendChild(row);
        });

        el.resultModal.classList.remove('hidden');
    }

    // =========================================
    // UI UPDATES & UTILITIES
    // =========================================
    function updateAllHUD() {
        // Question HUD
        el.currentQNum.textContent = state.currentQuestion;
        el.totalQNum.textContent = state.totalQuestions;
        const completedCount = state.historyLogs.length;
        const remQ = Math.max(0, state.totalQuestions - completedCount);
        el.remainingQCount.textContent = remQ;

        // Question Dots
        el.questionDots.innerHTML = '';
        for (let i = 1; i <= state.totalQuestions; i++) {
            const dot = document.createElement('span');
            dot.className = 'q-dot';
            if (i <= completedCount) dot.classList.add('done');
            else if (i === state.currentQuestion) dot.classList.add('active');
            el.questionDots.appendChild(dot);
        }

        // Balloon HUD
        el.remainingBalloonsNum.textContent = state.remainingBalloons;
        const pct = Math.max(0, Math.min(100, (state.remainingBalloons / Math.max(state.initialBalloons, 1)) * 100));
        el.balloonGaugeBar.style.width = `${pct}%`;

        el.balloonGaugeBar.classList.remove('warning', 'danger');
        if (state.remainingBalloons <= 15) {
            el.balloonGaugeBar.classList.add('danger');
            el.balloonCounterCard.classList.add('danger');
        } else if (state.remainingBalloons <= 35) {
            el.balloonGaugeBar.classList.add('warning');
            el.balloonCounterCard.classList.remove('danger');
        } else {
            el.balloonCounterCard.classList.remove('danger');
        }

        // History Ticker
        if (state.historyLogs.length === 0) {
            el.historyList.innerHTML = '<span class="history-empty">まだ記録がありません</span>';
        } else {
            el.historyList.innerHTML = '';
            state.historyLogs.forEach(h => {
                const chip = document.createElement('span');
                chip.className = 'history-chip' + (h.isPerfect ? ' chip-perfect' : '');
                const diffStr = h.isPerfect ? `PERFECT!` : `-${h.popped}`;
                chip.innerHTML = `Q${h.qNum}: ${h.answer}%→${h.correct}% <span class="chip-diff">(${diffStr})</span>`;
                el.historyList.appendChild(chip);
            });
        }
    }

    function updateControlButtons() {
        const p = state.phase;

        // Step indicator text
        const phaseLabels = {
            SETUP: '初期設定を行ってください',
            INPUT_ANSWER: `Q.${state.currentQuestion}: ① 回答者の予想(%)を入力して「回答を表示」を押してください`,
            ANSWER_LOCKED: `Q.${state.currentQuestion}: ② 正解の数値(%)を入力して「正解を発表！」を押してください`,
            CORRECT_REVEALED: `Q.${state.currentQuestion}: ③ 「バルーン計測！」で差分の風船が割れます！`,
            POPPING: '🎈 演出中...',
            QUESTION_DONE: `Q.${state.currentQuestion} 完了！「次の問題へ進む」を押してください`,
            GAME_OVER: '💥 GAME OVER',
            GAME_CLEAR: '🎉 GAME CLEAR!!'
        };
        el.dockPhaseIndicator.textContent = phaseLabels[p] || '';

        el.btnLockAnswer.disabled = (p === 'POPPING' || p === 'QUESTION_DONE' || p === 'GAME_OVER' || p === 'GAME_CLEAR');
        el.btnRevealCorrect.disabled = (p !== 'ANSWER_LOCKED' && p !== 'CORRECT_REVEALED');
        el.btnPopBalloons.disabled = (p !== 'CORRECT_REVEALED');

        if (p === 'QUESTION_DONE') {
            el.btnPopBalloons.classList.add('hidden');
            el.btnNextQuestion.classList.remove('hidden');
        } else {
            el.btnPopBalloons.classList.remove('hidden');
            el.btnNextQuestion.classList.add('hidden');
        }
    }

    // Blind Correct Answer Toggle
    el.chkBlindCorrect.addEventListener('change', () => {
        el.inputCorrect.type = el.chkBlindCorrect.checked ? 'password' : 'number';
    });

    // Mute Toggle
    el.btnMute.addEventListener('click', () => {
        const isMuted = sound.toggleMute();
        el.btnMute.textContent = isMuted ? '🔇 ミュート中' : '🔊 音ON';
    });

    // Dock Minimize / Restore
    function toggleDock() {
        const isMin = el.controlDock.classList.toggle('minimized');
        el.btnRestoreDock.classList.toggle('hidden', !isMin);
    }

    el.btnToggleDock.addEventListener('click', toggleDock);
    el.btnRestoreDock.addEventListener('click', toggleDock);

    document.addEventListener('keydown', (e) => {
        // 'H' shortcut to hide/show operator dock when not typing in an input
        if ((e.key === 'h' || e.key === 'H') && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
            toggleDock();
        }
    });

    function bumpBalloonCard() {
        el.balloonCounterCard.classList.add('pop-bump');
        setTimeout(() => el.balloonCounterCard.classList.remove('pop-bump'), 110);
    }

    function shakeInput(inputEl) {
        inputEl.style.borderColor = '#FF2A55';
        inputEl.focus();
        setTimeout(() => {
            inputEl.style.borderColor = '';
        }, 600);
    }

    function clearActiveTimer() {
        if (activeTimer) {
            clearInterval(activeTimer);
            clearTimeout(activeTimer);
            activeTimer = null;
        }
    }

    function clampInt(val, min, max, fallback) {
        const n = parseInt(val, 10);
        if (isNaN(n)) return fallback;
        return Math.max(min, Math.min(max, n));
    }

    function escapeHtml(str) {
        return str.replace(/[&<>"']/g, m => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[m]));
    }

    // =========================================
    // BUILT-IN AUTOMATED SELF-TEST SUITE
    // =========================================
    async function runBuiltInSelfTest() {
        const prevMuted = sound.muted;
        sound.setMuted(true);
        const results = [];
        const check = (cond, name) => {
            results.push({ pass: !!cond, name });
            if (!cond) console.error('[TEST FAIL]', name);
        };

        try {
            // 1. Setup 2 questions, 30 balloons, +10 bonus
            el.setupTotalQuestions.value = '2';
            el.setupInitialBalloons.value = '30';
            el.setupPerfectBonus.value = '10';
            startNewGame();
            check(state.remainingBalloons === 30 && state.totalQuestions === 2, '初期設定（2問・風船30個・ボーナス+10）の反映');

            // 2. Q1: Answer 60%, Correct 45% -> Diff 15 -> 15 balloons left
            el.inputRespondent.value = 'テスト回答者1';
            el.inputQuestionText.value = 'テスト問題1';
            el.inputAnswer.value = '60';
            lockAnswer();
            check(state.currentAnswer === 60 && el.displayAnswerVal.textContent == '60', '回答の入力と画面フリップ表示 (60%)');

            state.currentCorrect = 45;
            el.displayCorrectVal.textContent = '45';
            el.displayDiffVal.textContent = '15';
            state.phase = 'CORRECT_REVEALED';
            check(Math.abs(state.currentAnswer - state.currentCorrect) === 15, '正解発表と差分計算 (|60 - 45| = 15)');

            // Simulate popping 15 balloons
            saveSnapshot();
            for (let i = 0; i < 15; i++) {
                state.remainingBalloons--;
                engine.popOneBalloon();
            }
            finishQuestionRound(15, 15, false);
            check(state.remainingBalloons === 15 && state.phase === 'QUESTION_DONE', '差分15個の風船破裂と残り風船数更新 (30 → 15個)');

            // 3. Test Undo back to 30 balloons
            performUndo();
            check(state.remainingBalloons === 30, 'やり直し(Undo)機能による状態復元 (15 → 30個)');

            // Re-apply Q1 (diff 10 -> 20 left) and advance to Q2
            saveSnapshot();
            state.remainingBalloons = 20;
            engine.initBalloons(20);
            finishQuestionRound(10, 10, false);
            el.btnNextQuestion.click();
            check(state.currentQuestion === 2, '次の問題への進行 (Q.1 → Q.2)');

            // 4. Q2: Final question survived -> GAME CLEAR
            el.inputAnswer.value = '50';
            lockAnswer();
            state.currentCorrect = 45;
            state.remainingBalloons = 15;
            engine.initBalloons(15);
            finishQuestionRound(5, 5, false);
            check(state.phase === 'GAME_CLEAR', '最終問題クリア時の「GAME CLEAR」判定と演出起動');

            // 5. Test GAME OVER when balloons hit 0
            startNewGame();
            el.inputAnswer.value = '80';
            lockAnswer();
            state.currentCorrect = 20;
            state.remainingBalloons = 0;
            engine.initBalloons(0);
            finishQuestionRound(30, 60, false);
            check(state.phase === 'GAME_OVER', '残り風船0個時の「GAME OVER」判定と落下演出起動');

            // Reset back to clean default game (5 questions, 100 balloons)
            clearActiveTimer();
            el.setupTotalQuestions.value = '5';
            el.setupInitialBalloons.value = '100';
            el.setupPerfectBonus.value = '10';
            startNewGame();
        } finally {
            sound.setMuted(prevMuted);
        }

        const passedCount = results.filter(r => r.pass).length;
        const summary = results.map(r => `${r.pass ? '✅' : '❌'} ${r.name}`).join('\n');
        alert(`【自動セルフテスト完了: ${passedCount}/${results.length} 合格】\n\n${summary}\n\n※初期状態（5問・風船100個）にリセットしました。`);
    }

    if (el.btnRunTest) {
        el.btnRunTest.addEventListener('click', runBuiltInSelfTest);
    }
});
