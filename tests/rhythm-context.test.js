import test from 'node:test';
import assert from 'node:assert/strict';
import {rhythmContext} from '../src/doodle/rhythmContext.js';
import {ProgressiveDrumEngine} from '../src/doodle/progressiveDrums.js';
const score={totalBeats:64,sectionBeats:32,events:[
  {section:1,beat:0,role:'harmony'}, {section:1,beat:8,role:'harmony'},
  {section:1,beat:0,role:'bass'}, {section:1,beat:2.5,role:'bass'},
  {section:1,beat:.5,role:'pulse'},
]};
test('kick follows actual syncopated bass; pulse and harmonic approach follow score',()=>{
  const engine=new ProgressiveDrumEngine();
  const hits=[];
  for(let g=128;g<160;g++) hits.push(...engine.atGrid(g/4,12,rhythmContext(score,g/4)));
  assert.deepEqual(hits.filter(e=>e.voice==='popKick').map(e=>e.beat),[32,34.5]);
  assert.ok(hits.some(e=>e.voice==='brightHat'&&e.beat===32.5));
  assert.equal(rhythmContext(score,39.5).beforeChordChange,true);
  assert.equal(rhythmContext(score,38).beforeChordChange,false);
});
test('score relationships repeat identically and leave cadence space',()=>{
  assert.deepEqual(rhythmContext(score,34.5),rhythmContext(score,98.5));
  assert.equal(rhythmContext(score,61).ending,true);
  const engine=new ProgressiveDrumEngine();
  assert.ok(engine.atGrid(61.5,24,rhythmContext(score,61.5)).every(e=>['softKick','popKick'].includes(e.voice)));
});
test('dense fingerprint harmonic fill cannot restart the same drum twice',()=>{
  const engine=new ProgressiveDrumEngine({preset:'tiedye'});
  for(let g=128;g<158;g++) engine.atGrid(g/4,24,rhythmContext(score,g/4));
  const hits=engine.atGrid(39.5,24,rhythmContext(score,39.5));
  assert.equal(hits.filter(e=>e.voice==='cajon').length,1);
});
