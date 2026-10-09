import { composeMusicPlan } from './musicPlan.js';
// Deterministic local image-to-score composition. No model or cloud service.
export function analyzeArtwork(image) {
  const {data,width,height}=image;
  const columns=Array.from({length:16},()=>({mass:0,y:0,warm:0,green:0,light:0,edges:0,count:0}));
  const lineColumns=Array.from({length:64},()=>({hits:0,y:0,count:0}));
  let pale=0;
  let warm=0,cool=0,green=0,edges=0,dark=0,total=0;
  const stride=Math.max(1,Math.floor(width/120));
  for(let y=stride;y<height;y+=stride) for(let x=stride;x<width;x+=stride) {
    const i=(y*width+x)*4,r=data[i]/255,g=data[i+1]/255,b=data[i+2]/255;
    const light=(r+g+b)/3,sat=Math.max(r,g,b)-Math.min(r,g,b);
    const previous=i-stride*4;
    const edge=(Math.abs(data[i]-data[previous])+Math.abs(data[i+1]-data[previous+1])+Math.abs(data[i+2]-data[previous+2]))/765;
    const above=i-stride*width*4;
    const vertical=(Math.abs(data[i]-data[above])+Math.abs(data[i+1]-data[above+1])+Math.abs(data[i+2]-data[above+2]))/765;
    const line=lineColumns[Math.min(63,Math.floor(x/width*64))];
    line.count++;
    if(Math.max(edge,vertical)>.12) {line.hits++;line.y+=y/height;}
    if(light>.85&&sat<.15) pale++;
    const mass=light>.93&&sat<.08?0:Math.min(1,sat*.7+(1-light)*.3);
    const col=columns[Math.min(15,Math.floor(x/width*16))];
    col.green+=Math.max(0,g-(r+b)/2)*mass;col.light+=light;
    green+=Math.max(0,g-(r+b)/2);
    col.mass+=mass;col.y+=mass*y/height;col.warm+=Math.max(0,r-b)*mass;col.edges+=edge;col.count++;
    warm+=Math.max(0,r-b);cool+=Math.max(0,b-r);edges+=edge;dark+=light<.25?1:0;total++;
  }
  for(const col of columns) {col.centroid=col.mass?col.y/col.mass:.5;col.density=col.mass/Math.max(1,col.count);col.edges/=Math.max(1,col.count);}
  const lines=lineColumns.map(c=>({density:c.hits/Math.max(1,c.count),centroid:c.hits?c.y/c.hits:.5}));
  const lineDrawing=pale/Math.max(1,total)>.6&&lines.some(c=>c.density>.025)&&columns.reduce((s,c)=>s+c.density,0)/16<.2;
  return {columns,lineColumns:lines,lineDrawing,warm:warm/Math.max(1,total),cool:cool/Math.max(1,total),green:green/Math.max(1,total),edges:edges/Math.max(1,total),dark:dark/Math.max(1,total)};
}

const profiles={
  scribble:{name:'飞翔电子童谣',groove:'pop',root:60,minor:false,lead:'bell',motif:[0,2,4,3,2,4,5,2]},
  building:{name:'纸屋木质律动',groove:'wood',root:65,minor:false,lead:'marimba',motif:[0,1,2,4,2,1,3,0]},
  decorative:{name:'花园跳跃舞曲',groove:'swing',root:60,minor:false,lead:'musicBox',motif:[2,4,2,1,0,2,3,0]},
  tiedye:{name:'指纹舒缓电子',groove:'soft',root:62,minor:true,lead:'harp',motif:[0,2,3,4,3,2,1,0]},
};
export function composeArtwork(image,preset='upload',options={}) {
  return composeMusicPlan(analyzeArtwork(image),preset,options);
}

// Retained as an explicit baseline for future listening comparisons.
export function composeArtworkLegacy(image,preset='upload') {
  const features=analyzeArtwork(image);
  const base=profiles[preset] || {name:features.cool>features.warm?'清凉梦境':'温暖童话',root:60,minor:features.dark>.38,lead:features.warm>features.cool?'bell':'musicBox',motif:[0,2,4,3,2,1,3,0]};
  const scale=base.minor?[0,2,3,5,7,8,10]:[0,2,4,5,7,9,11];
  const pitch=degree=>base.root+scale[((degree%7)+7)%7]+12*Math.floor(degree/7);
  const motif=base.motif.map((degree,i)=>{
    // Preserve recognizable contour; only two motif notes are influenced by the drawing.
    const shift=(i===3||i===6)?(features.columns[i*2].centroid<.45?1:0):0;
    return degree+shift;
  });
  const groove=base.groove || (features.edges>.04?'pop':'soft');
  const chordSets={pop:[[0,2,4],[4,6,8],[5,7,9],[3,5,7]],wood:[[0,2,4,6],[5,7,9,11],[1,3,5,7],[4,6,8,10]],swing:[[0,2,4,5],[5,7,9,11],[1,3,5,7],[4,6,8,10]],soft:[[0,2,4],[5,7,9],[2,4,6],[6,8,10]]};
  const rhythms={pop:[0,.5,1.5,2,3.5,4.5,5,6.5],wood:[0,1,1.75,2.5,4,4.75,5.5,7],swing:[0,.67,1.5,2.67,3.5,4,5.67,6.5],soft:[0,1.5,3,4,5.5,7]};
  const chords=chordSets[groove];
  const rhythm=rhythms[groove];
  const events=[];
  const add=(section,beat,duration,voice,midi,velocity,x,y=.5)=>events.push({section,beat,duration,voice,midi,velocity,x,y});
  for(let section=0;section<2;section++) {
    for(let bar=0;bar<8;bar++) {
      // B closes on tonic so the return to A is a musical resolution.
      const chord=section===1&&bar===7?chords[0]:chords[bar%4];
      const start=bar*4;
      if(groove==='soft'||section===1&&bar%2===0) add(section,start,groove==='soft'?3.7:7.5,'strings',chord.slice(0,3).map(d=>pitch(d)-12),.19);
      if(groove==='wood'||groove==='swing') {
        for(const beat of (groove==='wood'?[.5,2,3.5]:[1,3])) add(section,start+beat,.28,'marimba',chord.map(d=>pitch(d)),.19);
      }
      add(section,start,1.6,'bass',pitch(chord[0])-24,.32);
      if(section===1) add(section,start+2,1.2,'bass',pitch(chord[2])-24,.2);
      const kicks=groove==='pop'?[0,1.5,2.5]:groove==='wood'?[0,2.5]:groove==='swing'?[0,2]:bar%2===0?[0]:[];
      for(const beat of kicks) add(section,start+beat,.18,'kick',36,section?.32:.23);
      if(groove==='pop') for(const beat of [1,3]) add(section,start+beat,.08,'snare',0,.21);
      if(groove==='wood') for(const beat of [1.5,3.5]) add(section,start+beat,.035,'hat',0,.16);
      if(section===1) for(const beat of [0.5,1.5,2.5,3.5]) add(section,start+beat,.035,'hat',0,.1);
      for(let eighth=0;eighth<8;eighth++) {
        const beat=start+eighth*.5;
        const x=section?1-beat/32:beat/32;
        if((groove==='pop'&&section===1&&eighth%2===1)||(groove==='soft'&&eighth%4===0)) add(section,beat,.7,'harp',pitch(chord[eighth%3]),.16);
      }
    }
    for(let phrase=0;phrase<4;phrase++) for(let i=0;i<rhythm.length;i++) {
      const beat=phrase*8+rhythm[i];
      if(section===1&&phrase===3&&rhythm[i]>5) continue;
      let degree=motif[i];
      if(section===1&&i>=4) degree=Math.min(7,degree+(groove==='soft'?-1:1));
      const last=section===1&&phrase===3&&rhythm[i]>=5.5;
      if(last) degree=0;
      const next=rhythm[i+1]??8;
      const duration=last?Math.min(2,32-beat):Math.min(groove==='soft'?1.6:.9,(next-rhythm[i])*.78);
      const x=section?1-beat/32:beat/32;
      const voice=section===1&&phrase%2===1&&!last?'flute':base.lead;
      add(section,beat,duration,voice,pitch(degree),.6,x,features.columns[Math.min(15,Math.floor(x*16))].centroid);
    }
    if(section===1) add(section,30,1.8,base.lead,pitch(0),.55,.0625,.5);
  }
  events.sort((a,b)=>a.section-b.section||a.beat-b.beat);
  return {name:base.name,groove,features,motif,events,sectionBeats:32,totalBeats:64};
}
