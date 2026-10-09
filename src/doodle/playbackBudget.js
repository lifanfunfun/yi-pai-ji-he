// Conservative scheduling limits, not a claim about a device's CPU capacity.
export class PlaybackBudget {
  constructor({notes=16,perVoice=8,cost=32}={}){this.limits={notes,perVoice,cost};this.reset();}
  reset(){this.active=[];this.stats={peakNotes:0,peakCost:0,maxVoice:0,deferred:0,maxDelay:0};}
  reserve({voice,time,duration,release,cost=1,count=1,grid=.1,anchor=0}) {
    let at=time;
    this.active=this.active.filter(note=>note.end>time+1e-7);
    for(let iteration=0;iteration<1000;iteration++) {
      const end=at+duration+release;
      const checkpoints=[at,...this.active.filter(note=>note.start>at&&note.start<end).map(note=>note.start)];
      let violation,peakNotes=0,peakCost=0,peakVoice=0;
      for(const point of checkpoints) {
        const active=this.active.filter(note=>note.start<=point+1e-7&&note.end>point+1e-7);
        const same=active.filter(note=>note.voice===voice);
        const total=active.reduce((sum,n)=>sum+n.count,0),usedCost=active.reduce((sum,n)=>sum+n.cost*n.count,0),voiceCount=same.reduce((sum,n)=>sum+n.count,0);
        peakNotes=Math.max(peakNotes,total+count);peakCost=Math.max(peakCost,usedCost+cost*count);peakVoice=Math.max(peakVoice,voiceCount+count);
        if(total+count>this.limits.notes||usedCost+cost*count>this.limits.cost||voiceCount+count>this.limits.perVoice){violation=voiceCount+count>this.limits.perVoice?same:active;break;}
      }
      if(!violation) {
        this.active.push({voice,count,cost,start:at,end});
        this.stats.peakNotes=Math.max(this.stats.peakNotes,peakNotes);
        this.stats.peakCost=Math.max(this.stats.peakCost,peakCost);
        this.stats.maxVoice=Math.max(this.stats.maxVoice,peakVoice);
        if(at>time+1e-7){this.stats.deferred++;this.stats.maxDelay=Math.max(this.stats.maxDelay,at-time);}
        return at;
      }
      const next=Math.min(...violation.map(note=>note.end));
      if(!Number.isFinite(next))throw new Error('A chord exceeds the configured voice budget');
      at=anchor+Math.ceil((next-anchor)/grid-1e-7)*grid;
    }
    throw new Error('Cannot find a bounded playback slot');
  }
}
