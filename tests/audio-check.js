import * as Tone from 'tone';
import { CelloEngine } from '../src/audio/celloEngine.js';
const output = document.querySelector('#result');
document.querySelector('#run').addEventListener('click', async () => {
  document.querySelector('#run').disabled = true;
  output.textContent = '';
  try {
    const cases = ['cello', 'synth', 'percussion', 'dog', 'fallback'].flatMap(instrument => [
      { instrument, rapid: false, volume: 100 }, { instrument, rapid: true, volume: 100 },
    ]).concat([{ instrument: 'dog', volume: 0 }, { instrument: 'fallback', volume: 0 }]);
    for (const {instrument, rapid, volume} of cases) {
      output.textContent += `${instrument}, rapid=${!!rapid}, volume=${volume}: loading\n`;
      const buffer = await Tone.Offline(async (context) => {
        const engine = new CelloEngine();
        engine.start = async () => { engine.ready = true; return true; };
        engine.setVolume(volume);
        engine.initOutput();
        if (instrument === 'cello') {
          engine.initRealCelloSampler();
          await Tone.loaded();
          await engine.reverb.ready;
        } else if (instrument !== 'fallback') await engine.setInstrument(instrument);
        const play = pitch => instrument === 'fallback' ? engine.playPhysicalAcousticCello(pitch, .88, 1.1) : engine.playCelloNote(pitch, .88, 1.1);
        if (rapid) {
          ['F3', 'F3', 'C4', 'C4', 'D4', 'D4'].forEach((pitch, index) => context.transport.schedule(() => play(pitch), .15 + index * .24));
          context.transport.start(0);
        } else play('F3');
      }, 3, 2, 44100);
      let peak = 0, square = 0, active = 0;
      for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
        for (const value of buffer.getChannelData(channel)) {
          peak = Math.max(peak, Math.abs(value));
          if (Math.abs(value) > .001) { square += value * value; active++; }
        }
      }
      const rms = Math.sqrt(square / Math.max(1, active));
      const result = { instrument, rapid: !!rapid, volume, peak: +peak.toFixed(4), peakDb: +(20 * Math.log10(peak)).toFixed(2), rmsDb: +(20 * Math.log10(rms)).toFixed(2), safe: volume === 0 ? peak === 0 : peak < .8 && peak > .001 };
      output.textContent += JSON.stringify(result) + '\n';
      if (!result.safe) throw new Error(`Output check failed: ${instrument}`);
    }
    output.textContent += 'PASS';
  } catch (error) { output.textContent += `FAIL: ${error.message}\n${error.stack}`; }
  finally { document.querySelector('#run').disabled = false; }
});
