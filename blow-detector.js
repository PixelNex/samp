class BlowDetector {
  constructor(options = {}) {
    this.audioCtx = null;
    this.mediaStream = null;
    this.analyser = null;
    this.filter = null;
    this.isListening = false;
    this.micPermissionState = 'prompt';
    this.blowThreshold = options.threshold ?? 92;
    this.requiredSustainedFrames = 55;
    this.sustainedBlowCount = 0;
    this.smoothedIntensity = 0;
    this.ambientBaseline = 0;
    this.startedAt = 0;
    this.onBlowIntensity = options.onBlowIntensity || (() => {});
    this.onBlowDetected = options.onBlowDetected || (() => {});
    this.onStatusChange = options.onStatusChange || (() => {});
  }

  async resume() {
    if (this.audioCtx?.state === 'suspended') {
      try { await this.audioCtx.resume(); } catch (_) {}
    }
  }

  async requestMicrophone() {
    if (this.isListening) { await this.resume(); return true; }
    if (!navigator.mediaDevices?.getUserMedia) {
      this.onStatusChange('unsupported');
      return false;
    }
    try {
      this.onStatusChange('requesting');
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioCtx();
      await this.audioCtx.resume();
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      });
      const source = this.audioCtx.createMediaStreamSource(this.mediaStream);
      this.filter = this.audioCtx.createBiquadFilter();
      this.filter.type = 'lowpass';
      this.filter.frequency.value = 500;
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.1;
      source.connect(this.filter);
      this.filter.connect(this.analyser);
      this.isListening = true;
      this.micPermissionState = 'granted';
      this.sustainedBlowCount = 0;
      this.ambientBaseline = 0;
      this.smoothedIntensity = 0;
      this.startedAt = performance.now();
      this.onStatusChange('listening');
      this._startAnalysisLoop();
      return true;
    } catch (error) {
      console.warn('Microphone access failed:', error);
      this.isListening = false;
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
    const frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
    const timeData = new Uint8Array(this.analyser.fftSize);
    const check = () => {
      if (!this.isListening) return;
      this.analyser.getByteFrequencyData(frequencyData);
      this.analyser.getByteTimeDomainData(timeData);
      let squares = 0;
      for (const sample of timeData) {
        const value = (sample - 128) / 128;
        squares += value * value;
      }
      const rms = Math.sqrt(squares / timeData.length);
      let low = 0;
      for (let i = 1; i <= 10; i++) low += frequencyData[i] || 0;
      const lowAverage = low / 10;
      let high = 0, count = 0;
      for (let i = 35; i <= 100 && i < frequencyData.length; i++) {
        high += frequencyData[i]; count++;
      }
      const highAverage = count ? high / count : 0;
      if (this.ambientBaseline === 0) this.ambientBaseline = lowAverage;
      else this.ambientBaseline = this.ambientBaseline * 0.995 + lowAverage * 0.005;
      const netLow = Math.max(0, lowAverage - this.ambientBaseline);
      const ratio = (lowAverage + 10) / (highAverage + 10);
      const score = Math.min(100, Math.round(netLow * 2 + rms * 450 * Math.min(ratio, 2)));
      this.smoothedIntensity = this.smoothedIntensity * 0.8 + score * 0.2;
      this.onBlowIntensity(Math.min(1, this.smoothedIntensity / 100), score);
      const warmedUp = performance.now() - this.startedAt > 5000;
      const genuineBlow = warmedUp && rms > 0.18 && netLow > 35 && ratio > 1.7 && score >= this.blowThreshold;
      this.sustainedBlowCount = genuineBlow ? this.sustainedBlowCount + 1 : 0;
      if (this.sustainedBlowCount >= this.requiredSustainedFrames) {
        this.sustainedBlowCount = 0;
        this.onBlowDetected();
      }
      this.animationFrameId = requestAnimationFrame(check);
    };
    this.animationFrameId = requestAnimationFrame(check);
  }

  triggerManualBlow() {
    // Deliberately disabled: the candle must respond only to a real microphone blow.
    return false;
  }
}

window.BlowDetector = BlowDetector;
