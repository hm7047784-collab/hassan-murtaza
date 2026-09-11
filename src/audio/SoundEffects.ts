// Web Audio procedural sound engine for authentic GTA V atmosphere

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private radioGain: GainNode | null = null;
  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private sirenOsc1: OscillatorNode | null = null;
  private sirenOsc2: OscillatorNode | null = null;
  private sirenGain: GainNode | null = null;
  private radioInterval: number | null = null;
  private currentRadioStation: string = 'radio_los_santos';
  private isMuted: boolean = false;
  private heliOsc: OscillatorNode | null = null;
  private heliGain: GainNode | null = null;
  private heliModOsc: OscillatorNode | null = null;
  private heliModGain: GainNode | null = null;

  public init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.8;
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.7;
      this.sfxGain.connect(this.masterGain);

      this.radioGain = this.ctx.createGain();
      this.radioGain.gain.value = 0.35;
      this.radioGain.connect(this.masterGain);
    } catch {
      // AudioContext might require user gesture
    }
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Engine sound loop
  public updateEngineSound(speedRatio: number, inVehicle: boolean) {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    if (!inVehicle) {
      if (this.engineGain) {
        this.engineGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
      }
      return;
    }

    if (!this.engineOsc) {
      this.engineOsc = this.ctx.createOscillator();
      this.engineOsc.type = 'sawtooth';
      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.value = 0;

      // Low pass filter for engine roar
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 350;

      this.engineOsc.connect(filter);
      filter.connect(this.engineGain);
      this.engineGain.connect(this.sfxGain!);
      this.engineOsc.start();
    }

    const baseFreq = 45 + Math.abs(speedRatio) * 110;
    this.engineOsc.frequency.setTargetAtTime(baseFreq, this.ctx.currentTime, 0.08);
    const targetVolume = Math.min(0.25, 0.06 + Math.abs(speedRatio) * 0.18);
    this.engineGain?.gain.setTargetAtTime(targetVolume, this.ctx.currentTime, 0.08);
  }

  // Realistic Chopper Rotor Sound (Thump-Thump-Thump)
  public updateHelicopterSound(inHeli: boolean, throttle: number = 0.5) {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    if (!inHeli) {
      if (this.heliGain) {
        this.heliGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.15);
      }
      return;
    }

    if (!this.heliOsc) {
      this.heliOsc = this.ctx.createOscillator();
      this.heliOsc.type = 'triangle';
      this.heliOsc.frequency.value = 65;

      this.heliModOsc = this.ctx.createOscillator();
      this.heliModOsc.type = 'sawtooth';
      this.heliModOsc.frequency.value = 16; // 16 Hz blade chop rate

      this.heliModGain = this.ctx.createGain();
      this.heliModGain.gain.value = 50;
      this.heliModOsc.connect(this.heliModGain);
      this.heliModGain.connect(this.heliOsc.frequency);

      this.heliGain = this.ctx.createGain();
      this.heliGain.gain.value = 0;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 280;

      this.heliOsc.connect(filter);
      filter.connect(this.heliGain);
      this.heliGain.connect(this.sfxGain!);

      this.heliModOsc.start();
      this.heliOsc.start();
    }

    const chopRate = 14 + throttle * 8;
    const baseFreq = 50 + throttle * 25;
    this.heliModOsc?.frequency.setTargetAtTime(chopRate, this.ctx.currentTime, 0.1);
    this.heliOsc.frequency.setTargetAtTime(baseFreq, this.ctx.currentTime, 0.1);
    this.heliGain?.gain.setTargetAtTime(0.28, this.ctx.currentTime, 0.1);
  }

  // Fort Zancudo Military Air-Raid Siren
  public playAirRaidSiren() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(360, now);
    osc.frequency.linearRampToValueAtTime(540, now + 1.2);
    osc.frequency.linearRampToValueAtTime(360, now + 2.4);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 750;

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 3.0);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 3.1);
  }

  // Heavy Tank Cannon Blast
  public playTankCannon() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Sub-bass thump
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(25, now + 0.55);
    oscGain.gain.setValueAtTime(0.7, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc.connect(oscGain);
    oscGain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.65);

    // Explosive metal noise
    this.playNoise(0.7, 0.65, 950);
  }

  // Police Siren
  public setSiren(active: boolean) {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    if (!active) {
      if (this.sirenGain) {
        this.sirenGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
      }
      return;
    }

    if (!this.sirenOsc1) {
      this.sirenOsc1 = this.ctx.createOscillator();
      this.sirenOsc1.type = 'triangle';
      this.sirenGain = this.ctx.createGain();
      this.sirenGain.gain.value = 0;

      this.sirenOsc1.connect(this.sirenGain);
      this.sirenGain.connect(this.sfxGain);
      this.sirenOsc1.start();
    }

    this.sirenGain.gain.setTargetAtTime(0.12, this.ctx.currentTime, 0.1);
    // Oscillate siren pitch between 650Hz and 950Hz
    const t = this.ctx.currentTime;
    const cycle = Math.sin(t * 3.5);
    this.sirenOsc1.frequency.setValueAtTime(800 + cycle * 200, t);
  }

  // Tire Screech on drift
  public playTireScreech() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.3;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1400;
    filter.Q.value = 4.0;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    noise.start();
  }

  // Car Horn
  public playHorn() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.frequency.setValueAtTime(420, now);
    osc2.frequency.setValueAtTime(530, now);
    osc1.type = 'sawtooth';
    osc2.type = 'sawtooth';

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxGain);
    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.5);
    osc2.stop(now + 0.5);
  }

  // Weapons
  public playPistol() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    
    // Punchy click
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.08);

    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.09);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.09);

    // Blast noise
    this.playNoise(0.07, 0.4, 2500);
  }

  public playSMG() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.05);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.06);
    this.playNoise(0.05, 0.3, 3500);
  }

  public playRifle() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.12);

    gain.gain.setValueAtTime(0.7, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.14);
    this.playNoise(0.12, 0.5, 1800);
  }

  public playRPGLaunch() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.25);

    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.3);
  }

  public playExplosion() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    // Sub-bass boom
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(25, now + 0.7);

    gain.gain.setValueAtTime(0.8, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.8);

    // Rumble noise
    this.playNoise(0.6, 0.8, 600);
  }

  public playPunch() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.1);

    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  public playCarCrash() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    this.playNoise(0.25, 0.6, 1200);
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.2);
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  // Wanted Stars alert sound
  public playWantedSting() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    // Dramatic tension brass chord
    [140, 168, 210, 280].forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + idx * 0.04);
      gain.gain.setValueAtTime(0.2, now + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.7);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now + idx * 0.04);
      osc.stop(now + 0.75);
    });
  }

  // Mission Complete fanfare
  public playMissionComplete() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const notes = [261.6, 329.6, 392.0, 523.25]; // C, E, G, C
    notes.forEach((freq, idx) => {
      const now = this.ctx!.currentTime + idx * 0.12;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now);
      osc.stop(now + 0.45);
    });
  }

  // Radio Station procedural music synthesizer
  public setRadio(stationId: string) {
    this.currentRadioStation = stationId;
    if (this.radioInterval) {
      window.clearInterval(this.radioInterval);
      this.radioInterval = null;
    }

    if (stationId === 'off' || !this.ctx || this.isMuted) return;

    let beat = 0;
    // 120 BPM = 125ms per 16th note
    this.radioInterval = window.setInterval(() => {
      if (!this.ctx || this.isMuted || !this.radioGain) return;
      const now = this.ctx.currentTime;
      beat = (beat + 1) % 16;

      if (this.currentRadioStation === 'radio_los_santos') {
        // West Coast Hip Hop (808 Kick on 0, 8, Snare on 4, 12, Hi-hat every 2, Funky synth bass)
        if (beat === 0 || beat === 7 || beat === 10) {
          this.play808Kick(now);
        }
        if (beat === 4 || beat === 12) {
          this.playSnare(now);
        }
        if (beat % 2 === 0) {
          this.playHiHat(now);
        }
        if (beat % 4 === 0) {
          const bassNotes = [55, 55, 65.4, 49]; // A, A, C, G
          const freq = bassNotes[(beat / 4) % bassNotes.length];
          this.playSynthBass(now, freq, 'sawtooth');
        }
      } else if (this.currentRadioStation === 'non_stop_pop') {
        // 80s Synth Pop / Electronic
        if (beat % 4 === 0) {
          this.play808Kick(now);
        }
        if (beat === 4 || beat === 12) {
          this.playSnare(now);
        }
        this.playHiHat(now);
        const popChords = [220, 261.6, 329.6, 293.6];
        if (beat % 2 === 0) {
          this.playLeadNote(now, popChords[(beat / 2) % popChords.length]);
        }
      } else if (this.currentRadioStation === 'west_coast_classics') {
        // G-Funk high whine whistle & deep bass
        if (beat === 0 || beat === 8) this.play808Kick(now);
        if (beat === 4 || beat === 12) this.playSnare(now);
        if (beat === 2 || beat === 6 || beat === 10 || beat === 14) this.playHiHat(now);
        if (beat === 0 || beat === 6) {
          this.playGFunkWhistle(now, 880 + (beat % 2) * 110);
        }
      } else if (this.currentRadioStation === 'vinewood_boulevard') {
        // Alt Rock riff & fast drums
        if (beat % 2 === 0) this.play808Kick(now);
        if (beat % 4 === 2) this.playSnare(now);
        const rockNotes = [82.4, 98, 110, 73.4];
        this.playSynthBass(now, rockNotes[beat % rockNotes.length], 'square');
      }
    }, 125);
  }

  private play808Kick(time: number) {
    if (!this.ctx || !this.radioGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.frequency.setValueAtTime(140, time);
    osc.frequency.exponentialRampToValueAtTime(35, time + 0.12);
    gain.gain.setValueAtTime(0.4, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);
    osc.connect(gain);
    gain.connect(this.radioGain);
    osc.start(time);
    osc.stop(time + 0.16);
  }

  private playSnare(time: number) {
    if (!this.ctx || !this.radioGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, time);
    gain.gain.setValueAtTime(0.2, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.08);
    osc.connect(gain);
    gain.connect(this.radioGain);
    osc.start(time);
    osc.stop(time + 0.09);

    // Snare noise
    const bufferSize = this.ctx.sampleRate * 0.08;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.3;
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const nGain = this.ctx.createGain();
    nGain.gain.setValueAtTime(0.2, time);
    nGain.gain.exponentialRampToValueAtTime(0.01, time + 0.08);
    noise.connect(nGain);
    nGain.connect(this.radioGain);
    noise.start(time);
  }

  private playHiHat(time: number) {
    if (!this.ctx || !this.radioGain) return;
    const bufferSize = this.ctx.sampleRate * 0.03;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.15;
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 7000;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.08, time);
    gain.gain.exponentialRampToValueAtTime(0.005, time + 0.03);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.radioGain);
    noise.start(time);
  }

  private playSynthBass(time: number, freq: number, type: OscillatorType) {
    if (!this.ctx || !this.radioGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, time);
    gain.gain.setValueAtTime(0.25, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.22);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.radioGain);
    osc.start(time);
    osc.stop(time + 0.23);
  }

  private playGFunkWhistle(time: number, freq: number) {
    if (!this.ctx || !this.radioGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);
    osc.frequency.linearRampToValueAtTime(freq + 40, time + 0.2);
    gain.gain.setValueAtTime(0.12, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);
    osc.connect(gain);
    gain.connect(this.radioGain);
    osc.start(time);
    osc.stop(time + 0.35);
  }

  private playLeadNote(time: number, freq: number) {
    if (!this.ctx || !this.radioGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);
    gain.gain.setValueAtTime(0.1, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);
    osc.connect(gain);
    gain.connect(this.radioGain);
    osc.start(time);
    osc.stop(time + 0.16);
  }

  private playNoise(duration: number, volume: number, cutoff: number) {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * volume;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = cutoff;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    noise.start(now);
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.8, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  // GTA V Character Switch Signature Audio Transition (Stratosphere whoosh + sting)
  public playCharacterSwitchSound() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    this.resume();
    const now = this.ctx.currentTime;

    // Sub-bass cinematic boom
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(95, now);
    subOsc.frequency.exponentialRampToValueAtTime(28, now + 1.2);
    subGain.gain.setValueAtTime(0.4, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);
    subOsc.connect(subGain);
    subGain.connect(this.sfxGain);
    subOsc.start(now);
    subOsc.stop(now + 1.45);

    // Filtered aerial wind whoosh
    this.playNoise(1.8, 0.28, 450);

    // High satellite sting chime
    const stingOsc = this.ctx.createOscillator();
    const stingGain = this.ctx.createGain();
    stingOsc.type = 'triangle';
    stingOsc.frequency.setValueAtTime(587.33, now + 0.15); // D5
    stingOsc.frequency.setValueAtTime(880, now + 0.35);    // A5
    stingGain.gain.setValueAtTime(0.001, now);
    stingGain.gain.linearRampToValueAtTime(0.18, now + 0.2);
    stingGain.gain.exponentialRampToValueAtTime(0.001, now + 1.6);
    stingOsc.connect(stingGain);
    stingGain.connect(this.sfxGain);
    stingOsc.start(now + 0.15);
    stingOsc.stop(now + 1.65);
  }

  // Character wheel hover tick
  public playWheelTick() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.04);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.05);
  }
}

export const sound = new SoundEngine();
