// Observed image features choose compatible musical parts, never object labels.
export function planUpload(features) {
  const columns=features.columns;
  const density=columns.reduce((s,c)=>s+c.density,0)/columns.length;
  const variation=columns.reduce((s,c)=>s+Math.abs(c.density-density),0)/columns.length;
  const family=features.lineDrawing?'line':features.green>.045?'garden':features.cool>features.warm+.025?'cool':features.edges>.055?'graphic':'warm';
  const banks={
    line:{lead:'handpan',bed:'strings',bass:'roundBass',pulse:'marimba',groove:'organic',mode:'major',roots:[1,4,0,3,5,1,4,0]},
    garden:{lead:'gardenFlute',bed:'gardenPad',bass:'pluckBass',pulse:'musicBox',groove:'swing',mode:'major',roots:[3,0,1,4,2,5,3,0]},
    cool:{lead:'feltKeys',bed:'softPad',bass:'deepBass',pulse:'handpan',groove:'soft',mode:'major',roots:[5,2,3,0,1,4,3,0]},
    graphic:{lead:'paperPluck',bed:'woodPad',bass:'pluckBass',pulse:'paperKeys',groove:'wood',mode:'major',roots:[1,4,2,5,3,1,4,0]},
    warm:{lead:'musicBox',bed:'gardenPad',bass:'roundBass',pulse:'marimba',groove:'pop',mode:'major',roots:[5,3,0,4,1,5,4,0]},
  };
  const bank=banks[family];
  // Local composition changes harmonic route, not just transposition/timbre.
  const roots=bank.roots.map((degree,i)=>{
    if(i===7) return 0;
    const c=columns[i*2];
    return c.density<density*.55?[3,5,1,0,2,3,4][i]:degree;
  });
  const motif=Array.from({length:8},(_,i)=>Math.max(0,Math.min(7,Math.round((1-columns[i*2].centroid)*7))));
  return {...bank,family,root:features.cool>features.warm?62:65,motif,
    chords:roots.map(d=>[d,d+2,d+4]),
    offsets:density<.12?[2]:variation>.08?[.67,2.67]:[1,3],duration:.4,
    evidence:{density,variation,warmth:features.warm-features.cool,edges:features.edges,green:features.green}};
}

// A small number of separated chord tones supplies harmony without a drone.
export function uploadTexture(plan,chord,bar,localDensity) {
  const patterns={
    line:{voice:'marimba',offsets:[0,4/3,8/3],order:[0,2,1],duration:.55},
    garden:{voice:'paperPluck',offsets:[0,4/3,8/3],order:[0,1,2],duration:.48},
    cool:{voice:'feltKeys',offsets:[0,2.5],order:[0,2],duration:1.1},
    graphic:{voice:'paperKeys',offsets:[.5,2,3],order:[0,2,1],duration:.35},
    warm:{voice:'marimba',offsets:[.5,1.5,3],order:[0,1,2],duration:.6},
  };
  const p=patterns[plan.family];
  if(localDensity<.008) return [];
  const sparse=localDensity<plan.evidence.density*.6;
  const offsets=sparse?p.offsets.slice(0,1):p.offsets;
  return offsets.map((offset,i)=>({offset,voice:p.voice,
    midi:chord.notes[p.order[(i+(bar>=8?1:0))%p.order.length]],
    duration:p.duration,velocity:bar>=14?.56:.76}));
}
