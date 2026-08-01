export type SensitivityLevel = 'low' | 'medium' | 'high';

export interface CryDetectorCallbacks {
  onCryDetected: () => void;
  onVolumeChange?: (dbLevel: number, rawRms: number) => void;
  onError?: (err: Error) => void;
}

export class CryDetector {
  private mediaStream: MediaStream | null = null;
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private animFrameId: number | null = null;
  private sustainedThresholdStartTime: number | null = null;
  private isListening: boolean = false;
  private sensitivity: SensitivityLevel = 'medium';

  // Thresholds in RMS (0 to 1) or approximate dB scale
  private sensitivityThresholds: Record<SensitivityLevel, number> = {
    high: 0.08,    // ~ Sensitive threshold (screams/crying or moderate vocalization)
    medium: 0.15,   // ~ Balanced threshold (clear continuous crying)
    low: 0.28,     // ~ Higher threshold (loud sustained crying)
  };

  public async start(sensitivity: SensitivityLevel, callbacks: CryDetectorCallbacks): Promise<void> {
    this.stop();
    this.sensitivity = sensitivity;

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioCtx();
      if (this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume();
      }

      const sourceNode = this.audioCtx.createMediaStreamSource(this.mediaStream);
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.8;
      sourceNode.connect(this.analyser);

      this.isListening = true;
      this.sustainedThresholdStartTime = null;

      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const targetThreshold = this.sensitivityThresholds[this.sensitivity];
      const SUSTAIN_DURATION_MS = 3000; // Must be continuous > 3 seconds

      const analyzeFrame = () => {
        if (!this.isListening || !this.analyser) return;

        this.analyser.getByteTimeDomainData(dataArray);

        // Calculate RMS (Root Mean Square)
        let sumSquares = 0;
        for (let i = 0; i < bufferLength; i++) {
          const norm = (dataArray[i] - 128) / 128; // Normalize -1 to 1
          sumSquares += norm * norm;
        }
        const rms = Math.sqrt(sumSquares / bufferLength);

        // Approximate dB level (-100 to 0)
        const db = rms > 0 ? 20 * Math.log10(rms) : -100;

        if (callbacks.onVolumeChange) {
          callbacks.onVolumeChange(Math.max(-100, Math.round(db)), rms);
        }

        const now = Date.now();

        if (rms >= targetThreshold) {
          if (this.sustainedThresholdStartTime === null) {
            this.sustainedThresholdStartTime = now;
          } else {
            const timeAboveThreshold = now - this.sustainedThresholdStartTime;
            if (timeAboveThreshold >= SUSTAIN_DURATION_MS) {
              // Trigger Cry Detected!
              this.stop();
              callbacks.onCryDetected();
              return;
            }
          }
        } else {
          // Reset continuous counter if sound drops below threshold
          this.sustainedThresholdStartTime = null;
        }

        this.animFrameId = requestAnimationFrame(analyzeFrame);
      };

      analyzeFrame();
    } catch (err) {
      this.stop();
      if (callbacks.onError) {
        callbacks.onError(err as Error);
      } else {
        console.error('Failed to start CryDetector:', err);
      }
    }
  }

  public stop() {
    this.isListening = false;
    this.sustainedThresholdStartTime = null;

    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      this.audioCtx.close().catch(() => {});
      this.audioCtx = null;
    }

    this.analyser = null;
  }

  public getIsListening(): boolean {
    return this.isListening;
  }
}

export const cryDetector = new CryDetector();
