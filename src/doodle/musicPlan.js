import {materialPalettes,demoMaterials,demoSubjects} from './materialMusic.js';
import {developReturn} from './expressiveReturn.js';
import {applyGroove} from './groovePalette.js';
import {arrangeDemoPicture} from './demoArrangements.js';
import {mapLinesToMusic} from './lineMusic.js';
import {planUpload,uploadTexture} from './uploadArrangement.js';
const identities = {
  scribble: {name:'飞翔电子童谣',lead:'bell',groove:'pop',root:60,motif:[0,1,2,4,2,1,0,2]},
  building: {name:'纸屋木质律动',lead:'marimba',groove:'wood',root:60,motif:[0,2,1,3,2,1,0,1]},
  decorative: {name:'花园跳跃舞曲',lead:'musicBox',groove:'swing',root:60,motif:[2,4,2,1,0,1,2,0]},
  tiedye: {name:'指纹舒缓电子',lead:'harp',groove:'soft',root:62,motif:[0,1,2,3,2,1,0,1]},
};
const mod=(n,m)=>(n%m+m)%m;
const closest=(note,candidates)=>candidates.reduce((best,value)=>Math.abs(value-note)<Math.abs(best-note)?value:best,candidates[0]);

// Enumerate inversions independently of bass; keep the inner voices connected.
export function voiceLead(chord,previous,low=48,high=72) {
  const candidates=chord.map(note=>{
    const pitches=[];
    for(let value=low;value<=high;value++) if(mod(value,12)===mod(note,12)) pitches.push(value);
    return pitches;
  });
  let best=null,cost=Infinity;
  const visit=(index,notes)=>{
    if(index===candidates.length) {
      const sorted=[...notes].sort((a,b)=>a-b);
      if(new Set(sorted).size!==sorted.length) return;
      const movement=sorted.reduce((sum,n,i)=>sum+Math.abs(n-(previous?.[i]??(54+i*4))),0);
      const cramped=sorted.slice(1).reduce((sum,n,i)=>sum+(n-sorted[i]<3?5:0),0);
      if(movement+cramped<cost) {cost=movement+cramped;best=sorted;}
      return;
    }
    for(const pitch of candidates[index]) visit(index+1,[...notes,pitch]);
  };
  visit(0,[]);return best??chord;
}

export function composeMusicPlan(features,preset='upload',{scaleId='pentatonic',material=null,scene=null,develop=false}={}) {
  const upload=identities[preset]?null:planUpload(features);
  const identity=identities[preset]??{...upload,name:'画面重组 · '+upload.family};
  const materialId=materialPalettes[material]?material:demoMaterials[preset]??null;
  const palette=materialPalettes[materialId];
  const base={...identity,...(palette?{lead:palette.lead,groove:palette.groove}:{})};
  const columns=features.columns;
  const averageDensity=columns.reduce((sum,c)=>sum+c.density,0)/columns.length;
  const peak=columns.reduce((best,c,i)=>c.density>columns[best].density?i:best,0);
  const hasSalientRegion=columns[peak].density>Math.max(.025,averageDensity*1.3);
  const subjects=demoSubjects[preset]??(hasSalientRegion?[{label:'视觉重心区域',x:(peak+.5)/columns.length,y:columns[peak].centroid,voice:base.lead,kind:'theme'}]:[]);
  const minor=scaleId==='dream-minor'||preset==='tiedye'&&scaleId==='pentatonic';
  const root=scaleId==='lydian'?65:minor?62:base.root;
  const pictureMode=scaleId==='pentatonic'&&!material?(upload?.mode??{decorative:'lydian',tiedye:'dorian'}[preset]):null;
  const diatonic=pictureMode==='dorian'?[0,2,3,5,7,9,10]:pictureMode==='lydian'?[0,2,4,6,7,9,11]:minor?[0,2,3,5,7,8,10]:scaleId==='lydian'?[0,2,4,6,7,9,11]:[0,2,4,5,7,9,11];
  const scale=upload&&scaleId==='pentatonic'&&!material?[0,2,4,7,9]:pictureMode?diatonic:scaleId==='major-triads'?[0,4,7]:scaleId==='pentatonic'?(minor?[0,3,5,7,10]:[0,2,4,7,9]):diatonic;
  const pitch=d=>root+scale[mod(d,scale.length)]+12*Math.floor(d/scale.length);
  const chordNote=d=>root+diatonic[mod(d,7)]+12*Math.floor(d/7);
  const allowed=Array.from({length:25},(_,i)=>pitch(i-5)).filter(n=>n>=root-2&&n<=root+14);
  const motif=base.motif.map((d,i)=>d+((i===3&&features.columns[6].centroid<.4)?1:0));
  // Every two bars is one harmonic unit; A asks, B develops then answers.
  const degrees=palette?.chords??upload?.chords??[[0,2,4],[3,5,7],[1,3,5],[4,6,8],[5,7,9],[3,5,7],[4,6,8],[0,2,4]];
  const harmony=[];let previous;
  for(const chord of degrees) {
    const notes=chord.map(chordNote);
    const voicing=voiceLead(notes,previous,root-12,root+10);previous=voicing;
    let bass=notes[0]-24;while(bass<36) bass+=12;
    harmony.push({notes:voicing,bass,pitchClasses:notes.map(n=>mod(n,12))});
  }
  const form=[
    {name:'引入',start:0,end:8,density:.25},
    {name:'主题',start:8,end:24,density:.55},
    {name:'转折',start:24,end:32,density:.35},
    {name:'发展',start:32,end:48,density:.7},
    {name:'回归',start:48,end:56,density:.8},
    {name:'收束',start:56,end:64,density:.25},
  ];
  const events=[];
  const add=(at,duration,role,voice,midi,velocity)=>{
    const section=at<32?0:1,beat=at%32;
    events.push({section,beat,duration:Math.min(duration,64-at),role,voice,midi,velocity,x:section?1-beat/32:beat/32});
  };
  const rhythms=base.groove==='swing'?[0,.67,1.5,2.67,4,4.67,5.5,6.67]:base.groove==='soft'?[0,1,2.5,4,5,6]:[0,.5,1.5,2.5,4,4.5,5.5,6.5];
  // Harmonic rhythm and density are planned first. The lead uses the same plan.
  for(let bar=0;bar<16;bar++) {
    const at=bar*4,chord=harmony[Math.floor(bar/2)];
    const ending=bar>=14,intro=bar<2,soft=base.groove==='soft';
    const demoArrangement={
      scribble:{bed:'strings',bass:'bass',pulse:'pulsePad',offsets:[.5,2.5],duration:.45},
      building:{bed:'woodPad',bass:'pluckBass',pulse:'paperKeys',offsets:[1,3],duration:.28},
      decorative:{bed:'gardenPad',bass:'roundBass',pulse:'harp',offsets:[.67,2.67],duration:.55},
      tiedye:{bed:'softPad',bass:'deepBass',pulse:'feltKeys',offsets:[2],duration:1.1},
    }[preset]??(upload?{...upload}:null);
    const harmonyVoice=demoArrangement?.bed??palette?.harmony??'strings';
    if(upload&&!material) {
      const scanColumn=Math.min(15,bar<8?bar*2:(15-(bar-8)*2));
      // One quiet, sustained layer supports the moving chord tones. Two notes
      // leave voice-budget headroom and avoid a competing full chord stack.
      if(bar%2===0&&columns[scanColumn].density>=.008)
        add(at,7.3,'harmony','softPad',[chord.notes[0],chord.notes.at(-1)],.16);
      for(const tone of uploadTexture(upload,chord,bar,columns[scanColumn].density))
        add(at+tone.offset,tone.duration,'harmony',tone.voice,tone.midi,tone.velocity);
    } else if(harmonyVoice==='paperKeys') {
      if(bar%2===0) add(at,7.9,'harmony','strings',chord.notes,.34);
      if(intro||ending) {if(bar%2===0) add(at,2.4,'harmony',harmonyVoice,chord.notes,.24);}
      else for(const offset of [0,2.5]) add(at+offset,.55,'harmony',harmonyVoice,chord.notes,.2);
    } else if(bar%2===0) add(at,7.9,'harmony',harmonyVoice,chord.notes,harmonyVoice==='strings'?.42:.34);
    if(!intro) add(at,preset==='tiedye'?2.6:soft?2.2:1.4,'bass',demoArrangement?.bass??'bass',chord.bass,ending?.25:.37);
    if(!ending) {
      const offsets=demoArrangement?.offsets??(soft?[2]:[.5,2.5]);
      for(const offset of offsets) add(at+offset,demoArrangement?.duration??.45,'pulse',demoArrangement?.pulse??'pulsePad',preset==='tiedye'?chord.notes.at(-1):chord.notes.slice(-2),.29);
    }
    if(!intro&&!ending&&!soft) {
      const kicks=base.groove==='pop'?[0,2.5]:[0,2];
      for(const offset of kicks) add(at+offset,.18,'rhythm','kick',36,.3);
      if(base.groove==='pop') for(const offset of [1,3]) add(at+offset,.08,'rhythm','snare',0,.2);
      else for(const offset of [1.5,3.5]) add(at+offset,.035,'rhythm','hat',0,.18);
    }
    if(at>=32&&at<56&&!soft) {
      for(const offset of [.5,2.5]) add(at+offset,.035,'rhythm','hat',0,.11);
      // Response occurs in the end-of-phrase breathing space, not over the lead.
      if(bar%2===1) add(at+3.25,.4,'texture','harp',chord.notes.at(-1)+12,.21);
    }
  }
  for(let phrase=0;phrase<8;phrase++) {
    const start=phrase*8,chord=harmony[phrase];
    const chordPitches=allowed.filter(n=>chord.pitchClasses.includes(mod(n,12)));
    const chordTargets=chordPitches.length?chordPitches:allowed;
    for(let i=0;i<rhythms.length;i++) {
      if(phrase===0&&i>2||phrase===7&&i>3) continue;
      let degree=motif[i];
      if(phrase===4||phrase===5) degree+=(i>=4?1:0);
      let note=closest(pitch(degree),allowed);
      const offset=rhythms[i];
      // Long/strong notes belong to the current harmony. Passing notes stay brief.
      if(i===0||offset===4||i===rhythms.length-1) note=closest(note,chordTargets);
      const next=rhythms[i+1]??8;
      const duration=Math.min(palette?.hold??(base.groove==='soft'?1.4:.85),(next-offset)*.78);
      add(start+offset,duration,'lead',base.lead,note,phrase===0?.48:phrase>=4?.67:.61);
    }
  }
  // A salient subject presents the existing theme; it does not add another bed
  // of unrelated notes. Temporarily clear the normal lead and thin accompaniment.
  for(let index=0;index<subjects.length;index++) {
    const subject=subjects[index];
    for(let section=0;section<2;section++) {
      const local=index===0?Math.round((section?1-subject.x:subject.x)*32/4)*4:24;
      const start=section*32+Math.min(24,Math.max(8,local));
      for(let i=events.length-1;i>=0;i--) {
        const time=events[i].section*32+events[i].beat;
        if(time>=start&&time<start+4&&(events[i].role==='lead'||events[i].role==='texture')) events.splice(i,1);
        else if(time>=start&&time<start+4&&events[i].role!=='harmony') events[i].velocity*=.65;
      }
      const chord=harmony[Math.floor(start/8)];
      const targets=allowed.filter(n=>chord.pitchClasses.includes(mod(n,12)));
      const contour=upload?motif.slice(0,4):index===0?[0,1,2,4]:[2,1,0,1];
      for(let i=0;i<4;i++) {
        let note=closest(pitch(contour[i]),allowed);
        if(i===0||i===3) note=closest(note,targets.length?targets:allowed);
        add(start+[0,.75,1.5,2.5][i],i===3?1.1:.5,'lead',subject.voice,note,index===0?.72:.63);
        const event=events.at(-1);event.subject=subject.label;event.y=subject.y;
      }
    }
  }
  add(62,1.8,'lead',base.lead,root,.57);
  for(const event of events) if(event.role==='harmony') event.velocity*=.75;
  const empty=features.columns.every(col=>col.density<.008);
  events.sort((a,b)=>a.section-b.section||a.beat-b.beat);
  const score={
    version:'composition-prototype-2',preset,name:base.name,groove:base.groove,features,motif,harmony,form,
    events:empty?[]:events,sectionBeats:32,totalBeats:64,scaleId,root,mode:pictureMode??scaleId,melodyScale:scale,material:materialId,subjects,subjectSource:demoSubjects[preset]?'demo-annotation':subjects.length?'density-salience':'unavailable',
    visualDNA:{version:'observed-v1',color:{warmth:features.warm-features.cool},line:{horizontalEdgeEnergy:features.edges},composition:{columns:features.columns.map(c=>({density:c.density,centroid:c.centroid}))},limitations:['No semantic or material recognition']},
    uploadArrangement:upload,
    percussionProfile:upload?({line:'tiedye',garden:'decorative',cool:'tiedye',graphic:'building',warm:'scribble'}[upload.family]):preset,
  };
  const arranged=empty?score:applyGroove(score);
  if(preset==='scribble'&&!empty) {
    for(const event of arranged.events) {
      if(event.role==='harmony') event.velocity*=.62;
      if(event.role==='lead') event.velocity=Math.min(.9,event.velocity*1.3);
      if(event.role==='pulse') event.velocity*=1.15;
      if(event.section===1&&event.role==='rhythm') event.velocity=Math.min(.65,event.velocity*1.75);
    }
  }
  const picture=mapLinesToMusic(material?arranged:arrangeDemoPicture(arranged));
  return develop&&!empty?developReturn(picture,{scene}):picture;
}
