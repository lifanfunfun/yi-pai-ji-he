import * as Tone from "tone";
import {safeOutput} from '../audio/safeOutput.js';
import {ProgressiveDrumEngine} from './progressiveDrums.js';
import {WarmPercussion} from './warmPercussion.js';
import {rhythmContext} from './rhythmContext.js';
import {lazyVoice,lazySample} from './lazyVoice.js';
import {VoiceBudget,midiNote} from './voiceBudget.js';
import {PlaybackBudget} from './playbackBudget.js';

export const DOODLE_SCALES = {
  "pentatonic": {
    name: "童话五声音阶 (极度悦耳)",
    notes: ["C3", "D3", "E3", "G3", "A3", "C4", "D4", "E4", "G4", "A4", "C5", "D5", "E5", "G5", "A5", "C6"],
  },
  "lydian": {
    name: "温暖空灵大调 (唯美治愈)",
    notes: ["F3", "G3", "A3", "B3", "C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5", "D5", "E5", "G5", "C6"],
  },
  "dream-minor": {
    name: "梦幻星空小调 (静谧神秘)",
    notes: ["D3", "E3", "F3", "A3", "C4", "D4", "E4", "F4", "A4", "C5", "D5", "E5", "F5", "A5", "C6", "D6"],
  },
  "major-triads": {
    name: "阳光大调和弦 (明朗清脆)",
    notes: ["C3", "E3", "G3", "C4", "E4", "G4", "C5", "E5", "G5", "C6", "E6", "G6"],
  },
};

export class DoodleMusicEngine {
  constructor() {
    this.ready = false;
    this.scaleId = "pentatonic";
    this.volume = 0.85;
    this.volumePercent = 80;

    this.reverb = null;
    this.delay = null;
    this.panner = null;
    this.limiter = null;

    this.marimbaSynth = null;
    this.bellSynth = null;
    this.musicBoxSynth = null;
    this.fluteSynth = null;
    this.harpSynth = null;
    this.bassSynth = null;

    this.activeBands = new Map();
    this.lastTriggerTime = 0;
    this.beatCount = 0;
    this.strings = null;
    this.score = null;
    this.scoreBeat = 0;
    this.scoreBpm = 90;
    this.scorePlaying = false;
    this.scheduler = null;
    this.nextScoreBeat = 0;
    this.performanceStats={calls:0,maxGapMs:0,maxWorkMs:0,lateWindows:0,triggered:0};
    this.harpBudget=new VoiceBudget(8);
    this.playbackBudget=new PlaybackBudget();
    this.voiceProfiles={};
  }

  async start() {
    if (this.ready) { await Tone.start(); return; }
    if (this.starting) return this.starting;
    this.starting = this.buildAudio();
    try { await this.starting; } finally { this.starting = null; }
  }

  async buildAudio({offline=false}={}) {
    try {
      if(!offline) await Tone.start();

      // Master output bus with warm studio reverb & gentle delay
      this.output = new Tone.Gain((this.volumePercent/100)**1.6).connect(safeOutput());
      this.limiter = new Tone.Limiter(-3).connect(this.output);
      this.mixMakeup=new Tone.Gain(1.15).connect(this.limiter);
      this.mixCompressor = new Tone.Compressor({threshold:-18,ratio:1.8,knee:10,attack:.03,release:.22}).connect(this.mixMakeup);
      this.master = new Tone.Gain(0).connect(this.mixCompressor);
      this.bassBus=this.master;
      this.progressiveDrums=new ProgressiveDrumEngine();
      this.warmPercussion=new WarmPercussion(this.master);
      this.leadBus=new Tone.Filter({frequency:6500,type:'lowpass',rolloff:-12}).connect(this.master);
      this.harmonyBus=new Tone.Filter({frequency:2600,type:'lowpass',rolloff:-12});
      this.harmonyPan=new Tone.Panner(-.16).connect(this.master);
      this.harmonyBus.connect(this.harmonyPan);
      const makeVoice=(type,settings,bus)=>{
        // Gentle starts avoid waveform discontinuities without removing percussion attacks.
        settings.envelope.attack=Math.max(.008,settings.envelope.attack);
        if(settings.modulationEnvelope) settings.modulationEnvelope.attack=Math.max(.006,settings.modulationEnvelope.attack);
        const voice=lazyVoice(()=>{
          const voice=new Tone.PolySynth(type,settings);voice.maxPolyphony=8;return voice;
        }).connect(bus===this.master?this.bassBus:bus);
        voice.budgetRelease=settings.envelope.release;
        voice.budgetCost=(settings.oscillator?.count??1)*(type===Tone.FMSynth?2:1);
        return voice;
      };
      this.materialVoices={
        fingerprintAir:makeVoice(Tone.Synth,{oscillator:{type:'fatsine',count:3,spread:9},envelope:{attack:.65,decay:.6,sustain:.65,release:2.2},volume:-15},this.harmonyBus),
        gardenFlute:makeVoice(Tone.FMSynth,{harmonicity:1,modulationIndex:.32,oscillator:{type:'sine'},envelope:{attack:.055,decay:.2,sustain:.55,release:.35},modulationEnvelope:{attack:.06,decay:.2,sustain:.15,release:.2},volume:-11},this.leadBus),
        handpan:makeVoice(Tone.FMSynth,{harmonicity:2.01,modulationIndex:.65,oscillator:{type:'sine'},envelope:{attack:.008,decay:.9,sustain:.045,release:1.1},modulationEnvelope:{attack:.004,decay:.35,sustain:0,release:.35},volume:-9},this.leadBus),
        woodPad:makeVoice(Tone.FMSynth,{harmonicity:1,modulationIndex:.2,oscillator:{type:'sine'},envelope:{attack:.15,decay:.5,sustain:.6,release:1},modulationEnvelope:{attack:.1,decay:.5,sustain:.05,release:.5},volume:-14},this.harmonyBus),
        gardenPad:makeVoice(Tone.Synth,{oscillator:{type:'sine'},envelope:{attack:.4,decay:.25,sustain:.65,release:1.2},volume:-14},this.harmonyBus),
        pluckBass:makeVoice(Tone.FMSynth,{harmonicity:1,modulationIndex:.6,oscillator:{type:'sine'},envelope:{attack:.006,decay:.4,sustain:.12,release:.25},modulationEnvelope:{attack:.002,decay:.18,sustain:0,release:.1},volume:-12},this.master),
        roundBass:makeVoice(Tone.Synth,{oscillator:{type:'triangle'},envelope:{attack:.012,decay:.3,sustain:.2,release:.3},volume:-12},this.master),
        deepBass:makeVoice(Tone.Synth,{oscillator:{type:'sine'},envelope:{attack:.08,decay:.5,sustain:.35,release:.65},volume:-12},this.master),
        pulsePad:makeVoice(Tone.Synth,{oscillator:{type:'triangle'},envelope:{attack:.025,decay:.16,sustain:.35,release:.22},volume:-14},this.leadBus),
        leafChime:makeVoice(Tone.FMSynth,{harmonicity:1.5,modulationIndex:.55,oscillator:{type:'sine'},envelope:{attack:.014,decay:.5,sustain:.06,release:.55},modulationEnvelope:{attack:.01,decay:.2,sustain:0,release:.2},volume:-14},this.leadBus),
        dryPluck:makeVoice(Tone.FMSynth,{harmonicity:3.1,modulationIndex:.9,oscillator:{type:'sine'},envelope:{attack:.003,decay:.1,sustain:.01,release:.09},modulationEnvelope:{attack:.002,decay:.06,sustain:0,release:.05},volume:-12},this.leadBus),
        paperPluck:makeVoice(Tone.FMSynth,{harmonicity:2.7,modulationIndex:.65,oscillator:{type:'sine'},envelope:{attack:.003,decay:.13,sustain:.025,release:.18},modulationEnvelope:{attack:.002,decay:.07,sustain:0,release:.08},volume:-10},this.leadBus),
        feltKeys:makeVoice(Tone.FMSynth,{harmonicity:1,modulationIndex:.3,oscillator:{type:'sine'},envelope:{attack:.018,decay:.8,sustain:.12,release:.9},modulationEnvelope:{attack:.015,decay:.4,sustain:.05,release:.3},volume:-10},this.leadBus),
        warmReed:makeVoice(Tone.Synth,{oscillator:{type:'triangle'},envelope:{attack:.08,decay:.2,sustain:.5,release:.25},volume:-13},this.leadBus),
        heroLead:makeVoice(Tone.FMSynth,{harmonicity:1,modulationIndex:1.1,oscillator:{type:'triangle'},envelope:{attack:.028,decay:.18,sustain:.45,release:.24},modulationEnvelope:{attack:.04,decay:.2,sustain:.2,release:.2},volume:-13},this.leadBus),
        paperKeys:makeVoice(Tone.FMSynth,{harmonicity:2,modulationIndex:.45,oscillator:{type:'sine'},envelope:{attack:.006,decay:.38,sustain:.06,release:.35},modulationEnvelope:{attack:.002,decay:.12,sustain:0,release:.15},volume:-15},this.harmonyBus),
        softPad:makeVoice(Tone.Synth,{oscillator:{type:'triangle'},envelope:{attack:.55,decay:.5,sustain:.45,release:1.4},volume:-22},this.harmonyBus),
      };
      this.strings = new Tone.PolySynth(Tone.Synth, {
        oscillator: {type:'triangle'}, envelope:{attack:.28,decay:.35,sustain:.65,release:1.5}, volume:-14,
      });

      this.reverb = new Tone.Reverb({
        decay: 1.8,
        preDelay: 0.02,
        wet: 0.14,
      }).connect(this.master);

      this.delay = new Tone.FeedbackDelay({
        delayTime: "8n.",
        feedback: 0.12,
        wet: 0.04,
      }).connect(this.reverb);
      this.strings.connect(this.harmonyBus);
      // Dedicated dry drum bus: remove subsonic energy, retain transients and
      // compress moderately before summing with the melodic arrangement.
      this.drumCompressor=new Tone.Compressor({threshold:-20,ratio:2.5,knee:6,attack:.018,release:.12}).connect(this.master);
      this.drumEQ=new Tone.EQ3({low:.8,mid:-1,high:-.8,lowFrequency:140,highFrequency:5200}).connect(this.drumCompressor);
      this.drumBus=new Tone.Filter({frequency:28,type:'highpass',rolloff:-24,Q:.7}).connect(this.drumEQ);
      this.kickEQ=new Tone.Filter({frequency:260,type:'peaking',gain:-2.5,Q:1}).connect(this.drumBus);
      this.kick = new Tone.MembraneSynth({pitchDecay:.025,octaves:3,envelope:{attack:.0015,decay:.14,sustain:0,release:.06},volume:-17}).connect(this.kickEQ);
      this.snareEQ=new Tone.Filter({frequency:750,type:'highpass',rolloff:-12,Q:.7}).connect(this.drumBus);
      this.snare = new Tone.NoiseSynth({noise:{type:'pink'},envelope:{attack:.001,decay:.07,sustain:0,release:.025},volume:-22}).connect(this.snareEQ);
      this.hatHighCut=new Tone.Filter({frequency:10000,type:'lowpass',rolloff:-12,Q:.7}).connect(this.drumBus);
      this.hatEQ=new Tone.Filter({frequency:5000,type:'highpass',rolloff:-12,Q:.7}).connect(this.hatHighCut);
      this.hat = new Tone.NoiseSynth({noise:{type:'white'},envelope:{attack:.001,decay:.025,sustain:0,release:.015},volume:-26}).connect(this.hatEQ);
      this.shakerFilter=new Tone.Filter(3800,'highpass').connect(this.hatHighCut);
      this.shaker=new Tone.NoiseSynth({noise:{type:'pink'},envelope:{attack:.008,decay:.045,sustain:0,release:.025},volume:-25}).connect(this.shakerFilter);
      this.clapFilter=new Tone.Filter({frequency:1800,type:'bandpass',Q:.6}).connect(this.drumBus);
      this.clap=new Tone.NoiseSynth({noise:{type:'white'},envelope:{attack:.004,decay:.085,sustain:0,release:.04},volume:-19}).connect(this.clapFilter);
      this.rim=new Tone.MembraneSynth({pitchDecay:.006,octaves:.5,oscillator:{type:'triangle'},envelope:{attack:.001,decay:.035,sustain:0,release:.02},volume:-20}).connect(this.drumBus);
      this.tom=new Tone.MembraneSynth({pitchDecay:.04,octaves:1.5,envelope:{attack:.003,decay:.16,sustain:0,release:.08},volume:-22}).connect(this.drumBus);

      // 1. Red/Warm: Marimba / Pluck
      this.marimbaSynth = new Tone.PolySynth(Tone.FMSynth, {
        harmonicity: 4,
        modulationIndex: 1.2,
        oscillator: { type: "sine" },
        envelope: { attack: 0.008, decay: 0.25, sustain: 0.05, release: 0.4 },
        modulationEnvelope: { attack:.006,decay:.13,sustain:0,release:.12 },
        volume: -8,
      }).connect(this.leadBus);

      // 2. Yellow/Orange: Glockenspiel / Crystal Mallet
      this.bellSynth = new Tone.PolySynth(Tone.FMSynth, {
        harmonicity: 2,
        modulationIndex: 1.2,
        oscillator: { type: "sine" },
        envelope: { attack: 0.008, decay: 0.35, sustain: 0.02, release: 0.6 },
        modulationEnvelope: { attack: 0.006, decay: 0.2, sustain: 0, release: 0.2 },
        volume: -10,
      }).connect(this.leadBus);

      // 3. Cyan/Blue: Celestial Music Box / Kalimba
      this.musicBoxSynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "sine" },
        envelope: { attack: 0.008, decay: 0.45, sustain: 0.05, release: 0.8 },
        volume: -8,
      }).connect(this.leadBus);

      // 4. Green: Soft Flute / Chime Lead
      this.fluteSynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "sine" },
        envelope: { attack: 0.05, decay: 0.4, sustain: 0.3, release: 0.7 },
        volume: -12,
      }).connect(this.leadBus);

      // 5. Purple/Pink: Dreamy Harp
      this.harpSynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "triangle" },
        envelope: { attack: 0.01, decay: 0.6, sustain: 0.1, release: 1.0 },
        volume: -12,
      }).connect(this.leadBus);

      // 6. Black / Dark outlines: Percussive Cello / Sub Pluck
      this.bassSynth = new Tone.MonoSynth({
        oscillator: { type: "sawtooth" },
        filter: { Q: 2, type: "lowpass", rolloff: -24 },
        envelope: { attack: 0.02, decay: 0.4, sustain: 0.1, release: 0.5 },
        filterEnvelope: { attack: 0.01, decay: 0.2, sustain: 0.2, release: 0.4, baseFrequency: 60, octaves: 2.5 },
        volume: -12,
      }).connect(this.bassBus);

      // Parallel spatial send keeps the theme close and avoids wet bass/drums.
      // Sampled harp stays separate from the synthetic harp used by other pictures.
      this.materialVoices.concertHarp=lazySample(()=>import('./harpVoice.js').then(module=>module.loadHarp())).connect(this.leadBus);
      this.harpSpaceSend=new Tone.Gain(.18).connect(this.reverb);
      this.materialVoices.concertHarp.connect(this.harpSpaceSend);
      this.harpSynth.connect(this.harpSpaceSend);
      this.materialVoices.feltKeys.connect(this.harpSpaceSend);
      this.materialVoices.paperKeys.connect(this.harpSpaceSend);
      this.leadSend = new Tone.Gain(.12).connect(this.reverb);
      this.leadBus.connect(this.leadSend);
      this.harmonySend = new Tone.Gain(.18).connect(this.reverb);
      this.harmonyBus.connect(this.harmonySend);
      await this.reverb.ready;

      await this.prepareScoreVoices();
      this.resourcesReady=true;
      this.ready = true;
      if(!offline) {
        this.outputMeter=new Tone.Waveform(256);this.output.connect(this.outputMeter);
        this.observedPeak=0;
      }
      this.scoreAnchor = Tone.now();
      this.master.gain.value = this.scorePlaying ? .85 : 0;
      if(!offline) this.scheduler ||= setInterval(() => this.scheduleScore(), 25);
    } catch (err) {
      console.warn("DoodleMusicEngine audio start failed:", err);
    }
  }

  setScale(scaleId) {
    if (DOODLE_SCALES[scaleId]) {
      this.scaleId = scaleId;
    }
  }

  setVolume(percent) {
    this.volumePercent=Math.max(0,Math.min(100,Number(percent)||0));
    // Output fader leaves instrument velocity/timbre and the mix balance unchanged.
    this.output?.gain.rampTo((this.volumePercent/100)**1.6,.06);
  }

  getScaleNotes() {
    return DOODLE_SCALES[this.scaleId]?.notes || DOODLE_SCALES["pentatonic"].notes;
  }

  /**
   * Map y position (0 = top, 1 = bottom) to scale pitch
   */
  pitchForNormY(normY) {
    const notes = this.getScaleNotes();
    const clampedY = Math.max(0, Math.min(0.999, normY));
    // Top of screen is high pitch, bottom of screen is low pitch
    const idx = Math.floor((1 - clampedY) * notes.length);
    const safeIdx = Math.max(0, Math.min(notes.length - 1, idx));
    return notes[safeIdx];
  }

  /**
   * Trigger note based on pixel color & position
   */
  trigger(hitEvent) {
    if (!this.ready) {
      this.start().catch(() => {});
      return;
    }

    const {
      bandIndex = 0,
      pitch,
      colorType = "rainbow",
      velocity = 0.75,
      pan = 0,
      colorName = "彩虹",
    } = hitEvent;

    const now = Tone.now();
    const safePitch = pitch || "C5";
    const safeVel = Math.max(0.08, Math.min(0.65, velocity * this.volume * .65));

    try {
      switch (colorType) {
        case "red":
          this.marimbaSynth?.triggerAttackRelease(safePitch, "8n", now, safeVel);
          break;
        case "orange":
        case "yellow":
          this.bellSynth?.triggerAttackRelease(safePitch, "8n", now, safeVel);
          break;
        case "green":
          this.fluteSynth?.triggerAttackRelease(safePitch, "4n", now, safeVel * 0.85);
          break;
        case "cyan":
        case "blue":
          this.musicBoxSynth?.triggerAttackRelease(safePitch, "8n", now, safeVel);
          break;
        case "purple":
          this.harpSynth?.triggerAttackRelease(safePitch, "4n", now, safeVel);
          break;
        case "dark":
          // Deep bass note
          const bassNote = safePitch.replace(/[4-6]/, "2");
          this.bassSynth?.triggerAttackRelease(bassNote, "8n", now, safeVel);
          break;
        default:
          this.musicBoxSynth?.triggerAttackRelease(safePitch, "8n", now, safeVel);
          break;
      }
    } catch {
      // Audio trigger grace
    }
  }

  stopAll() {
    this.setScorePlaying(false);
    if (!this.ready) return;
    this.releaseVoices();
  }

  releaseVoices() {
    for (const voice of Object.values(this.materialVoices??{})) voice.releaseAll();
    for (const voice of [this.marimbaSynth,this.bellSynth,this.musicBoxSynth,this.fluteSynth,this.harpSynth,this.strings]) voice?.releaseAll();
    this.bassSynth?.triggerRelease();
    this.kick?.triggerRelease();
    this.snare?.triggerRelease();
    this.hat?.triggerRelease();
    this.shaker?.triggerRelease();this.clap?.triggerRelease();this.rim?.triggerRelease();this.tom?.triggerRelease();
  }

  setScore(score) {
    if(this.ready) {
      this.releaseVoices();
      // Allow the old lookahead window to drain while muted before the new piece.
      this.master.gain.cancelScheduledValues(Tone.now());
      this.master.gain.setValueAtTime(this.master.gain.value,Tone.now());
      this.master.gain.linearRampToValueAtTime(0,Tone.now()+.04);
      if(this.scorePlaying) {
        this.master.gain.setValueAtTime(0,Tone.now()+.14);
        this.master.gain.linearRampToValueAtTime(.85,Tone.now()+.19);
      }
    }
    this.score = score; this.scoreBeat = 0; this.nextScoreBeat = 0;
    this.harpBudget.reset();
    this.playbackBudget.reset();
    this.scoreEvents=[...score.events].sort((a,b)=>a.section-b.section||a.beat-b.beat||(['harmony','bass','lead','pulse','texture'].indexOf(a.role)-['harmony','bass','lead','pulse','texture'].indexOf(b.role)));
    if(this.ready) {
      const waiting=score.events.some(event=>event.voice==='concertHarp')&&!this.materialVoices.concertHarp.loaded;
      this.resourcesReady=!waiting;
      this.prepareScoreVoices().then(()=>{
        if(this.score!==score)return;
        this.resourcesReady=true;
        if(waiting){this.scoreAnchor=Tone.now()+.05;this.scoreBeat=0;this.nextScoreBeat=0;this.nextDrumGrid=0;this.progressiveDrums.reset();}
      }).catch(error=>console.warn('绘音色加载失败',error));
    }
    this.progressiveDrums?.reset();this.nextDrumGrid=0;
    if(this.progressiveDrums) this.progressiveDrums.preset=score.percussionProfile??score.preset;
    this.scoreAnchor = Tone.now()+(this.ready?.14:0);
  }

  prepareScoreVoices() {
    return Promise.all([...new Set(this.score?.events.map(event=>event.voice)??[])].map(name=>this.materialVoices?.[name]?.warm?.()));
  }

  setScorePlaying(playing) {
    if(this.scorePlaying === playing) return;
    this.lastScheduleWallTime=null;
    this.scoreBeat = this.absoluteScoreBeat();
    this.scoreAnchor = Tone.now();
    this.scorePlaying = playing;
    this.master?.gain.rampTo(playing ? .85 : 0,.05);
    this.nextScoreBeat = this.scoreBeat;
  }

  setScoreBpm(bpm) {
    this.scoreBeat = this.absoluteScoreBeat();
    this.scoreAnchor = Tone.now();this.scoreBpm = bpm;
  }

  absoluteScoreBeat() {
    return Math.max(0,this.scoreBeat + (this.scorePlaying && this.ready ? (Tone.now()-(this.scoreAnchor??Tone.now()))*this.scoreBpm/60 : 0));
  }

  getScorePosition() {
    if(!this.score || !this.ready) return null;
    const stamp=Tone.getContext().rawContext.getOutputTimestamp?.();
    const presentation=stamp?.contextTime>0&&stamp.performanceTime>0?stamp.contextTime+(performance.now()-stamp.performanceTime)/1000:Tone.immediate();
    const absolute=Math.max(0,this.scoreBeat+(this.scorePlaying?(presentation-this.scoreAnchor)*this.scoreBpm/60:0));
    const beat=((absolute%this.score.totalBeats)+this.score.totalBeats)%this.score.totalBeats;
    const section=Math.floor(beat/this.score.sectionBeats);
    const progress=(beat%this.score.sectionBeats)/this.score.sectionBeats;
    return {section,position:section?1-progress:progress};
  }

    scheduleScore() {
      if(!this.ready || !this.scorePlaying || !this.score || this.resourcesReady===false) return;
      const workStart=performance.now();
      if(this.lastScheduleWallTime) {
        const gap=workStart-this.lastScheduleWallTime;
        this.performanceStats.maxGapMs=Math.max(this.performanceStats.maxGapMs,gap);
        if(gap>180) this.performanceStats.lateWindows++;
      }
      this.lastScheduleWallTime=workStart;this.performanceStats.calls++;
      if(this.outputMeter) {
        for(const sample of this.outputMeter.getValue()) this.observedPeak=Math.max(this.observedPeak,Math.abs(sample));
        const readout=document.querySelector('#doodleVolumeValue');
        if(readout) {readout.dataset.audioPeakDb=(20*Math.log10(Math.max(1e-9,this.observedPeak))).toFixed(1);readout.dataset.audioContext=Tone.getContext().state;}
      }
    const now=Tone.now(), beat=this.absoluteScoreBeat(), end=beat+.18*this.scoreBpm/60;
      const from=Math.max(beat,this.nextScoreBeat),total=this.score.totalBeats;
    const voices={...this.materialVoices,bell:this.bellSynth,musicBox:this.musicBoxSynth,marimba:this.marimbaSynth,flute:this.fluteSynth,harp:this.harpSynth,strings:this.strings,bass:this.bassSynth,kick:this.kick,rim:this.rim,tom:this.tom};
    for(let cycle=Math.floor(from/total);cycle<=Math.floor(end/total);cycle++) for(const event of this.scoreEvents??this.score.events) {
      if(this.getScanLines&&event.role==='rhythm') continue;
      const eventBeat=cycle*total+event.section*this.score.sectionBeats+event.beat;
      if(eventBeat<from || eventBeat>=end) continue;
      const time=Math.max(now+.005,this.scoreAnchor+(eventBeat-this.scoreBeat)*60/this.scoreBpm);
      const voiceBalance={bell:1.08,musicBox:1,heroLead:1.1,warmReed:1.12,paperPluck:1,marimba:1,harp:1.12,pulsePad:1,strings:1,softPad:1.2,bass:.82,pluckBass:.9,roundBass:.9,deepBass:1,clap:1.1,hat:1,shaker:1,kick:1.05};
      const harpVoice=['harp','concertHarp'].includes(event.voice);
      const uploadMix=this.score.uploadArrangement;
      // Rebalance the foreground harp against the quiet opening/accompaniment.
      // Keep the boost before the existing limiter, without adding any voices.
      const mixBalance=uploadMix?(harpVoice?.6:event.voice==='softPad'?1.65:
        event.role==='harmony'||event.role==='pulse'?1.2:1.1):1;
      const velocity=Math.min(.85,event.velocity*this.volume*(voiceBalance[event.voice]??1)*mixBalance);
      if(['snare','hat','shaker','clap'].includes(event.voice)) {
        this[event.voice]?.triggerAttackRelease(event.duration*60/this.scoreBpm,time,velocity);
        continue;
      }
      const notes=Array.isArray(event.midi)?event.midi.map(midiNote):midiNote(event.midi);
      const lead=event.role==='lead'||(!event.role&&['bell','musicBox','marimba','flute'].includes(event.voice));
      const duration=event.duration*60/this.scoreBpm;
      const profile=voices[event.voice];
      const release=profile?.budgetRelease??({concertHarp:1.5,strings:1.5,bass:.5,bell:.6,musicBox:.8,marimba:.4,flute:.7,harp:1}[event.voice]??.4);
      const cost=profile?.budgetCost??(['bell','marimba'].includes(event.voice)?2:1);
      const scheduled=this.playbackBudget.reserve({voice:event.voice,time,duration,release,cost,count:Array.isArray(notes)?notes.length:1,grid:60/this.scoreBpm/3,anchor:this.scoreAnchor});
      voices[event.voice]?.triggerAttackRelease(notes,duration,scheduled,velocity*(lead?.85:1));
      this.performanceStats.triggered+=Array.isArray(event.midi)?event.midi.length:1;
    }
    if(this.getScanLines&&this.progressiveDrums&&this.score.percussionEnabled!==false) {
      this.progressiveDrums.sectionBeats=this.score.sectionBeats;
      this.progressiveDrums.preset=this.score.percussionProfile??this.score.preset;
      let grid=Math.max(this.nextDrumGrid??0,Math.ceil(from*4-1e-7));
      for(;grid/4<end;grid++) {
        const absolute=grid/4,pass=Math.floor(absolute/this.score.sectionBeats);
        const progress=absolute%this.score.sectionBeats/this.score.sectionBeats;
        const position=pass%2?1-progress:progress;
        const local=this.getScanLines(position);
          const context=rhythmContext(this.score,absolute);
          const hits=this.progressiveDrums.atGrid(absolute,local.count,context);
        const time=Math.max(now+.005,this.scoreAnchor+(absolute-this.scoreBeat)*60/this.scoreBpm);
        for(const hit of hits) this.warmPercussion.play(hit,time,this.volume);
        this.drumDebug={...this.progressiveDrums.state,position,absoluteBeat:absolute};
      }
      this.nextDrumGrid=grid;
    }
    this.nextScoreBeat=end;
    this.performanceStats.maxWorkMs=Math.max(this.performanceStats.maxWorkMs,performance.now()-workStart);
    this.performanceStats.harpMaxActive=this.harpBudget.maxActive;
    this.performanceStats.harpDeferred=this.harpBudget.deferred;
    this.performanceStats.materialVoicesInitialized=Object.values(this.materialVoices??{}).filter(voice=>voice.initialized).length;
    this.performanceStats.playbackBudget=this.playbackBudget.stats;
    const debugReadout=document.querySelector('#doodleVolumeValue');
    if(debugReadout&&workStart-(this.lastStatsPublish??0)>1000) {debugReadout.dataset.performance=JSON.stringify(this.performanceStats);this.lastStatsPublish=workStart;}
  }

  sectionBeat(section, step, bpm) {
    if (!this.ready) return;
    const chords=[['C3','E3','G3'],['A2','C3','E3'],['F3','A3','C4'],['G2','B2','D3']];
    const chord=chords[Math.floor(step/4)%4];
    const beat=60/bpm;
    const now=Tone.now();
    if (step%4===0) {
      this.strings.triggerAttackRelease(chord,beat*(section===3?5:3.5),now,section===3?.18:.3);
      this.bassSynth?.triggerAttackRelease(chord[0],beat*1.5,now,.25);
    }
    if(section===1 || section===2) this.harpSynth?.triggerAttackRelease(chord[step%3].replace('2','3').replace('3','4'),beat*.6,now,.2);
  }
}
