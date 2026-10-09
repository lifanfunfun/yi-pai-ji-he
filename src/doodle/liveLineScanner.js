// Pure, deterministic scan-local reader. No score, random notes or accompaniment.
export const SCAN_BPM=120;
export const SWEEP_SECONDS=8;
export const READ_HZ=240;
export const MAX_NOTES_PER_BEAT=6;
export function makeLineFixture(kind,width=960,height=540) {
  const data=new Uint8ClampedArray(width*height*4);
  for(let y=0;y<height;y++) for(let x=0;x<width;x++) {
    const nx=x/width,ny=y/height;
    let ink=false;
    if(kind==='fingerprint') {
      const radius=Math.hypot((nx-.5)/.39,(ny-.51)/.45);
      ink=radius<1&&radius>.09&&Math.abs(radius/.055-Math.round(radius/.055))<.075;
    } else if(kind==='rising') {
      const cy=.85-(nx-.05)*.7/.9;
      ink=nx>.05&&nx<.95&&Math.abs(ny-cy)<.003;
    } else {
      const count=kind==='dense'||kind==='mixed'&&nx>.5?20:3;
      for(let line=0;line<count;line++) {
        const cy=.12+line*.76/(count-1);
        if(nx>.05&&nx<.95&&!(kind==='mixed'&&nx>.48&&nx<.52)&&Math.abs(ny-cy)<.003) {ink=true;break;}
      }
    }
    const i=(y*width+x)*4;
    data[i]=data[i+1]=data[i+2]=ink?28:250;data[i+3]=255;
  }
  return {width,height,data};
}

export function extractLineMask(image) {
  const {width,height,data}=image;
  const gray=new Uint8Array(width*height),histogram=new Uint32Array(256);
  let lo=255,hi=0,sum=0;
  for(let p=0;p<gray.length;p++) {
    const i=p*4,alpha=data[i+3]/255;
    const value=Math.round((data[i]*.2126+data[i+1]*.7152+data[i+2]*.0722)*alpha+255*(1-alpha));
    gray[p]=value;histogram[value]++;sum+=value;lo=Math.min(lo,value);hi=Math.max(hi,value);
  }
  // Otsu threshold separates foreground from paper; polarity also supports light ink on dark paper.
  let threshold=lo,best=-1,weight=0,partial=0,mode=0;
  for(let value=0;value<256;value++) {
    if(histogram[value]>histogram[mode]) mode=value;
    weight+=histogram[value];partial+=value*histogram[value];
    const other=gray.length-weight;if(!weight||!other) continue;
    const between=weight*other*(partial/weight-(sum-partial)/other)**2;
    if(between>best) {best=between;threshold=value;}
  }
  const mask=new Uint8Array(width*height),edges=new Float32Array(width*height);
  for(let y=0;y<height;y++) for(let x=0;x<width;x++) {
    const p=y*width+x;
    mask[p]=hi-lo>=12&&(mode>=128?gray[p]<=threshold:gray[p]>threshold)?1:0;
    if(x>0&&x<width-1&&y>0&&y<height-1) {
      const gx=-gray[p-width-1]+gray[p-width+1]-2*gray[p-1]+2*gray[p+1]-gray[p+width-1]+gray[p+width+1];
      const gy=-gray[p-width-1]-2*gray[p-width]-gray[p-width+1]+gray[p+width-1]+2*gray[p+width]+gray[p+width+1];
      edges[p]=Math.hypot(gx,gy)/1020;
    }
  }
  // Structural heuristic: scan-line runs are mostly thin, rather than filled blocks.
  let thin=0,thick=0;
  const model={width,height,mask,gray,edges};
  for(let x=0;x<width;x+=Math.max(1,Math.floor(width/48))) {
    for(const hit of readLineIntersections(model,x)) {
      if(hit.thickness<height*.045&&hit.edgeStrength>.05) thin++;else thick++;
    }
  }
  return {...model,isLineArt:thin>=8&&thin/Math.max(1,thin+thick)>.75,classification:{thin,thick,threshold,polarity:mode>=128?'dark-on-light':'light-on-dark'}};
}

export function readLineIntersections(model,x,radius=1) {
  const {width,height,mask}=model;
  const ix=Math.max(0,Math.min(width-1,Math.round(x)));
  const hits=[];let start=-1;
  for(let y=0;y<=height;y++) {
    let votes=0,samples=0;
    if(y<height) for(let dx=-radius;dx<=radius;dx++) {
      const xx=ix+dx;if(xx<0||xx>=width) continue;
      samples++;votes+=mask[y*width+xx];
    }
    const ink=y<height&&votes>=Math.ceil(samples/2);
    if(ink&&start<0) start=y;
    if(!ink&&start>=0) {
      let edgeStrength=0;
      if(model.edges) for(const yy of [start-1,start,start+1,y-1,y,y+1]) for(let dx=-radius;dx<=radius;dx++) {
        if(yy>=0&&yy<height&&ix+dx>=0&&ix+dx<width) edgeStrength=Math.max(edgeStrength,model.edges[yy*width+ix+dx]);
      }
      hits.push({x:ix,y:(start+y-1)/2,thickness:y-start,edgeStrength:model.edges?edgeStrength:1});start=-1;
    }
  }
  return hits;
}

const SCALE=[0,2,4,5,7,9,11];
export function lineYToMidi(y,height) {
  const degree=Math.round((1-y/height)*14);
  return 48+SCALE[degree%7]+12*Math.floor(degree/7);
}

export class LiveLineReader {
  constructor(model,{melody=false}={}) {this.model=model;this.melody=melody;this.reset();}
  reset() {this.phase=0;this.tracks=[];this.nextId=0;this.total=0;this.primaryId=null;this.primaryY=null;}
  read(x,dt) {
    const intersections=readLineIntersections(this.model,x).filter(hit=>hit.thickness<this.model.height*.045&&hit.edgeStrength>.05);
    const unused=new Set(this.tracks);
    const tracks=intersections.map(hit=>{
      const error=t=>Math.abs(hit.y-(t.y+(t.slope??0)*(x-t.x)));
      const nearby=[...unused].filter(t=>error(t)<this.model.height*.035).sort((a,b)=>error(a)-error(b));
      const previous=nearby[0];if(previous) unused.delete(previous);
      const slope=previous&&x!==previous.x?(hit.y-previous.y)/(x-previous.x):previous?.slope??0;
      return {...hit,id:previous?.id??this.nextId++,slope:Math.max(-3,Math.min(3,slope)),midi:lineYToMidi(hit.y,this.model.height)};
    });
    this.tracks=tracks;
    let primary=tracks.find(t=>t.id===this.primaryId);
    if(!primary&&tracks.length) {
      const target=this.primaryY??this.model.height*.5;
      primary=tracks.reduce((a,b)=>Math.abs(a.y-target)<=Math.abs(b.y-target)?a:b);
    }
    this.primaryId=primary?.id??null;this.primaryY=primary?.y??this.primaryY;
    // Three crossings = one note/beat; denser crossings increase event count only.
    const notesPerBeat=Math.min(MAX_NOTES_PER_BEAT,tracks.length/3);
    this.phase+=Math.max(0,Math.min(.08,dt))*SCAN_BPM/60*notesPerBeat;
    const notes=[];
    if(!tracks.length) this.phase=0;
    while(this.phase>=1&&tracks.length) {
      this.phase--;
      notes.push({...primary,midi:this.melody?primary.midi:60,duration:Math.max(.07,Math.min(.35,.7/(notesPerBeat*SCAN_BPM/60))),velocity:.55});
      this.total++;
    }
    const gaps=tracks.slice(1).map((t,i)=>t.y-tracks[i].y).sort((a,b)=>a-b);
    return {x,intersections:tracks,primary,count:tracks.length,density:tracks.length/this.model.height*100,spacing:gaps.length?gaps[Math.floor(gaps.length/2)]:null,notes,notesPerBeat,total:this.total};
  }
}

// The audio scheduler and deterministic tests use the same fixed-step reader.
export class ScanTimeline {
  constructor(model,options={}) {this.reader=new LiveLineReader(model,options);this.step=0;this.direction=options.direction??1;}
  advanceTo(seconds) {
    const events=[],end=Math.floor(Math.min(SWEEP_SECONDS,Math.max(0,seconds))*READ_HZ+1e-7);
    while(this.step<end) {
      const time=++this.step/READ_HZ;
      const fraction=time/SWEEP_SECONDS;
      const result=this.reader.read((this.direction<0?1-fraction:fraction)*(this.reader.model.width-1),1/READ_HZ);
      for(const note of result.notes) events.push({...note,time,count:result.count});
    }
    return events;
  }
}

export class ScanSequence {
  constructor(model,{passes=1,...options}={}) {
    this.passes=passes;this.timelines=Array.from({length:passes},(_,i)=>new ScanTimeline(model,{...options,direction:i%2?-1:1}));
  }
  advanceTo(seconds) {
    const notes=[];
    for(let pass=0;pass<this.passes;pass++) {
      if(seconds<=pass*SWEEP_SECONDS) break;
      for(const event of this.timelines[pass].advanceTo(seconds-pass*SWEEP_SECONDS)) notes.push({...event,time:event.time+pass*SWEEP_SECONDS,pass:pass+1});
    }
    return notes;
  }
}
