export type SoundType = 'white_noise' | 'rain' | 'womb';

class AudioSynth {
  private ctx: AudioContext | null = null;
  private noiseNode: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private pulseOsc: OscillatorNode | null = null;
  private pulseGain: GainNode | null = null;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private createNoiseBuffer(type: SoundType): AudioBuffer {
    if (!this.ctx) throw new Error('AudioContext not initialized');
    const bufferSize = this.ctx.sampleRate * 3; // 3 seconds buffer
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0.0;
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;

      if (type === 'white_noise') {
        data[i] = white * 0.2;
      } else if (type === 'rain') {
        // Pink noise approximation for rain sound
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
        b6 = white * 0.115926;
      } else if (type === 'womb') {
        // Brown noise for deep womb environment
        lastOut = (lastOut + (0.02 * white)) / 1.02;
        data[i] = lastOut * 1.5;
      }
    }

    return buffer;
  }

  public startSound(type: SoundType, volume: number = 0.7, fadeInSec: number = 1) {
    this.stopSound(0);
    this.initContext();
    if (!this.ctx) return;

    const buffer = this.createNoiseBuffer(type);
    this.noiseNode = this.ctx.createBufferSource();
    this.noiseNode.buffer = buffer;
    this.noiseNode.loop = true;

    this.gainNode = this.ctx.createGain();
    const now = this.ctx.currentTime;
    
    // Start at 0 for fade in
    this.gainNode.gain.setValueAtTime(0.001, now);
    this.gainNode.gain.exponentialRampToValueAtTime(Math.max(volume, 0.001), now + Math.max(fadeInSec, 0.1));

    if (type === 'rain') {
      this.filterNode = this.ctx.createBiquadFilter();
      this.filterNode.type = 'lowpass';
      this.filterNode.frequency.setValueAtTime(1000, now);
      this.noiseNode.connect(this.filterNode);
      this.filterNode.connect(this.gainNode);
    } else if (type === 'womb') {
      this.filterNode = this.ctx.createBiquadFilter();
      this.filterNode.type = 'lowpass';
      this.filterNode.frequency.setValueAtTime(350, now);

      // Heartbeat pulse modulation
      this.pulseOsc = this.ctx.createOscillator();
      this.pulseOsc.type = 'sine';
      this.pulseOsc.frequency.setValueAtTime(1.2, now); // ~72 BPM pulse

      this.pulseGain = this.ctx.createGain();
      this.pulseGain.gain.setValueAtTime(100, now);

      this.pulseOsc.connect(this.pulseGain);
      this.pulseGain.connect(this.filterNode.frequency);
      this.pulseOsc.start(now);

      this.noiseNode.connect(this.filterNode);
      this.filterNode.connect(this.gainNode);
    } else {
      this.noiseNode.connect(this.gainNode);
    }

    this.gainNode.connect(this.ctx.destination);
    this.noiseNode.start(now);
  }

  public setVolume(volume: number) {
    if (this.gainNode && this.ctx) {
      const now = this.ctx.currentTime;
      this.gainNode.gain.linearRampToValueAtTime(Math.max(volume, 0.001), now + 0.1);
    }
  }

  public stopSound(fadeOutSec: number = 3) {
    if (this.gainNode && this.ctx && fadeOutSec > 0) {
      const now = this.ctx.currentTime;
      this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, now);
      this.gainNode.gain.exponentialRampToValueAtTime(0.0001, now + fadeOutSec);
      
      const currentNoiseNode = this.noiseNode;
      const currentPulseOsc = this.pulseOsc;
      
      setTimeout(() => {
        try {
          currentNoiseNode?.stop();
          currentNoiseNode?.disconnect();
          currentPulseOsc?.stop();
          currentPulseOsc?.disconnect();
        } catch {
          // ignore cleanup errors if already stopped
        }
      }, fadeOutSec * 1000);

      this.noiseNode = null;
      this.pulseOsc = null;
      this.gainNode = null;
      this.filterNode = null;
    } else {
      try {
        this.noiseNode?.stop();
        this.noiseNode?.disconnect();
        this.pulseOsc?.stop();
        this.pulseOsc?.disconnect();
      } catch {
        // ignore cleanup errors
      }
      this.noiseNode = null;
      this.pulseOsc = null;
      this.gainNode = null;
      this.filterNode = null;
    }
  }
}

export default AudioSynth;
