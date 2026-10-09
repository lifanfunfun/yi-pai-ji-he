// B interprets the same theme. A is deliberately never mutated.
export const demoScenes={
  scribble:{intent:'flight-and-joy',source:'demo-annotation'},
  decorative:{intent:'flower-meadow',source:'demo-annotation'},
  building:{intent:'paper-town',source:'demo-annotation'},
  tiedye:{intent:'flowing-pattern',source:'demo-annotation'},
};
export function developReturn(score,{scene=null}={}) {
  const context=scene?{intent:scene,source:'explicit-intent'}:demoScenes[score.preset]??{intent:score.features.green>.08?'green-motion':'visual-colors',source:'pixel-features'};
  const intent=context.intent;
  const nature=['flower-meadow','fresh-leaves','flowers','green-motion'].includes(intent);
  const dry=intent==='dry-leaves';
  const events=score.events.map(e=>({...e,midi:Array.isArray(e.midi)?[...e.midi]:e.midi}));
  const add=(beat,duration,voice,midi,velocity,role='texture')=>{
    if(events.some(e=>e.section===1&&e.voice===voice&&Math.abs(e.beat-beat)<.001)) return;
    events.push({section:1,beat,duration:Math.min(duration,32-beat),voice,midi,velocity,role,x:1-beat/32,development:intent});
  };
  for(const event of events) {
    if(event.section!==1) continue;
    const column=score.features.columns[Math.min(15,Math.floor(event.x*16))];
    const warmth=column.warm/Math.max(.0001,column.mass);
    if(event.role==='lead') {
      // Leave structural strong notes intact; embellish weak notes only.
      if(event.beat%4!==0&&event.beat<24&&!event.subject) {
        if(nature) event.voice='leafChime';
        else if(dry) event.voice='dryPluck';
        else if(intent==='paper-town') event.voice='paperPluck';
        else event.voice=warmth>.15?'feltKeys':'musicBox';
        event.duration*=dry?.58:nature?.8:1;
      }
      if(event.subject==='飞翔人物') {
        // Rising register in B conveys lift, without restarting a new melody.
        if(event.beat%4!==0) event.midi+=12;
        event.duration*=1.12;
      }
      if(event.subject==='举手的孩子们') {
        event.voice='paperPluck';event.duration*=.7;
        if(event.beat%4!==0) event.beat+=.125;
      }
      if(dry) {event.velocity*=.8;event.duration*=.75;}
    }
    if(event.role==='harmony'&&nature) {event.voice='softPad';event.velocity*=.85;}
    if(event.role==='rhythm'&&dry) event.velocity*=.6;
  }
  for(let bar=0;bar<6;bar++) {
    const beat=bar*4,chord=score.harmony[4+Math.floor(bar/2)];
    if(dry) {
      if(bar%2===1) add(beat+3,.28,'dryPluck',chord.notes.at(-1),.2);
      continue;
    }
    // A restrained offbeat pulse increases perceived movement, not scan BPM.
    for(const offset of (nature?[.75,2.75]:[.5,1.5,2.5,3.5])) add(beat+offset,.035,'hat',0,nature?.09:.12,'rhythm');
    if(nature) {
      for(const offset of [1.5,3]) add(beat+offset,.42,'leafChime',chord.notes.at(-1)+12,.22);
    } else if(intent==='flowing-pattern') {
      for(let i=0;i<3;i++) add(beat+.75+i,.32,'marimba',chord.notes[i%chord.notes.length]+12,.19);
    } else if(bar%2===1) {
      add(beat+3.25,.4,'warmReed',chord.notes.at(-1)+12,.23);
    }
  }
  // Thin texture during foreground statements; the protagonist remains audible.
  const foreground=events.filter(e=>e.section===1&&e.subject);
  const filtered=events.filter(e=>!(e.section===1&&e.role==='texture'&&foreground.some(s=>Math.abs(e.beat-s.beat)<.55)));
  filtered.sort((a,b)=>a.section-b.section||a.beat-b.beat);
  return {...score,events:filtered,expression:{...context,secondPass:'theme-variation-and-response',firstPass:'preserved',tempo:'unchanged'}};
}
