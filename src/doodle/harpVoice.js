import * as Tone from 'tone';
import C3 from '../../assets/harp-samples/C3.mp3';
import F4 from '../../assets/harp-samples/F4.mp3';
import A4 from '../../assets/harp-samples/A4.mp3';
import E5 from '../../assets/harp-samples/E5.mp3';
import G5 from '../../assets/harp-samples/G5.mp3';
import B5 from '../../assets/harp-samples/B5.mp3';
import D6 from '../../assets/harp-samples/D6.mp3';
export function loadHarp(){return new Promise((resolve,reject)=>{
  let voice=new Tone.Sampler({urls:{C3,F4,A4,E5,G5,B5,D6},attack:.006,release:1.5,volume:-13,onload:()=>resolve(voice),onerror:reject});
});}
