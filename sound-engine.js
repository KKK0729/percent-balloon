/**
 * Web Audio API Sound Engine for Percent Balloon
 * Synthesizes all sound effects procedurally without external audio files.
 */
class SoundEngine {
    constructor() {
        this.ctx = null;
        this.muted = false;
        this.drumrollTimer = null;
    }

    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    setMuted(muted) {
        this.muted = muted;
        if (muted) {
            this.stopDrumroll();
        }
    }

    toggleMute() {
        this.setMuted(!this.muted);
        return this.muted;
    }

    // Helper: create noise buffer for balloon pop & snare
    createNoiseBuffer(duration = 0.2) {
        if (!this.ctx) return null;
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        return buffer;
    }

    // UI button click / Start sound
    playClick() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.08);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.09);
    }

    // Answer Lock-in ("Jan!" chord)
    playAnswerLock() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
        freqs.forEach((f, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(f, now + idx * 0.025);

            gain.gain.setValueAtTime(0.22, now + idx * 0.025);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + idx * 0.025);
            osc.stop(now + 0.46);
        });
    }

    // Drumroll loop during answer reveal
    startDrumroll() {
        this.stopDrumroll();
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        let step = 0;
        this.drumrollTimer = setInterval(() => {
            if (this.muted || !this.ctx) return;
            const now = this.ctx.currentTime;

            // Snare tick
            const noise = this.ctx.createBufferSource();
            noise.buffer = this.createNoiseBuffer(0.045);

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(1200 + (step % 2) * 300, now);

            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.14, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.04);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);
            noise.start(now);
            step++;
        }, 45);
    }

    stopDrumroll() {
        if (this.drumrollTimer) {
            clearInterval(this.drumrollTimer);
            this.drumrollTimer = null;
        }
    }

    // Correct Answer Stop ("Don!!")
    playRevealHit() {
        this.stopDrumroll();
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;

        // Impact bass
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(45, now + 0.35);

        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.36);

        // Brass hit chord
        const chord = [587.33, 880, 1174.66]; // D5, A5, D6
        chord.forEach((f) => {
            const o = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            o.type = 'square';
            o.frequency.setValueAtTime(f, now);
            g.gain.setValueAtTime(0.14, now);
            g.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
            o.connect(g);
            g.connect(this.ctx.destination);
            o.start(now);
            o.stop(now + 0.42);
        });
    }

    // Realistic Balloon Pop sound
    playBalloonPop(remainingRatio = 0.5) {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;

        // 1. Sharp burst noise
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.createNoiseBuffer(0.12);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        // Slightly higher pitch tension when balloons get low
        const baseFreq = 900 + (1 - remainingRatio) * 700 + (Math.random() * 350 - 175);
        filter.frequency.setValueAtTime(baseFreq, now);
        filter.Q.setValueAtTime(1.2, now);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.55, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.ctx.destination);
        noise.start(now);

        // 2. Punchy membrane snap oscillator
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(360 + Math.random() * 140, now);
        osc.frequency.exponentialRampToValueAtTime(55, now + 0.075);

        oscGain.gain.setValueAtTime(0.45, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        osc.connect(oscGain);
        oscGain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.085);
    }

    // Balloon inflate / bonus add sound ("Poyon!")
    playBalloonAdd(index = 0) {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';

        const base = 380 + index * 35;
        osc.frequency.setValueAtTime(base, now);
        osc.frequency.exponentialRampToValueAtTime(base * 1.9, now + 0.12);

        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.14);
    }

    // Danger beep when balloons <= 10
    playDangerBeep() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.setValueAtTime(440, now + 0.07);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
    }

    // PERFECT!! 0% diff fanfare
    playPerfectFanfare() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const notes = [
            { f: 523.25, t: 0, d: 0.12 },    // C5
            { f: 659.25, t: 0.11, d: 0.12 }, // E5
            { f: 783.99, t: 0.22, d: 0.12 }, // G5
            { f: 1046.50, t: 0.33, d: 0.45 },// C6
            { f: 1318.51, t: 0.45, d: 0.65 } // E6
        ];

        notes.forEach(n => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(n.f, now + n.t);

            gain.gain.setValueAtTime(0.28, now + n.t);
            gain.gain.exponentialRampToValueAtTime(0.001, now + n.t + n.d);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + n.t);
            osc.stop(now + n.t + n.d + 0.02);
        });
    }

    // GAME CLEAR fanfare
    playGameClear() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const melody = [
            { f: 523.25, t: 0.0, d: 0.15 },
            { f: 523.25, t: 0.16, d: 0.15 },
            { f: 523.25, t: 0.32, d: 0.15 },
            { f: 523.25, t: 0.48, d: 0.38 },
            { f: 415.30, t: 0.88, d: 0.38 },
            { f: 466.16, t: 1.28, d: 0.38 },
            { f: 523.25, t: 1.68, d: 0.24 },
            { f: 466.16, t: 1.96, d: 0.14 },
            { f: 523.25, t: 2.12, d: 0.95 }
        ];

        melody.forEach(n => {
            // Dual oscillators for rich brass sound
            ['sawtooth', 'triangle'].forEach((type, i) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = type;
                osc.frequency.setValueAtTime(n.f * (i === 1 ? 2 : 1), now + n.t);

                gain.gain.setValueAtTime(i === 0 ? 0.2 : 0.12, now + n.t);
                gain.gain.exponentialRampToValueAtTime(0.001, now + n.t + n.d);

                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now + n.t);
                osc.stop(now + n.t + n.d + 0.03);
            });
        });
    }

    // GAME OVER crash & fall sound
    playGameOver() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;

        // Falling whistle
        const fallOsc = this.ctx.createOscillator();
        const fallGain = this.ctx.createGain();
        fallOsc.type = 'sine';
        fallOsc.frequency.setValueAtTime(950, now);
        fallOsc.frequency.exponentialRampToValueAtTime(90, now + 0.85);

        fallGain.gain.setValueAtTime(0.28, now);
        fallGain.gain.exponentialRampToValueAtTime(0.01, now + 0.85);

        fallOsc.connect(fallGain);
        fallGain.connect(this.ctx.destination);
        fallOsc.start(now);
        fallOsc.stop(now + 0.86);

        // Explosion crash at 0.8s
        const crashNoise = this.ctx.createBufferSource();
        crashNoise.buffer = this.createNoiseBuffer(1.1);
        const crashFilter = this.ctx.createBiquadFilter();
        crashFilter.type = 'lowpass';
        crashFilter.frequency.setValueAtTime(650, now + 0.8);

        const crashGain = this.ctx.createGain();
        crashGain.gain.setValueAtTime(0.001, now);
        crashGain.gain.setValueAtTime(0.6, now + 0.8);
        crashGain.gain.exponentialRampToValueAtTime(0.001, now + 1.85);

        crashNoise.connect(crashFilter);
        crashFilter.connect(crashGain);
        crashGain.connect(this.ctx.destination);
        crashNoise.start(now + 0.8);

        // Sad descending brass
        const sadNotes = [
            { f: 392.00, t: 1.0, d: 0.35 }, // G4
            { f: 369.99, t: 1.38, d: 0.35 },// F#4
            { f: 349.23, t: 1.76, d: 0.35 },// F4
            { f: 329.63, t: 2.14, d: 0.95 } // E4
        ];
        sadNotes.forEach(n => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(n.f, now + n.t);
            osc.frequency.linearRampToValueAtTime(n.f * 0.96, now + n.t + n.d);

            gain.gain.setValueAtTime(0.18, now + n.t);
            gain.gain.exponentialRampToValueAtTime(0.001, now + n.t + n.d);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + n.t);
            osc.stop(now + n.t + n.d + 0.03);
        });
    }
}

window.soundEngine = new SoundEngine();
