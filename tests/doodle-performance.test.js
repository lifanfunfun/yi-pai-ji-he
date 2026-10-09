import test from 'node:test';import assert from 'node:assert/strict';
import {VoiceBudget,midiNote} from '../src/doodle/voiceBudget.js';
import {lazyVoice,lazySample} from '../src/doodle/lazyVoice.js';
import {PlaybackBudget} from '../src/doodle/playbackBudget.js';
test('8 voice limit reserves release tails and quantizes overflow without dropping notes',()=>{
 const budget=new VoiceBudget(8),starts=[];
 for(let i=0;i<40;i++)starts.push(budget.reserve(i*.03,.18,.65,.125));
 assert.equal(starts.length,40);assert.ok(budget.maxActive<=8);assert.ok(budget.deferred>0);
 for(let i=8;i<starts.length;i++)assert.ok(starts[i]>=starts[i-8]+.83-1e-7);
 assert.ok(starts.slice(8).every(time=>Math.abs(time/.125-Math.round(time/.125))<1e-7));
});
test('ordinary density preserves original note times and pitches',()=>{
 const budget=new VoiceBudget(8);
 for(let i=0;i<40;i++)assert.equal(budget.reserve(i*.25,.18,.65,.125),i*.25);
 assert.equal(budget.deferred,0);assert.equal(midiNote(60),'C4');assert.equal(midiNote(61),'C#4');
});
test('unused voices do not create audio nodes; used nodes are reused',()=>{
 let created=0,hits=0,connections=0;
 const voice=lazyVoice(()=>{created++;return {connect(){connections++;},triggerAttackRelease(){hits++;},releaseAll(){}};});
 voice.connect({});voice.releaseAll();assert.equal(created,0);
 voice.warm();voice.triggerAttackRelease();voice.triggerAttackRelease();assert.equal(created,1);assert.equal(hits,2);assert.equal(connections,1);
});
test('sample preload is shared and playback cannot instantiate a second sampler',async()=>{
 let loads=0,hits=0;
 const voice=lazySample(async()=>{loads++;return {connect(){},triggerAttackRelease(){hits++;}};});
 voice.connect({});assert.equal(loads,0);await Promise.all([voice.warm(),voice.warm()]);
 voice.triggerAttackRelease();assert.equal(loads,1);assert.equal(hits,1);assert.equal(voice.loaded,true);
});
test('combined melody/harmony budget bounds note count and weighted synthesis cost',()=>{
 const budget=new PlaybackBudget(),reservations=[];
 for(let i=0;i<120;i++) {
   const voice=i%5===0?'fatPad':'harp',count=voice==='fatPad'?3:1,cost=voice==='fatPad'?3:1;
   const start=budget.reserve({voice,time:i*.04,duration:.2,release:.6,count,cost,grid:1/3});
   reservations.push({start,end:start+.8,count,cost,voice});
 }
 for(const at of reservations.map(n=>n.start+.00001)) {
   const active=reservations.filter(n=>n.start<=at&&n.end>at);
   assert.ok(active.reduce((sum,n)=>sum+n.count,0)<=16);
   assert.ok(active.reduce((sum,n)=>sum+n.count*n.cost,0)<=32);
   for(const voice of ['harp','fatPad'])assert.ok(active.filter(n=>n.voice===voice).reduce((sum,n)=>sum+n.count,0)<=8);
 }
 assert.ok(budget.stats.deferred>0);
});
