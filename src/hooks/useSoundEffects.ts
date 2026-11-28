import { useCallback, useEffect, useState } from 'react';

const MUTE_STORAGE_KEY = 'lingoclub_sfx_muted_v1';
const VOLUME_STORAGE_KEY = 'lingoclub_sfx_volume_v1';

export interface SoundPreferencesState {
  muted: boolean;
  volume: number;
}

class SoundEffectsEngine {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;
  private volume: number = 85;
  private listeners = new Set<(state: SoundPreferencesState) => void>();

  constructor() {
    try {
      if (typeof window !== 'undefined') {
        this.muted = window.localStorage.getItem(MUTE_STORAGE_KEY) === '1';
        const rawVol = window.localStorage.getItem(VOLUME_STORAGE_KEY);
        if (rawVol !== null) {
          const parsed = Number(rawVol);
          if (Number.isFinite(parsed)) {
            this.volume = Math.max(0, Math.min(100, Math.round(parsed)));
          }
        }
      }
    } catch {
      this.muted = false;
      this.volume = 85;
    }
  }

  subscribe(fn: (state: SoundPreferencesState) => void): () => void {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  private notify(): void {
    const snapshot = { muted: this.muted, volume: this.volume };
    this.listeners.forEach((fn) => fn(snapshot));
  }

  private ensureContext(): AudioContext | null {
    if (this.muted || this.volume <= 0 || typeof window === 'undefined') return null;
    try {
      if (!this.ctx) {
        const Ctx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Ctx) return null;
        this.ctx = new Ctx();
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  isMuted(): boolean {
    return this.muted;
  }

  getVolume(): number {
    return this.volume;
  }

  setMuted(nextMuted: boolean): void {
    this.muted = Boolean(nextMuted);
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(MUTE_STORAGE_KEY, this.muted ? '1' : '0');
      }
    } catch {
      // Ignore storage quota errors
    }
    this.notify();
  }

  setVolume(nextVolume: number): void {
    const clamped = Math.max(0, Math.min(100, Math.round(Number(nextVolume) || 0)));
    this.volume = clamped;
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(VOLUME_STORAGE_KEY, String(clamped));
      }
    } catch {
      // Ignore storage quota errors
    }
    this.notify();
  }

  applyPreferences(prefs: { muted?: boolean; volume?: number }): void {
    let changed = false;
    if (typeof prefs.muted === 'boolean' && prefs.muted !== this.muted) {
      this.muted = prefs.muted;
      try {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(MUTE_STORAGE_KEY, this.muted ? '1' : '0');
        }
      } catch {
        // Ignore
      }
      changed = true;
    }
    if (typeof prefs.volume === 'number' && Number.isFinite(prefs.volume)) {
      const clamped = Math.max(0, Math.min(100, Math.round(prefs.volume)));
      if (clamped !== this.volume) {
        this.volume = clamped;
        try {
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(VOLUME_STORAGE_KEY, String(clamped));
          }
        } catch {
          // Ignore
        }
        changed = true;
      }
    }
    if (changed) this.notify();
  }

  toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  private playTone(
    freq: number,
    durationSec: number,
    options: {
      type?: OscillatorType;
      gain?: number;
      delay?: number;
      endFreq?: number;
    } = {},
  ): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const { type = 'sine', gain = 0.08, delay = 0, endFreq } = options;
    const scaledGain = Math.max(0.0002, gain * (this.volume / 100));
    try {
      const now = ctx.currentTime + delay;
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      if (typeof endFreq === 'number') {
        osc.frequency.exponentialRampToValueAtTime(Math.max(24, endFreq), now + durationSec);
      }

      gainNode.gain.setValueAtTime(0.0001, now);
      gainNode.gain.linearRampToValueAtTime(scaledGain, now + 0.012);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + Math.max(0.02, durationSec));

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + durationSec + 0.03);
    } catch {
      // Ignore audio errors when context is blocked
    }
  }

  playClick = (): void => {
    this.playTone(620, 0.045, { type: 'triangle', gain: 0.04, endFreq: 760 });
  };

  playCorrect = (): void => {
    this.playTone(523.25, 0.11, { type: 'triangle', gain: 0.09, delay: 0 });
    this.playTone(659.25, 0.12, { type: 'triangle', gain: 0.09, delay: 0.075 });
    this.playTone(783.99, 0.18, { type: 'sine', gain: 0.09, delay: 0.15 });
  };

  playIncorrect = (): void => {
    this.playTone(230, 0.16, { type: 'sawtooth', gain: 0.055, delay: 0, endFreq: 165 });
    this.playTone(170, 0.2, { type: 'sawtooth', gain: 0.05, delay: 0.12, endFreq: 118 });
  };

  playBuzzer = (): void => {
    this.playTone(440, 0.09, { type: 'square', gain: 0.08, delay: 0, endFreq: 880 });
    this.playTone(880, 0.14, { type: 'triangle', gain: 0.09, delay: 0.08, endFreq: 1046.5 });
    this.playTone(1174.66, 0.22, { type: 'sine', gain: 0.08, delay: 0.17 });
  };

  playCombo = (streak = 2): void => {
    const base = Math.min(880, 440 + streak * 45);
    this.playTone(base, 0.09, { type: 'triangle', gain: 0.08, delay: 0 });
    this.playTone(base * 1.25, 0.12, { type: 'sine', gain: 0.085, delay: 0.065 });
    this.playTone(base * 1.5, 0.16, { type: 'sine', gain: 0.09, delay: 0.13 });
  };

  playTransition = (): void => {
    this.playTone(392, 0.07, { type: 'sine', gain: 0.04, delay: 0, endFreq: 523.25 });
  };

  playTurnSwap = (): void => {
    this.playTone(440, 0.09, { type: 'triangle', gain: 0.06, delay: 0 });
    this.playTone(587.33, 0.12, { type: 'triangle', gain: 0.065, delay: 0.08 });
  };

  playUnlock = (): void => {
    this.playTone(587.33, 0.09, { type: 'sine', gain: 0.075, delay: 0 });
    this.playTone(739.99, 0.1, { type: 'sine', gain: 0.08, delay: 0.08 });
    this.playTone(880, 0.14, { type: 'triangle', gain: 0.085, delay: 0.16 });
    this.playTone(1174.66, 0.22, { type: 'sine', gain: 0.09, delay: 0.24 });
  };

  playTick = (urgent = false): void => {
    this.playTone(urgent ? 940 : 660, 0.04, { type: 'square', gain: urgent ? 0.045 : 0.025 });
  };

  playStickerPop = (): void => {
    this.playTone(480, 0.055, { type: 'sine', gain: 0.06, delay: 0, endFreq: 860 });
    this.playTone(960, 0.06, { type: 'triangle', gain: 0.05, delay: 0.05 });
  };

  playFanfare = (): void => {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, idx) => {
      this.playTone(n, idx === notes.length - 1 ? 0.28 : 0.12, {
        type: 'triangle',
        gain: 0.085,
        delay: idx * 0.09,
      });
    });
  };

  playHostAlert = (): void => {
    this.playTone(698.46, 0.09, { type: 'sine', gain: 0.065, delay: 0 });
    this.playTone(523.25, 0.14, { type: 'triangle', gain: 0.07, delay: 0.09 });
  };
}

export const soundEngine = new SoundEffectsEngine();

export interface UseSoundEffectsResult {
  muted: boolean;
  volume: number;
  setMuted: (muted: boolean) => void;
  setVolume: (volume: number) => void;
  applyPreferences: (prefs: { muted?: boolean; volume?: number }) => void;
  toggleMute: () => boolean;
  playClick: () => void;
  playCorrect: () => void;
  playSuccess: () => void;
  playIncorrect: () => void;
  playError: () => void;
  playBuzzer: () => void;
  playCombo: (streak?: number) => void;
  playTransition: () => void;
  playReveal: () => void;
  playFlip: () => void;
  playTurnSwap: () => void;
  playUnlock: () => void;
  playBadgeUnlock: () => void;
  playTick: (urgent?: boolean) => void;
  playStickerPop: () => void;
  playPop: () => void;
  playFanfare: () => void;
  playHostAlert: () => void;
}

export type SoundEffectsApi = UseSoundEffectsResult;

export function useSoundEffects(): UseSoundEffectsResult {
  const [state, setState] = useState<SoundPreferencesState>(() => ({
    muted: soundEngine.isMuted(),
    volume: soundEngine.getVolume(),
  }));

  useEffect(() => {
    return soundEngine.subscribe((next) => setState(next));
  }, []);

  const setMuted = useCallback((next: boolean) => {
    soundEngine.setMuted(next);
  }, []);

  const setVolume = useCallback((next: number) => {
    soundEngine.setVolume(next);
  }, []);

  const applyPreferences = useCallback((prefs: { muted?: boolean; volume?: number }) => {
    soundEngine.applyPreferences(prefs);
  }, []);

  const toggleMute = useCallback(() => {
    return soundEngine.toggleMute();
  }, []);

  return {
    muted: state.muted,
    volume: state.volume,
    setMuted,
    setVolume,
    applyPreferences,
    toggleMute,
    playClick: soundEngine.playClick,
    playCorrect: soundEngine.playCorrect,
    playSuccess: soundEngine.playCorrect,
    playIncorrect: soundEngine.playIncorrect,
    playError: soundEngine.playIncorrect,
    playBuzzer: soundEngine.playBuzzer,
    playCombo: soundEngine.playCombo,
    playTransition: soundEngine.playTransition,
    playReveal: soundEngine.playTransition,
    playFlip: soundEngine.playTransition,
    playTurnSwap: soundEngine.playTurnSwap,
    playUnlock: soundEngine.playUnlock,
    playBadgeUnlock: soundEngine.playUnlock,
    playTick: soundEngine.playTick,
    playStickerPop: soundEngine.playStickerPop,
    playPop: soundEngine.playStickerPop,
    playFanfare: soundEngine.playFanfare,
    playHostAlert: soundEngine.playHostAlert,
  };
}
