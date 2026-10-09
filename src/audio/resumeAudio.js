import * as Tone from 'tone';
export async function resumeProjectAudio() {
  await Tone.start();
  const destination=Tone.getDestination();
  destination.mute=false;
  destination.volume.rampTo(0,.03);
  if(Tone.getContext().state!=='running') {
    await Tone.getContext().resume();
  }
  if(Tone.getContext().state!=='running') throw new Error('浏览器音频尚未恢复');
}
