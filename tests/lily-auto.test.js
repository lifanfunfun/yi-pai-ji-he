import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { buildLilyGraph } from '../src/lily/lilyGraph.js';
import { createLilyPulseEvents } from '../src/lily/lilyPropagation.js';

test('first bead plays alone, remains source as others join, and pause silences playback', async () => {
  const code = fs.readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
  const functions = code.slice(code.indexOf('function updateLilyState('), code.indexOf('function syncLilyControls('));
  const notes = [];
  let muted = false;
  const context = {
    state: { pads: [{id:'first',x:20,y:20,note:'C4'}], lilyPlaying:true, lilySourceId:null, lilyRange:120, lilyIntervalMs:700, lilySpreadMs:180, lilyMappingMode:'melody-instrument', lilyInstrumentId:'gemidi-marimba' },
    els:{process:{width:640,height:480}},
    createDefaultLilyEnsembleAssignments:()=>({}),
    createLilyNodesFromPads:pads=>pads.map(p=>({...p})),
    buildLilyGraph, createLilyPulseEvents,
    lilyVoiceEngine:{ready:true,start:async()=>{},trigger:event=>notes.push(event.nodeId),setMuted:value=>{muted=value;}},
    syncLilyControls(){},updateLilyPaletteFromControls(){}, performance:{now:()=>1000},alert(){},
  };
  vm.createContext(context);
  vm.runInContext(functions,context);
  context.updateLilyState(1000);context.processLilyPlayback(1000);
  assert.equal(context.state.lilySourceId,'first');
  assert.deepEqual(notes,['first']);
  context.state.pads.push({id:'second',x:50,y:20,note:'D4'});
  context.updateLilyState(1800);context.processLilyPlayback(1800);
  assert.equal(context.state.lilySourceId,'first');
  assert.deepEqual(notes,['first','first','second']);
  context.state.stream={};
  await context.toggleLilyPlay();
  assert.equal(muted,true);
  context.processLilyPlayback(2600);
  assert.equal(notes.length,3);
  await context.toggleLilyPlay();
  assert.equal(muted,false);
  assert.equal(notes.length,5);
  context.state.pads=context.state.pads.slice(1);
  context.updateLilyState(3000);
  assert.equal(context.state.lilySourceId,'second');
});

test('autoplay starts audio and rotates to another available bead after four loops', async () => {
  const code = fs.readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
  const functions = code.slice(code.indexOf('function updateLilyState('), code.indexOf('function syncLilyControls('));
  const first = {id:'first',x:20,y:20,note:'C4'};
  const second = {id:'second',x:50,y:20,note:'D4'};
  const context = {
    state:{lilyNodes:[first,second],lilySourceId:'first',lilyGraph:buildLilyGraph([first,second],{range:120}),lilyIntervalMs:700,lilySpreadMs:180},
    lilyVoiceEngine:{ready:false,start:async()=>{context.lilyVoiceEngine.ready=true;},setMuted(){},trigger(){}},
    updateLilyPaletteFromControls(){},syncLilyControls(){},createLilyPulseEvents,
  };
  vm.createContext(context);vm.runInContext(functions,context);
  await context.startLilyAutoplay();
  assert.equal(context.state.lilyPlaying,true);
  for (const time of [1000,1800,2600,3400]) context.processLilyPlayback(time);
  assert.equal(context.state.lilySourceId,'first');
  context.processLilyPlayback(4200);
  assert.equal(context.state.lilySourceId,'second');
  context.state.lilyNodes=[second];
  context.state.lilyGraph=buildLilyGraph([second],{range:120});
  for (const time of [5000,5800,6600,7400,8200]) context.processLilyPlayback(time);
  assert.equal(context.state.lilySourceId,'second');
});
