/**
 * Microphone-based & Gesture Blow Detection Engine
 * Accurately detects blowing air into the microphone using Web Audio frequency & RMS analysis,
 * with seamless touch, click, button, and keyboard fallbacks.
 */

class BlowDetector {
  constructor(options = {}) {
    this.audioCtx = null;
    this.mediaStream = null;
    this.analyser = null;
    this.filter = null;
    this.isListening = false;
    this.micPermissionState = 'prompt'; // 'prompt', 'granted', 'denied', 'unsupported'
    
    // Sensitivity & Thresholds
    this.blowThreshold = options.threshold || 12; 
    this.sustainedBlowCount = 0;
    this.requiredSustainedFrames = 2; // ~30-50ms of sustained blow
    this.smoothingFactor = 0.4;
    this.smoothedIntensity = 0;
    this.ambientBaseline = 0;
    
    // Callbacks
    this.onBlowIntensity = options.onBlowIntensity || (() => {});
    this.onBlowDetected = options.onBlowDetected || (() => {});
    this.onStatusChange = options.onStatusChange || (() => {});

    this.animationFrameId = null;

    // Attach global gesture resume
    this._bindResumeEvents();
  }

  _bindResumeEvents() {
    const resumeHandler = () => {
      this.resume();
    };
    window.addEventListener('pointerdown', resumeHandler, { passive: true });
    window.addEventListener('touchstart', resumeHandler, { passive: true });
    window.addEventListener('keydown', resumeHandler, { passive: true });
  }

  async resume() {
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      try {
        await this.audioCtx.resume();
      } catch (e) {
        console.warn('AudioContext resume failed:', e);
      }
    }
  }

  async requestMicrophone() {
    if (this.isListening) {
      await this.resume();
      return true;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.warn('navigator.mediaDevices.getUserMedia is not supported in this environment');
      this.micPermissionState = 'unsupported';
      this.isListening = false;
      this.onStatusChange('unsupported');
      return false;
    }

    try {
      this.onStatusChange('requesting');
      
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!this.audioCtx || this.audioCtx.state === 'closed') {
        this.audioCtx = new AudioCtx();
      }
      
      if (this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume();
      }

      // Try tailored constraints first, fall back to basic audio if device rejects constraints
      try {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false
          }
        });
      } catch (constraintErr) {
        console.warn('Strict constraints failed, retrying with basic audio constraints:', constraintErr);
        this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }

      if (this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume();
      }

      const source = this.audioCtx.createMediaStreamSource(this.mediaStream);
      
      // Low-pass filter (850Hz) to isolate sub-bass breath turbulence & cut high-pitch room noise
      this.filter = this.audioCtx.createBiquadFilter();
      this.filter.type = 'lowpass';
      this.filter.frequency.setValueAtTime(850, this.audioCtx.currentTime);
      this.filter.Q.setValueAtTime(0.7, this.audioCtx.currentTime);

      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.2;

      source.connect(this.filter);
      this.filter.connect(this.analyser);

      this.isListening = true;
      this.micPermissionState = 'granted';
      this.sustainedBlowCount = 0;
      this.ambientBaseline = 0;
      this.onStatusChange('listening');
      this._startAnalysisLoop();
      return true;
    } catch (err) {
      console.warn('Microphone access denied or unavailable:', err);
      this.micPermissionState = 'denied';
      this.isListening = false;
      this.onStatusChange('denied');
      return false;
    }
  }

  stopListening() {
    this.isListening = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(t => t.stop());
      this.mediaStream = null;
    }
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      this.audioCtx.close();
      this.audioCtx = null;
    }
    this.onStatusChange('stopped');
  }

  _startAnalysisLoop() {
    if (!this.analyser) return;

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    const timeDomainArray = new Uint8Array(this.analyser.fftSize);

    const checkBlow = () => {
      if (!this.isListening) return;

      // Resume context if browser suspended it in background
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }

      this.analyser.getByteFrequencyData(dataArray);
      this.analyser.getByteTimeDomainData(timeDomainArray);

      // 1. Calculate RMS Volume (Time Domain)
      let sumSquares = 0;
      for (let i = 0; i < timeDomainArray.length; i++) {
        const val = (timeDomainArray[i] - 128) / 128;
        sumSquares += val * val;
      }
      const rms = Math.sqrt(sumSquares / timeDomainArray.length);

      // 2. Low Frequency Energy (Wind/breath turbulence ~20Hz - 600Hz)
      // FFT size 512 gives ~43Hz per bin. Bins 1..15 are 40Hz - 650Hz
      let lowFreqSum = 0;
      const startBin = 1;
      const endBin = Math.min(16, dataArray.length);
      for (let i = startBin; i < endBin; i++) {
        lowFreqSum += dataArray[i];
      }
      const avgLowFreq = lowFreqSum / (endBin - startBin);

      // 3. High Frequency Energy (Speech/whistling/background noise)
      let highFreqSum = 0;
      const highStartBin = Math.min(25, dataArray.length);
      const highEndBin = Math.min(80, dataArray.length);
      for (let i = highStartBin; i < highEndBin; i++) {
        highFreqSum += dataArray[i];
      }
      const avgHighFreq = (highEndBin > highStartBin) ? highFreqSum / (highEndBin - highStartBin) : 0;

      // 4. Ambient Baseline Adaptation (slowly adapts to quiet room noise)
      if (this.ambientBaseline === 0) {
        this.ambientBaseline = avgLowFreq;
      } else {
        this.ambientBaseline = this.ambientBaseline * 0.98 + avgLowFreq * 0.02;
      }

      // 5. Blow Score Computation
      // Blowing into mic creates huge low-frequency air displacement relative to high frequencies
      let blowScore = 0;
      const netLowFreq = Math.max(0, avgLowFreq - (this.ambientBaseline * 0.6));

      if (netLowFreq > 4 || rms > 0.015) {
        const turbulenceRatio = (avgLowFreq + 8) / (avgHighFreq + 8);
        const energy = (netLowFreq * 1.6) + (rms * 400);
        blowScore = Math.min(100, Math.round(energy * Math.min(2.5, Math.max(0.8, turbulenceRatio))));
      }

      // Smooth intensity for fluid flame animation
      this.smoothedIntensity = this.smoothedIntensity * this.smoothingFactor + blowScore * (1 - this.smoothingFactor);
      const normalizedIntensity = Math.min(1.0, Math.max(0, this.smoothedIntensity / 100));

      this.onBlowIntensity(normalizedIntensity, blowScore);

      // Threshold check for blowing out the candle
      if (blowScore >= this.blowThreshold || (rms > 0.08 && avgLowFreq > 15)) {
        this.sustainedBlowCount++;
        if (this.sustainedBlowCount >= this.requiredSustainedFrames) {
          this.sustainedBlowCount = 0;
          this.onBlowDetected();
        }
      } else {
        if (this.sustainedBlowCount > 0) {
          this.sustainedBlowCount--;
        }
      }

      this.animationFrameId = requestAnimationFrame(checkBlow);
    };

    this.animationFrameId = requestAnimationFrame(checkBlow);
  }

  /**
   * Programmatic / Manual blow simulation (for button, click, gesture, or keyboard)
   */
  triggerManualBlow(duration = 750) {
    // Prevent overlapping manual blow animations from competing with the mic detector.
    if (this.manualBlowActive) return;
    this.manualBlowActive = true;

    const startTime = performance.now();
    const peakTime = startTime + duration * 0.45;
    let blownOut = false;

    const animateSimulatedBlow = (now) => {
      const elapsed = now - startTime;
      if (elapsed >= duration) {
        this.onBlowIntensity(0, 0);
        if (!blownOut) {
          blownOut = true;
          this.onBlowDetected();
        }
        this.manualBlowActive = false;
        return;
      }

      let progress = 0;
      if (now < peakTime) {
        progress = (now - startTime) / (peakTime - startTime);
      } else {
        progress = 1 - (now - peakTime) / (duration - (peakTime - startTime));
      }

      // Simulated intensity curve
      const intensity = Math.min(1.0, Math.max(0, progress * 1.3));
      this.onBlowIntensity(intensity, intensity * 90);

      if (elapsed > duration * 0.45 && !blownOut) {
        blownOut = true;
        this.onBlowDetected();
        this.manualBlowActive = false;
      }

      requestAnimationFrame(animateSimulatedBlow);
    };

    requestAnimationFrame(animateSimulatedBlow);
  }
}

window.BlowDetector = BlowDetector;
