import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source = fs.readFileSync(new URL('../src/doodle/doodleStageView.js', import.meta.url),'utf8');
const classSource = source.slice(source.indexOf('export class DoodleStageView')).replace('export class','class');
const DoodleStageView = vm.runInNewContext(`${classSource};DoodleStageView`);

test('two sections alternate directions, stay in bounds and freeze when paused', () => {
  const view=Object.create(DoodleStageView.prototype);
  Object.assign(view,{canvasWidth:800,canvasHeight:550,isPlaying:true,bpm:90,scanPos:0,section:0,direction:1,lastFrameTime:0,lastBeat:0,lastScanSample:0,bandStates:Array(24).fill(false),sourceMode:'doodle',stageEl:{querySelector:()=>({})},sampleScanline(){},renderOverlays(){}});
  let now=0;
  const advance=()=>{for(let i=0;i<135;i++){now+=80;view.tick(now);}assert.ok(view.scanPos>=0&&view.scanPos<=1);};
  advance();assert.equal(view.section,1);assert.equal(view.direction,-1);
  advance();assert.equal(view.section,0);assert.equal(view.direction,1);
  advance();assert.equal(view.section,1);assert.equal(view.direction,-1);
  advance();assert.equal(view.section,0);assert.equal(view.direction,1);
  view.isPlaying=false;const position=view.scanPos;now+=80;view.tick(now);assert.equal(view.scanPos,position);
});
