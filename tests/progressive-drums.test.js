import test from 'node:test';import assert from 'node:assert/strict';
import {ProgressiveDrumEngine} from '../src/doodle/progressiveDrums.js';
function render(count,passes=8,preset='scribble') {const engine=new ProgressiveDrumEngine({sectionBeats:16,preset}),events=[];for(let g=0;g<passes*16*4;g++) events.push(...engine.atGrid(g/4,count));return events;}
test('drums enter halfway through outward sweep and intensify on return',()=>{
  const events=render(24);
  const voices=pass=>new Set(events.filter(e=>e.pass===pass).map(e=>e.voice));
  assert.ok(!events.some(e=>e.beat<8));
  assert.ok(voices(1).has('popKick'));
  assert.ok(voices(2).has('clap')&&voices(2).has('brightHat'));
  assert.ok(events.filter(e=>e.pass===2).length>events.filter(e=>e.pass===1).length*2);
});
test('same tempo/grid: dense crossings create more events; blank regions keep only faint pulse',()=>{
  const dense=render(24),sparse=render(3),blank=render(0);
  assert.ok(dense.filter(e=>e.pass===2).length>sparse.filter(e=>e.pass===2).length);
  assert.ok(blank.every(e=>e.voice==='softKick'&&e.velocity<=.035));
  assert.ok(dense.every(e=>Math.abs(e.beat*4-Math.round(e.beat*4))<1e-8));
});
test('density smoothing declines locally and next grid produces no duplicated hits',()=>{
  const engine=new ProgressiveDrumEngine({sectionBeats:16});
  for(let g=256;g<272;g++) engine.atGrid(g/4,24);
  const previous=engine.state.smoothed;engine.atGrid(68,0);
  assert.ok(engine.state.smoothed<previous&&engine.state.smoothed>0);
  assert.deepEqual(engine.atGrid(68,24),[]);
  for(let g=273;g<300;g++) engine.atGrid(g/4,0);
  assert.ok(engine.state.smoothed<.001);
});
test('two sweep structure repeats without unlimited layering, with distinct picture grooves',()=>{
  const events=render(24,12);
  assert.ok(new Set(events.map(e=>e.voice)).size<=5);
  const perPass=p=>events.filter(e=>e.pass===p).length;
  assert.equal(perPass(12),perPass(2));
  assert.ok(events.every(e=>e.velocity<=.25));
  assert.ok(!events.some(e=>e.beat%16>=15&&!['softKick','popKick'].includes(e.voice)));
  assert.equal(new Set(events.map(e=>`${e.beat}:${e.voice}`)).size,events.length);
  assert.deepEqual(render(24,12),events);
  const signatures=['scribble','building','decorative','tiedye'].map(preset=>JSON.stringify(render(24,2,preset).map(e=>[e.beat,e.voice])));
  assert.equal(new Set(signatures).size,4);
});
