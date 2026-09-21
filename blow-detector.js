/**
 * Strict microphone blow detector.
 * The candle extinguishes only after a very strong, sustained blow.
 */
class BlowDetector {
  constructor(options = {}) {
    this.audioCtx = null;
    this.mediaStream = null;
    this.analyser = null;
    this.filter = null;
    this.isListening = false;
    this.micPermissionState = 'prompt';

    this.blowThreshold = options.threshold ?? 85;
    this.requiredSustainedFrames = 40;
    this.sustainedBlowCount = 0;
    this.smoothedIntensity = 0;
    this.ambientBaseline = 0;
    this.onBlowIntensity = options.onBlowIntensity || (() => {});
    this.onBlowDetected = options.onBlowDetected || (() => {});
    this.onStatusChange = options.onStatusChange || (() => {});
    this.animationFrameId = null;
    this.lastDetectionTime = 0;
    this._bindResumeEvents();
  }

  _bindResumeEvents() {
    const resumeHandler = () => this.resume();
    window.addEventListener('pointerdown', resumeHandler, { passive: true });
    window.addEventListener('touchstart', resumeHandler, { passive: true });
    window.addEventListener('keydown', resumeHandler, { passive: true });
  }

  async resume() {
    if (this.audioCtx?.state === 'suspended') {
      try { await this.audioCtx.resume(); } catch (_) {}
    }
  }

  async requestMicrophone() {
    if (this.isListening) { await this.resume(); return true; }
    if (!navigator.mediaDevices?.getUserMedia) {
      this.micPermissionState = 'unsupported';
      this.onStatusChange('unsupported');
      return false;
    }

    try {
      this.onStatusChange('requesting');
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioCtx();
      await this.audioCtx.resume();
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
      });

      const source = this.audioCtx.createMediaStreamSource(this.mediaStream);
      this.filter = this.audioCtx.createBiquadFilter();
      this.filter.type = 'lowpass';
      this.filter.frequency.value = 600;
      this.filter.Q.value = 0.7;
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.2;
      source.connect(this.filter);
      this.filter.connect(this.analyser);

      this.isListening = true;
      this.micPermissionState = 'granted';
      this.sustainedBlowCount = 0;
      this.ambientBaseline = 0;
      this.lastDetectionTime = 0;
      this.onStatusChange('listening');
      this._startAnalysisLoop();
      return true;
    } catch (error) {
      console.warn('Microphone access failed:', error);
      this.isListening = false;
      this.micPermissionState = 'denied';
      this.onStatusChange('denied');
      return false;
    }
  }

  stopListening() {
    this.isListening = false;
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    this.animationFrameId = null;
    this.mediaStream?.getTracks().forEach(track => track.stop());
    this.mediaStream = null;
    if (this.audioCtx && this.audioCtx.state !== 'closed') this.audioCtx.close();
    this.audioCtx = null;
    this.onStatusChange('stopped');
  }

  _startAnalysisLoop() {
    if (!this.analyser) return;
    const frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
    const timeData = new Uint8Array(this.analyser.fftSize);

    const checkBlow = () => {
      if (!this.isListening) return;
      this.analyser.getByteFrequencyData(frequencyData);
      this.analyser.getByteTimeDomainData(timeData);

      let sumSquares = 0;
      for (const sample of timeData) {
        const value = (sample - 128) / 128;
        sumSquares += value * value;
      }
      const rms = Math.sqrt(sumSquares / timeData.length);

      let low = 0;
      for (let i = 1; i <= 10; i++) low += frequencyData[i] || 0;
      const lowAverage = low / 10;

      let high = 0;
      let highBins = 0;
      for (let i = 30; i <= 90 && i < frequencyData.length; i++) {
        high += frequencyData[i];
        highBins++;
      }
      const highAverage = highBins ? high / highBins : 0;

      if (this.ambientBaseline === 0) this.ambientBaseline = lowAverage;
      else this.ambientBaseline = this.ambientBaseline * 0.998 + lowAverage * 0.002;

      const netLow = Math.max(0, lowAverage - this.ambientBaseline);
      const ratio = (lowAverage + 8) / (highAverage + 8);
      const blowScore = Math.min(100, Math.round(netLow * 2 + rms * 500 * Math.min(ratio, 2)));

      this.smoothedIntensity = this.smoothedIntensity * 0.75 + blowScore * 0.25;
      this.onBlowIntensity(Math.min(1, this.smoothedIntensity / 100), blowScore);

      const genuineBlow =
        rms > 0.14 &&
        netLow > 28 &&
        ratio > 1.5 &&
        blowScore >= this.blowThreshold;

      if (genuineBlow) this.sustainedBlowCount++;
      else this.sustainedBlowCount = 0;

      const now = performance.now();
      if (this.sustainedBlowCount >= this.requiredSustainedFrames && now - this.lastDetectionTime > 4000) {
        this.sustainedBlowCount = 0;
        this.lastDetectionTime = now;
        this.onBlowDetected();
      }

      this.animationFrameId = requestAnimationFrame(checkBlow);
    };

    this.animationFrameId = requestAnimationFrame(checkBlow);
  }

  triggerManualBlow(duration = 750) {
    const start = performance.now();
    let detected = false;
    const animate = now => {
      const elapsed = now - start;
      if (elapsed >= duration) {
        this.onBlowIntensity(0, 0);
        if (!detected) {
          detected = true;
          this.onBlowDetected();
        }
        return;
      }
      const progress = Math.min(1, elapsed / (duration * 0.45));
      this.onBlowIntensity(Math.min(1, progress), progress * 90);
      requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }
}

window.BlowDetector = BlowDetector;
