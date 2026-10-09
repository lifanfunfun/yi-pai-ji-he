import * as Tone from 'tone';
import {safeOutput} from '../src/audio/safeOutput.js';
import {resumeProjectAudio} from '../src/audio/resumeAudio.js';
const result=document.querySelector('#result');
document.querySelector('#native').onclick=async()=>{
 const ctx=new AudioContext();await ctx.resume();
 for(let i=0;i<3;i++) {
  const osc=ctx.createOscillator(),gain=ctx.createGain(),at=ctx.currentTime+.1+i*.4;
  osc.frequency.value=[261.63,329.63,392][i];gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(.12,at+.03);gain.gain.linearRampToValueAtTime(0,at+.28);
  osc.connect(gain).connect(ctx.destination);osc.start(at);osc.stop(at+.3);
 }
 result.textContent=`原生 AudioContext：${ctx.state}；直接输出三个音。`;
 setTimeout(()=>ctx.close(),1600);
};
document.querySelector('#project').onclick=async()=>{
 try {
 await resumeProjectAudio();
 const voice=new Tone.Synth({oscillator:{type:'sine'},envelope:{attack:.02,decay:.1,sustain:.2,release:.15},volume:-12}).connect(safeOutput());
 const now=Tone.now();['C4','E4','G4'].forEach((note,i)=>voice.triggerAttackRelease(note,.2,now+.1+i*.4,.6));
 result.textContent=`项目 AudioContext：${Tone.getContext().state}；静音：${Tone.getDestination().mute}；总输出：${Tone.getDestination().volume.value.toFixed(1)} dB。`;
 setTimeout(()=>voice.dispose(),1800);
 }catch(error){result.textContent=error.stack;}
};
