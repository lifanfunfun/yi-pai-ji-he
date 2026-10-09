// Two-bar patterns share the score clock. B develops the established groove.
const grooves={
  pop:{name:'欢快童趣舞曲',kick:[0,1,2,3,4,5,6,7],clap:[1,3,5,7],hat:[.5,1.5,2.5,3.5,4.5,5.5,6.5,7.5],extra:'shaker'},
  wood:{name:'纸屋木质律动',kick:[0,3,4,6.5],rim:[1,2.75,5,7],shaker:[.5,1.5,3.5,4.5,5.5,7.5],extra:'rim'},
  swing:{name:'花园摇摆',kick:[0,2,4,6],rim:[1,3,5,7],shaker:[.67,1.67,2.67,3.67,4.67,5.67,6.67,7.67],extra:'clap'},
  organic:{name:'旋转轻律动',kick:[0,3.5,4,6.75],rim:[2,6],shaker:[.75,2.5,4.75,6.5],extra:'tom'},
  soft:{name:'舒缓脉动',kick:[0,4.5],shaker:[2.5,6.5],extra:'rim'},
  paperTown:{name:'纸屋原声轻切分',kick:[0,3,4,6.5],rim:[1.5,3.5,5,7],shaker:[.5,2,3.5,4.5,6,7.5],extra:'rim'},
  garden:{name:'花园三连摇摆',kick:[0,4],rim:[2,6],shaker:[.67,2.67,4.67,6.67],extra:'rim'},
  fingerprint:{name:'指纹流动切分',kick:[0,3.5,4,6.5],rim:[2,6],tom:[2.75,6.75],shaker:[.5,1.5,2.5,3.5,4.5,5.5,6.5,7.5],extra:'tom'},
};
export function applyGroove(score) {
  const demoGroove={building:'paperTown',decorative:'garden',tiedye:'fingerprint'}[score.preset];
  const groove=grooves[demoGroove??score.groove]??grooves.soft;
  const events=score.events.filter(e=>e.role!=='rhythm');
  const add=(absolute,voice,velocity)=>{
    if(events.some(e=>e.role==='rhythm'&&e.voice===voice&&e.section*32+e.beat===absolute)) return;
    events.push({section:Math.floor(absolute/32),beat:absolute%32,duration:voice==='kick'||voice==='tom'?.18:.055,role:'rhythm',voice,midi:voice==='tom'?48:36,velocity,x:absolute<32?absolute/32:1-(absolute%32)/32});
  };
  // Intro and final cadence breathe. Four repeated loops establish identity.
  for(let phrase=4;phrase<8;phrase++) {
    const at=phrase*8,b=at>=32;
    for(const [voice,positions] of Object.entries(groove)) {
      if(!Array.isArray(positions)) continue;
      if(phrase===4&&['hat','shaker'].includes(voice)) continue;
      for(let i=0;i<positions.length;i++) {
        if(phrase===7&&positions[i]>=4) continue;
        const level=voice==='kick'?.29:voice==='clap'||voice==='snare'?.27:voice==='rim'?.23:.17;
        add(at+positions[i],voice,level*(i%2?.85:1)*(phrase===6?1.12:phrase===7?.8:1));
      }
    }
    if(b) {
      if(groove.extra==='clap') for(const offset of [3,7]) add(at+offset,'clap',.12);
      if(groove.extra==='rim') add(at+7.5,'rim',.12);
      if(groove.extra==='tom'&&phrase!==7) add(at+7.5,'tom',.22);
      // One short turnaround per four bars, avoiding constant drum fills.
      if(phrase===5||phrase===6) {
        const offsets=phrase===6?[.25,.75,1.25,1.75,2.25,2.75,3.25,3.75,4.25,4.75,5.25,5.75,6.25,6.75,7.25,7.75]:[1.75,3.75,5.75,7.75];
        for(let i=0;i<offsets.length;i++) {
          if(score.groove==='soft'&&score.preset!=='tiedye'&&i%4!==0) continue;
          if(score.groove!=='pop'&&score.groove!=='soft'&&i%2!==0) continue;
          add(at+offsets[i],'shaker',(phrase===6?.13:.1)*(score.groove==='soft'?.6:1));
        }
      }
    }
  }
  events.sort((a,b)=>a.section-b.section||a.beat-b.beat);
  return {...score,events,grooveName:groove.name};
}
