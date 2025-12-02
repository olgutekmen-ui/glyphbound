/* audio.js — V1.2 (PITCH SHIFTING SYNTH) */
(function() {
    const AudioSys = {
        ctx: null,
        muted: localStorage.getItem("nx_muted") === "true",
        bgmOscillators: [],

        init() {
            try {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                this.ctx = new AudioContext();
                this.updateMuteState();
            } catch (e) { console.warn("Web Audio API missing"); }
        },

        // --- SYNTHESIS ENGINE ---
        playTone(freq, type, duration, vol = 0.1, slide = 0) {
            if (this.muted || !this.ctx) return;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
            if (slide !== 0) osc.frequency.exponentialRampToValueAtTime(freq + slide, this.ctx.currentTime + duration);
            gain.gain.setValueAtTime(vol, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + duration);
        },

        // --- PITCH SHIFTING PLAY ---
        play(key, pitchMult = 1.0) {
            if (this.muted || !this.ctx) return;
            if (this.ctx.state === 'suspended') this.ctx.resume();

            // Adjust base frequencies by pitchMult
            switch (key) {
                case 'swap':
                    this.playTone(800 * pitchMult, 'sine', 0.1, 0.1, -400);
                    break;
                case 'match':
                    // Chime scales up with combos
                    const base = 440 * pitchMult;
                    this.playTone(base, 'triangle', 0.3, 0.1);
                    setTimeout(() => this.playTone(base * 1.25, 'triangle', 0.3, 0.1), 50); // Major Third
                    setTimeout(() => this.playTone(base * 1.5, 'triangle', 0.3, 0.1), 100); // Fifth
                    break;
                case 'cast':
                    this.playTone(200, 'sawtooth', 0.5, 0.1, 800);
                    break;
                case 'warning':
                    this.playTone(150, 'square', 0.4, 0.15);
                    setTimeout(() => this.playTone(100, 'square', 0.4, 0.15), 200);
                    break;
                case 'win':
                    [523, 659, 783, 1046].forEach((f, i) => setTimeout(() => this.playTone(f, 'square', 0.4, 0.1), i * 150));
                    break;
                case 'lose':
                    this.playTone(150, 'sawtooth', 1.0, 0.2, -50);
                    this.playTone(145, 'sawtooth', 1.0, 0.2, -50);
                    break;
            }
        },

        playBGM(key) {
            if (this.muted || !this.ctx) return;
            this.stopBGM();
            const osc1 = this.ctx.createOscillator();
            const osc2 = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const root = key === 'bgm_battle' ? 130.81 : 65.41;
            osc1.frequency.value = root; osc1.type = 'sawtooth';
            osc2.frequency.value = root * 1.5; osc2.type = 'triangle';
            const lfo = this.ctx.createOscillator(); lfo.frequency.value = 0.1;
            const lfoGain = this.ctx.createGain(); lfoGain.gain.value = 500;
            const filter = this.ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 600;
            osc1.connect(filter); osc2.connect(filter); lfo.connect(lfoGain); lfoGain.connect(filter.frequency);
            filter.connect(gain); gain.connect(this.ctx.destination);
            gain.gain.setValueAtTime(0, this.ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.05, this.ctx.currentTime + 2);
            osc1.start(); osc2.start(); lfo.start();
            this.bgmOscillators = [osc1, osc2, lfo];
        },

        stopBGM() {
            this.bgmOscillators.forEach(o => { try { o.stop(); } catch(e){} });
            this.bgmOscillators = [];
        },

        toggleMute() {
            this.muted = !this.muted;
            localStorage.setItem("nx_muted", this.muted);
            this.updateMuteState();
            if (this.muted) { if (this.ctx) this.ctx.suspend(); this.stopBGM(); }
            else { if (this.ctx) this.ctx.resume(); const isGame = window.location.pathname.includes("game.html"); this.playBGM(isGame ? 'bgm_battle' : 'bgm_map'); }
            return this.muted;
        },

        updateMuteState() {
            const btn = document.getElementById("mute-btn");
            if (btn) {
                btn.textContent = this.muted ? "🔇" : "🔊";
                btn.style.opacity = this.muted ? "0.5" : "1";
            }
        }
    };
    window.AudioSys = AudioSys;
    AudioSys.init();
})();