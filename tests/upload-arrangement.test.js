import {test} from 'node:test';
import assert from 'node:assert/strict';
import {composeMusicPlan} from '../src/doodle/musicPlan.js';
const features=(extra={})=>({warm:.12,cool:0,green:0,edges:.02,dark:0,lineDrawing:false,
  columns:Array.from({length:16},(_,i)=>({density:.25,centroid:.3+i/40,edges:.02})),...extra});
test('default uploads use warm pentatonic melody and no tritone harmony',()=>{
  for(const extra of [{},{cool:.2,warm:0},{green:.12},{lineDrawing:true},{edges:.12}]) {
    const score=composeMusicPlan(features(extra));
    assert.deepEqual(score.melodyScale,[0,2,4,7,9]);
    for(const chord of score.harmony) for(const a of chord.notes) for(const b of chord.notes)
      assert.notEqual((Math.abs(a-b)%12),6);
    assert.ok(score.uploadArrangement.chords.every(c=>c[0]!==6));
  }
});
test('uploads select different harmony routes and instrument families deterministically',()=>{
  const inputs=[features(),features({cool:.2,warm:0}),features({green:.12}),features({edges:.12})];
  const scores=inputs.map(f=>composeMusicPlan(f));
  assert.equal(new Set(scores.map(s=>JSON.stringify(s.harmony))).size,4);
  assert.equal(new Set(scores.map(s=>s.uploadArrangement.lead)).size,4);
  for(let i=0;i<inputs.length;i++) assert.deepEqual(scores[i],composeMusicPlan(inputs[i]));
  const demo=composeMusicPlan(inputs[0],'scribble');
  for(const score of scores) assert.notDeepEqual(score.harmony,demo.harmony);
});
test('local whitespace changes uploaded harmonic route while demo is unaffected',()=>{
  const a=features(),b=features();b.columns[4].density=.01;
  assert.notDeepEqual(composeMusicPlan(a).harmony,composeMusicPlan(b).harmony);
  assert.equal(composeMusicPlan(a,'scribble').uploadArrangement,null);
});
test('uploaded harmony uses separated chord tones, distinct textures and local breathing space',()=>{
  const inputs=[features(),features({cool:.2,warm:0}),features({green:.12}),features({edges:.12})];
  const beds=inputs.map(f=>composeMusicPlan(f).events.filter(e=>e.role==='harmony'&&e.voice!=='softPad'));
  assert.equal(new Set(beds.map(b=>b[0].voice)).size,4);
  for(const bed of beds) {
    assert.ok(bed.length>8);
    assert.ok(bed.every(e=>!Array.isArray(e.midi)&&e.duration<=1.1));
  }
  const f=features();f.columns[4].density=0;
  const score=composeMusicPlan(f);
  assert.ok(!score.events.some(e=>e.role==='harmony'&&e.section===0&&e.beat>=8&&e.beat<12));
  for(const e of score.events.filter(e=>e.role==='harmony')) {
    const chord=score.harmony[Math.floor((e.section*32+e.beat)/8)];
    assert.ok((Array.isArray(e.midi)?e.midi:[e.midi]).every(n=>chord.notes.includes(n)));
  }
});
test('uploads retain exactly one quiet pad layer aligned with current harmony',()=>{
  const score=composeMusicPlan(features());
  const pads=score.events.filter(e=>e.voice==='softPad'&&e.role==='harmony');
  assert.equal(pads.length,8);
  for(const e of pads) {
    assert.equal(e.midi.length,2);
    assert.ok(e.velocity<=.16);
    assert.ok(e.duration<8);
    const chord=score.harmony[Math.floor((e.section*32+e.beat)/8)];
    assert.ok(e.midi.every(n=>chord.notes.includes(n)));
  }
});
