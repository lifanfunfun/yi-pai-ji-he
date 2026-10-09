import * as Tone from 'tone';
import {DoodleMusicEngine} from '../src/doodle/doodleAudioEngine.js';
import {composeArtwork} from '../src/doodle/doodleComposer.js';
import {extractLineMask,readLineIntersections} from '../src/doodle/liveLineScanner.js';
import hero from '../assets/doodle-scribble-wide.png';
import houses from '../assets/doodle-building-wide-v2.png';
import sheep from '../assets/doodle-decorative-wide-v2.png';
import fingerprint from '../assets/doodle-tiedye-wide.png';
const result=document.querySelector('#result'),rows=[];
try {
for(const [preset,url,bpm] of [['scribble',hero,104],['building',houses,90],['decorative',sheep,96],['tiedye',fingerprint,72]]) {
  result.textContent=JSON.stringify(rows,null,2)+`\n渲染 ${preset}：真实音源、A/B、100%音量…`;
  const image=new Image();image.src=url;await image.decode();
  const canvas=document.createElement('canvas');canvas.width=800;canvas.height=450;
  const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0,800,450);
  const data=ctx.getImageData(0,0,800,450),mask=extractLineMask(data),score=composeArtwork(data,preset);
  const duration=64*60/bpm+3;
  const buffer=await Tone.Offline(async()=>{
    const engine=new DoodleMusicEngine();engine.volumePercent=100;
    await engine.buildAudio({offline:true});
    if(!engine.ready) throw new Error('实际音源初始化失败');
    engine.score=score;engine.scorePlaying=true;engine.scoreBpm=bpm;
    engine.scoreAnchor=.2;engine.scoreBeat=0;engine.master.gain.value=.85;
    engine.getScanLines=position=>({count:readLineIntersections(mask,position*799).filter(p=>p.thickness<450*.045&&p.edgeStrength>.05).length});
    let current=0;engine.absoluteScoreBeat=()=>current;
    for(let g=0;g<64*100;g++) {current=g/100;engine.scheduleScore();}
  },duration,2,44100);
  let peak=0,power=0,clipped=0,jump=0;
  for(let ch=0;ch<2;ch++) {
    const values=buffer.getChannelData(ch);
    for(let i=0;i<values.length;i++) {peak=Math.max(peak,Math.abs(values[i]));power+=values[i]**2;if(Math.abs(values[i])>=1)clipped++;if(i)jump=Math.max(jump,Math.abs(values[i]-values[i-1]));}
  }
  const db=v=>Number((20*Math.log10(Math.max(v,1e-10))).toFixed(2));
  rows.push({preset,bpm,volumePercent:100,durationSeconds:Number(duration.toFixed(2)),peakDbFS:db(peak),rmsDbFS:db(Math.sqrt(power/(buffer.length*2))),clippedSamples:clipped,maxAdjacentSampleJump:Number(jump.toFixed(4))});
  result.textContent=JSON.stringify(rows,null,2);
}
result.dataset.complete='true';
} catch(error) {result.textContent+=`\nERROR: ${error.stack}`;result.dataset.error='true';}
