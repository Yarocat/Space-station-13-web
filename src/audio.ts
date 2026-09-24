// Procedural Web Audio synthesizer and authentic TGStation audio bridge
import { soundManager, TG_SOUNDS } from './systems/soundManager';

let audioCtx: AudioContext | null = null;
let soundEnabled = true;

// Preload common station sound effects in background
if (typeof window !== 'undefined') {
  soundManager.preloadCommonSounds().catch(() => {});
}

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function toggleAudio(enabled?: boolean): boolean {
  if (enabled !== undefined) {
    soundEnabled = enabled;
  } else {
    soundEnabled = !soundEnabled;
  }
  soundManager.setMuted('master', !soundEnabled);
  if (soundEnabled) {
    getAudioContext();
    soundManager.unlockAudioContext();
  }
  return soundEnabled;
}

export function isAudioEnabled(): boolean {
  return soundEnabled && !soundManager.isMuted('master');
}

export const SoundSystem = {
  step(isClown: boolean = false, targetX?: number, targetY?: number, playerX?: number, playerY?: number) {
    if (!soundEnabled) return;
    if (targetX !== undefined && targetY !== undefined && playerX !== undefined && playerY !== undefined) {
      soundManager.playSound(
        isClown ? TG_SOUNDS.BIKE_HORN : TG_SOUNDS.FOOTSTEP_CARPET,
        targetX,
        targetY,
        playerX,
        playerY,
        12,
        { category: 'effects', volume: isClown ? 0.4 : 0.25, playbackRate: 0.9 + Math.random() * 0.2 }
      );
      return;
    }

    soundManager.play(isClown ? TG_SOUNDS.BIKE_HORN : TG_SOUNDS.FOOTSTEP_CARPET, {
      category: 'effects',
      volume: isClown ? 0.35 : 0.2,
      playbackRate: 0.95 + Math.random() * 0.1,
    });
  },

  door(open: boolean = true, targetX?: number, targetY?: number, playerX?: number, playerY?: number) {
    if (!soundEnabled) return;
    const sound = open ? TG_SOUNDS.AIRLOCK_OPEN : TG_SOUNDS.AIRLOCK_CLOSE;
    if (targetX !== undefined && targetY !== undefined && playerX !== undefined && playerY !== undefined) {
      soundManager.playSound(sound, targetX, targetY, playerX, playerY, 16, {
        category: 'effects',
        volume: 0.8,
      });
      return;
    }
    soundManager.play(sound, { category: 'effects', volume: 0.75 });
  },

  closet(open: boolean = true, targetX?: number, targetY?: number, playerX?: number, playerY?: number) {
    if (!soundEnabled) return;
    const sound = open ? TG_SOUNDS.CLOSET_OPEN : TG_SOUNDS.CLOSET_CLOSE;
    if (targetX !== undefined && targetY !== undefined && playerX !== undefined && playerY !== undefined) {
      soundManager.playSound(sound, targetX, targetY, playerX, playerY, 15, {
        category: 'effects',
        volume: 0.85,
      });
      return;
    }
    soundManager.play(sound, { category: 'effects', volume: 0.8 });
  },

  closetLock(locked: boolean = true, targetX?: number, targetY?: number, playerX?: number, playerY?: number) {
    if (!soundEnabled) return;
    const sound = locked ? TG_SOUNDS.CLOSET_LOCK : TG_SOUNDS.CLOSET_UNLOCK;
    if (targetX !== undefined && targetY !== undefined && playerX !== undefined && playerY !== undefined) {
      soundManager.playSound(sound, targetX, targetY, playerX, playerY, 15, {
        category: 'effects',
        volume: 0.85,
      });
      return;
    }
    soundManager.play(sound, { category: 'effects', volume: 0.8 });
  },

  airlock(targetX?: number, targetY?: number, playerX?: number, playerY?: number) {
    if (!soundEnabled) return;
    if (targetX !== undefined && targetY !== undefined && playerX !== undefined && playerY !== undefined) {
      soundManager.playSound(TG_SOUNDS.AIRLOCK_BOLT_DOWN, targetX, targetY, playerX, playerY, 16, {
        category: 'effects',
        volume: 0.85,
      });
      return;
    }
    soundManager.play(TG_SOUNDS.AIRLOCK_BOLT_DOWN, { category: 'effects', volume: 0.8 });
  },

  laser(targetX?: number, targetY?: number, playerX?: number, playerY?: number) {
    if (!soundEnabled) return;
    const laserSound = Math.random() > 0.5 ? TG_SOUNDS.LASER : TG_SOUNDS.LASER2;
    if (targetX !== undefined && targetY !== undefined && playerX !== undefined && playerY !== undefined) {
      soundManager.playSound(laserSound, targetX, targetY, playerX, playerY, 20, {
        category: 'effects',
        volume: 0.85,
      });
      return;
    }
    soundManager.play(laserSound, { category: 'effects', volume: 0.8 });
  },

  gunshot(targetX?: number, targetY?: number, playerX?: number, playerY?: number) {
    if (!soundEnabled) return;
    if (targetX !== undefined && targetY !== undefined && playerX !== undefined && playerY !== undefined) {
      soundManager.playSound(TG_SOUNDS.GUNSHOT, targetX, targetY, playerX, playerY, 22, {
        category: 'effects',
        volume: 0.9,
      });
      return;
    }
    soundManager.play(TG_SOUNDS.GUNSHOT, { category: 'effects', volume: 0.85 });
  },

  crowbar(targetX?: number, targetY?: number, playerX?: number, playerY?: number) {
    if (!soundEnabled) return;
    if (targetX !== undefined && targetY !== undefined && playerX !== undefined && playerY !== undefined) {
      soundManager.playSound(TG_SOUNDS.CROWBAR, targetX, targetY, playerX, playerY, 12, {
        category: 'effects',
        volume: 0.75,
      });
      return;
    }
    soundManager.play(TG_SOUNDS.CROWBAR, { category: 'effects', volume: 0.7 });
  },

  welder(targetX?: number, targetY?: number, playerX?: number, playerY?: number) {
    if (!soundEnabled) return;
    if (targetX !== undefined && targetY !== undefined && playerX !== undefined && playerY !== undefined) {
      soundManager.playSound(TG_SOUNDS.WELDER, targetX, targetY, playerX, playerY, 14, {
        category: 'effects',
        volume: 0.75,
      });
      return;
    }
    soundManager.play(TG_SOUNDS.WELDER, { category: 'effects', volume: 0.7 });
  },

  honk(targetX?: number, targetY?: number, playerX?: number, playerY?: number) {
    if (!soundEnabled) return;
    if (targetX !== undefined && targetY !== undefined && playerX !== undefined && playerY !== undefined) {
      soundManager.playSound(TG_SOUNDS.BIKE_HORN, targetX, targetY, playerX, playerY, 18, {
        category: 'effects',
        volume: 0.9,
      });
      return;
    }
    soundManager.play(TG_SOUNDS.BIKE_HORN, { category: 'effects', volume: 0.85 });
  },

  pickup() {
    if (!soundEnabled) return;
    soundManager.playUi(TG_SOUNDS.CLICK, 0.5);
  },

  scanner() {
    if (!soundEnabled) return;
    soundManager.playUi(TG_SOUNDS.PEN_CLICK, 0.6);
  },

  wrench(targetX?: number, targetY?: number, playerX?: number, playerY?: number) {
    if (!soundEnabled) return;
    if (targetX !== undefined && targetY !== undefined && playerX !== undefined && playerY !== undefined) {
      soundManager.playSound(TG_SOUNDS.DOOR_CLICK, targetX, targetY, playerX, playerY, 12, {
        category: 'effects',
        volume: 0.7,
      });
      return;
    }
    soundManager.play(TG_SOUNDS.DOOR_CLICK, { category: 'effects', volume: 0.65 });
  },

  alarm() {
    if (!soundEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.linearRampToValueAtTime(600, now + 0.18);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.24);
  },

  punch() {
    if (!soundEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Dull fleshy impact
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.12);

    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  },

  disarm() {
    if (!soundEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Fast shove / rustle
    const bufferSize = Math.floor(ctx.sampleRate * 0.12);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.4));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
  },

  grab() {
    if (!soundEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.linearRampToValueAtTime(140, now + 0.1);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
  },

  equip() {
    if (!soundEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Buckle / snap sound
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.setValueAtTime(840, now + 0.04);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.09);
  },

  slip() {
    if (!soundEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Fast slide pitch ramp down + loud floor thud!
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.2);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.29);
  },

  rattle() {
    if (!soundEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Skeleton bone clicking
    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(900 + i * 150, now + i * 0.04);
      gain.gain.setValueAtTime(0.08, now + i * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.04 + 0.03);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.04);
      osc.stop(now + i * 0.04 + 0.04);
    }
  },

  hiss() {
    if (!soundEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Lizard hiss
    const bufferSize = Math.floor(ctx.sampleRate * 0.25);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 4000;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
  },

  groan() {
    if (!soundEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.linearRampToValueAtTime(75, now + 0.35);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 350;

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.42);
  }
};
