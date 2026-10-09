import * as Tone from 'tone';
import {WarmPercussion} from '../src/doodle/warmPercussion.js';
import {ProgressiveDrumEngine} from '../src/doodle/progressiveDrums.js';
import {extractLineMask,readLineIntersections} from '../src/doodle/liveLineScanner.js';
import hero from '../assets/doodle-scribble-wide.png';
import houses from '../assets/doodle-building-wide-v2.png';
import sheep from '../assets/doodle-decorative-wide-v2.png';
import fingerprint from '../assets/doodle-tiedye-wide.png';
const output=[];
for(const [voice,velocity] of [['softKick',.15],['woodTick',.11],['brush',.075],['softHat',.065],['popKick',.24],['clap',.17],['brightHat',.1]]) {
  const buffer=await Tone.Offline(()=>{
    const limiter=new Tone.Limiter(-1).toDestination();
    const drums=new WarmPercussion(limiter);
    for(let i=0;i<4;i++) drums.play({voice,velocity,duration:.12},.1+i*.4,.85);
  },2);
  const data=buffer.getChannelData(0);
  let peak=0,power=0;
  for(const value of data) {peak=Math.max(peak,Math.abs(value));power+=value*value;}
  const db=value=>Number((20*Math.log10(Math.max(value,1e-10))).toFixed(1));
  output.push({voice,peakDbFS:db(peak),rmsDbFS:db(Math.sqrt(power/data.length)),clipped:peak>=1});
}
for(const [preset,url] of [['scribble',hero],['building',houses],['decorative',sheep],['tiedye',fingerprint]]) {
  const image=new Image();image.src=url;await image.decode();
  const canvas=document.createElement('canvas');canvas.width=800;canvas.height=450;
  const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0,800,450);
  const model=extractLineMask(ctx.getImageData(0,0,800,450));
  const engine=new ProgressiveDrumEngine({preset}),events=[];
  for(let grid=0;grid<64*4;grid++) {
    const beat=grid/4,pass=Math.floor(beat/32),fraction=beat%32/32;
    const x=(pass%2?1-fraction:fraction)*799;
    const count=readLineIntersections(model,x).filter(p=>p.thickness<450*.045&&p.edgeStrength>.05).length;
    events.push(...engine.atGrid(beat,count));
  }
  output.push({preset,beforeMidpoint:events.filter(e=>e.beat<16).length,outwardSecondHalf:events.filter(e=>e.beat>=16&&e.beat<32).length,returnSweep:events.filter(e=>e.beat>=32).length,voices:[...new Set(events.map(e=>e.voice))]});
}
document.getElementById('result').textContent=JSON.stringify(output,null,2);
