import AudioSynth, { SoundType } from './audioSynth';

export class WhiteNoisePlayer {
  private synth: AudioSynth | null = null;
  private currentSound: SoundType = 'white_noise';
  private isPlaying: boolean = false;
  private volume: number = 0.7;

  constructor() {
    // AudioSynth instance lazy creation on user interaction
  }

  private getSynth(): AudioSynth {
    if (!this.synth) {
      this.synth = new AudioSynth();
    }
    return this.synth;
  }

  public play(sound: SoundType = 'white_noise', volume: number = 0.7, fadeInSec: number = 1) {
    const synth = this.getSynth();
    this.currentSound = sound;
    this.volume = volume;
    this.isPlaying = true;
    synth.startSound(sound, volume, fadeInSec);
  }

  public setVolume(volume: number) {
    this.volume = volume;
    if (this.synth && this.isPlaying) {
      this.synth.setVolume(volume);
    }
  }

  public setSound(sound: SoundType) {
    this.currentSound = sound;
    if (this.synth && this.isPlaying) {
      this.synth.startSound(sound, this.volume, 0.5);
    }
  }

  public stop(fadeOutSec: number = 3): Promise<void> {
    return new Promise((resolve) => {
      if (this.synth && this.isPlaying) {
        this.isPlaying = false;
        this.synth.stopSound(fadeOutSec);
        setTimeout(() => {
          resolve();
        }, fadeOutSec * 1000 + 100);
      } else {
        this.isPlaying = false;
        resolve();
      }
    });
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getCurrentSound(): SoundType {
    return this.currentSound;
  }
}

export const whiteNoisePlayer = new WhiteNoisePlayer();
