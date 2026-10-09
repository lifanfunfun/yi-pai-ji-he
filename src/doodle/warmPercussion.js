import * as Tone from 'tone';
export class WarmPercussion {
  constructor(destination) {
    this.bus=new Tone.Gain(1).connect(destination);
    this.lowCut=new Tone.Filter({type:'highpass',frequency:30,rolloff:-12}).connect(this.bus);
    this.softKick=new Tone.MembraneSynth({pitchDecay:.018,octaves:1.5,oscillator:{type:'sine'},envelope:{attack:.004,decay:.18,sustain:0,release:.08},volume:-14}).connect(this.lowCut);
    this.woodTick=new Tone.FMSynth({harmonicity:3.5,modulationIndex:.45,oscillator:{type:'sine'},envelope:{attack:.002,decay:.055,sustain:0,release:.03},volume:-5}).connect(this.bus);
    this.brushFilter=new Tone.Filter({type:'bandpass',frequency:1500,Q:.5}).connect(this.bus);
    this.brush=new Tone.NoiseSynth({noise:{type:'pink'},envelope:{attack:.012,decay:.065,sustain:0,release:.06},volume:-4}).connect(this.brushFilter);
    this.hatLow=new Tone.Filter({type:'lowpass',frequency:7500,rolloff:-12}).connect(this.bus);
    this.hatHigh=new Tone.Filter({type:'highpass',frequency:3800,rolloff:-12}).connect(this.hatLow);
    this.softHat=new Tone.NoiseSynth({noise:{type:'pink'},envelope:{attack:.003,decay:.025,sustain:0,release:.02},volume:-3}).connect(this.hatHigh);
    this.popKick=new Tone.MembraneSynth({pitchDecay:.025,octaves:3,envelope:{attack:.002,decay:.14,sustain:0,release:.06},volume:-12}).connect(this.lowCut);
    this.clapFilter=new Tone.Filter({type:'bandpass',frequency:1900,Q:.55}).connect(this.bus);
    this.clap=new Tone.NoiseSynth({noise:{type:'pink'},envelope:{attack:.004,decay:.09,sustain:0,release:.04},volume:-5}).connect(this.clapFilter);
    this.brightCut=new Tone.Filter({type:'lowpass',frequency:8500,rolloff:-12}).connect(this.bus);
    this.brightHigh=new Tone.Filter({type:'highpass',frequency:4500,rolloff:-12}).connect(this.brightCut);
    this.brightHat=new Tone.NoiseSynth({noise:{type:'white'},envelope:{attack:.002,decay:.025,sustain:0,release:.018},volume:-7}).connect(this.brightHigh);
    this.lowTom=new Tone.MembraneSynth({pitchDecay:.025,octaves:.8,envelope:{attack:.004,decay:.15,sustain:0,release:.08},volume:-12}).connect(this.bus);
  }
  play(event,time,volume=1) {
    // Artistic event levels are deliberately small; calibrate once at the instrument bus.
    const velocity=Math.min(.65,event.velocity*volume*3.2);
    if(event.voice==='cajon') {
      this.lowTom.triggerAttackRelease('C3',event.duration,time,velocity*.7);
      this.woodTick.triggerAttackRelease('C4',.06,time,velocity*.25);
    }
    if(event.voice==='shaker') this.softHat.triggerAttackRelease(.08,time,velocity*.85);
    if(event.voice==='softKick') this.softKick.triggerAttackRelease('C2',event.duration,time,velocity);
    if(event.voice==='woodTick') this.woodTick.triggerAttackRelease('G4',event.duration,time,velocity);
    if(event.voice==='popKick') this.popKick.triggerAttackRelease('C2',event.duration,time,velocity);
    if(event.voice==='lowTom') this.lowTom.triggerAttackRelease('G2',event.duration,time,velocity);
    if(event.voice==='clap'||event.voice==='brightHat') this[event.voice].triggerAttackRelease(event.duration,time,velocity);
    if(event.voice==='brush'||event.voice==='softHat') this[event.voice].triggerAttackRelease(event.duration,time,velocity);
  }
  stop() {this.bus.gain.cancelScheduledValues(Tone.immediate());this.bus.gain.setValueAtTime(0,Tone.immediate());}
  resume() {this.bus.gain.cancelScheduledValues(Tone.immediate());this.bus.gain.setValueAtTime(1,Tone.immediate());}
}
