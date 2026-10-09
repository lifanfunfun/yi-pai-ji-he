import {ProgressiveDrumEngine} from '../src/doodle/progressiveDrums.js';
import {makeLineFixture,extractLineMask,readLineIntersections} from '../src/doodle/liveLineScanner.js';
import {writeFileSync} from 'node:fs';
const results=[];
for(const kind of ['sparse','dense','fingerprint','mixed']) {
  const model=extractLineMask(makeLineFixture(kind)),engine=new ProgressiveDrumEngine({sectionBeats:16}),events=[];
  for(let g=0;g<5*16*4;g++) {
    const beat=g/4,pass=Math.floor(beat/16),fraction=beat%16/16;
    const x=(pass%2?1-fraction:fraction)*(model.width-1);
    const count=readLineIntersections(model,x).filter(p=>p.thickness<model.height*.045&&p.edgeStrength>.05).length;
    events.push(...engine.atGrid(beat,count));
  }
  results.push({kind,perPass:Array.from({length:5},(_,i)=>events.filter(e=>e.pass===i+1).length),voicesPerPass:Array.from({length:5},(_,i)=>[...new Set(events.filter(e=>e.pass===i+1).map(e=>e.voice))])});
}
writeFileSync(new URL('../../渐进鼓点-确定性结果.json',import.meta.url),JSON.stringify(results,null,2));console.log(JSON.stringify(results));
