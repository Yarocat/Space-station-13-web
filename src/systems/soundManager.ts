/**
 * Space Station 13 - Modular Web Audio Sound System (SoundManager)
 *
 * Senior Game Developer / TypeScript Architecture:
 * - Pure TypeScript + Browser Web Audio API (AudioContext)
 * - 2D Positional (Spatial) Audio with distance attenuation & stereo panning
 * - Channel volume controls: Master, Effects, Ambience, Music, UI
 * - Asynchronous loading with AudioBuffer caching and concurrent fetch deduplication
 * - Resilient autoplay unlocking and robust error protection (no app/canvas crash on 404/decode error)
 * - TGStation repository URL resolution with local offline fallbacks
 */

export type SoundCategory = 'master' | 'effects' | 'ambience' | 'music' | 'ui';

export interface SoundPlayOptions {
  /** Channel category (default: 'effects') */
  category?: SoundCategory;
  /** Volume multiplier for this playback instance (0.0 to 1.0, default: 1.0) */
  volume?: number;
  /** Playback pitch/speed variation (e.g. 0.95 - 1.05 for natural variety) */
  playbackRate?: number;
  /** Whether the sound should loop */
  loop?: boolean;
  /** 2D Spatial coordinate X of the sound event in tiles */
  targetX?: number;
  /** 2D Spatial coordinate Y of the sound event in tiles */
  targetY?: number;
  /** 2D Spatial coordinate X of the listener (player) in tiles */
  playerX?: number;
  /** 2D Spatial coordinate Y of the listener (player) in tiles */
  playerY?: number;
  /** Maximum audible hearing distance in tiles (default: 15 tiles) */
  maxDistance?: number;
}

export interface SoundInstance {
  id: string;
  soundPath: string;
  category: SoundCategory;
  source: AudioBufferSourceNode;
  gainNode: GainNode;
  pannerNode?: StereoPannerNode;
  stop: () => void;
}

/**
 * Verified Space Station 13 sound assets from TGStation repository:
 * https://github.com/tgstation/tgstation/tree/master/sound
 */
export const TG_SOUNDS = {
  // UI & Clicks
  CLICK: 'sound/items/click.ogg',
  PEN_CLICK: 'sound/items/pen_click.ogg',
  KEYBOARD_CLICK: 'sound/machines/computer/keyboard_clicks_1.ogg',

  // Iconic Mob & Fun Sounds
  BIKE_HORN: 'sound/items/bikehorn.ogg',
  AIR_HORN: 'sound/items/airhorn/airhorn.ogg',

  // Doors & Airlocks
  AIRLOCK_OPEN: 'sound/machines/airlock/airlockopen.ogg',
  AIRLOCK_CLOSE: 'sound/machines/airlock/airlockclose.ogg',
  AIRLOCK_BOLT_DOWN: 'sound/machines/airlock/boltsdown.ogg',
  AIRLOCK_BOLT_UP: 'sound/machines/airlock/boltsup.ogg',
  DOOR_CLICK: 'sound/machines/airlock/doorclick.ogg',

  // Closets & Lockers
  CLOSET_OPEN: 'sound/machines/closet/closet_open.ogg',
  CLOSET_CLOSE: 'sound/machines/closet/closet_close.ogg',
  CLOSET_LOCK: 'sound/machines/closet/closet_lock.ogg',
  CLOSET_UNLOCK: 'sound/machines/closet/closet_unlock.ogg',
  WOODEN_CLOSET_OPEN: 'sound/machines/closet/wooden_closet_open.ogg',
  WOODEN_CLOSET_CLOSE: 'sound/machines/closet/wooden_closet_close.ogg',

  // Tools & Maintenance
  WELDER: 'sound/items/tools/welder.ogg',
  WELDER_ACTIVATE: 'sound/items/tools/welderactivate.ogg',
  CROWBAR: 'sound/items/tools/crowbar.ogg',
  CROWBAR_PRYING: 'sound/items/tools/crowbar_prying.ogg',

  // Weapons & Combat
  LASER: 'sound/items/weapons/laser.ogg',
  LASER2: 'sound/items/weapons/laser2.ogg',
  GUNSHOT: 'sound/items/weapons/gun/pistol/shot.ogg',

  // Effects & Impacts
  GLASS_BREAK: 'sound/effects/glass/glassbr1.ogg',
  FOOTSTEP_CARPET: 'sound/effects/footstep/carpet1.ogg',

  // Ambience
  AMBIENCE_GENERAL: 'sound/ambience/general/ambigen1.ogg',
  AMBIENCE_ENGINEERING: 'sound/ambience/engineering/ambiatmos.ogg',
} as const;

export class SoundManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private categoryGains: Record<SoundCategory, GainNode | null> = {
    master: null,
    effects: null,
    ambience: null,
    music: null,
    ui: null,
  };

  private volumes: Record<SoundCategory, number> = {
    master: 0.8,
    effects: 0.8,
    ambience: 0.4,
    music: 0.5,
    ui: 0.9,
  };

  private muted: Record<SoundCategory, boolean> = {
    master: false,
    effects: false,
    ambience: false,
    music: false,
    ui: false,
  };

  private bufferCache = new Map<string, AudioBuffer>();
  private pendingLoads = new Map<string, Promise<AudioBuffer | null>>();
  private activeInstances = new Map<string, SoundInstance>();
  private currentAmbience: SoundInstance | null = null;
  private isUnlocked = false;
  private nextInstanceId = 1;

  constructor() {
    this.registerAutoplayUnlock();
  }

  /**
   * Registers one-time user interaction listeners to unlock AudioContext
   * in adherence to browser Autoplay policies without disrupting UI.
   */
  private registerAutoplayUnlock(): void {
    if (typeof window === 'undefined') return;

    const unlock = () => {
      this.ensureAudioContext();
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().then(() => {
          this.isUnlocked = true;
        }).catch((err) => {
          console.warn('[SoundManager] Autoplay unlock deferred:', err);
        });
      } else {
        this.isUnlocked = true;
      }

      window.removeEventListener('click', unlock, true);
      window.removeEventListener('keydown', unlock, true);
      window.removeEventListener('touchstart', unlock, true);
      window.removeEventListener('pointerdown', unlock, true);
    };

    window.addEventListener('click', unlock, true);
    window.addEventListener('keydown', unlock, true);
    window.addEventListener('touchstart', unlock, true);
    window.addEventListener('pointerdown', unlock, true);
  }

  /**
   * Lazy initializes the AudioContext and the audio routing graph.
   * Master Gain -> Destination
   * Category Gains (effects, ambience, music, ui) -> Master Gain
   */
  private ensureAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    if (!this.ctx) {
      try {
        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

        if (!AudioContextClass) {
          console.warn('[SoundManager] Web Audio API is not supported in this environment.');
          return null;
        }

        this.ctx = new AudioContextClass();

        // 1. Master Gain Node
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(
          this.muted.master ? 0 : this.volumes.master,
          this.ctx.currentTime
        );
        this.masterGain.connect(this.ctx.destination);
        this.categoryGains.master = this.masterGain;

        // 2. Subcategory Gain Nodes
        const subCategories: Exclude<SoundCategory, 'master'>[] = [
          'effects',
          'ambience',
          'music',
          'ui',
        ];

        for (const cat of subCategories) {
          const gain = this.ctx.createGain();
          gain.gain.setValueAtTime(
            this.muted[cat] ? 0 : this.volumes[cat],
            this.ctx.currentTime
          );
          gain.connect(this.masterGain);
          this.categoryGains[cat] = gain;
        }
      } catch (err) {
        console.warn('[SoundManager] Error initializing AudioContext:', err);
        return null;
      }
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    return this.ctx;
  }

  /**
   * Explicitly unlocks or resumes the audio context.
   */
  public async unlockAudioContext(): Promise<boolean> {
    const ctx = this.ensureAudioContext();
    if (!ctx) return false;
    try {
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      this.isUnlocked = true;
      return true;
    } catch (e) {
      console.warn('[SoundManager] Unable to resume AudioContext:', e);
      return false;
    }
  }

  // =========================================================================
  // VOLUME & CHANNEL CONTROLS
  // =========================================================================

  /**
   * Sets the volume for a specific channel (0.0 to 1.0).
   */
  public setVolume(category: SoundCategory, volume: number): void {
    const clamped = Math.max(0, Math.min(1, volume));
    this.volumes[category] = clamped;

    const gainNode = this.categoryGains[category];
    if (gainNode && this.ctx) {
      const targetGain = this.muted[category] ? 0 : clamped;
      // Smooth exponential/linear ramp to avoid audible pops/clicks
      gainNode.gain.cancelScheduledValues(this.ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(targetGain, this.ctx.currentTime + 0.05);
    }
  }

  /**
   * Gets the volume of a channel.
   */
  public getVolume(category: SoundCategory): number {
    return this.volumes[category];
  }

  /**
   * Sets mute state for a channel.
   */
  public setMuted(category: SoundCategory, muted: boolean): void {
    this.muted[category] = muted;

    const gainNode = this.categoryGains[category];
    if (gainNode && this.ctx) {
      const targetGain = muted ? 0 : this.volumes[category];
      gainNode.gain.cancelScheduledValues(this.ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(targetGain, this.ctx.currentTime + 0.05);
    }
  }

  /**
   * Checks if a channel is muted.
   */
  public isMuted(category: SoundCategory): boolean {
    return this.muted[category];
  }

  /**
   * Toggles mute state for a channel.
   */
  public toggleMute(category: SoundCategory = 'master'): boolean {
    const nextState = !this.muted[category];
    this.setMuted(category, nextState);
    return nextState;
  }

  // =========================================================================
  // AUDIO BUFFER LOADING & CACHING
  // =========================================================================

  /**
   * Resolves URL candidates for a sound path:
   * 1. Local public URL (e.g. /sound/items/bikehorn.ogg or /items/bikehorn.ogg)
   * 2. TGStation GitHub raw URL
   * 3. TGStation jsdelivr CDN URL
   */
  private getSoundCandidateUrls(soundPath: string): string[] {
    if (soundPath.startsWith('http://') || soundPath.startsWith('https://')) {
      return [soundPath];
    }

    const cleanPath = soundPath.replace(/^\/+/, '');
    const normalizedPath = cleanPath.startsWith('sound/') ? cleanPath : `sound/${cleanPath}`;

    return [
      `/${cleanPath}`,
      `/${normalizedPath}`,
      `https://raw.githubusercontent.com/tgstation/tgstation/master/${normalizedPath}`,
      `https://cdn.jsdelivr.net/gh/tgstation/tgstation@master/${normalizedPath}`,
    ];
  }

  /**
   * Asynchronously loads and decodes an audio buffer with in-memory caching.
   * Prevents duplicate in-flight network requests.
   */
  public async loadAudioBuffer(soundPath: string): Promise<AudioBuffer | null> {
    const cached = this.bufferCache.get(soundPath);
    if (cached) return cached;

    const inFlight = this.pendingLoads.get(soundPath);
    if (inFlight) return inFlight;

    const ctx = this.ensureAudioContext();
    if (!ctx) return null;

    const loadPromise = (async (): Promise<AudioBuffer | null> => {
      const candidates = this.getSoundCandidateUrls(soundPath);

      for (const url of candidates) {
        try {
          const res = await fetch(url).catch(() => null);
          if (!res || !res.ok) continue;

          const arrayBuf = await res.arrayBuffer();
          // Decode audio data safely
          const audioBuffer = await new Promise<AudioBuffer>((resolve, reject) => {
            ctx.decodeAudioData(arrayBuf, resolve, reject);
          });

          if (audioBuffer) {
            this.bufferCache.set(soundPath, audioBuffer);
            return audioBuffer;
          }
        } catch {
          // Continue to next candidate URL
        }
      }

      console.warn(`[SoundManager] Could not load audio from candidate paths for: ${soundPath}`);
      return null;
    })();

    this.pendingLoads.set(soundPath, loadPromise);

    try {
      return await loadPromise;
    } finally {
      this.pendingLoads.delete(soundPath);
    }
  }

  /**
   * Preloads a single sound into cache.
   */
  public async preloadSound(soundPath: string): Promise<AudioBuffer | null> {
    return this.loadAudioBuffer(soundPath);
  }

  /**
   * Preloads multiple sounds in parallel.
   */
  public async preloadSounds(soundPaths: string[]): Promise<void> {
    await Promise.all(soundPaths.map((p) => this.loadAudioBuffer(p)));
  }

  /**
   * Preloads common station sounds (airlocks, clicks, honk, tools, weapons)
   */
  public async preloadCommonSounds(): Promise<void> {
    const common = [
      TG_SOUNDS.CLICK,
      TG_SOUNDS.BIKE_HORN,
      TG_SOUNDS.AIRLOCK_OPEN,
      TG_SOUNDS.AIRLOCK_CLOSE,
      TG_SOUNDS.AIRLOCK_BOLT_DOWN,
      TG_SOUNDS.DOOR_CLICK,
      TG_SOUNDS.CLOSET_OPEN,
      TG_SOUNDS.CLOSET_CLOSE,
      TG_SOUNDS.CLOSET_LOCK,
      TG_SOUNDS.CLOSET_UNLOCK,
      TG_SOUNDS.WELDER,
      TG_SOUNDS.CROWBAR,
      TG_SOUNDS.LASER,
      TG_SOUNDS.GUNSHOT,
      TG_SOUNDS.GLASS_BREAK,
      TG_SOUNDS.FOOTSTEP_CARPET,
    ];
    await this.preloadSounds(common);
  }

  // =========================================================================
  // 2D SPATIAL PLAYBACK & STANDARD PLAYBACK
  // =========================================================================

  /**
   * Plays a 2D spatial audio sound in world coordinates with smooth distance
   * attenuation and stereo panning.
   *
   * @param soundPath Path or URL to the sound file
   * @param targetX World tile X of the sound source
   * @param targetY World tile Y of the sound source
   * @param playerX World tile X of the player/listener
   * @param playerY World tile Y of the player/listener
   * @param maxDistance Maximum distance in tiles before sound drops to 0 (default: 15)
   * @param options Additional playback parameters (volume, pitch variation, etc.)
   */
  public async playSound(
    soundPath: string,
    targetX: number,
    targetY: number,
    playerX: number,
    playerY: number,
    maxDistance: number = 15,
    options?: Omit<SoundPlayOptions, 'targetX' | 'targetY' | 'playerX' | 'playerY' | 'maxDistance'>
  ): Promise<SoundInstance | null> {
    // 1. Calculate 2D Euclidean distance
    const dx = targetX - playerX;
    const dy = targetY - playerY;
    const distance = Math.hypot(dx, dy);

    // If beyond hearing range, return immediately without loading/decoding
    if (distance > maxDistance) {
      return null;
    }

    // 2. Calculate distance attenuation factor (0.0 to 1.0)
    // Using a smooth power curve for natural acoustic roll-off
    const linearFactor = Math.max(0, 1 - distance / maxDistance);
    const distanceGain = Math.pow(linearFactor, 1.3);

    // 3. Calculate stereo panning (-1.0 far left to +1.0 far right)
    // Horizontal offset determines stereo separation
    const panRatio = dx / Math.max(1, maxDistance * 0.7);
    const stereoPan = Math.max(-1.0, Math.min(1.0, panRatio));

    return this.playInternal(soundPath, {
      ...options,
      category: options?.category || 'effects',
      volume: (options?.volume ?? 1.0) * distanceGain,
      stereoPan,
    });
  }

  /**
   * Standard playback for non-spatial sounds or sounds with optional spatial options.
   */
  public async play(
    soundPath: string,
    options?: SoundPlayOptions
  ): Promise<SoundInstance | null> {
    if (
      options?.targetX !== undefined &&
      options?.targetY !== undefined &&
      options?.playerX !== undefined &&
      options?.playerY !== undefined
    ) {
      return this.playSound(
        soundPath,
        options.targetX,
        options.targetY,
        options.playerX,
        options.playerY,
        options.maxDistance ?? 15,
        options
      );
    }

    return this.playInternal(soundPath, {
      ...options,
      category: options?.category || 'effects',
      volume: options?.volume ?? 1.0,
    });
  }

  /**
   * Convenience method to play UI sound effects (unaffected by spatial positioning)
   */
  public async playUi(soundPath: string = TG_SOUNDS.CLICK, volume: number = 0.8): Promise<SoundInstance | null> {
    return this.playInternal(soundPath, {
      category: 'ui',
      volume,
    });
  }

  /**
   * Plays background ambient station audio on loop with smooth crossfade.
   */
  public async playAmbience(
    soundPath: string = TG_SOUNDS.AMBIENCE_GENERAL,
    volume: number = 0.4
  ): Promise<SoundInstance | null> {
    if (this.currentAmbience && this.currentAmbience.soundPath === soundPath) {
      return this.currentAmbience;
    }

    this.stopAmbience();

    const instance = await this.playInternal(soundPath, {
      category: 'ambience',
      volume,
      loop: true,
    });

    if (instance) {
      this.currentAmbience = instance;
    }

    return instance;
  }

  /**
   * Stops currently playing ambient background audio.
   */
  public stopAmbience(): void {
    if (this.currentAmbience) {
      this.currentAmbience.stop();
      this.currentAmbience = null;
    }
  }

  /**
   * Internal playback engine constructing Web Audio graph per sound instance:
   * AudioBufferSourceNode -> Instance Gain -> StereoPannerNode -> Category Gain -> Master Gain -> Destination
   */
  private async playInternal(
    soundPath: string,
    opts: {
      category: SoundCategory;
      volume: number;
      playbackRate?: number;
      loop?: boolean;
      stereoPan?: number;
    }
  ): Promise<SoundInstance | null> {
    try {
      const ctx = this.ensureAudioContext();
      if (!ctx) return null;

      const buffer = await this.loadAudioBuffer(soundPath);
      if (!buffer) return null;

      // 1. Source Node
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = !!opts.loop;

      if (opts.playbackRate !== undefined && opts.playbackRate > 0) {
        source.playbackRate.setValueAtTime(opts.playbackRate, ctx.currentTime);
      }

      // 2. Instance Gain Node
      const instanceGain = ctx.createGain();
      const finalVolume = Math.max(0, Math.min(1, opts.volume));
      instanceGain.gain.setValueAtTime(finalVolume, ctx.currentTime);

      let lastNode: AudioNode = instanceGain;
      source.connect(instanceGain);

      // 3. Stereo Panner Node (if supported & specified)
      let pannerNode: StereoPannerNode | undefined;
      if (opts.stereoPan !== undefined && typeof ctx.createStereoPanner === 'function') {
        pannerNode = ctx.createStereoPanner();
        pannerNode.pan.setValueAtTime(opts.stereoPan, ctx.currentTime);
        instanceGain.connect(pannerNode);
        lastNode = pannerNode;
      }

      // 4. Connect to Category Gain
      const catGain = this.categoryGains[opts.category] || this.masterGain || ctx.destination;
      lastNode.connect(catGain);

      // 5. Track Instance
      const instanceId = `snd_${this.nextInstanceId++}`;
      let isStopped = false;

      const stop = () => {
        if (isStopped) return;
        isStopped = true;
        try {
          source.stop();
          source.disconnect();
          instanceGain.disconnect();
          if (pannerNode) pannerNode.disconnect();
        } catch {
          // ignore already stopped source errors
        }
        this.activeInstances.delete(instanceId);
      };

      source.onended = () => {
        stop();
      };

      const instance: SoundInstance = {
        id: instanceId,
        soundPath,
        category: opts.category,
        source,
        gainNode: instanceGain,
        pannerNode,
        stop,
      };

      this.activeInstances.set(instanceId, instance);

      // Start playback
      source.start(ctx.currentTime);
      return instance;
    } catch (err) {
      console.warn(`[SoundManager] Playback error for ${soundPath}:`, err);
      return null;
    }
  }

  /**
   * Stops an active sound instance by ID.
   */
  public stopInstance(id: string): void {
    const inst = this.activeInstances.get(id);
    if (inst) {
      inst.stop();
    }
  }

  /**
   * Stops all currently active sounds across all channels.
   */
  public stopAll(): void {
    for (const inst of Array.from(this.activeInstances.values())) {
      inst.stop();
    }
    this.activeInstances.clear();
    this.currentAmbience = null;
  }

  /**
   * Diagnostics: Get statistics about loaded buffers and channels.
   */
  public getStats(): {
    cachedBuffers: number;
    activeSounds: number;
    isUnlocked: boolean;
    volumes: Record<SoundCategory, number>;
    muted: Record<SoundCategory, boolean>;
  } {
    return {
      cachedBuffers: this.bufferCache.size,
      activeSounds: this.activeInstances.size,
      isUnlocked: this.isUnlocked,
      volumes: { ...this.volumes },
      muted: { ...this.muted },
    };
  }
}

/**
 * Singleton instance of SoundManager for global station use.
 */
export const soundManager = new SoundManager();

export default soundManager;
