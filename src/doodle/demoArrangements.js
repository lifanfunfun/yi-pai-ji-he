// These are authored arrangements for known demo pictures, not object detection.
export function arrangeDemoPicture(score) {
  const preset=score.preset;
  if(!['building','decorative','tiedye'].includes(preset)) return score;
  const events=score.events.filter(e=>e.role!=='lead'&&e.role!=='pulse').map(event=>({...event,midi:Array.isArray(event.midi)?[...event.midi]:event.midi}));
  for(const event of events) {
    if(preset==='building') {
      if(event.role==='lead') {
        event.voice='paperPluck';event.duration=Math.min(.75,event.duration*1.15);
        event.velocity*=1.05;
      }
      if(event.role==='pulse') {
        // Individual plucks alternate like the staggered roof/window shapes.
        const chord=score.harmony[Math.floor((event.section*32+event.beat)/8)];
        event.voice='paperKeys';event.midi=chord.notes[Math.floor(event.beat/2)%chord.notes.length]+12;
        event.duration=.32;event.velocity=.27;
      }
      if(event.role==='texture') {event.voice='paperPluck';event.velocity*=.75;}
      if(event.role==='bass') event.duration=.65;
    }
    if(preset==='decorative') {
      if(event.role==='lead') {
        event.voice='gardenFlute';event.duration=Math.min(1.2,event.duration*1.4);
        event.midi+=12;event.velocity*=.95;
      }
      if(event.role==='pulse') {event.voice='musicBox';event.midi=Array.isArray(event.midi)?event.midi.at(-1)+12:event.midi+12;event.velocity=.23;}
      if(event.role==='texture') {event.voice='harp';event.duration=.8;}
      if(event.role==='harmony') event.velocity*=.85;
    }
    if(preset==='tiedye') {
      if(event.role==='lead') {
        event.voice='handpan';event.duration=Math.min(1.8,event.duration*1.8);event.velocity*=1.1;
      }
      if(event.role==='pulse') {
        event.voice='handpan';event.duration=1.1;event.velocity=.18;
        event.midi=Array.isArray(event.midi)?event.midi.at(-1):event.midi;
      }
      if(event.role==='texture') {event.voice='feltKeys';event.duration=1.3;event.velocity*=.65;}
      if(event.role==='harmony') {event.voice='fingerprintAir';event.velocity*=.8;}
      if(event.role==='rhythm') event.velocity*=1.15;
    }
  }
  const plans={
    building:{voice:'paperPluck',answer:'paperKeys',motif:[0,2,1,3,2,4,2,0],rhythm:[0,.75,1.5,2.5,4,4.75,5.5,6.5],arpeggio:[0,2,1,2],offsets:[.5,1.5,2.5,3.5]},
    decorative:{voice:'gardenFlute',answer:'musicBox',motif:[0,2,4,3,4,5,2,0],rhythm:[0,.67,1.33,2.67,4,4.67,5.33,6.67],arpeggio:[0,1,2,1],offsets:[.67,2,2.67]},
    tiedye:{voice:'handpan',answer:'feltKeys',motif:[0,2,4,2,5,3,0,2],rhythm:[0,1,2.5,3.5,4.5,5.5,6.5,7],arpeggio:[0,2,1,2],offsets:[.75,2.25,3.75]},
  };
  const plan=plans[preset],scale=score.melodyScale;
  const note=degree=>score.root+scale[(degree%scale.length+scale.length)%scale.length]+12*Math.floor(degree/scale.length)+(preset==='decorative'?12:0);
  const add=(absolute,duration,role,voice,midi,velocity)=>events.push({section:Math.floor(absolute/32),beat:absolute%32,duration:Math.min(duration,64-absolute),role,voice,midi,velocity,x:absolute<32?absolute/32:1-absolute%32/32});
  for(const event of events) if(event.role==='harmony') event.velocity*=.55;
  for(let phrase=0;phrase<8;phrase++) {
    const chord=score.harmony[phrase],start=phrase*8;
    for(let i=0;i<8;i++) {
      if(phrase===0&&i>3||phrase===7&&i>4) continue;
      let degree=plan.motif[i]+(phrase>=4&&phrase<=5&&i>=4?1:0);
      let midi=note(degree);
      if(i===0||i===4) {
        const choices=Array.from({length:9},(_,d)=>note(d)).filter(n=>chord.pitchClasses.includes(n%12));
        if(choices.length) midi=choices.reduce((a,b)=>Math.abs(a-midi)<=Math.abs(b-midi)?a:b);
      }
      const next=plan.rhythm[i+1]??8;
      add(start+plan.rhythm[i],Math.min(preset==='building'?.6:.95,(next-plan.rhythm[i])*.85),'lead',plan.voice,midi,.66);
    }
    // Follow chord tones as a moving accompaniment, with a clear gap to answer.
    for(let bar=0;bar<2;bar++) for(let i=0;i<plan.offsets.length;i++) {
      if(phrase===7||phrase===0&&bar===0) continue;
      const midi=chord.notes[plan.arpeggio[i]%chord.notes.length]+(preset==='tiedye'?12:0);
      add(start+bar*4+plan.offsets[i],preset==='tiedye'?.55:.26,'pulse',plan.answer,midi,phrase>=4?.27:.21);
    }
    if(phrase%2===1&&phrase<7) add(start+7.4,.4,'texture',plan.answer,chord.notes.at(-1)+12,.26);
  }
  add(62,1.8,'lead',plan.voice,note(0),.58);
  if(preset==='tiedye') {
    const columns=score.features.columns;
    const edgeValues=columns.map(c=>c.edges);
    const min=Math.min(...edgeValues),max=Math.max(...edgeValues);
    for(let section=0;section<2;section++) for(let cell=0;cell<16;cell++) {
      const column=columns[section?15-cell:cell];
      const density=max-min>.0001?(column.edges-min)/(max-min):.5;
      const offsets=density>.66?[0,.5,1,1.5]:density>.33?[0,1]:[0];
      const at=section*32+cell*2;
      const chord=score.harmony[Math.floor(at/8)];
      for(let i=0;i<offsets.length;i++) {
        if(at+offsets[i]>=62) continue;
        // Trace the contour in scale steps, resolving phrase starts to harmony.
        const degree=Math.round((1-column.centroid)*5)+i%3;
        let midi=note(degree)+12;
        if(i===0) midi=chord.notes[cell%chord.notes.length]+12;
        add(at+offsets[i],density>.66?.38:.8,'texture','harp',midi,section?.36:.3);
      }
    }
    // Open upper voicing adds brightness without lifting the whole bed level.
    for(let phrase=0;phrase<8;phrase++) {
      const notes=score.harmony[phrase].notes;
      add(phrase*8,7.7,'harmony','fingerprintAir',[notes[0],notes.at(-1)+12],.16);
    }
  }
  events.sort((a,b)=>a.section-b.section||a.beat-b.beat);
  const descriptions={
    building:'纸屋拼贴：木质拨弦与错落的原声轻律动',
    decorative:'小羊与花朵：长笛式主题与花园摇摆',
    tiedye:'彩泥指纹：手碟式主题与循环氛围电子',
  };
  return {...score,events,arrangementIntent:descriptions[preset]};
}
