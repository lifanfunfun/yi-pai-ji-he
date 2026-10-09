// Read accompaniment timing from the actual score, including repeated A/B cycles.
const scoreTimes=new WeakMap();
export function rhythmContext(score, absoluteBeat) {
  const beat=((absoluteBeat%score.totalBeats)+score.totalBeats)%score.totalBeats;
  if(!scoreTimes.has(score)) {
    const cached={bass:[],harmony:[],pulse:[]};
    for(const event of score.events) if(cached[event.role]) cached[event.role].push(event.section*score.sectionBeats+event.beat);
    for(const list of Object.values(cached)) list.sort((a,b)=>a-b);
    scoreTimes.set(score,cached);
  }
  const on=at=>Math.abs(at-beat)<.001;
  const {bass,harmony,pulse}=scoreTimes.get(score);
  const next=harmony.find(at=>at>beat+.001)??score.totalBeats;
  return {bassHit:bass.some(on),pulseHit:pulse.some(at=>Math.abs(Math.round(at*4)/4-beat)<.001),
    chordChange:harmony.some(on),beforeChordChange:next-beat<=.5,
    phraseEnd:beat%8>=7,ending:beat>=score.totalBeats-4};
}
