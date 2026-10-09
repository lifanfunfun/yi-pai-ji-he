import test from 'node:test';
import assert from 'node:assert/strict';
import {composeArtwork,analyzeArtwork} from '../src/doodle/doodleComposer.js';
import {mapLinesToMusic} from '../src/doodle/lineMusic.js';
import {arrangeDemoPicture} from '../src/doodle/demoArrangements.js';
const data=new Uint8ClampedArray(96*54*4).fill(255);
for(let y=16;y<40;y++) for(let x=15;x<80;x++) {const i=(y*96+x)*4;data[i]=220;data[i+1]=80;data[i+2]=40;}
const image={data,width:96,height:54};

test('line art is detected and scan-local dense regions generate more notes in both directions',()=>{
  const pixels=new Uint8ClampedArray(256*128*4).fill(255);
  for(let y=10;y<118;y++) for(let x=20;x<236;x++) {
    if(x<128?x%40===0:x%8===0) {
      const at=(y*256+x)*4;pixels[at]=pixels[at+1]=pixels[at+2]=20;
    }
  }
  const features=analyzeArtwork({data:pixels,width:256,height:128});
  assert.equal(features.lineDrawing,true);
  const score=composeArtwork(image,'tiedye');
  const mapped=mapLinesToMusic({...score,features});
  const notes=mapped.events.filter(e=>e.lineDensity!==undefined);
  assert.ok(notes.filter(e=>e.section===0&&e.beat>=16).length>notes.filter(e=>e.section===0&&e.beat<16).length);
  assert.ok(notes.filter(e=>e.section===1&&e.beat<16).length>notes.filter(e=>e.section===1&&e.beat>=16).length);
  assert.ok(notes.every(e=>Math.abs(e.x-(e.section?1-e.beat/32:e.beat/32))<1e-9));
  for(const section of [0,1]) {
    const melody=notes.filter(e=>e.section===section);
    for(let i=1;i<melody.length;i++) assert.ok(Math.abs(melody[i].midi-melody[i-1].midi)>=3);
    assert.ok(melody.every(e=>mapped.melodyScale.includes((e.midi-mapped.root)%12)));
  }
  assert.equal(analyzeArtwork({data:new Uint8ClampedArray(pixels.length).fill(255),width:256,height:128}).lineDrawing,false);
});
test('score is deterministic, repeats an A motif and resolves B to tonic',()=>{
  const score=composeArtwork(image,'scribble');
  assert.deepEqual(score,composeArtwork(image,'scribble'));
  assert.equal(score.sectionBeats,32);
  assert.equal(score.form[0].name,'引入');
  assert.ok(score.events.filter(e=>e.section===0&&e.beat<8).length<score.events.filter(e=>e.section===1&&e.beat<8).length);
  const last=score.events.filter(e=>e.section===1&&e.role==='lead').at(-1);
  assert.equal(last.midi%12,score.root%12);
  assert.ok(score.events.every(e=>e.beat>=0&&e.beat<32&&e.duration>0));
});

test('materials change voicing, articulation and palette; annotated subjects replace rather than stack lead',()=>{
  const materials=['paper','wood','watercolor','oil','cloth','leaf'];
  const scores=materials.map(material=>composeArtwork(image,'upload',{material,scaleId:'lydian'}));
  assert.equal(new Set(scores.map(score=>JSON.stringify(score.events))).size,6);
  assert.ok(new Set(scores.map(score=>JSON.stringify(score.harmony))).size>=4);
  assert.notEqual(scores[0].subjectSource,'demo-annotation');
  const hero=composeArtwork(image,'scribble');
  assert.equal(hero.subjectSource,'demo-annotation');
  const subject=hero.events.filter(e=>e.subject==='飞翔人物');
  assert.ok(subject.length>=8);
  for(const event of subject) assert.ok(!hero.events.some(other=>other!==event&&other.role==='lead'&&!other.subject&&other.section===event.section&&other.beat===event.beat));
});

test('scale changes affect the score, blank artwork is silent, and strong lead notes follow harmony',()=>{
  const score=composeArtwork(image,'scribble',{scaleId:'lydian'});
  assert.equal(score.root,65);
  assert.notDeepEqual(score.events,composeArtwork(image,'scribble').events);
  assert.equal(composeArtwork({width:96,height:54,data:new Uint8ClampedArray(data.length).fill(255)}).events.length,0);
  for(const event of score.events.filter(e=>e.role==='lead'&&e.beat%8===0)) {
    const phrase=(event.section*32+event.beat)/8;
    assert.ok(score.harmony[phrase].pitchClasses.includes(event.midi%12));
  }
  for(const chord of score.harmony) assert.ok(chord.notes.every(n=>n>=53&&n<=75));
});
test('four demos have distinct motifs; image features also affect uploaded scores',()=>{
  assert.equal(new Set(['scribble','building','decorative','tiedye'].map(id=>JSON.stringify(composeArtwork(image,id).motif))).size,4);
  const white={width:96,height:54,data:new Uint8ClampedArray(data.length).fill(255)};
  assert.notDeepEqual(composeArtwork(image).features,composeArtwork(white).features);
});

test('development preserves A exactly, changes B, and distinguishes fresh and dry expression',()=>{
  for(const preset of ['scribble','building','decorative','tiedye']) {
    const original=composeArtwork(image,preset,{develop:false});
    const next=composeArtwork(image,preset,{develop:true});
    assert.deepEqual(next.events.filter(e=>e.section===0),original.events.filter(e=>e.section===0));
    assert.notDeepEqual(next.events.filter(e=>e.section===1),original.events.filter(e=>e.section===1));
    const rhythms=next.events.filter(e=>e.section===1&&e.role==='rhythm');
    assert.equal(new Set(rhythms.map(e=>`${e.voice}:${e.beat}`)).size,rhythms.length);
  }
  const fresh=composeArtwork(image,'upload',{scene:'fresh-leaves',develop:true});
  const dry=composeArtwork(image,'upload',{scene:'dry-leaves',develop:true});
  assert.ok(fresh.events.some(e=>e.section===1&&e.voice==='leafChime'));
  assert.ok(dry.events.some(e=>e.section===1&&e.voice==='dryPluck'));
  assert.deepEqual(fresh.events.filter(e=>e.section===0),dry.events.filter(e=>e.section===0));
});

test('normal playback retains the cohesive baseline; experimental development is opt-in',()=>{
  const normal=composeArtwork(image,'scribble');
  assert.deepEqual(normal.events,composeArtwork(image,'scribble',{develop:false}).events);
  assert.equal(normal.expression,undefined);
});

test('all demos retain a sustained harmonic floor across both passes',()=>{
  for(const preset of ['scribble','building','decorative','tiedye']) {
    const score=composeArtwork(image,preset);
    const floor=score.events.filter(e=>e.role==='harmony'&&e.duration>=7.5);
    assert.deepEqual([...new Set(floor.map(e=>e.section*32+e.beat))],[0,8,16,24,32,40,48,56]);
    assert.ok(floor.every(e=>e.velocity>0));
  }
});

test('fingerprint uses three requested voices, with denser triplet xylophone in dense regions',()=>{
  const base=composeArtwork(image,'tiedye');
  const lineColumns=base.features.lineColumns.map((c,i)=>({...c,density:i<32?.015:.15,centroid:.4}));
  const mapped=mapLinesToMusic({...base,features:{...base.features,lineColumns}});
  const harp=mapped.events.filter(e=>e.lineDensity!==undefined&&e.section===0);
  assert.ok(harp.filter(e=>e.beat>=16).length>harp.filter(e=>e.beat<16).length);
  assert.ok(mapped.events.some(e=>e.voice==='strings'&&e.role==='harmony'));
  assert.deepEqual([...new Set(mapped.events.map(e=>e.voice))].sort(),['handpan','marimba','strings']);
  assert.equal(mapped.percussionEnabled,true);
  assert.ok(harp.filter(e=>e.lineDensity>.65).every(e=>Math.abs(e.beat*3-Math.round(e.beat*3))<1e-7));
  assert.ok(harp.every(e=>mapped.harmony[Math.floor((e.section*32+e.beat)/8)].pitchClasses.includes(e.midi%12)));
});

test('first sweep keeps harmony and pulsing pad; drums enter only on return',()=>{
  const score=composeArtwork(image,'scribble');
  assert.ok(score.events.some(e=>e.section===0&&e.voice==='pulsePad'));
  assert.ok(score.events.some(e=>e.section===0&&e.role==='harmony'));
  assert.ok(!score.events.some(e=>e.section===0&&e.role==='rhythm'));
  const kicks=score.events.filter(e=>e.section===1&&e.voice==='kick'&&e.beat<8);
  assert.deepEqual(kicks.map(e=>e.beat),[0,1,2,3,4,5,6,7]);
});

test('demos retain distinct lead and accompaniment; fingerprint explicitly shares strings and omits bass',()=>{
  const scores=['scribble','building','decorative','tiedye'].map(id=>composeArtwork(image,id));
  for(const role of ['lead','harmony','bass','pulse']) {
    const palettes=scores.map(s=>JSON.stringify([...new Set(s.events.filter(e=>e.role===role).map(e=>e.voice))].sort()));
    assert.equal(new Set(palettes).size,role==='harmony'?3:4,role);
  }
});

test('return drums build layers then leave space before returning to A',()=>{
  const drums=composeArtwork(image,'scribble').events.filter(e=>e.section===1&&e.role==='rhythm');
  const voices=(start,end)=>new Set(drums.filter(e=>e.beat>=start&&e.beat<end).map(e=>e.voice));
  assert.ok(!voices(0,8).has('hat'));
  assert.ok(voices(8,16).has('hat'));
  assert.ok(voices(16,24).has('shaker'));
  assert.ok(drums.filter(e=>e.beat>=16&&e.beat<24).length>drums.filter(e=>e.beat<8).length);
  assert.ok(!drums.some(e=>e.beat>=28));
});

test('picture-specific arrangement leaves hero untouched and gives other demos different instruments',()=>{
  const hero=composeArtwork(image,'scribble');
  assert.equal(arrangeDemoPicture(hero),hero);
  for(const [preset,lead] of [['building','paperPluck'],['decorative','gardenFlute'],['tiedye','handpan']]) {
    const score=composeArtwork(image,preset);
    assert.ok(score.events.filter(e=>e.role==='lead').every(e=>e.voice===lead));
    assert.ok(score.arrangementIntent);
    assert.ok(!score.events.some(e=>e.role==='rhythm'&&e.section===0));
    assert.ok(!score.events.some(e=>e.role==='rhythm'&&e.voice==='clap'));
  }
});

test('garden uses Lydian and fingerprint uses Dorian with moving accompaniment',()=>{
  assert.equal(composeArtwork(image,'decorative').mode,'lydian');
  assert.equal(composeArtwork(image,'tiedye').mode,'dorian');
  for(const preset of ['building','decorative','tiedye']) {
    const score=composeArtwork(image,preset);
    const pulse=score.events.filter(e=>e.role==='pulse');
    assert.ok(pulse.length>30);
    assert.ok(pulse.every(e=>!Array.isArray(e.midi)));
    assert.ok(new Set(pulse.map(e=>e.midi)).size>3);
  }
});
