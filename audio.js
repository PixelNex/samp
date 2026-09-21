/**
 * Procedural Web Audio Engine for Birthday Celebration
 * Zero external audio dependencies - 100% synthesized in-browser for flawless reliability.
 */

class BirthdayAudioEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.bgmTimer = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(0.55, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.75, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.8, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  /**
   * Synthesize a chime / bell note (music box / celesta tone)
   */
  playNote(freq, startTime, duration = 0.8, gainLevel = 0.3) {
    if (!this.ctx || this.isMuted) return;

    const osc = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const noteGain = this.ctx.createGain();

    // Warm bell tone with subtle overtone
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2, startTime);

    noteGain.gain.setValueAtTime(0, startTime);
    noteGain.gain.linearRampToValueAtTime(gainLevel, startTime + 0.02);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(noteGain);
    osc2.connect(noteGain);
    noteGain.connect(this.musicGain);

    osc.start(startTime);
    osc2.start(startTime);
    osc.stop(startTime + duration);
    osc2.stop(startTime + duration);
  }

  /**
   * Polyphonic Happy Birthday Fanfare Melody
   */
  playHappyBirthdayFanfare() {
    this.init();
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime + 0.1;
    
    // Note frequencies (Hz) in C Major:
    const C4 = 261.63, D4 = 293.66, E4 = 329.63, F4 = 349.23,
          G4 = 392.00, A4 = 440.00, B4 = 493.88,
          C5 = 523.25, D5 = 587.33, E5 = 659.25, F5 = 698.46, G5 = 783.99;

    const notes = [
      // "Hap-py Birth-day to you"
      { f: G4, d: 0.35, t: 0.0 },
      { f: G4, d: 0.25, t: 0.38 },
      { f: A4, d: 0.6,  t: 0.68, chords: [C4, E4] },
      { f: G4, d: 0.6,  t: 1.35, chords: [C4, E4] },
      { f: C5, d: 0.6,  t: 2.00, chords: [E4, G4] },
      { f: B4, d: 1.1,  t: 2.68, chords: [D4, G4] },

      // "Hap-py Birth-day to you"
      { f: G4, d: 0.35, t: 3.85 },
      { f: G4, d: 0.25, t: 4.23 },
      { f: A4, d: 0.6,  t: 4.53, chords: [D4, F4] },
      { f: G4, d: 0.6,  t: 5.20, chords: [D4, G4] },
      { f: D5, d: 0.6,  t: 5.85, chords: [D4, F4] },
      { f: C5, d: 1.1,  t: 6.52, chords: [C4, E4, G4] },

      // "Hap-py Birth-day dear [Friend]"
      { f: G4, d: 0.35, t: 7.70 },
      { f: G4, d: 0.25, t: 8.08 },
      { f: G5, d: 0.6,  t: 8.38, chords: [C4, E4, G4] },
      { f: E5, d: 0.6,  t: 9.05, chords: [C4, G4] },
      { f: C5, d: 0.6,  t: 9.72, chords: [C4, F4] },
      { f: B4, d: 0.6,  t: 10.38, chords: [D4, F4] },
      { f: A4, d: 1.0,  t: 11.05, chords: [C4, F4, A4] },

      // "Hap-py Birth-day to you!"
      { f: F5, d: 0.35, t: 12.15 },
      { f: F5, d: 0.25, t: 12.53 },
      { f: E5, d: 0.6,  t: 12.83, chords: [C4, G4] },
      { f: C5, d: 0.6,  t: 13.50, chords: [C4, E4] },
      { f: D5, d: 0.6,  t: 14.15, chords: [D4, G4, B4] },
      { f: C5, d: 1.8,  t: 14.82, chords: [C4, E4, G4, C5] }
    ];

    notes.forEach(note => {
      const startTime = now + note.t * 0.72;
      this.playNote(note.f, startTime, note.d * 1.2, 0.42);
      if (note.chords) {
        note.chords.forEach(cf => {
          this.playNote(cf, startTime, (note.d + 0.3) * 1.1, 0.16);
        });
      }
    });
  }

  /**
   * Sound of blowing air / wind gust
   */
  playWhoosh(intensity = 0.5) {
    this.init();
    if (!this.ctx || this.isMuted) return;

    const bufferSize = Math.floor(this.ctx.sampleRate * 0.35);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(320 + intensity * 350, this.ctx.currentTime);
    filter.Q.setValueAtTime(2.2, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.28 * intensity, this.ctx.currentTime + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start();
    noise.stop(this.ctx.currentTime + 0.36);
  }

  /**
   * Extinguish puff sound
   */
  playExtinguish() {
    this.init();
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.25);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.26);

    this.playWhoosh(0.7);
  }

  /**
   * Confetti Cannon Pop
   */
  playPop() {
    this.init();
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.15);

    gain.gain.setValueAtTime(0.65, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.16);

    this.playSparkleChime();
  }

  /**
   * Magical sparkle chime sweep
   */
  playSparkleChime() {
    this.init();
    if (!this.ctx || this.isMuted) return;

    const freqs = [659.25, 783.99, 987.77, 1174.66, 1318.51, 1567.98];
    const now = this.ctx.currentTime;
    
    freqs.forEach((f, idx) => {
      this.playNote(f, now + idx * 0.055, 0.4, 0.16);
    });
  }

  /**
   * Interactive UI Click Chime
   */
  playClick() {
    this.init();
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.06);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.07);
  }

  /**
   * Candle Relight igniter whoosh & chime
   */
  playRelight() {
    this.init();
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(750, now + 0.2);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.26);
    this.playSparkleChime();
  }
}

window.audioEngine = new BirthdayAudioEngine();
