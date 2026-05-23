/**
 * Snake Reloaded - Sound Engine
 * Synthesizes retro 8-bit sound effects using the Web Audio API.
 * Zero external asset dependencies.
 */

const SoundManager = {
  muted: localStorage.getItem('snakeMuted') === 'true',
  ctx: null,

  /**
   * Initializes the AudioContext upon user interaction.
   * Browsers restrict audio playback until a user gesture occurs.
   */
  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  },

  /**
   * Toggles the audio mute state.
   * @returns {boolean} New mute state
   */
  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem('snakeMuted', this.muted);
    return this.muted;
  },

  /**
   * Play standard food eating sound (classic retro 8-bit blip).
   */
  playEat() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square'; // Classic NES chiptune square wave
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  },

  /**
   * Play special golden food eat sound (higher double-blip).
   */
  playGoldenEat() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const ctx = this.ctx;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'square';
    osc1.frequency.setValueAtTime(600, ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.06);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(800, ctx.currentTime + 0.04);
    osc2.frequency.exponentialRampToValueAtTime(1600, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start();
    osc1.stop(ctx.currentTime + 0.06);
    osc2.start(ctx.currentTime + 0.04);
    osc2.stop(ctx.currentTime + 0.12);
  },

  /**
   * Play game start chimes (rising cyberpunk arpeggio).
   */
  playStart() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const ctx = this.ctx;
    const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
    const duration = 0.08;

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle'; // Smoother triangle sound
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.06);

      gain.gain.setValueAtTime(0.15, ctx.currentTime + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.06 + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + idx * 0.06);
      osc.stop(ctx.currentTime + idx * 0.06 + duration);
    });
  },

  /**
   * Play speed leveling chimes (harmonized high double-beep).
   */
  playLevelUp() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const ctx = this.ctx;
    const times = [0, 0.08];
    const freqs = [587.33, 880.00]; // D5, A5

    times.forEach((time, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(freqs[idx], ctx.currentTime + time);

      gain.gain.setValueAtTime(0.1, ctx.currentTime + time);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + time + 0.1);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + time);
      osc.stop(ctx.currentTime + time + 0.1);
    });
  },

  /**
   * Play game over explosion sound (sliding white-noise-simulating rumble).
   */
  playGameOver() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sawtooth'; // Raw, buzzy waveform
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(40, ctx.currentTime + 0.6);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.6);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  },

  /**
   * Play Pause / Unpause toggle sounds.
   * @param {boolean} isPaused
   */
  playPause(isPaused) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    if (isPaused) {
      // High to low frequency slide
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(300, ctx.currentTime + 0.15);
    } else {
      // Low to high frequency slide
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(600, ctx.currentTime + 0.15);
    }

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  }
};
