import * as Tone from 'tone';
import {CelloEngine} from '../src/audio/celloEngine.js';
import {DrumEngine} from '../src/audio/drumEngine.js';
import {SequencerPad} from '../src/audio/sequencerPad.js';
import {LilyVoiceEngine} from '../src/lily/lilyVoiceEngine.js';
const output=document.querySelector('#result'),rows=[];
try {
for(const mode of ['舞','漾','织']) {
 const buffer=await Tone.Offline(async()=>{
  const context=Tone.getContext();
  if(mode==='舞') {
   const engine=new CelloEngine();engine.setVolume(100);engine.initOutput();
   for(let i=0;i<8;i++) context.setTimeout(()=>engine.playPhysicalAcousticCello(['F3','A3','C4','D4'][i%4],.8,.4),.1+i*.5);
  }
  if(mode==='漾') {
   const engine=new LilyVoiceEngine({Tone:{...Tone,start:async()=>{}}});await engine.start();engine.setVolume(100);
   for(let i=0;i<16;i++) engine.trigger({note:['C4','E4','G4','A4'][i%4],time:.1+i*.25,velocity:.9});
  }
  if(mode==='织') {
   const engine=new DrumEngine();await engine.start({offline:true});
   const pad=new SequencerPad({...Tone,start:async()=>{}});await pad.start();
   for(let i=0;i<16;i++) {
    const time=.1+i*.25;pad.trigger(i,time);
    engine.kick.triggerAttackRelease('C1',.1,time,.85);
    engine.hihat.triggerAttackRelease(.04,time,.6);
    if(i%2) engine.snareBody.triggerAttackRelease('D2',.1,time,.5);
   }
  }
 },6,2,44100);
 let peak=0,power=0,clips=0;
 for(let ch=0;ch<2;ch++) for(const value of buffer.getChannelData(ch)) {peak=Math.max(peak,Math.abs(value));power+=value*value;if(Math.abs(value)>=1) clips++;}
 const db=n=>Number((20*Math.log10(Math.max(n,1e-9))).toFixed(2));
 rows.push({mode,peakDbFS:db(peak),rmsDbFS:db(Math.sqrt(power/(buffer.length*2))),clippedSamples:clips});
 output.textContent=JSON.stringify(rows,null,2);
}
output.dataset.complete='true';
}catch(error){output.textContent+=`\nERROR: ${error.stack}`;}
