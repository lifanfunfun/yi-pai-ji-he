// Grid-quantized percussion driven by scan-local crossings, never a prerecorded loop.
export class ProgressiveDrumEngine {
  constructor({sectionBeats=32,preset='scribble'}={}) {this.sectionBeats=sectionBeats;this.preset=preset;this.reset();}
  reset() {this.lastGrid=-1;this.smoothed=0;this.state={pass:1,density:0,activity:0,voices:[]};}
  atGrid(absoluteBeat,lineCount,context=null) {
    const grid=Math.ceil(absoluteBeat*4-1e-7);
    if(grid<=this.lastGrid) return [];
    this.lastGrid=grid;
    const beat=grid/4,pass=Math.floor(beat/this.sectionBeats),returning=pass%2===1;
    this.smoothed+=.4*(Math.min(1,Math.max(0,lineCount)/24)-this.smoothed);
    const density=this.smoothed,sub=grid%16,bar=Math.floor(beat/4),local=beat%this.sectionBeats;
    const events=[];
    const breath=.84+.16*Math.sin(local/this.sectionBeats*Math.PI);
    const add=(voice,velocity)=>events.push({beat,voice,velocity:velocity*breath*(this.preset==='tiedye'?.55:1),duration:['softKick','popKick','lowTom','cajon'].includes(voice)?.16:.06,pass:pass+1,density,lineCount});
    const entered=returning||local>=this.sectionBeats/2;
    const cadence=local>=this.sectionBeats-1||context?.ending;
    const profiles={
      scribble:{kick:'popKick',a:[0,8],b:[0,4,8,12],accent:'clap',back:[4,12],hat:'brightHat',tops:[2,6,10,14]},
      building:{kick:'softKick',a:[0,8],b:[0,6,8,14],accent:'woodTick',back:[4,12],hat:'softHat',tops:[2,10]},
      decorative:{kick:'softKick',a:[0],b:[0,8],accent:'brush',back:[4,12],hat:'softHat',tops:[3,7,11,15]},
      tiedye:{kick:'cajon',a:[0],b:[0,8],accent:'cajon',back:[6,14],hat:'shaker',tops:[3,11]},
    };
    const profile=profiles[this.preset]??profiles.tiedye;
    if(entered) {
      if(lineCount===0) {if(sub===0) add(this.preset==='tiedye'?'cajon':'softKick',.028);}
      else {
        // The low drum speaks with the bass, rather than placing unrelated roots.
        const kickHit=context?(context.bassHit||context.chordChange):(returning?profile.b:profile.a).includes(sub);
        if(kickHit) add(profile.kick,(returning?.24:.14)*(context?.chordChange?1:.9));
        if(returning&&!cadence) {
          if(profile.back.includes(sub)) add(profile.accent,this.preset==='scribble'?.17:.13);
          if(context?context.pulseHit:profile.tops.includes(sub)) add(profile.hat,this.preset==='scribble'?.10:.075);
          if(density>.35&&[1,5,9,13].includes(sub)&&bar%4!==3&&!context?.phraseEnd) add(profile.hat,.065);
          if(density>.55&&(context?context.beforeChordChange:sub===15&&bar%2===1)) add(this.preset==='building'?'woodTick':this.preset==='tiedye'?'cajon':'lowTom',.10);
        } else if(!cadence&&density>.22&&sub===10) add(profile.hat,.055);
      }
    }
    // An accent and a harmonic fill may request the same mono drum at one instant.
    // Merge them instead of restarting its oscillator twice (Tone rejects this).
    const merged=new Map();
    for(const event of events) {
      const previous=merged.get(event.voice);
      if(!previous||event.velocity>previous.velocity) merged.set(event.voice,event);
    }
    const bounded=[...merged.values()].slice(0,2);
    this.state={pass:pass+1,density:lineCount,smoothed:density,activity:entered?(returning?.9:.4)*breath:0,voices:bounded.map(e=>e.voice)};
    return bounded;
  }
}
