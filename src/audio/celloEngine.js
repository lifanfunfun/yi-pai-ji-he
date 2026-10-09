/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Tone from "tone";
import {safeOutput} from './safeOutput.js';
import { getMelodicPreset } from "./melodicPresets.js";
import dogBarkUrl from "../../assets/dog-bark.wav";

export const CELLO_SONGS = [
  {
    id: "twinkle",
    title: "小星星 (Twinkle, Twinkle Little Star)",
    tonality: "F大调 (F Major)",
    composer: "经典名曲",
    tempo: 96,
    notes: [
      // 乐句 1: 1 1 5 5 6 6 5 (一闪一闪亮晶晶)
      { pitch: "F3", duration: "4n", text: "1" },
      { pitch: "F3", duration: "4n", text: "1" },
      { pitch: "C4", duration: "4n", text: "5" },
      { pitch: "C4", duration: "4n", text: "5" },
      { pitch: "D4", duration: "4n", text: "6" },
      { pitch: "D4", duration: "4n", text: "6" },
      { pitch: "C4", duration: "2n", text: "5" },

      // 乐句 2: 4 4 3 3 2 2 1 (满天都是小星星)
      { pitch: "Bb3", duration: "4n", text: "4" },
      { pitch: "Bb3", duration: "4n", text: "4" },
      { pitch: "A3", duration: "4n", text: "3" },
      { pitch: "A3", duration: "4n", text: "3" },
      { pitch: "G3", duration: "4n", text: "2" },
      { pitch: "G3", duration: "4n", text: "2" },
      { pitch: "F3", duration: "2n", text: "1" },

      // 乐句 3: 5 5 4 4 3 3 2 (挂在天上放光明)
      { pitch: "C4", duration: "4n", text: "5" },
      { pitch: "C4", duration: "4n", text: "5" },
      { pitch: "Bb3", duration: "4n", text: "4" },
      { pitch: "Bb3", duration: "4n", text: "4" },
      { pitch: "A3", duration: "4n", text: "3" },
      { pitch: "A3", duration: "4n", text: "3" },
      { pitch: "G3", duration: "2n", text: "2" },

      // 乐句 4: 5 5 4 4 3 3 2 (好像许多小眼睛)
      { pitch: "C4", duration: "4n", text: "5" },
      { pitch: "C4", duration: "4n", text: "5" },
      { pitch: "Bb3", duration: "4n", text: "4" },
      { pitch: "Bb3", duration: "4n", text: "4" },
      { pitch: "A3", duration: "4n", text: "3" },
      { pitch: "A3", duration: "4n", text: "3" },
      { pitch: "G3", duration: "2n", text: "2" },

      // 乐句 5: 1 1 5 5 6 6 5 (一闪一闪亮晶晶)
      { pitch: "F3", duration: "4n", text: "1" },
      { pitch: "F3", duration: "4n", text: "1" },
      { pitch: "C4", duration: "4n", text: "5" },
      { pitch: "C4", duration: "4n", text: "5" },
      { pitch: "D4", duration: "4n", text: "6" },
      { pitch: "D4", duration: "4n", text: "6" },
      { pitch: "C4", duration: "2n", text: "5" },

      // 乐句 6: 4 4 3 3 2 2 1 (满天都是小星星)
      { pitch: "Bb3", duration: "4n", text: "4" },
      { pitch: "Bb3", duration: "4n", text: "4" },
      { pitch: "A3", duration: "4n", text: "3" },
      { pitch: "A3", duration: "4n", text: "3" },
      { pitch: "G3", duration: "4n", text: "2" },
      { pitch: "G3", duration: "4n", text: "2" },
      { pitch: "F3", duration: "2n", text: "1" },
    ]
  },
  {
    id: "ode_to_joy",
    title: "欢乐颂 (Ode to Joy)",
    tonality: "F大调 (F Major)",
    composer: "贝多芬 (Beethoven)",
    tempo: 108,
    notes: [
      // 乐句 1: 3 3 4 5 | 5 4 3 2
      { pitch: "A3", duration: "4n", text: "3" },
      { pitch: "A3", duration: "4n", text: "3" },
      { pitch: "Bb3", duration: "4n", text: "4" },
      { pitch: "C4", duration: "4n", text: "5" },
      { pitch: "C4", duration: "4n", text: "5" },
      { pitch: "Bb3", duration: "4n", text: "4" },
      { pitch: "A3", duration: "4n", text: "3" },
      { pitch: "G3", duration: "4n", text: "2" },

      // 乐句 1后半: 1 1 2 3 | 3. 2 2 -
      { pitch: "F3", duration: "4n", text: "1" },
      { pitch: "F3", duration: "4n", text: "1" },
      { pitch: "G3", duration: "4n", text: "2" },
      { pitch: "A3", duration: "4n", text: "3" },
      { pitch: "A3", duration: "4n", text: "3" },
      { pitch: "G3", duration: "8n", text: "2" },
      { pitch: "G3", duration: "2n", text: "2" },

      // 乐句 2: 3 3 4 5 | 5 4 3 2
      { pitch: "A3", duration: "4n", text: "3" },
      { pitch: "A3", duration: "4n", text: "3" },
      { pitch: "Bb3", duration: "4n", text: "4" },
      { pitch: "C4", duration: "4n", text: "5" },
      { pitch: "C4", duration: "4n", text: "5" },
      { pitch: "Bb3", duration: "4n", text: "4" },
      { pitch: "A3", duration: "4n", text: "3" },
      { pitch: "G3", duration: "4n", text: "2" },

      // 乐句 2后半: 1 1 2 3 | 2. 1 1 -
      { pitch: "F3", duration: "4n", text: "1" },
      { pitch: "F3", duration: "4n", text: "1" },
      { pitch: "G3", duration: "4n", text: "2" },
      { pitch: "A3", duration: "4n", text: "3" },
      { pitch: "G3", duration: "4n", text: "2" },
      { pitch: "F3", duration: "8n", text: "1" },
      { pitch: "F3", duration: "2n", text: "1" },

      // 乐句 3 (副歌展开): 2 2 3 1 | 2 3 4 3 1
      { pitch: "G3", duration: "4n", text: "2" },
      { pitch: "G3", duration: "4n", text: "2" },
      { pitch: "A3", duration: "4n", text: "3" },
      { pitch: "F3", duration: "4n", text: "1" },
      { pitch: "G3", duration: "4n", text: "2" },
      { pitch: "A3", duration: "8n", text: "3" },
      { pitch: "Bb3", duration: "8n", text: "4" },
      { pitch: "A3", duration: "4n", text: "3" },
      { pitch: "F3", duration: "4n", text: "1" },

      // 乐句 3后半: 2 3 4 3 2 | 1 2 5(低) -
      { pitch: "G3", duration: "4n", text: "2" },
      { pitch: "A3", duration: "8n", text: "3" },
      { pitch: "Bb3", duration: "8n", text: "4" },
      { pitch: "A3", duration: "4n", text: "3" },
      { pitch: "G3", duration: "4n", text: "2" },
      { pitch: "F3", duration: "4n", text: "1" },
      { pitch: "G3", duration: "4n", text: "2" },
      { pitch: "C3", duration: "2n", text: "5" },

      // 乐句 4 (再现辉煌): 3 3 4 5 | 5 4 3 2
      { pitch: "A3", duration: "4n", text: "3" },
      { pitch: "A3", duration: "4n", text: "3" },
      { pitch: "Bb3", duration: "4n", text: "4" },
      { pitch: "C4", duration: "4n", text: "5" },
      { pitch: "C4", duration: "4n", text: "5" },
      { pitch: "Bb3", duration: "4n", text: "4" },
      { pitch: "A3", duration: "4n", text: "3" },
      { pitch: "G3", duration: "4n", text: "2" },

      // 乐句 4后半: 1 1 2 3 | 2. 1 1 -
      { pitch: "F3", duration: "4n", text: "1" },
      { pitch: "F3", duration: "4n", text: "1" },
      { pitch: "G3", duration: "4n", text: "2" },
      { pitch: "A3", duration: "4n", text: "3" },
      { pitch: "G3", duration: "4n", text: "2" },
      { pitch: "F3", duration: "8n", text: "1" },
      { pitch: "F3", duration: "2n", text: "1" },
    ]
  }
];

export class CelloEngine {
  constructor() {
    this.ready = false;
    this.samplerLoaded = false;
    this.mode = "guided";
    this.currentSongIndex = 0;
    this.currentNoteIndex = 0;
    this.lastTriggerTime = 0;
    this.bowDirection = 1;
    this.lastBowDir = 1;
    this.currentPitch = "F3";
    this.audioCtx = null;
    this.sampler = null;
    this.reverb = null;
    this.instrument = "cello";
    this.alternateVoices = {};
    this.activeSources = new Set();
    this.volumePercent = 70;
    this.masterGain = null;
    this.compressor = null;
    this.limiter = null;
  }

  async start() {
    try {
      if (Tone.context && Tone.context.state !== "running") {
        await Tone.start();
      }
      this.initRealCelloSampler();
      this.ready = true;
    } catch (e) {
      console.warn("Tone.start error:", e);
    }

    try {
      this.audioCtx = this.getAudioContext();
      if (this.audioCtx && this.audioCtx.state === "suspended" && typeof this.audioCtx.resume === "function") {
        await this.audioCtx.resume();
      }
      this.ready = true;
    } catch {}

    return this.ready;
  }

  /**
   * Initializes real acoustic cello sampler from professional live cello recordings
   */
  initRealCelloSampler() {
    if (this.sampler) return;
    this.initOutput();

    try {
      // Warm concert hall acoustic environment
      this.reverb = new Tone.Reverb({
        decay: 1.55,
        preDelay: 0.015,
        wet: 0.18,
      }).connect(this.masterGain);

      // Cello body warmth equalizer: boost warm wooden resonance at 240Hz, tame harsh highs
      const eq = new Tone.EQ3({
        low: 0.7,
        mid: 0,
        high: -0.5,
        lowFrequency: 280,
        highFrequency: 3200,
      }).connect(this.reverb);
      this.celloEQ = eq;

      // Real acoustic cello audio recordings bank (sampled from real bowed cello notes)
      this.sampler = new Tone.Sampler({
        attack: 0.035,
        release: 0.18,
        curve: "exponential",
        urls: {
          A2: "A2.mp3",
          C3: "C3.mp3",
          D3: "D3.mp3",
          F3: "F3.mp3",
          G3: "G3.mp3",
          A3: "A3.mp3",
          "A#3": "As3.mp3",
          C4: "C4.mp3",
          D4: "D4.mp3",
          F4: "F4.mp3",
        },
        baseUrl: "https://cdn.jsdelivr.net/gh/nbrosowsky/tonejs-instruments/samples/cello/",
        onload: () => {
          this.samplerLoaded = true;
          console.log("🎻 Real Acoustic Cello sample library loaded successfully!");
        },
      }).connect(eq);

      this.sampler.volume.value = -10; // Matched to the other voices; retain output headroom.
    } catch (e) {
      console.warn("Real Cello Sampler initialization fallback:", e);
    }
  }

  getCurrentSong() {
    return CELLO_SONGS[this.currentSongIndex] || CELLO_SONGS[0];
  }

  async setInstrument(instrument) {
    if (!["cello", "synth", "percussion", "dog"].includes(instrument)) return;
    await this.start();
    this.initOutput();
    if (instrument !== "cello" && !this.alternateVoices[instrument]) {
      if (instrument === "dog") {
        await new Promise((resolve, reject) => {
          const voice = new Tone.Sampler({
            // The recorded bark's voiced section is approximately E5 (650–670 Hz).
            urls: { E5: dogBarkUrl }, release: 0.08,
            onload: resolve, onerror: reject,
          }).connect(this.masterGain);
          voice.volume.value = -11;
          this.alternateVoices.dog = voice;
        }).catch(error => {
          this.alternateVoices.dog?.dispose();
          delete this.alternateVoices.dog;
          throw error;
        });
      } else {
        const preset = getMelodicPreset(instrument === "synth" ? "airy-pad" : "gemidi-marimba");
        const p = preset.params;
        const filter = new Tone.Filter(p.cutoff, "lowpass").connect(this.masterGain);
        const voice = new Tone.PolySynth(Tone.Synth, {
          oscillator: { type: instrument === "synth" ? preset.synth : "sine" },
          envelope: { attack: p.attack, decay: p.decay, sustain: p.sustain, release: instrument === "synth" ? .65 : p.release },
        }).connect(filter);
        voice.volume.value = instrument === "synth" ? -11 : -5.5;
        this.alternateVoices[instrument] = voice;
      }
    }
    this.stop();
    this.instrument = instrument;
    return instrument;
  }

  initOutput() {
    if (this.masterGain) return;
    this.limiter = new Tone.Limiter(-4).connect(safeOutput());
    this.compressor = new Tone.Compressor({ threshold: -16, ratio: 3, knee: 8, attack: .012, release: .16 }).connect(this.limiter);
    this.masterGain = new Tone.Gain(this.outputLevel()).connect(this.compressor);
  }

  outputLevel() {
    return .85 * Math.pow(this.volumePercent / 100, 1.6);
  }

  setVolume(percent) {
    this.volumePercent = Math.max(0, Math.min(100, Number(percent) || 0));
    if (this.masterGain) this.masterGain.gain.rampTo(this.outputLevel(), .04);
  }

  setSong(indexOrId) {
    if (typeof indexOrId === "number") {
      this.currentSongIndex = Math.max(0, Math.min(CELLO_SONGS.length - 1, indexOrId));
    } else if (typeof indexOrId === "string") {
      const idx = CELLO_SONGS.findIndex(s => s.id === indexOrId);
      if (idx !== -1) this.currentSongIndex = idx;
    }
    this.currentNoteIndex = 0;
    const song = this.getCurrentSong();
    this.currentPitch = song.notes[0]?.pitch || "F3";
    return song;
  }

  setMode(mode) {
    this.mode = mode || "guided";
  }

  getCurrentNote() {
    const song = this.getCurrentSong();
    return song.notes[this.currentNoteIndex] || song.notes[0];
  }

  resetSongProgress() {
    this.currentNoteIndex = 0;
    const song = this.getCurrentSong();
    this.currentPitch = song.notes[0]?.pitch || "F3";
  }

  /**
   * Play a clean single cello note on stroke / gesture flip strictly following current song melody
   */
  stroke(speed = 0.8, direction = 1) {
    const now = performance.now();
    this.lastTriggerTime = now;
    this.lastBowDir = direction;

    const song = this.getCurrentSong();
    const playedIndex = this.currentNoteIndex;
    const noteData = song.notes[playedIndex] || song.notes[0];
    const targetPitch = noteData.pitch;

    // Advance to next note in song melody (cycles cleanly after all notes of current song)
    this.currentNoteIndex = (this.currentNoteIndex + 1) % song.notes.length;
    this.currentPitch = targetPitch;

    const velocity = Math.min(0.88, Math.max(0.45, speed * 1.05));
    this.playCelloNote(targetPitch, velocity, 1.1);

    return {
      song,
      pitch: targetPitch,
      noteData,
      noteIndex: playedIndex,
      totalNotes: song.notes.length,
      nextNote: song.notes[this.currentNoteIndex],
      velocity,
      direction,
    };
  }

  /**
   * Plays a real acoustic cello sound note with natural bowed envelope & resonance
   */
  playCelloNote(pitch, velocity = 0.85, durationSec = 1.0) {
    if (this.instrument !== "cello") {
      const voice = this.alternateVoices[this.instrument];
      // A single bow voice keeps loudness stable even during rapid waving.
      voice?.releaseAll();
      if (voice) voice.triggerAttackRelease(pitch.replace("Bb", "A#"), this.instrument === "percussion" ? .22 : durationSec, undefined, velocity);
      return;
    }
    // 1. Primary: Use real acoustic cello recordings via Tone.Sampler
    if (this.sampler && this.samplerLoaded) {
      try {
        if (Tone.context && Tone.context.state === "suspended") {
          Tone.start().catch(() => {});
        }
        // Normalize enharmonic names (e.g., Bb3 -> A#3)
        const tonePitch = pitch.replace("Bb", "A#").replace("Db", "C#").replace("Eb", "D#");
        this.sampler.releaseAll();
        this.sampler.triggerAttackRelease(tonePitch, durationSec, undefined, velocity);
        return;
      } catch (err) {
        console.warn("Sampler trigger warning, falling back to physical acoustic engine:", err);
      }
    }

    // If sampler is still initializing, start it
    if (!this.sampler) {
      this.initRealCelloSampler();
    }

    // 2. High-fidelity Physical Cello Acoustic Modeling Synthesizer (Instant zero-delay warm cello sound)
    this.playPhysicalAcousticCello(pitch, velocity, durationSec);
  }

  /**
   * Physical Cello Acoustics: Replicates spruce body formant resonances (250Hz cavity, 450Hz wood plate,
   * bow friction onset, and warm cello vibrato)
   */
  playPhysicalAcousticCello(pitch, velocity = 0.8, durationSec = 1.0) {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    if (ctx.state === "suspended" && typeof ctx.resume === "function") {
      ctx.resume().catch(() => {});
    }

    const freq = this.pitchToFrequency(pitch);
    const now = this.masterGain?.context.now() ?? Tone.now();

    // 1. Dual Bowed String Oscillators (Fundamental + Warm Sub-harmonic Body Resonance)
    const oscMain = ctx.createOscillator();
    const oscSub = ctx.createOscillator();
    oscMain.type = "sawtooth";
    oscSub.type = "triangle";

    oscMain.frequency.setValueAtTime(freq, now);
    oscSub.frequency.setValueAtTime(freq * 0.5, now); // Deep resonant wood octave

    // 2. Left-hand expressive vibrato LFO (5.3 Hz, delayed onset after bow grabs string)
    const vibratoLfo = ctx.createOscillator();
    const vibratoGain = ctx.createGain();
    vibratoLfo.frequency.setValueAtTime(5.3, now);
    vibratoGain.gain.setValueAtTime(0, now);
    vibratoGain.gain.linearRampToValueAtTime(0, now + 0.12);
    vibratoGain.gain.linearRampToValueAtTime(freq * 0.014, now + 0.35); // 1.4% frequency modulation
    vibratoLfo.connect(vibratoGain);
    vibratoGain.connect(oscMain.frequency);
    vibratoLfo.start(now);
    vibratoLfo.stop(now + durationSec + 0.2);

    // 3. Acoustic Cello Wood Formant Filters
    // - Air Helmholtz resonance inside cello body ~240 Hz
    const airFilter = ctx.createBiquadFilter();
    airFilter.type = "peaking";
    airFilter.frequency.setValueAtTime(240, now);
    airFilter.Q.setValueAtTime(3.2, now);
    airFilter.gain.setValueAtTime(6.0, now);

    // - Wood plate body resonance ~460 Hz
    const woodFilter = ctx.createBiquadFilter();
    woodFilter.type = "peaking";
    woodFilter.frequency.setValueAtTime(460, now);
    woodFilter.Q.setValueAtTime(2.8, now);
    woodFilter.gain.setValueAtTime(4.0, now);

    // - Warm lowpass roll-off (eliminates artificial electronic buzz)
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.setValueAtTime(1400, now);
    lowpass.Q.setValueAtTime(1.0, now);

    // 4. Bow Friction / Rosin noise burst on attack (35ms initial grip)
    const noiseBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.04), ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < output.length; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (output.length * 0.3));
    }
    const noiseSrc = ctx.createBufferSource();
    noiseSrc.buffer = noiseBuffer;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(velocity * 0.15, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.setValueAtTime(1200, now);
    noiseFilter.Q.setValueAtTime(2.0, now);
    noiseSrc.connect(noiseFilter);
    noiseFilter.connect(noiseGain);

    // 5. Bowed Master Amplitude Envelope (Soft bowed attack, singing sustain, woody decay)
    const mainGain = ctx.createGain();
    const peakLevel = Math.min(0.075, velocity * 0.075);
    mainGain.gain.setValueAtTime(0.0001, now);
    mainGain.gain.linearRampToValueAtTime(peakLevel, now + 0.07); // Gentle bowed attack
    mainGain.gain.setValueAtTime(peakLevel * 0.9, now + 0.25);
    mainGain.gain.exponentialRampToValueAtTime(peakLevel * 0.7, now + durationSec * 0.7);
    mainGain.gain.linearRampToValueAtTime(0.0001, now + durationSec + 0.12);

    // Wiring Audio Graph
    oscMain.connect(airFilter);
    oscSub.connect(airFilter);
    airFilter.connect(woodFilter);
    woodFilter.connect(lowpass);
    lowpass.connect(mainGain);
    noiseGain.connect(mainGain);
    this.initOutput();
    mainGain.connect(this.celloEQ?.input || this.masterGain.input);

    oscMain.start(now);
    oscSub.start(now);
    noiseSrc.start(now);
    for (const source of [oscMain, oscSub, noiseSrc, vibratoLfo]) {
      this.activeSources.add(source);
      source.addEventListener("ended", () => this.activeSources.delete(source), { once: true });
    }

    const stopTime = now + durationSec + 0.15;
    oscMain.stop(stopTime);
    oscSub.stop(stopTime);

    setTimeout(() => {
      try {
        mainGain.disconnect();
        vibratoGain.disconnect();
      } catch {}
    }, (durationSec + 0.3) * 1000);
  }

  getAudioContext() {
    if (!this.audioCtx) {
      this.audioCtx = (this.masterGain?.context || Tone.getContext()).rawContext;
    }
    return this.audioCtx;
  }

  pitchToFrequency(pitch) {
    const noteMap = {
      C: 0, "C#": 1, Db: 1, D: 2, "D#": 3, Eb: 3,
      E: 4, F: 5, "F#": 6, Gb: 6, G: 7, "G#": 8,
      Ab: 8, A: 9, "A#": 10, Bb: 10, B: 11,
    };
    const match = pitch.match(/^([A-G][#b]?)([0-9])$/);
    if (!match) return 174.61; // F3 default
    const [, note, octStr] = match;
    const octave = parseInt(octStr, 10);
    const semitones = noteMap[note] + (octave - 4) * 12 - 9;
    return 440 * Math.pow(2, semitones / 12);
  }

  stop() {
    this.sampler?.releaseAll();
    for (const voice of Object.values(this.alternateVoices)) voice.releaseAll();
    for (const source of this.activeSources) {
      try { source.stop(); } catch {}
    }
    this.activeSources.clear();
  }
}
