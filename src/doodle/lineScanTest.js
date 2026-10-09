import * as Tone from 'tone';
import {extractLineMask,makeLineFixture,LiveLineReader,ScanSequence,readLineIntersections,SCAN_BPM,SWEEP_SECONDS} from './liveLineScanner.js';
import {ProgressiveDrumEngine} from './progressiveDrums.js';
import {WarmPercussion} from './warmPercussion.js';
import fingerprintUrl from '../../assets/doodle-tiedye-wide.png';
import pianoA3 from '../../assets/piano-samples/A3.mp3';
import pianoA4 from '../../assets/piano-samples/A4.mp3';
import pianoA5 from '../../assets/piano-samples/A5.mp3';
const $=id=>document.getElementById(id);
const canvas=$('view'),ctx=canvas.getContext('2d');
const source=document.createElement('canvas');source.width=960;source.height=540;
const sourceCtx=source.getContext('2d',{willReadFrequently:true});
const labels={sparse:'A 三条直线',dense:'B 二十条直线',fingerprint:'C 指纹测试图',rising:'D 上升曲线',mixed:'E 左疏右密',artwork:'原作彩泥指纹',upload:'上传线稿'};
let reader,kind='sparse',playing=false,elapsed=0,last=0,frame=0,piano,starting;
let flashes=[],history=[],records=[],countSum=0,samples=0,comparison=null,recorder,chunks=[],runId=0;
let timeline,anchor=0,scheduler,currentRun=[],presented=0,maxLag=0,trace=[];
let runPasses=1,visualPass=0,drumGrid=0,drumRun=[],drumPresented=0,drumStates=[];
const progressiveDrums=new ProgressiveDrumEngine({sectionBeats:16});
const limiter=new Tone.Limiter(-2).toDestination();
const pianoRoom=new Tone.Reverb({decay:1.6,preDelay:.018,wet:1}).connect(limiter);
const pianoRoomSend=new Tone.Gain(.13).connect(pianoRoom);
const warmPercussion=new WarmPercussion(limiter);
const recording=Tone.getContext().rawContext.createMediaStreamDestination();Tone.connect(limiter,recording);
function presentationNow() {
  const raw=Tone.getContext().rawContext;
  const stamp=raw.getOutputTimestamp?.();
  // Align visual position to the browser's output clock when available.
  if(stamp?.contextTime>0&&stamp.performanceTime>0) return stamp.contextTime+(performance.now()-stamp.performanceTime)/1000;
  return Tone.immediate();
}
async function initAudio() {
  await Tone.start();
  if(!starting) starting=new Promise((resolve,reject)=>{
    piano=new Tone.Sampler({urls:{A3:pianoA3,A4:pianoA4,A5:pianoA5},attack:.003,release:.12,volume:-13,onload:resolve,onerror:reject}).connect(limiter);
    piano.connect(pianoRoomSend);
  });
  await starting;
  await pianoRoom.ready;
}
function reset() {
  elapsed=0;last=0;flashes=[];history=[];countSum=0;samples=0;currentRun=[];presented=0;maxLag=0;trace=[];
  reader.melody=$('melody').checked;reader.reset();
  runPasses=$('drums').checked?2:1;visualPass=0;drumGrid=0;drumRun=[];drumPresented=0;drumStates=[];progressiveDrums.reset();
  timeline=new ScanSequence(reader.model,{melody:reader.melody,passes:runPasses});
  $('pitch').textContent='—';render(reader.read(0,0));
}
function updateModel() {
  reader=new LiveLineReader(extractLineMask(sourceCtx.getImageData(0,0,960,540)));
  $('classification').textContent=reader.model.isLineArt?'薄线结构 / 线描':'非典型线描（仍可测试）';
  reset();
}
async function selectKind(next) {
  stop();kind=next;
  document.querySelectorAll('[data-kind]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.kind===kind)));
  if(kind==='artwork') {
    const img=new Image();img.src=fingerprintUrl;await img.decode();
    sourceCtx.drawImage(img,0,0,960,540);
  } else if(kind!=='upload') sourceCtx.putImageData(new ImageData(makeLineFixture(kind).data,960,540),0,0);
  updateModel();
}
function render(result) {
  ctx.drawImage(source,0,0);ctx.lineWidth=2;ctx.strokeStyle='#a5acb9';ctx.beginPath();ctx.moveTo(result.x,0);ctx.lineTo(result.x,540);ctx.stroke();
  ctx.fillStyle='#1491b8';
  for(const hit of result.intersections) {ctx.beginPath();ctx.arc(result.x,hit.y,3.5,0,Math.PI*2);ctx.fill();}
  if(result.primary) {
    trace.push({x:result.x,y:result.primary.y});
    ctx.strokeStyle='#8353bd';ctx.lineWidth=3;ctx.beginPath();
    for(let i=0;i<trace.length;i++) {const p=trace[i];if(!i) ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y);}ctx.stroke();
    ctx.fillStyle='#8353bd';ctx.beginPath();ctx.arc(result.x,result.primary.y,5,0,Math.PI*2);ctx.fill();
  }
  const now=performance.now();flashes=flashes.filter(f=>now-f.time<200);
  for(const f of flashes) {ctx.fillStyle=`rgba(245,171,24,${1-(now-f.time)/200})`;ctx.beginPath();ctx.arc(f.x,f.y,8,0,Math.PI*2);ctx.fill();}
  $('count').textContent=result.count;$('rate').textContent=(result.notesPerBeat*SCAN_BPM/60).toFixed(1);
  $('recent').textContent=history.filter(t=>now-t<1000).length;$('total').textContent=presented;
  $('density').textContent=result.density.toFixed(2);
  $('position').textContent=`${(result.x/959*100).toFixed(1)}% · x=${Math.round(result.x)}`;
  $('spacing').textContent=result.spacing===null?'—':`${result.spacing.toFixed(1)} px`;
  $('lag').textContent=`${maxLag.toFixed(1)} ms`;
  $('progress').style.width=`${Math.max(0,result.x/960)*100}%`;
}
function tick(now) {
  if(!playing) return;
  // Drawing may stall without interrupting the independently scheduled audio.
  last=now;
  elapsed=Math.max(0,Math.min(SWEEP_SECONDS*runPasses,presentationNow()-anchor));
  const pass=Math.min(runPasses-1,Math.floor(elapsed/SWEEP_SECONDS));
  if(pass!==visualPass) {visualPass=pass;trace=[];reader.reset();}
  const fraction=(elapsed-pass*SWEEP_SECONDS)/SWEEP_SECONDS;
  const x=(pass%2?1-fraction:fraction)*959;
  const result=reader.read(x,0);countSum+=result.count;samples++;
  while(presented<currentRun.length&&currentRun[presented].time<=elapsed) {
    const note=currentRun[presented++];
    flashes.push({...note,time:now});history.push(now);
    $('pitch').textContent=`${Tone.Frequency(note.midi,'midi').toNote()} · ${note.midi}`;
  }
  while(drumPresented<drumRun.length&&drumRun[drumPresented].time<=elapsed) drumPresented++;
  if(runPasses>1) {
    const recent=drumRun.slice(0,drumPresented).filter(e=>e.time>elapsed-1);
    const state=drumStates.filter(s=>s.time<=elapsed).at(-1);
    $('drumDebug').textContent=`第 ${pass+1} 遍 · 图像交点 ${result.count} · 平滑密度 ${(state?.smoothed??0).toFixed(2)} · 鼓点活跃度 ${Math.round((state?.activity??0)*100)}% · 近1秒鼓点 ${recent.length} · 正在触发：${recent.slice(-3).map(e=>e.voice).join('、')||'静音'}`;
    $('status').textContent=`实时读取中 · 第 ${pass+1}/${runPasses} 遍 · 120 BPM`;
  }
  history=history.filter(t=>now-t<1000);render(result);
  $('log').textContent=currentRun.slice(Math.max(0,presented-5),presented).map(r=>`${labels[r.picture]}  ${r.time.toFixed(3)}s  x=${r.x} 交点=${r.intersections} → MIDI ${r.midi}  时长=${r.duration.toFixed(3)}s`).join('\n');
  if(elapsed>=SWEEP_SECONDS*runPasses) {finish();return;}
  frame=requestAnimationFrame(tick);
}
function scheduleAudio() {
  if(!playing) return;
  const now=Tone.immediate(),until=Math.max(0,Math.min(SWEEP_SECONDS*runPasses,now-anchor+.06));
  const events=timeline.advanceTo(until);
  for(const note of events) {
    const scheduled=anchor+note.time;
    const lag=Math.max(0,(now-scheduled)*1000);maxLag=Math.max(maxLag,lag);
    if(lag>80) {stop();$('status').textContent='调度停顿，已停止；不补发积压音符';return;}
    piano.triggerAttackRelease(Tone.Frequency(note.midi,'midi').toNote(),note.duration,Math.max(now+.001,scheduled),note.velocity);
    const record={picture:kind,time:note.time,x:note.x,y:note.y,intersections:note.count,midi:note.midi,duration:note.duration,velocity:note.velocity,audioTime:scheduled,lagMs:lag,voice:'piano',pass:note.pass};
    currentRun.push(record);records.push(record);
  }
  if(runPasses>1) for(;drumGrid/4<=until*SCAN_BPM/60;drumGrid++) {
    const beat=drumGrid/4,time=beat*60/SCAN_BPM;
    if(time>=SWEEP_SECONDS*runPasses) break;
    const pass=Math.floor(time/SWEEP_SECONDS),fraction=time%SWEEP_SECONDS/SWEEP_SECONDS;
    const x=(pass%2?1-fraction:fraction)*959;
    const points=readLineIntersections(reader.model,x).filter(p=>p.thickness<reader.model.height*.045&&p.edgeStrength>.05);
    const hits=progressiveDrums.atGrid(beat,points.length);
    drumStates.push({...progressiveDrums.state,time});
    for(const hit of hits) {
      const scheduled=anchor+time,lag=Math.max(0,(now-scheduled)*1000);
      maxLag=Math.max(maxLag,lag);
      if(lag>80) {stop();$('status').textContent='打击乐调度停顿，已停止；不补发积压音符';return;}
      warmPercussion.play(hit,Math.max(now+.001,scheduled));
      const record={picture:kind,time,x,y:'',intersections:points.length,midi:'',duration:hit.duration,velocity:hit.velocity,audioTime:scheduled,lagMs:lag,voice:hit.voice,pass:hit.pass};
      drumRun.push(record);records.push(record);
    }
  }
}
function exportLog() {
  const keys=['picture','time','x','y','intersections','midi','duration','velocity','audioTime','lagMs','voice','pass'];
  const text=keys.join(',')+'\n'+[...records].sort((a,b)=>a.audioTime-b.audioTime).map(r=>keys.map(k=>r[k]??'').join(',')).join('\n');
  if($('saveLog').href.startsWith('blob:')) URL.revokeObjectURL($('saveLog').href);
  $('saveLog').href=URL.createObjectURL(new Blob([text],{type:'text/csv;charset=utf-8'}));$('saveLog').download='线条扫描-实际触发.csv';$('saveLog').hidden=false;
}
async function finish() {
  playing=false;clearInterval(scheduler);$('start').textContent='重新扫描';$('status').textContent='本遍完成';
  const row=document.createElement('tr');
  const duration=SWEEP_SECONDS*runPasses;
  for(const text of [`${labels[kind]} / ${reader.melody?'曲线':'密度'}`,`${duration}s`,(countSum/Math.max(1,samples)).toFixed(1),presented,(presented/duration).toFixed(2),`${currentRun.filter(e=>e.time<duration/2).length} / ${currentRun.filter(e=>e.time>=duration/2).length}`,`${currentRun[0]?.midi??'—'} → ${currentRun.at(-1)?.midi??'—'}`,`${maxLag.toFixed(1)} ms`]) {const td=document.createElement('td');td.textContent=text;row.append(td);}
  $('results').append(row);exportLog();
  if(runPasses>1) $('drumDebug').textContent='往返鼓点实际触发数：'+Array.from({length:runPasses},(_,p)=>`第${p+1}遍 ${drumRun.filter(e=>e.pass===p+1).length}`).join('；');
  if(comparison?.length) {const next=comparison.shift();await selectKind(next);await begin(false);}
  else if(comparison) {comparison=null;$('compare').disabled=false;recorder?.stop();}
}
async function begin(clearRecords=true) {
  const token=++runId;$('status').textContent='正在载入本地钢琴采样';$('start').disabled=true;
  try {await initAudio();if(token!==runId) return;
    reset();if(clearRecords) records=[];warmPercussion.resume();playing=true;anchor=Tone.immediate()+.1;last=performance.now();$('status').textContent=`实时读取中 · 120 BPM · ${reader.melody?'曲线阶段':'密度阶段'}`;$('start').textContent='停止扫描';scheduleAudio();scheduler=setInterval(scheduleAudio,15);frame=requestAnimationFrame(tick);
  } catch(error) {$('status').textContent=`无法启动钢琴：${error.message}`;}
  finally {$('start').disabled=false;}
}
function stop() {runId++;playing=false;clearInterval(scheduler);cancelAnimationFrame(frame);piano?.releaseAll();warmPercussion.stop();$('start').textContent='开始扫描';$('status').textContent='已停止';}
$('start').onclick=()=>{if(playing) {comparison=null;$('compare').disabled=false;if(recorder?.state==='recording') recorder.stop();stop();} else begin();};
document.querySelectorAll('[data-kind]').forEach(b=>b.onclick=()=>{comparison=null;$('compare').disabled=false;if(recorder?.state==='recording') recorder.stop();selectKind(b.dataset.kind);});
$('compare').onclick=async()=>{
  $('drums').checked=false;$('compare').disabled=true;records=[];$('results').replaceChildren();comparison=['dense','fingerprint','rising','mixed'];
  await selectKind('sparse');
  if(typeof MediaRecorder!=='undefined') {
    chunks=[];recorder=new MediaRecorder(recording.stream);
    recorder.ondataavailable=e=>{if(e.data.size) chunks.push(e.data);};
    recorder.onstop=()=>{const link=$('saveAudio');if(link.href.startsWith('blob:')) URL.revokeObjectURL(link.href);link.href=URL.createObjectURL(new Blob(chunks,{type:recorder.mimeType}));link.download='线条扫描-五图钢琴对比.webm';link.hidden=false;};recorder.start();
  }
  await begin(false);
};
$('melody').onchange=()=>{comparison=null;$('compare').disabled=false;if(recorder?.state==='recording') recorder.stop();stop();reset();};
$('drums').onchange=()=>{comparison=null;$('compare').disabled=false;if(recorder?.state==='recording') recorder.stop();stop();reset();$('drumDebug').textContent=$('drums').checked?'中途进入、回扫增强已启用；点击开始扫描':'鼓点调试：未启用';};
$('saveImage').onclick=()=>source.toBlob(blob=>{const a=document.createElement('a');const url=URL.createObjectURL(blob);a.href=url;a.download=`${labels[kind]}.png`;a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);});
$('upload').onchange=async e=>{const file=e.target.files[0];if(!file) return;stop();comparison=null;$('compare').disabled=false;if(recorder?.state==='recording') recorder.stop();const url=URL.createObjectURL(file);const img=new Image();try{img.src=url;await img.decode();sourceCtx.fillStyle='#fafafa';sourceCtx.fillRect(0,0,960,540);const ratio=Math.min(960/img.width,540/img.height);sourceCtx.drawImage(img,(960-img.width*ratio)/2,(540-img.height*ratio)/2,img.width*ratio,img.height*ratio);kind='upload';updateModel();}finally{URL.revokeObjectURL(url);}};
document.addEventListener('visibilitychange',()=>{if(document.hidden&&playing) {comparison=null;$('compare').disabled=false;if(recorder?.state==='recording') recorder.stop();stop();}});
selectKind('sparse');
