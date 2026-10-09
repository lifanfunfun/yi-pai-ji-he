import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { GridScanner } from '../src/detection/gridScanner.js';
import { SequencerPad } from '../src/audio/sequencerPad.js';

test('five-row grid expands evenly and routes only the top row to the melodic pad', () => {
  const scanner = new GridScanner({rows:5,rowInstruments:['pad','kick','snare','hihat','clap']});
  assert.equal(scanner.rows,5);
  assert.deepEqual(scanner.evaluatePoint(0,0),{x:.04,y:.04});
  const drumHits=[],padHits=[];
  const code=fs.readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
  const fn=code.slice(code.indexOf('function triggerGridStep('),code.indexOf('async function toggleSequencerPlay('));
  const context={state:{gridScanner:scanner,gridState:scanner.rowInstruments.map(instrument=>[{active:true,instrument}])},drumEngine:{trigger:id=>drumHits.push(id)},sequencerPad:{trigger:step=>padHits.push(step)}};
  vm.runInNewContext(`${fn};triggerGridStep(0,10);`,context);
  assert.deepEqual(padHits,[0]);
  assert.deepEqual(drumHits,['kick','snare','hihat','clap']);
});

test('pad notes keep scheduled transport timing and stop releases voices', async () => {
  let hit,released=false;
  class Node { constructor(){this.voiceOptions=arguments[1];} toDestination(){return this;} connect(){return this;} triggerAttackRelease(...args){hit=args;} releaseAll(){released=true;} }
  const engine=new SequencerPad({start:async()=>{},Limiter:Node,Reverb:Node,PolySynth:Node,Synth:Node},()=>new Node());
  await engine.start();engine.trigger(4,12.5);
  assert.deepEqual(hit,['A4','8n',12.5,.65]);
  engine.stop();assert.equal(released,true);
});
