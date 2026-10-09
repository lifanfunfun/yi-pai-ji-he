import {makeLineFixture,extractLineMask,ScanTimeline} from '../src/doodle/liveLineScanner.js';
import {writeFileSync} from 'node:fs';
const results=[];
for(const kind of ['sparse','dense','fingerprint','rising','mixed']) {
  const timeline=new ScanTimeline(extractLineMask(makeLineFixture(kind)),{melody:true});
  const notes=timeline.advanceTo(8);
  const result={kind,seconds:8,notes:notes.length,firstHalf:notes.filter(e=>e.time<4).length,secondHalf:notes.filter(e=>e.time>=4).length,firstMidi:notes[0]?.midi,lastMidi:notes.at(-1)?.midi,per2Seconds:[0,2,4,6].map(t=>notes.filter(e=>e.time>=t&&e.time<t+2).length)};
  results.push(result);
}
writeFileSync(new URL('../../线条扫描-A到E-确定性结果.json',import.meta.url),JSON.stringify(results,null,2));
console.log(JSON.stringify(results));
