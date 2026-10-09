import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { getMelodicPreset } from '../src/audio/melodicPresets.js';

test('stop releases the camera, clears tracking, resets melody, and is repeatable', () => {
  const code = fs.readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
  const functions = code.slice(code.indexOf('function stopCamera()'), code.indexOf('function loop(now)'));
  let trackStops = 0, audioStops = 0, resets = 0;
  const context = {
    state: { running: true, stream: { getTracks: () => [{ stop: () => trackStops++ }] }, hands: [1], handsRaw: [1], handStates: [1], recentHits: [1] },
    celloEngine: { stop: () => audioStops++, resetSongProgress: () => resets++ },
    celloView: { bowPos: .8, targetBowPos: .9, accumulatedMotion: 1, particles: [1] },
    els: { video: { pause() {}, srcObject: {} }, start: { disabled: true } },
    document: { body: { dataset: {} } },
    lastHandPos: {}, updateStats() {}, setStatus(value) { context.status = value; },
    lilyVoiceEngine: { ready: false }, syncLilyControls() {},
    doodleEngine: { stopAll() {} }, doodleView: {}, syncDoodleControls() {},
  };
  vm.runInNewContext(`${functions};stopDanceInteraction();stopDanceInteraction();`, context);
  assert.equal(trackStops, 1);
  assert.equal(audioStops, 2);
  assert.equal(resets, 2);
  assert.equal(context.state.running, false);
  assert.equal(context.state.dancePaused, true);
  assert.equal(context.els.video.srcObject, null);
  assert.equal(context.state.hands.length, 0);
  assert.equal(context.state.recentHits.length, 0);
  assert.equal(context.celloView.bowPos, .5);
  assert.equal(context.status, '待启动');
  assert.equal(context.els.start.textContent, '开始互动');
});

test('every sound follows the same melody, uses the original presets, and can stop', async () => {
  class Voice {
    constructor(...args) {
      this.options = args.at(-1); this.volume = { value: 0 }; this.notes = [];
      this.gain = { rampTo: value => { this.level = value; } };
      if (this.options.onload) queueMicrotask(this.options.onload);
    }
    connect() { return this; }
    toDestination() { return this; }
    releaseAll() { this.released = true; }
    triggerAttackRelease(...args) { this.notes.push(args); }
    dispose() {}
  }
  const source = fs.readFileSync(new URL('../src/audio/celloEngine.js', import.meta.url), 'utf8')
    .replace(/^import .*;$/gm, '').replaceAll('export const ', 'const ').replace('export class ', 'class ');
  const Engine = vm.runInNewContext(`${source};CelloEngine;`, {
    Tone: { Sampler: Voice, PolySynth: Voice, Synth: Voice, Filter: Voice, Gain: Voice, Compressor: Voice, Limiter: Voice },
    getMelodicPreset, dogBarkUrl: 'dog-bark.wav', queueMicrotask,safeOutput:()=>new Voice({}),
    performance: { now: () => 1000 }, console,
  });
  const engine = new Engine();
  engine.setVolume(100);
  assert.equal(engine.outputLevel(), .85);
  engine.setVolume(0);
  assert.equal(engine.outputLevel(), 0);
  engine.setVolume(70);
  engine.start = async () => true;
  await engine.setInstrument('synth');
  assert.equal(engine.alternateVoices.synth.options.oscillator.type, getMelodicPreset('airy-pad').synth);
  assert.equal(engine.stroke().pitch, 'F3');
  assert.equal(engine.alternateVoices.synth.notes[0][0], 'F3');
  await engine.setInstrument('dog');
  assert.equal(engine.currentNoteIndex, 1, 'switching sound keeps melody position');
  assert.equal(engine.alternateVoices.dog.options.urls.E5, 'dog-bark.wav');
  assert.equal(engine.stroke().pitch, 'F3');
  assert.equal(engine.stroke().pitch, 'C4');
  assert.equal(engine.alternateVoices.dog.notes[1][0], 'C4');
  await engine.setInstrument('percussion');
  assert.equal(engine.stroke().pitch, 'C4');
  assert.equal(engine.alternateVoices.percussion.notes[0][1], .22);
  engine.stop();
  assert.ok(Object.values(engine.alternateVoices).every(voice => voice.released));
});
