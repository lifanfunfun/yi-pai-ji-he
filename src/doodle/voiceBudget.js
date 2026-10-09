// Reserve release tails; never steal or abruptly cut a currently sounding note.
export class VoiceBudget {
  constructor(limit=8){this.limit=limit;this.reset();}
  reset(){this.ends=Array(this.limit).fill(-Infinity);this.maxActive=0;this.deferred=0;}
  reserve(time,duration,release,gridSeconds,anchor=0){
    let slot=this.ends.findIndex(end=>end<=time+1e-7),at=time;
    if(slot<0){
      slot=this.ends.indexOf(Math.min(...this.ends));
      at=anchor+Math.ceil((this.ends[slot]-anchor)/gridSeconds-1e-7)*gridSeconds;
      this.deferred++;
    }
    this.ends[slot]=at+duration+release;
    this.maxActive=Math.max(this.maxActive,this.ends.filter(end=>end>at).length);
    return at;
  }
}
export function midiNote(midi){return ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'][((midi%12)+12)%12]+(Math.floor(midi/12)-1);}
