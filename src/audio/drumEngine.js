import * as Tone from "tone";
import {safeOutput} from './safeOutput.js';
import { normalizeDrumKitSettings } from "./drumKitConfig.js";
import { nextPadChordNotes } from "./padProgression.js";

const DEFAULT_PAD_PROGRESSION = ["Cmaj7", "Am7", "Fmaj7", "G6"];

export class DrumEngine {
  constructor(settings = {}) {
    this.ready = false;
    this.lastTriggerAt = new Map();
    this.settings = normalizeDrumKitSettings(settings);
    this.samplePlayers = new Map();
    this.sampleUrls = new Map();
    this.sampleNames = new Map();
    this.onSampleStatusChange = null;
    this.padStep = 0;
    this.melodyVoices = new Map();
    this.melodyPreset = "warm";
    this.lastSource = "synth";
  }

  async start({offline=false}={}) {
    if(!offline) await Tone.start();
    if (this.ready) return;

    this.limiter = new Tone.Limiter(-4).connect(safeOutput());
    this.bus = new Tone.Gain(0.55).connect(this.limiter);
    this.parallel = new Tone.Gain(0.16).connect(this.limiter);
    this.reverb = new Tone.Reverb({ decay: 1.15, wet: 0.12 }).connect(this.parallel);
    this.softClip = new Tone.Gain(1).connect(this.bus);

    this.kick = new Tone.MembraneSynth({
      pitchDecay: 0.055,
      octaves: 8,
      oscillator: { type: "sine" },
      envelope: { attack: 0.001, decay: 0.42, sustain: 0.01, release: 0.08 },
      volume: -6,
    }).connect(this.softClip);
    this.kickClick = new Tone.NoiseSynth({
      noise: { type: "white" },
      envelope: { attack: 0.001, decay: 0.012, sustain: 0, release: 0.01 },
      volume: -12,
    }).connect(new Tone.Filter(5200, "highpass").connect(this.bus));

    this.snare = new Tone.NoiseSynth({
      noise: { type: "white" },
      envelope: { attack: 0.001, decay: 0.18, sustain: 0, release: 0.08 },
      volume: -8,
    }).connect(new Tone.Filter(1700, "highpass").connect(this.reverb));
    this.snareBody = new Tone.MembraneSynth({
      pitchDecay: 0.018,
      octaves: 3,
      oscillator: { type: "triangle" },
      envelope: { attack: 0.001, decay: 0.11, sustain: 0, release: 0.05 },
      volume: -8,
    }).connect(this.bus);

    this.hihat = new Tone.NoiseSynth({
      noise: { type: "white" },
      envelope: { attack: 0.001, decay: 0.055, sustain: 0, release: 0.018 },
      volume: -10,
    }).connect(new Tone.Filter(7800, "highpass").connect(this.bus));

    this.tom = new Tone.MembraneSynth({
      pitchDecay: 0.034,
      octaves: 5,
      oscillator: { type: "triangle" },
      envelope: { attack: 0.002, decay: 0.26, sustain: 0.02, release: 0.11 },
      volume: -8,
    }).connect(this.bus);

    this.clap = new Tone.NoiseSynth({
      noise: { type: "pink" },
      envelope: { attack: 0.001, decay: 0.12, sustain: 0.01, release: 0.18 },
      volume: -10,
    }).connect(this.reverb);

    this.pad = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "sine" },
      envelope: { attack: 0.18, decay: 0.35, sustain: 0.72, release: 1.4 },
      volume: -12,
    }).connect(new Tone.Filter(1400, "lowpass").connect(this.reverb));

    this.ready = true;
    await Promise.all(
      Array.from(this.sampleUrls.entries()).map(([instrument, url]) =>
        this.createSamplePlayer(instrument, url),
      ),
    );
  }

  setSettings(settings = {}) {
    this.settings = normalizeDrumKitSettings({
      ...this.settings,
      ...settings,
    });
    for (const [instrument, player] of this.samplePlayers.entries()) {
      const setting = this.settings[instrument];
      if (setting) player.volume.value = setting.volumeDb;
    }
  }

  async loadSample(instrument, file) {
    if (!file) return null;
    this.clearSample(instrument);
    const url = URL.createObjectURL(file);
    this.sampleUrls.set(instrument, url);
    this.sampleNames.set(instrument, file.name);

    let loaded = false;
    if (this.ready) {
      await this.createSamplePlayer(instrument, url);
      loaded = true;
    } else {
      this.notifySampleStatusChange(instrument);
    }
    return { name: file.name, url, loaded };
  }

  clearSample(instrument) {
    const player = this.samplePlayers.get(instrument);
    if (player) {
      player.dispose();
      this.samplePlayers.delete(instrument);
    }
    const url = this.sampleUrls.get(instrument);
    if (url) URL.revokeObjectURL(url);
    this.sampleUrls.delete(instrument);
    this.sampleNames.delete(instrument);
    this.notifySampleStatusChange(instrument);
  }

  sampleStatus(instrument) {
    const name = this.sampleNames.get(instrument) || "";
    const player = this.samplePlayers.get(instrument);
    return {
      name,
      hasSample: !!name,
      loaded: !!player?.loaded,
      source: name ? (player?.loaded ? "sample" : "queued") : "synth",
    };
  }

  notifySampleStatusChange(instrument) {
    if (typeof this.onSampleStatusChange === "function") {
      this.onSampleStatusChange(instrument, this.sampleStatus(instrument));
    }
  }

  async createSamplePlayer(instrument, url) {
    const setting = this.settings[instrument];
    const player = new Tone.Player({
      url,
      fadeOut: 0.012,
      onload: () => this.notifySampleStatusChange(instrument),
    }).connect(this.bus);
    player.volume.value = setting?.volumeDb ?? 0;
    this.samplePlayers.set(instrument, player);
    await waitForLoaded(player, 2500);
    this.notifySampleStatusChange(instrument);
    return player;
  }

  trigger(instrument, velocity = 0.85, options = {}) {
    if (!this.ready) return false;

    const now = performance.now();
    const lastAt = this.lastTriggerAt.get(instrument) ?? -Infinity;
    if (!options.force && now - lastAt < 35) return false;
    this.lastTriggerAt.set(instrument, now);

    const v = Math.max(0.25, Math.min(1, velocity));
    const setting = this.settings[instrument] || {};
    const time = options.time;
    const samplePlayer = this.samplePlayers.get(instrument);
    if (samplePlayer?.loaded) {
      this.lastSource = "sample";
      samplePlayer.stop(time);
      samplePlayer.playbackRate = semitonesToRate(setting.pitch || 0);
      samplePlayer.volume.value = (setting.volumeDb || 0) + velocityToDb(v);
      samplePlayer.start(time, 0, setting.decay || 0.7);
      return true;
    }

    const semitoneOffset = setting.pitch || 0;
    this.lastSource = "synth";
    if (instrument === "kick") {
      this.kick.triggerAttackRelease(noteWithOffset("C1", semitoneOffset), "8n", time, v);
      this.kickClick.triggerAttackRelease("64n", time, v * 0.32);
    } else if (instrument === "snare") {
      this.snare.triggerAttackRelease(setting.decay || 0.42, time, v);
      this.snareBody.triggerAttackRelease(noteWithOffset("D2", semitoneOffset), "16n", time, v * 0.35);
    } else if (instrument === "hihat") {
      this.hihat.triggerAttackRelease(setting.decay || 0.16, time, v * 0.72);
    } else if (instrument === "pad") {
      const notes = nextPadChordNotes(
        { kind: "pad", progression: DEFAULT_PAD_PROGRESSION },
        this.padStep++,
        "C3",
      ).map((note) => noteWithOffset(note, semitoneOffset));
      this.pad.volume.value = setting.volumeDb || -7;
      this.pad.triggerAttackRelease(notes, setting.decay || 1.8, time, v * 0.46);
    } else if (instrument === "clap") {
      this.clap.triggerAttackRelease(setting.decay || 0.48, time, v);
    } else {
      this.tom.triggerAttackRelease(noteWithOffset("G1", semitoneOffset), "16n", time, v);
    }
    return true;
  }

  setMelodyPreset(id) {
    if (!['wood','musicbox','warm','cloud','dream'].includes(id)) return;
    this.stopMelody();
    for (const voice of this.melodyVoices.values()) { voice.dispose(); voice.melodyFilter?.dispose(); }
    this.melodyVoices.clear();
    this.melodyPreset = id;
  }

  setMelodyNote(key, note) {
    if (!this.ready) return;
    let voice = this.melodyVoices.get(key);
    if (!voice && note) {
      const configs = {
        wood: { fm:true, harmonicity:3, modulationIndex:1.2, decay:.35, release:.18, cutoff:3800 },
        musicbox: { fm:true, harmonicity:3.5, modulationIndex:2, decay:1.1, release:.8, cutoff:4600 },
        warm: { type:'sine', attack:.18, cutoff:1400, release:1.4 },
        cloud: { type:'triangle', attack:.3, cutoff:1000, release:1.8 },
        dream: { type:'sine', attack:.06, cutoff:2400, release:.9 },
      };
      const c = configs[this.melodyPreset];
      const filter = new Tone.Filter(c.cutoff, 'lowpass').connect(this.bus);
      filter.connect(this.reverb);
      const options = { oscillator:{ type:c.type || 'sine' }, envelope:{ attack:c.attack || .004, decay:c.decay || .35, sustain:c.fm ? 0 : .65, release:c.release } };
      if (c.fm) Object.assign(options, { harmonicity:c.harmonicity, modulationIndex:c.modulationIndex, modulation:{type:'sine'}, modulationEnvelope:{attack:.001,decay:.2,sustain:0,release:.2} });
      voice = c.fm ? new Tone.FMSynth(options) : new Tone.Synth(options);
      voice.connect(filter);
      voice.melodyFilter = filter;
      this.melodyVoices.set(key, voice);
    }
    if (!voice) return;
    if (!note) { voice.triggerRelease(); return; }
    voice.volume.value = (this.settings.pad.volumeDb ?? -7) - 6;
    voice.triggerAttack(note, undefined, .65);
  }

  stopMelody() {
    for (const voice of this.melodyVoices.values()) voice.triggerRelease();
  }

  preview(instrument) {
    return this.trigger(instrument, 0.9, { force: true });
  }
}

function waitForLoaded(player, timeoutMs) {
  if (player.loaded) return Promise.resolve(true);
  return Promise.race([
    Tone.loaded().then(() => player.loaded).catch(() => false),
    new Promise((resolve) => setTimeout(() => resolve(player.loaded), timeoutMs)),
  ]);
}

function semitonesToRate(semitones) {
  return 2 ** (semitones / 12);
}

function velocityToDb(velocity) {
  return -18 + velocity * 18;
}

function noteWithOffset(note, semitones) {
  return Tone.Frequency(note).transpose(semitones).toNote();
}
