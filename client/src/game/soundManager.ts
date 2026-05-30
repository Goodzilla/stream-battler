// Web Audio API Programmatic Synthesizer for Retro-Neon Combat Sound & Music
class SoundManager {
  private ctx: AudioContext | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  
  private masterVolume: number = 0.3;
  private musicVolume: number = 0.1;

  // Throttling to prevent overlapping audio overload
  private lastHitTime: number = 0;
  private lastCritTime: number = 0;

  // Background Music Loop
  private schedulerTimerId: any = null;
  private isMusicPlaying: boolean = false;
  private beatDuration: number = 60 / 115; // duration of one beat in seconds (around 0.52s, 115 BPM)
  private nextBeatTime: number = 0;
  private currentBeat: number = 0;
  private scheduleAheadTime: number = 0.1; // schedule 100ms ahead

  constructor() {
    try {
      const savedMaster = localStorage.getItem('masterVolume');
      if (savedMaster !== null) this.masterVolume = parseFloat(savedMaster);
      const savedMusic = localStorage.getItem('musicVolume');
      if (savedMusic !== null) this.musicVolume = parseFloat(savedMusic);
    } catch (err) {
      console.warn("Failed to load volume preferences:", err);
    }
  }

  public getMasterVolume(): number {
    return this.masterVolume;
  }

  public getMusicVolume(): number {
    return this.musicVolume;
  }

  public init() {
    if (this.ctx) return;

    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;

      this.ctx = new AudioCtxClass();
      
      // 1. Create Dynamics Compressor Node at output to avoid clipping/deafening levels
      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-18, this.ctx.currentTime);
      this.compressor.knee.setValueAtTime(8, this.ctx.currentTime);
      this.compressor.ratio.setValueAtTime(12, this.ctx.currentTime);
      this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
      this.compressor.release.setValueAtTime(0.08, this.ctx.currentTime);
      this.compressor.connect(this.ctx.destination);

      // 2. Setup Master Gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
      this.masterGain.connect(this.compressor);

      // 3. Setup Music Gain
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
      this.musicGain.connect(this.compressor);

    } catch (err) {
      console.warn("Failed to initialize Web Audio API:", err);
    }
  }

  private resumeContext(): boolean {
    this.init();
    if (!this.ctx) return false;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return true;
  }

  public setVolume(master: number, music: number) {
    this.masterVolume = master;
    this.musicVolume = music;
    try {
      localStorage.setItem('masterVolume', String(master));
      localStorage.setItem('musicVolume', String(music));
    } catch {}

    if (this.ctx) {
      if (this.masterGain) {
        this.masterGain.gain.setValueAtTime(master, this.ctx.currentTime);
      }
      if (this.musicGain) {
        this.musicGain.gain.setValueAtTime(music, this.ctx.currentTime);
      }
    }
  }

  // Generate White Noise Buffer
  private createNoiseBuffer(): AudioBuffer {
    if (!this.ctx) throw new Error("AudioContext not ready");
    const bufferSize = this.ctx.sampleRate * 0.4; // 400ms buffer
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  // --- SOUND EFFECTS ---

  // 1. Play Hit Sound (sine sweep decaying from 120Hz to 35Hz + noise snap)
  public playHit() {
    if (!this.resumeContext()) return;
    const now = Date.now();
    if (now - this.lastHitTime < 80) return; // Rate-limit / throttle hit sounds
    this.lastHitTime = now;

    const ctx = this.ctx!;
    const time = ctx.currentTime;

    // A. Kick-like low thud
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.connect(gainNode);
    gainNode.connect(this.masterGain!);

    osc.frequency.setValueAtTime(130, time);
    osc.frequency.exponentialRampToValueAtTime(35, time + 0.08);

    gainNode.gain.setValueAtTime(0.35, time);
    gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.08);

    osc.start(time);
    osc.stop(time + 0.08);

    // B. Noise click/snap
    try {
      const noise = ctx.createBufferSource();
      noise.buffer = this.createNoiseBuffer();
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1000, time);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.12, time);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.03);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.masterGain!);

      noise.start(time);
      noise.stop(time + 0.03);
    } catch {}
  }

  // 2. Play Critical Hit (High metallic ring clang + loud hit snap)
  public playCrit() {
    if (!this.resumeContext()) return;
    const now = Date.now();
    if (now - this.lastCritTime < 80) return;
    this.lastCritTime = now;

    const ctx = this.ctx!;
    const time = ctx.currentTime;

    // Metallic ring (combining two high frequency oscillators)
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(880, time);
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1440, time);

    gainNode.gain.setValueAtTime(0.28, time);
    gainNode.gain.exponentialRampToValueAtTime(0.005, time + 0.22);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(this.masterGain!);

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + 0.22);
    osc2.stop(time + 0.22);

    // White noise explosion blast
    try {
      const noise = ctx.createBufferSource();
      noise.buffer = this.createNoiseBuffer();
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(3000, time);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.20, time);
      noiseGain.gain.exponentialRampToValueAtTime(0.005, time + 0.12);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.masterGain!);

      noise.start(time);
      noise.stop(time + 0.12);
    } catch {}
  }

  // 3. Play Active Skill Sound (Ascending pitch sweeps)
  public playSkill() {
    if (!this.resumeContext()) return;

    const ctx = this.ctx!;
    const time = ctx.currentTime;

    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gainNode = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(650, time + 0.28);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(250, time);
    filter.frequency.exponentialRampToValueAtTime(1200, time + 0.28);
    filter.Q.setValueAtTime(3, time);

    gainNode.gain.setValueAtTime(0.28, time);
    gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.32);

    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.masterGain!);

    osc.start(time);
    osc.stop(time + 0.32);
  }

  // 4. Play Victory Trumpet Fanfare (ascending brass triad chords: C4 -> E4 -> G4 -> C5)
  public playVictory() {
    if (!this.resumeContext()) return;
    this.stopMusic();

    const ctx = this.ctx!;
    const start = ctx.currentTime;
    const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
    const durations = [0.14, 0.14, 0.14, 0.70];
    const offsets = [0, 0.14, 0.28, 0.42];

    notes.forEach((freq, i) => {
      const time = start + offsets[i];
      const dur = durations[i];

      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gainNode = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(freq * 3, time);
      filter.frequency.exponentialRampToValueAtTime(freq * 1.5, time + dur);

      gainNode.gain.setValueAtTime(0, time);
      gainNode.gain.linearRampToValueAtTime(0.06, time + 0.03); // Quick fade-in (lowered gain)
      gainNode.gain.exponentialRampToValueAtTime(0.005, time + dur);

      osc.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(this.masterGain!);

      osc.start(time);
      osc.stop(time + dur);
    });
  }

  // 5. Play Defeat Fail Sound (sad descending slow brass: C4 -> B3 -> Bb3 -> A3)
  public playDefeat() {
    if (!this.resumeContext()) return;
    this.stopMusic();

    const ctx = this.ctx!;
    const start = ctx.currentTime;
    const notes = [261.63, 246.94, 233.08, 220.00]; // C4, B3, Bb3, A3
    const durations = [0.22, 0.22, 0.22, 0.85];
    const offsets = [0, 0.22, 0.44, 0.66];

    notes.forEach((freq, i) => {
      const time = start + offsets[i];
      const dur = durations[i];

      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gainNode = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, time);
      
      // Add a sad vibrato to the final note
      if (i === 3) {
        osc.frequency.linearRampToValueAtTime(freq - 6, time + 0.3);
        osc.frequency.linearRampToValueAtTime(freq + 4, time + 0.6);
        osc.frequency.linearRampToValueAtTime(freq - 2, time + 0.8);
      }

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(freq * 2.5, time);
      filter.frequency.exponentialRampToValueAtTime(freq * 0.8, time + dur);

      gainNode.gain.setValueAtTime(0, time);
      gainNode.gain.linearRampToValueAtTime(0.07, time + 0.04); // Quick fade-in (lowered gain)
      gainNode.gain.exponentialRampToValueAtTime(0.005, time + dur);

      osc.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(this.masterGain!);

      osc.start(time);
      osc.stop(time + dur);
    });
  }

  // --- PROCEDURAL BACKGROUND MUSIC SYNTHESIS ---

  // Starts the scheduler loop for the rhythmic synth drum pulse
  public startMusic() {
    if (this.isMusicPlaying) return;
    if (!this.resumeContext()) return;

    this.isMusicPlaying = true;
    this.nextBeatTime = this.ctx!.currentTime;
    this.currentBeat = 0;

    // Run scheduler timer (checks frequently to cue audio nodes)
    this.schedulerTimerId = setInterval(() => {
      this.schedulerLoop();
    }, 40);
  }

  // Stop music loop
  public stopMusic() {
    if (!this.isMusicPlaying) return;
    this.isMusicPlaying = false;
    if (this.schedulerTimerId) {
      clearInterval(this.schedulerTimerId);
      this.schedulerTimerId = null;
    }
  }

  private schedulerLoop() {
    const ctx = this.ctx!;
    // Schedule notes slightly in advance to protect against timing gaps
    while (this.nextBeatTime < ctx.currentTime + this.scheduleAheadTime) {
      this.playMusicBeat(this.currentBeat, this.nextBeatTime);
      this.nextBeatTime += this.beatDuration / 2; // 8th note division
      this.currentBeat = (this.currentBeat + 1) % 16;
    }
  }

  private playMusicBeat(beat: number, time: number) {
    const ctx = this.ctx!;

    // 1. Kick Drum (Triggered on beats 0, 4, 8, 12)
    if (beat % 4 === 0) {
      const kickOsc = ctx.createOscillator();
      const kickGain = ctx.createGain();
      kickOsc.connect(kickGain);
      kickGain.connect(this.musicGain!);

      kickOsc.frequency.setValueAtTime(80, time);
      kickOsc.frequency.exponentialRampToValueAtTime(42, time + 0.15);

      kickGain.gain.setValueAtTime(0.42, time);
      kickGain.gain.exponentialRampToValueAtTime(0.005, time + 0.15);

      kickOsc.start(time);
      kickOsc.stop(time + 0.15);
    }

    // 2. Off-beat Bass Pulse (Triggered on 2, 6, 10, 14)
    if (beat % 4 === 2) {
      const bassOsc = ctx.createOscillator();
      const bassGain = ctx.createGain();
      bassOsc.connect(bassGain);
      bassGain.connect(this.musicGain!);

      bassOsc.type = 'triangle';
      bassOsc.frequency.setValueAtTime(55, time); // A1 note
      
      bassGain.gain.setValueAtTime(0, time);
      bassGain.gain.linearRampToValueAtTime(0.35, time + 0.02);
      bassGain.gain.exponentialRampToValueAtTime(0.005, time + 0.12);

      bassOsc.start(time);
      bassOsc.stop(time + 0.12);
    }

    // 3. Hi-Hat ticking (Triggered on all odd beats 1, 3, 5, 7, ... and slightly louder on 2, 6)
    if (beat % 2 === 1 || beat % 4 === 2) {
      try {
        const hhSource = ctx.createBufferSource();
        hhSource.buffer = this.createNoiseBuffer();
        
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(8000, time);

        const hhGain = ctx.createGain();
        const volume = (beat % 4 === 2) ? 0.05 : 0.025;
        
        hhGain.gain.setValueAtTime(volume, time);
        hhGain.gain.exponentialRampToValueAtTime(0.002, time + 0.035);

        hhSource.connect(filter);
        filter.connect(hhGain);
        hhGain.connect(this.musicGain!);

        hhSource.start(time);
        hhSource.stop(time + 0.035);
      } catch {}
    }
  }
}

export const soundManager = new SoundManager();
