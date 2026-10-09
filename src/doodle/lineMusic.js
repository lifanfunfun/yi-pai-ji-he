// Two-axis edge occupancy controls note density, on the shared scan/music clock.
// Line-art classification is a visual heuristic, not semantic recognition.
export function mapLinesToMusic(score) {
  if(!score.events.length||!(score.preset==='tiedye'||score.features.lineDrawing)) return score;
  const columns=score.features.lineColumns;
  if(!columns?.length) return score;
  const peak=Math.max(...columns.map(c=>c.density),.025);
  let events=score.events.filter(e=>e.lineDensity===undefined&&!(['harp','concertHarp'].includes(e.voice)&&e.role==='texture'));
  if(score.preset==='tiedye') {
    const beds=new Map();
    for(const event of events.filter(event=>event.role==='harmony')) {
      const key=event.section*32+event.beat,previous=beds.get(key);
      if(!previous||(Array.isArray(event.midi)?event.midi.length:1)>(Array.isArray(previous.midi)?previous.midi.length:1))beds.set(key,event);
    }
    events=events.filter(event=>event.role==='lead'||event.role==='pulse').map(event=>({...event,voice:event.role==='lead'?'handpan':'marimba',velocity:event.role==='lead'?event.velocity:.18}));
    events.push(...[...beds.values()].map(event=>({...event,voice:'strings',velocity:.16})));
  }
  const scale=score.melodyScale;
  const pitch=degree=>score.root+scale[degree%scale.length]+12+12*Math.floor(degree/scale.length);
  const allowed=Array.from({length:12},(_,degree)=>pitch(degree));
  const previous=[null,null];
  const lastBeat=[-Infinity,-Infinity];
  const arpeggio=[0,2,4,2,5,3,0,4];
  for(let section=0;section<2;section++) for(let cell=0;cell<columns.length;cell++) {
    const column=columns[section?columns.length-1-cell:cell];
    const density=column.density/peak;
    if(column.density<.008) continue;
    const dense=density>.65,medium=density>.28;
    if(!dense&&!medium&&cell%4!==0||medium&&!dense&&cell%2!==0) continue;
    const start=cell*32/columns.length;
    for(const offset of dense?[0,.25]:[0]) {
      // Dense lines use a three-note subdivision, rather than continuous sixteenths.
      const beat=dense?Math.round((start+offset)*3)/3:start+offset;
      if(beat<=lastBeat[section]+1e-7) continue;
      if(beat>=30.5) continue;
      lastBeat[section]=beat;
      const chord=score.harmony[Math.floor((section*32+beat)/8)];
      const degree=Math.round((1-column.centroid)*3)+arpeggio[(cell*2+(offset?1:0))%arpeggio.length];
      const target=pitch(degree);
      const chordTones=allowed.filter(n=>chord.pitchClasses.includes(n%12));
      const pool=chordTones.length?chordTones:allowed;
      // Avoid repeated seconds and repeated pitches; prefer bounded chordal leaps.
      const bounded=pool.filter(n=>previous[section]===null||Math.abs(n-previous[section])>=3&&Math.abs(n-previous[section])<=9);
      const alternatives=bounded.length?bounded:pool.filter(n=>previous[section]===null||Math.abs(n-previous[section])>=3);
      const midi=(alternatives.length?alternatives:pool).reduce((a,b)=>Math.abs(a-target)<=Math.abs(b-target)?a:b);
      previous[section]=midi;
      events.push({section,beat,duration:dense?.22:medium?.42:.85,role:'texture',voice:score.preset==='tiedye'?'marimba':'concertHarp',midi,velocity:section?.33:.3,x:section?1-beat/32:beat/32,lineDensity:density});
    }
  }
  events.sort((a,b)=>a.section-b.section||a.beat-b.beat);
  return {...score,events,...(score.preset==='tiedye'?{percussionEnabled:true,arrangementIntent:'弦乐和声、手碟、木琴，配轻箱鼓与沙锤'}:{}),lineMapping:{source:'two-axis-edge-occupancy',columns:columns.length,classification:score.preset==='tiedye'?'demo-line-art':'image-heuristic'}};
}
