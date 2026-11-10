// Synesthetic Procedural Sound Engine
// Real-time ambient chord progressions, biological event chimes,
// dual spectral waveform & frequency bar visualizer via Web Audio API.

export class SoundEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.analyser = null;
    this.initialized = false;
    this.audioStarted = false;
    this.enabled = true;
    this.volume = 0.5;

    // Musical Scale Definitions (frequencies in Hz)
    this.scales = {
      lydian: [130.81, 146.83, 164.81, 185.00, 196.00, 220.00, 246.94, 261.63, 293.66, 329.63, 370.00, 392.00, 440.00, 493.88, 523.25],
      dorian: [130.81, 146.83, 155.56, 174.61, 196.00, 220.00, 233.08, 261.63, 293.66, 311.13, 349.23, 392.00, 440.00, 466.16, 523.25],
      pentatonic: [130.81, 146.83, 164.81, 196.00, 220.00, 261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25],
      aeolian: [110.00, 123.47, 130.81, 146.83, 164.81, 174.61, 196.00, 220.00, 246.94, 261.63, 293.66, 329.63, 349.23, 392.00]
    };
    this.currentScale = 'lydian';

    // Drone Oscillators
    this.droneOscs = [];
    this.droneGains = [];
    this.droneFilter = null;
    this.droneTimer = null;
    this.isDroneActive = true;
    this.isEventsActive = true;
    this.isThereminActive = true;

    // Theremin continuous node
    this.thereminOsc = null;
    this.thereminGain = null;

    // Visualizer Mode: 'waveform' or 'frequency'
    this.vizMode = 'waveform';
    this.scopeCanvas = null;
    this.scopeCtx = null;
    this.timeData = null;
    this.freqData = null;
  }

  init(scopeCanvasElement) {
    if (scopeCanvasElement) {
      this.scopeCanvas = scopeCanvasElement;
      this.scopeCtx = scopeCanvasElement.getContext('2d');
    }
  }

  ensureContext() {
    if (!this.initialized) {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.enabled ? this.volume : 0, this.ctx.currentTime);

        this.analyser = this.ctx.createAnalyser();
        this.analyser.fftSize = 512;
        this.analyser.smoothingTimeConstant = 0.85;

        this.masterGain.connect(this.analyser);
        this.analyser.connect(this.ctx.destination);

        this.timeData = new Uint8Array(this.analyser.fftSize);
        this.freqData = new Uint8Array(this.analyser.frequencyBinCount);

        this.initDrone();
        this.initTheremin();

        this.initialized = true;
        this.audioStarted = true;
        this.startDroneProgression();
        this.startScopeVisualizer();
      } catch (err) {
        console.warn('Web Audio initialization error:', err);
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(e => console.warn('Audio resume error:', e));
    }
  }

  setMasterGain(val) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.enabled ? this.volume : 0, this.ctx.currentTime, 0.05);
    }
  }

  toggleAudio(state) {
    this.enabled = state !== undefined ? state : !this.enabled;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.enabled ? this.volume : 0, this.ctx.currentTime, 0.05);
    }
    return this.enabled;
  }

  setScale(scaleName) {
    if (this.scales[scaleName]) {
      this.currentScale = scaleName;
      this.shiftDroneChord();
    }
  }

  // --- Generative Ambient Chord Drone Engine ---
  initDrone() {
    this.droneFilter = this.ctx.createBiquadFilter();
    this.droneFilter.type = 'lowpass';
    this.droneFilter.frequency.setValueAtTime(320, this.ctx.currentTime);
    this.droneFilter.Q.setValueAtTime(4.0, this.ctx.currentTime);
    this.droneFilter.connect(this.masterGain);

    for (let i = 0; i < 4; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = i % 2 === 0 ? 'sine' : 'triangle';
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);

      osc.connect(gain);
      gain.connect(this.droneFilter);
      osc.start();

      this.droneOscs.push(osc);
      this.droneGains.push(gain);
    }
  }

  shiftDroneChord() {
    if (!this.ctx || !this.isDroneActive || !this.enabled || !this.initialized) return;
    const scale = this.scales[this.currentScale];
    const now = this.ctx.currentTime;

    const baseIdx = Math.floor(Math.random() * (scale.length - 8));
    const chordIndices = [baseIdx, baseIdx + 2, baseIdx + 4, baseIdx + 6];

    this.droneOscs.forEach((osc, idx) => {
      const noteFreq = scale[chordIndices[idx] % scale.length];
      osc.frequency.setTargetAtTime(noteFreq, now, 2.5);
    });

    const filterFreq = 220 + Math.random() * 380;
    this.droneFilter.frequency.setTargetAtTime(filterFreq, now, 3.0);
  }

  startDroneProgression() {
    this.shiftDroneChord();
    if (this.droneTimer) clearInterval(this.droneTimer);
    this.droneTimer = setInterval(() => {
      this.shiftDroneChord();
    }, 7000);
  }

  // --- Continuous Theremin Node ---
  initTheremin() {
    this.thereminOsc = this.ctx.createOscillator();
    this.thereminGain = this.ctx.createGain();

    this.thereminOsc.type = 'sine';
    this.thereminGain.gain.setValueAtTime(0, this.ctx.currentTime);

    this.thereminOsc.connect(this.thereminGain);
    this.thereminGain.connect(this.masterGain);
    this.thereminOsc.start();
  }

  setTheremin(active, normX = 0.5, normY = 0.5) {
    if (!this.initialized || !this.isThereminActive || !this.enabled) return;
    const now = this.ctx.currentTime;

    if (!active) {
      this.thereminGain.gain.setTargetAtTime(0, now, 0.08);
      return;
    }

    const freq = 120 + normX * 600;
    const vol = Math.min(0.25, 0.05 + (1 - normY) * 0.2);

    this.thereminOsc.frequency.setTargetAtTime(freq, now, 0.04);
    this.thereminGain.gain.setTargetAtTime(vol, now, 0.04);
  }

  // --- Biological & Celestial Event FX ---
  playEat(isCarnivore = false) {
    if (!this.initialized || !this.isEventsActive || !this.enabled) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    if (isCarnivore) {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.15);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, now);
      filter.frequency.exponentialRampToValueAtTime(100, now + 0.15);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    } else {
      const scale = this.scales[this.currentScale];
      const randomNote = scale[Math.floor(Math.random() * scale.length)] * 2;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(randomNote, now);
      osc.frequency.exponentialRampToValueAtTime(randomNote * 1.5, now + 0.12);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(randomNote, now);
      filter.Q.setValueAtTime(6.0, now);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    }

    osc.start(now);
    osc.stop(now + 0.2);
  }

  playBirth() {
    if (!this.initialized || !this.isEventsActive || !this.enabled) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    const baseFreq = 440;
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 2, now + 0.25);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.32);
  }

  playCosmicRay() {
    if (!this.initialized || !this.enabled) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.3);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.36);
  }

  // Dual Visualizer Renderer: Waveform vs Frequency Spectrum
  startScopeVisualizer() {
    const draw = () => {
      requestAnimationFrame(draw);
      if (!this.scopeCtx || !this.analyser || !this.scopeCanvas) return;

      const width = this.scopeCanvas.width;
      const height = this.scopeCanvas.height;
      const ctx = this.scopeCtx;

      ctx.fillStyle = 'rgba(3, 7, 18, 0.35)';
      ctx.fillRect(0, 0, width, height);

      if (this.vizMode === 'frequency') {
        // Frequency Spectrum Bars
        this.analyser.getByteFrequencyData(this.freqData);
        const barCount = 32;
        const barWidth = width / barCount;

        for (let i = 0; i < barCount; i++) {
          const val = this.freqData[i * 4] / 255.0;
          const barHeight = val * (height - 4);
          const hue = 180 + i * 4;

          ctx.fillStyle = this.enabled ? `hsl(${hue}, 100%, 55%)` : '#475569';
          ctx.fillRect(i * barWidth, height - barHeight, barWidth - 1, barHeight);
        }
      } else {
        // Waveform Oscilloscope
        this.analyser.getByteTimeDomainData(this.timeData);
        ctx.lineWidth = 1.8;
        ctx.strokeStyle = this.enabled ? '#00f0ff' : '#475569';
        ctx.shadowColor = this.enabled ? 'rgba(0, 240, 255, 0.6)' : 'transparent';
        ctx.shadowBlur = 4;

        ctx.beginPath();
        const sliceWidth = width / this.timeData.length;
        let x = 0;

        for (let i = 0; i < this.timeData.length; i++) {
          const v = this.timeData[i] / 128.0;
          const y = (v * height) / 2;

          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          x += sliceWidth;
        }

        ctx.lineTo(width, height / 2);
        ctx.stroke();
      }
    };

    draw();
  }
}
