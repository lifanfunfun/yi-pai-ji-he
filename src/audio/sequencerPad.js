import {safeOutput} from './safeOutput.js';
export class SequencerPad {
  constructor(Tone,outputProvider=safeOutput) { this.Tone = Tone; this.voice = null;this.outputProvider=outputProvider; }
  async start() {
    await this.Tone.start();
    if (this.voice) return;
    this.limiter = new this.Tone.Limiter(-4).connect(this.outputProvider());
    this.reverb = new this.Tone.Reverb({decay: 1.8, wet: 0.2}).connect(this.limiter);
    this.voice = new this.Tone.PolySynth(this.Tone.Synth, {
      oscillator: {type: 'triangle'},
      envelope: {attack: 0.045, decay: 0.25, sustain: 0.35, release: 0.65},
      volume: -13,
    }).connect(this.reverb);
  }
  trigger(step, time) {
    const notes = ['C4','D4','E4','G4','A4','G4','E4','D4'];
    this.voice?.triggerAttackRelease(notes[step % notes.length], '8n', time, 0.65);
  }
  stop() { this.voice?.releaseAll(); }
}
