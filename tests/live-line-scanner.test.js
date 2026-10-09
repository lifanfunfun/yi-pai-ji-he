import test from 'node:test';
import assert from 'node:assert/strict';
import {makeLineFixture,extractLineMask,readLineIntersections,LiveLineReader,lineYToMidi,SWEEP_SECONDS,ScanTimeline,ScanSequence} from '../src/doodle/liveLineScanner.js';
const models=Object.fromEntries(['sparse','dense','fingerprint'].map(kind=>[kind,extractLineMask(makeLineFixture(kind))]));
function measure(model) {
  const reader=new LiveLineReader(model),events=[];const dt=1/120;
  for(let i=0;i<=SWEEP_SECONDS*120;i++) {
    const time=i*dt;const result=reader.read(time/SWEEP_SECONDS*(model.width-1),i?dt:0);
    for(const note of result.notes) events.push({...note,time,count:result.count});
  }
  return events;
}
test('three test images are structurally classified as lines; crossings are deduplicated strokes',()=>{
  assert.ok(Object.values(models).every(m=>m.isLineArt));
  assert.equal(readLineIntersections(models.sparse,480).length,3);
  assert.equal(readLineIntersections(models.dense,480).length,20);
  assert.ok(readLineIntersections(models.fingerprint,480).length>readLineIntersections(models.fingerprint,150).length);
});
test('same BPM, speed and velocity: dense image triggers far more shorter notes',()=>{
  const sparse=measure(models.sparse),dense=measure(models.dense);
  assert.ok(dense.length>sparse.length*5);
  assert.ok(dense.every(n=>n.duration<sparse[0].duration));
  assert.ok([...sparse,...dense].every(n=>n.velocity===.55));
  console.log(JSON.stringify({sparseNotes:sparse.length,denseNotes:dense.length,fingerprintNotes:measure(models.fingerprint).length,sweepSeconds:SWEEP_SECONDS}));
});
test('fingerprint sound density rises on entry, falls on exit, and is silent in margins',()=>{
  const events=measure(models.fingerprint);
  const count=(a,b)=>events.filter(e=>e.time>=a&&e.time<b).length;
  assert.ok(count(3,5)>count(1,3));
  assert.ok(count(3,5)>count(5,7));
  assert.equal(count(0,.7),0);assert.equal(count(7.3,8),0);
});
test('live changes are causal: blank scan column immediately prevents any note',()=>{
  const reader=new LiveLineReader(models.dense);
  for(let i=0;i<50;i++) reader.read(480,.02);
  const blank=reader.read(0,.02);assert.equal(blank.count,0);assert.equal(blank.notes.length,0);
  const live=new LiveLineReader({...models.dense,mask:new Uint8Array(models.dense.mask)});
  assert.equal(live.read(480,0).count,20);
  for(let y=0;y<live.model.height;y++) for(let x=478;x<=482;x++) live.model.mask[y*live.model.width+x]=0;
  assert.equal(live.read(480,.02).count,0);
});
test('continuous curves retain identity and pitch follows height, without random jumps',()=>{
  const reader=new LiveLineReader(models.sparse);let previous;
  for(let x=100;x<850;x+=2) {
    const current=reader.read(x,1/120).intersections;
    assert.equal(current.length,3);
    if(previous) for(let i=0;i<3;i++) {assert.equal(current[i].id,previous[i].id);assert.ok(Math.abs(current[i].midi-previous[i].midi)<=2);}
    for(const track of current) assert.equal(track.midi,lineYToMidi(track.y,reader.model.height));
    previous=current;
  }
});
test('blank images are not line-art; reset removes pending triggers and track history',()=>{
  const blank=makeLineFixture('sparse');blank.data.fill(255);
  assert.equal(extractLineMask(blank).isLineArt,false);
  const reader=new LiveLineReader(models.dense);reader.read(480,.08);reader.reset();
  assert.equal(reader.total,0);assert.equal(reader.phase,0);assert.equal(reader.tracks.length,0);
});

test('phase 1: left sparse/right dense controls note count locally, not BPM or gain',()=>{
  const model=extractLineMask(makeLineFixture('mixed'));
  const events=new ScanTimeline(model).advanceTo(8);
  const left=events.filter(e=>e.time<4),right=events.filter(e=>e.time>=4);
  assert.ok(right.length>left.length*5);
  assert.ok(events.every(e=>e.velocity===.55&&e.midi===60));
  assert.ok(events.every((e,i)=>!i||e.time-events[i-1].time>=1/12-1/240-1e-7));
});

test('phase 1: repeat scans and different scheduler batch sizes yield identical events',()=>{
  const expected=new ScanTimeline(models.fingerprint).advanceTo(8);
  const incremental=new ScanTimeline(models.fingerprint);const events=[];
  for(let t=.037;t<8;t+=.037) events.push(...incremental.advanceTo(t));
  events.push(...incremental.advanceTo(8));
  assert.deepEqual(events,expected);
  assert.deepEqual(new ScanTimeline(models.fingerprint).advanceTo(8),expected);
});

test('phase 1: thick filled block is not counted as many lines and faint gray lines survive',()=>{
  const block=makeLineFixture('sparse');block.data.fill(255);
  for(let y=100;y<400;y++) for(let x=200;x<700;x++) {
    const p=(y*block.width+x)*4;block.data[p]=block.data[p+1]=block.data[p+2]=25;
  }
  const model=extractLineMask(block);
  assert.equal(model.isLineArt,false);
  assert.equal(new LiveLineReader(model).read(480,.05).count,0);
  const faint=makeLineFixture('dense');
  for(let i=0;i<faint.data.length;i+=4) if(faint.data[i]<100) faint.data[i]=faint.data[i+1]=faint.data[i+2]=190;
  assert.equal(readLineIntersections(extractLineMask(faint),480).length,20);
});

test('phase 2 D: rising curve generates monotonic rising notes, locked to one track',()=>{
  const model=extractLineMask(makeLineFixture('rising'));
  assert.equal(model.isLineArt,true);
  const events=new ScanTimeline(model,{melody:true}).advanceTo(8);
  assert.ok(events.length>=4);
  assert.equal(new Set(events.map(e=>e.id)).size,1);
  assert.ok(events.at(-1).midi-events[0].midi>=7);
  for(let i=1;i<events.length;i++) assert.ok(events[i].midi>=events[i-1].midi);
  assert.ok(events.every(e=>e.midi===lineYToMidi(e.y,model.height)));
});

test('phase 2: horizontal lines keep one melody line and one pitch instead of rotating tracks',()=>{
  for(const kind of ['sparse','dense']) {
    const events=new ScanTimeline(models[kind],{melody:true}).advanceTo(8);
    assert.equal(new Set(events.map(e=>e.id)).size,1);
    assert.equal(new Set(events.map(e=>e.midi)).size,1);
  }
});

test('phase 2: inverted paper and downward curve preserve geometry and pitch direction',()=>{
  const image=makeLineFixture('rising');
  const inverted={...image,data:new Uint8ClampedArray(image.data)};
  for(let p=0;p<inverted.data.length;p+=4) for(let c=0;c<3;c++) inverted.data[p+c]=255-image.data[p+c];
  assert.deepEqual(extractLineMask(inverted).mask,extractLineMask(image).mask);
  const mirrored={...image,data:new Uint8ClampedArray(image.data.length)};
  for(let y=0;y<image.height;y++) for(let x=0;x<image.width;x++) {
    const src=((image.height-1-y)*image.width+x)*4,dst=(y*image.width+x)*4;
    mirrored.data.set(image.data.subarray(src,src+4),dst);
  }
  const notes=new ScanTimeline(extractLineMask(mirrored),{melody:true}).advanceTo(8);
  assert.ok(notes.at(-1).midi<notes[0].midi);
  for(let i=1;i<notes.length;i++) assert.ok(notes[i].midi<=notes[i-1].midi);
});

test('five sweeps use the same image causally, reversing direction on alternate passes',()=>{
  const model=extractLineMask(makeLineFixture('rising'));
  const sequence=new ScanSequence(model,{passes:5,melody:true}).advanceTo(40);
  const first=sequence.filter(e=>e.pass===1),second=sequence.filter(e=>e.pass===2),third=sequence.filter(e=>e.pass===3);
  assert.ok(first.at(-1).midi>first[0].midi);
  assert.ok(second.at(-1).midi<second[0].midi);
  assert.deepEqual(third.map(e=>[e.x,e.y,e.midi]),first.map(e=>[e.x,e.y,e.midi]));
  assert.ok(sequence.every(e=>e.time>(e.pass-1)*8&&e.time<=e.pass*8));
});
