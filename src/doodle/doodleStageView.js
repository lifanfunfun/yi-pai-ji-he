import scribbleImage from '../../assets/doodle-scribble-wide.png';
import {extractLineMask,readLineIntersections} from './liveLineScanner.js';
import buildingImage from '../../assets/doodle-building-wide-v2.png';
import tiedyeImage from '../../assets/doodle-tiedye-wide.png';
import decorativeImage from '../../assets/doodle-decorative-wide-v2.png';
const artworkImages = {scribble:scribbleImage,building:buildingImage,tiedye:tiedyeImage,decorative:decorativeImage};

export class DoodleStageView {
  constructor(containerEl) {
    this.container = containerEl;
    this.stageEl = null;

    // Canvases
    this.canvasWidth = 800;
    this.canvasHeight = 450;
    this.renderScale = 4.8; // 3840 × 2160 backing store; retain logical drawing coordinates.
    this.doodleCanvas = null;
    this.doodleCtx = null;
    this.animCanvas = null;
    this.animCtx = null;

    // Scanline & playback
    this.isPlaying = false;
    this.scanPos = 0; // 0.0 to 1.0 (horizontal position)
    this.bpm = 104;
    this.section = 0;
    this.direction = 1;
    this.lastScanSample = 0;
    this.lastBeat = 0;
    this.onSectionBeat = null;
    this.onArtworkChanged = null;
    this.getScorePosition = null;
    this.lastFrameTime = performance.now();

    // Mode: "doodle" (drawing/image) or "camera" (live feed)
    this.sourceMode = "doodle";
    this.currentPreset = "scribble";

    // Interactive Drawing state
    this.isDrawing = false;
    this.currentColor = "#ef4444";
    this.brushSize = 14;
    this.lastDrawX = 0;
    this.lastDrawY = 0;

    // Visual particles & trigger pulses
    this.ripples = [];
    this.particles = [];
    this.recentHits = [];

    // Band memory to debounce continuous strokes
    this.bandStates = new Array(24).fill(false);

    // Callbacks
    this.onNoteHit = null;

    this.initDom();
    this.loadPreset("scribble");
  }

  initDom() {
    let stageEl = document.querySelector("#doodleStage");
    if (!stageEl) {
      stageEl = document.createElement("div");
      stageEl.id = "doodleStage";
      stageEl.className = "doodle-stage";
      stageEl.innerHTML = `
        <div class="doodle-viewport">
          <!-- Main Content Canvas (Holds drawings, uploaded artwork, camera snapshot) -->
          <canvas id="doodleMainCanvas" width="${this.canvasWidth}" height="${this.canvasHeight}"></canvas>
          
          <!-- Animation Canvas (Laser scanline, music notes, ripples) -->
          <canvas id="doodleAnimCanvas" width="${this.canvasWidth}" height="${this.canvasHeight}"></canvas>

          <!-- Top-Left Live Trigger HUD Badge -->
          <div class="doodle-hud-pill" id="doodleHudPill" hidden>
            <span class="doodle-hud-icon">🎵</span>
            <span class="doodle-hud-text" id="doodleHudText">扫描准备就绪 · 点击开始</span>
          </div>

          <!-- Bottom Drawing Toolbar on Stage -->
          <div class="doodle-brush-bar">
            <div class="doodle-palette">
              <button class="palette-swatch is-active" style="background:#ef4444" data-color="#ef4444" title="红 · 马林巴"></button>
              <button class="palette-swatch" style="background:#f97316" data-color="#f97316" title="橙 · 木琴"></button>
              <button class="palette-swatch" style="background:#eab308" data-color="#eab308" title="黄 · 钟琴"></button>
              <button class="palette-swatch" style="background:#22c55e" data-color="#22c55e" title="绿 · 长笛"></button>
              <button class="palette-swatch" style="background:#06b6d4" data-color="#06b6d4" title="青 · 水晶"></button>
              <button class="palette-swatch" style="background:#3b82f6" data-color="#3b82f6" title="蓝 · 八音盒"></button>
              <button class="palette-swatch" style="background:#a855f7" data-color="#a855f7" title="紫 · 竖琴"></button>
              <button class="palette-swatch" style="background:#1e293b" data-color="#1e293b" title="黑 · 低音大提琴"></button>
            </div>
            <div class="doodle-brush-tools">
              <button id="btnDoodleEraser" class="doodle-tool-btn" title="橡皮擦">🧹 橡皮</button>
              <button id="btnDoodleClear" class="doodle-tool-btn" title="清空画板">🗑️ 清空</button>
            </div>
          </div>
        </div>

        <input type="file" id="doodleUploadInput" accept="image/*" style="display:none;" />
      `;

      this.container.appendChild(stageEl);
      this.stageEl = stageEl;

      this.doodleCanvas = stageEl.querySelector("#doodleMainCanvas");
      this.doodleCtx = this.doodleCanvas.getContext("2d", { willReadFrequently: true });
      this.animCanvas = stageEl.querySelector("#doodleAnimCanvas");
      this.animCtx = this.animCanvas.getContext("2d");

      for(const [canvas,ctx] of [[this.doodleCanvas,this.doodleCtx],[this.animCanvas,this.animCtx]]) {
        // Preserve 4K artwork; the moving light/particles need only display resolution.
        const scale=canvas===this.animCanvas?Math.min(2,window.devicePixelRatio||1):this.renderScale;
        canvas.width=Math.round(this.canvasWidth*scale);
        canvas.height=Math.round(this.canvasHeight*scale);
        ctx.setTransform(scale,0,0,scale,0,0);
        ctx.imageSmoothingEnabled=true;
        ctx.imageSmoothingQuality='high';
      }

      this.bindEvents();
    }
  }

  bindEvents() {
    const animCanvas = this.animCanvas;

    // Palette swatch clicks
    this.stageEl.querySelectorAll(".palette-swatch").forEach((swatch) => {
      swatch.addEventListener("click", (e) => {
        this.stageEl.querySelectorAll(".palette-swatch").forEach((s) => s.classList.remove("is-active"));
        swatch.classList.add("is-active");
        this.currentColor = swatch.dataset.color;
      });
    });

    // Tool buttons
    this.stageEl.querySelector("#btnDoodleClear")?.addEventListener("click", () => {
      this.clearCanvas();
    });

    this.stageEl.querySelector("#btnDoodleEraser")?.addEventListener("click", () => {
      this.currentColor = "#ffffff";
      this.stageEl.querySelectorAll(".palette-swatch").forEach((s) => s.classList.remove("is-active"));
    });

    // File upload
    const fileInput = this.stageEl.querySelector("#doodleUploadInput");
    if (fileInput) {
      fileInput.addEventListener("change", (e) => {
        const file = e.target?.files?.[0];
        if (file) {
          this.loadImageFile(file);
        }
      });
    }

    // Drawing interaction with mouse / touch
    const getPos = (e) => {
      const rect = animCanvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const scaleX = this.canvasWidth / rect.width;
      const scaleY = this.canvasHeight / rect.height;
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY,
      };
    };

    const startDraw = (e) => {
      // Don't draw if clicking bottom brush bar
      if (e.target.closest(".doodle-brush-bar") || e.target.closest(".doodle-hud-pill")) return;
      if (this.sourceMode === "camera-live") {
        const videoEl = document.querySelector("#camera");
        if (videoEl && videoEl.videoWidth > 0) {
          this.captureCameraFrame(videoEl);
        }
        this.sourceMode = "doodle";
        const camBtn = document.querySelector("#doodleCaptureCameraButton");
        if (camBtn) camBtn.textContent = "📷 摄像头取景";
      }
      this.isDrawing = true;
      const pos = getPos(e);
      this.lastDrawX = pos.x;
      this.lastDrawY = pos.y;
      this.drawStroke(pos.x, pos.y, true);
    };

    const moveDraw = (e) => {
      if (!this.isDrawing) return;
      e.preventDefault();
      const pos = getPos(e);
      this.drawStroke(pos.x, pos.y, false);
      this.lastDrawX = pos.x;
      this.lastDrawY = pos.y;
    };

    const stopDraw = () => {
      if (!this.isDrawing) return;
      this.isDrawing = false;
      this.currentPreset = 'upload';
      this.notifyArtwork();
    };

    animCanvas.addEventListener("mousedown", startDraw);
    window.addEventListener("mousemove", moveDraw);
    window.addEventListener("mouseup", stopDraw);

    animCanvas.addEventListener("touchstart", startDraw, { passive: false });
    window.addEventListener("touchmove", moveDraw, { passive: false });
    window.addEventListener("touchend", stopDraw);
  }

  drawStroke(x, y, isStart = false) {
    const ctx = this.doodleCtx;
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = this.currentColor;
    ctx.fillStyle = this.currentColor;
    ctx.lineWidth = this.currentColor === "#ffffff" ? 36 : this.brushSize;

    ctx.beginPath();
    if (isStart) {
      ctx.arc(x, y, ctx.lineWidth * 0.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.moveTo(this.lastDrawX, this.lastDrawY);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  clearCanvas() {
    this.doodleCtx.fillStyle = "#ffffff";
    this.doodleCtx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
    this.ripples = [];
    this.particles = [];
    this.notifyArtwork();
  }

  loadPreset(presetId) {
    this.bpm = {scribble:104,building:90,decorative:96,tiedye:72}[presetId] ?? 80;
    this.currentPreset = presetId;
    this.sourceMode = 'doodle';
    this.resetScan();
    this.clearCanvas();
    if (artworkImages[presetId]) {
      const image = new Image();
      image.onload = () => {
        if (this.currentPreset !== presetId || this.sourceMode !== 'doodle') return;
        this.clearCanvas();
        const scale = Math.min(this.canvasWidth/image.width,this.canvasHeight/image.height);
        const width=image.width*scale,height=image.height*scale;
        this.doodleCtx.drawImage(image,(this.canvasWidth-width)/2,(this.canvasHeight-height)/2,width,height);
        this.resetScan();
        this.notifyArtwork();
      };
      image.src = artworkImages[presetId];
    }
  }

  resetScan() {
    this.scanPos = 0; this.section = 0; this.direction = 1;
    this.bandStates.fill(false); this.lastScanSample = 0; this.lastBeat = 0;
  }

  notifyArtwork() {
    // Analysis keeps the original resolution and mapping independent of display quality.
    const analysis=document.createElement('canvas');
    analysis.width=this.canvasWidth;analysis.height=this.canvasHeight;
    const ctx=analysis.getContext('2d');
    ctx.drawImage(this.doodleCanvas,0,0,this.canvasWidth,this.canvasHeight);
    this.recordArtwork=analysis;
    const image=ctx.getImageData(0,0,this.canvasWidth,this.canvasHeight);
    this.scanImage=image;
    this.lineStructure=extractLineMask(image);
    this.onArtworkChanged?.(image,this.currentPreset);
  }

  readScanLines(position) {
    let model=this.lineStructure;
    if(this.sourceMode==='camera-live') {
      // Read the current camera strip, not the cached frame from the last sweep.
      const strip=document.createElement('canvas');strip.width=3;strip.height=this.canvasHeight;
      const ctx=strip.getContext('2d');
      const sx=Math.max(0,Math.min(this.doodleCanvas.width-3*this.renderScale,position*this.doodleCanvas.width));
      ctx.drawImage(this.doodleCanvas,sx,0,3*this.renderScale,this.doodleCanvas.height,0,0,3,this.canvasHeight);
      model=extractLineMask(ctx.getImageData(0,0,3,this.canvasHeight));
    }
    if(!model) return {count:0,points:[]};
    const x=this.sourceMode==='camera-live'?1:position*(model.width-1);
    const points=readLineIntersections(model,x).filter(p=>p.thickness<model.height*.045&&p.edgeStrength>.05);
    return {count:points.length,points,isLineArt:model.isLineArt};
  }

  loadImageFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        this.doodleCtx.fillStyle = "#ffffff";
        this.doodleCtx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

        // Aspect fit image
        const aspect = img.width / img.height;
        let dw = this.canvasWidth;
        let dh = this.canvasHeight;
        let dx = 0;
        let dy = 0;

        if (aspect > this.canvasWidth / this.canvasHeight) {
          dh = this.canvasWidth / aspect;
          dy = (this.canvasHeight - dh) * 0.5;
        } else {
          dw = this.canvasHeight * aspect;
          dx = (this.canvasWidth - dw) * 0.5;
        }

        this.doodleCtx.drawImage(img, dx, dy, dw, dh);
        this.recordImageBounds={x:dx,y:dy,width:dw,height:dh};
        this.sourceMode = 'doodle'; this.currentPreset = 'upload'; this.resetScan();
        this.notifyArtwork();
        this.setHudText("🖼️ 已载入本地图片涂鸦 · 扫描开始");
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  captureCameraFrame(videoEl) {
    if (!videoEl || videoEl.videoWidth === 0) return;
    this.doodleCtx.save();
    // Mirror camera frame horizontally
    this.doodleCtx.translate(this.canvasWidth, 0);
    this.doodleCtx.scale(-1, 1);
    this.doodleCtx.drawImage(videoEl, 0, 0, this.canvasWidth, this.canvasHeight);
    this.doodleCtx.restore();
    this.currentPreset = 'camera'; this.notifyArtwork();
    this.setHudText("📸 已捕捉摄像头画幅涂鸦 · 开始扫描演奏");
  }

  setHudText(text, icon = "🎶") {
    const pill = this.stageEl?.querySelector("#doodleHudPill");
    const textEl = this.stageEl?.querySelector("#doodleHudText");
    if (textEl) textEl.textContent = text;
    if (pill) {
      pill.classList.add("is-popping");
      setTimeout(() => pill.classList.remove("is-popping"), 300);
    }
  }

  /**
   * Main 60fps tick: updates scan line position, samples pixels along the vertical line,
   * triggers audio and renders laser scanline, note sparkles & rings
   */
  tick(now, liveVideoEl = null) {
    const dt = Math.min(0.08, (now - this.lastFrameTime) / 1000);
    this.lastFrameTime = now;

    const w = this.canvasWidth;
    const h = this.canvasHeight;

    // If live camera scanner mode is active, stream video directly to canvas
    if (this.sourceMode === "camera-live" && liveVideoEl && liveVideoEl.videoWidth > 0) {
      this.doodleCtx.save();
      this.doodleCtx.translate(w, 0);
      this.doodleCtx.scale(-1, 1);
      this.doodleCtx.drawImage(liveVideoEl, 0, 0, w, h);
      this.doodleCtx.restore();
      if (!this.cameraScoreReady) {
        this.currentPreset = 'camera';this.notifyArtwork();this.cameraScoreReady = true;
      }
    }

    // 1. Advance scan line horizontally
    if (this.isPlaying) {
      // Loop duration in seconds based on BPM: 120 BPM = 2.0s per sweep
      const sweepSeconds = (60 / this.bpm) * 16;
      this.scanPos += this.direction * dt / sweepSeconds;
      if (this.scanPos >= 1.0 || this.scanPos <= 0 && this.direction < 0) {
        this.scanPos = Math.max(0, Math.min(1, this.scanPos));
        this.direction *= -1;
        this.section = (this.section + 1) % 2;
        this.bandStates.fill(false); // Reset bands on new cycle
      }
      const beatMs = 60000 / this.bpm;
      const musicalPosition = this.getScorePosition?.();
      if (musicalPosition) {
        const wrapped = this.previousMusicalSection === 1 && musicalPosition.section === 0;
        this.section = musicalPosition.section;this.scanPos = musicalPosition.position;
        this.direction = this.section ? -1 : 1;
        this.previousMusicalSection = this.section;
        if(wrapped && this.sourceMode === 'camera-live') this.notifyArtwork();
      }
      if (now - this.lastScanSample >= beatMs / 4) {
        this.lastScanSample = now;
        this.sampleScanline(this.scanPos * w, now);
      }
      const phaseLabels = ['A · 线条旋律 →', 'B · 色彩和声 ←'];
      this.stageEl.querySelector('#doodleHudText').textContent = phaseLabels[this.section];
    }

    // 2. Render animation overlays
    this.renderOverlays(now);
  }

  /**
   * Read vertical pixel column along scanline and detect colored strokes/lines
   */
  sampleScanline(scanX, now) {
    const h = this.canvasHeight;
    const sampleX = Math.floor(Math.max(0, Math.min(this.canvasWidth - 1, scanX)));
    const numBands = 24;
    const bandHeight = h / numBands;

    let hitsThisFrame = [];
    // Read the cached analysis image instead of synchronously copying pixels
    // from the 4K display canvas up to 48 times on every scan tick.
    if(this.sourceMode==='camera-live') {
      const canvas=this.scanAnalysisCanvas??=document.createElement('canvas');
      canvas.width=this.canvasWidth;canvas.height=this.canvasHeight;
      const context=canvas.getContext('2d',{willReadFrequently:true});
      context.drawImage(this.doodleCanvas,0,0,this.canvasWidth,this.canvasHeight);
      this.scanImage=context.getImageData(0,0,this.canvasWidth,this.canvasHeight);
    }
    if(!this.scanImage) return;
    const pixels=this.scanImage.data;

    for (let band = 0; band < numBands; band++) {
      const sampleY = Math.floor(band * bandHeight + bandHeight * 0.5);

      let pixel;
      try {
        const offset=(sampleY*this.canvasWidth+sampleX)*4;
        pixel = pixels.subarray(offset,offset+4);
      } catch {
        continue;
      }

      const r = pixel[0];
      const g = pixel[1];
      const b = pixel[2];
      const a = pixel[3];

      if (a < 30) {
        this.bandStates[band] = false;
        continue;
      }

      // Calculate Lightness & Saturation
      const max = Math.max(r, g, b) / 255;
      const min = Math.min(r, g, b) / 255;
      const l = (max + min) / 2;
      const d = max - min;
      const s = l > 0.5 ? d / (2 - max - min + 0.001) : d / (max + min + 0.001);

      // Check if pixel is background (pure white/pale canvas, light paper, or transparent)
      const isWhiteBg = (r > 235 && g > 235 && b > 235) || (s < 0.15 && l > 0.58);
      if (isWhiteBg) {
        this.bandStates[band] = false;
        if (this.section === 3 && band === 12 && now - (this.lastBlankHit || 0) > 1800) {
          this.lastBlankHit = now;
          hitsThisFrame.push({bandIndex:band,normY:.65,colorType:'purple',colorHex:'#d2c5ed',colorName:'留白余韵',velocity:.22,pan:0,x:sampleX,y:sampleY,section:3});
        }
        continue;
      }
      const left=Math.max(0,sampleX-3),right=Math.min(this.canvasWidth,sampleX+4);
      const nearby=pixels.subarray((sampleY*this.canvasWidth+left)*4,(sampleY*this.canvasWidth+right)*4);
      let contrast = 0;
      for (let p=0;p<nearby.length;p+=4) contrast=Math.max(contrast,Math.abs(nearby[p]-r)+Math.abs(nearby[p+1]-g)+Math.abs(nearby[p+2]-b));
      if (this.section === 0 && contrast < 55 && l > .25) { this.bandStates[band]=false; continue; }
      if (this.section === 2 && contrast < 90) { this.bandStates[band]=false; continue; }
      if (this.section === 3) continue;

      // Calculate Hue (0 to 360)
      let hue = 0;
      if (d !== 0) {
        const dr = (max - r / 255) / d;
        const dg = (max - g / 255) / d;
        const db = (max - b / 255) / d;

        if (r / 255 === max) hue = db - dg;
        else if (g / 255 === max) hue = 2 + dr - db;
        else hue = 4 + dg - dr;

        hue = ((hue / 6) % 1) * 360;
        if (hue < 0) hue += 360;
      }

      // Classify Color into instrument categories
      let colorType = "rainbow";
      let colorHex = "#38bdf8";
      let colorName = "八音盒";

      if (l < 0.22) {
        // Deep black/dark outline
        colorType = "dark";
        colorHex = "#1e293b";
        colorName = "低音大提琴";
      } else if (hue < 20 || hue >= 340) {
        colorType = "red";
        colorHex = "#ef4444";
        colorName = "马林巴木琴";
      } else if (hue >= 20 && hue < 55) {
        colorType = "orange";
        colorHex = "#f97316";
        colorName = "清脆打击乐";
      } else if (hue >= 55 && hue < 90) {
        colorType = "yellow";
        colorHex = "#eab308";
        colorName = "金色钟琴";
      } else if (hue >= 90 && hue < 165) {
        colorType = "green";
        colorHex = "#22c55e";
        colorName = "风之长笛";
      } else if (hue >= 165 && hue < 210) {
        colorType = "cyan";
        colorHex = "#06b6d4";
        colorName = "空灵水晶";
      } else if (hue >= 210 && hue < 265) {
        colorType = "blue";
        colorHex = "#3b82f6";
        colorName = "童梦八音盒";
      } else {
        colorType = "purple";
        colorHex = "#a855f7";
        colorName = "唯美竖琴";
      }

      // Only trigger note when entering the colored stroke (or pulsing gently across thick areas)
      if (!this.bandStates[band] || this.section === 1 && now - (this.colorPulseAt?.[band] || 0) > 900) {
        this.colorPulseAt ||= {};
        this.colorPulseAt[band] = now;
        this.bandStates[band] = true;

        const normY = sampleY / h;
        const pan = (sampleX / this.canvasWidth) * 1.6 - 0.8; // stereo pan
        const velocity = Math.min(1.0, 0.4 + s * 0.5 + (1 - l) * 0.3);

        const hitEvent = {
          bandIndex: band,
          normY,
          colorType,
          colorHex,
          colorName,
          velocity,
          pan,
          x: sampleX,
          y: sampleY,
          section: this.section,
        };

        hitsThisFrame.push(hitEvent);

        // Spawn visual feedback: Expanding ripple ring & musical note sparkle
        this.spawnRipple(sampleX, sampleY, colorHex);
        this.spawnNoteParticle(sampleX, sampleY, colorHex);
      }
    }

    // Dispatch detected hits to audio engine & UI
    if (hitsThisFrame.length > 0 && typeof this.onNoteHit === "function") {
      hitsThisFrame.filter((_,i)=>i%Math.max(1,Math.ceil(hitsThisFrame.length/3))===0).slice(0,3).forEach((hit) => this.onNoteHit(hit));
      const first = hitsThisFrame[0];
      this.setHudText(`${first.colorName} · 音高已触发`, "🎶");
    }
  }

  spawnRipple(x, y, color) {
    this.ripples.push({
      x,
      y,
      radius: 4,
      maxRadius: 36,
      color,
      alpha: 0.9,
    });
  }

  spawnNoteParticle(x, y, color) {
    const chars = ["♪", "♫", "♬", "♩", "✦"];
    const char = chars[Math.floor(Math.random() * chars.length)];
    this.particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 2,
      vy: -2.5 - Math.random() * 2,
      char,
      color,
      alpha: 1.0,
      size: 20 + Math.random() * 10,
    });
  }

  /**
   * Render glowing laser scan line, ripple waves, and floating notes on animation canvas
   */
  renderRecordPlayer(now) {
    const c=this.animCtx;
    const dt=Math.min(.1,Math.max(0,(now-(this.recordLastTime??now))/1000));
    this.recordLastTime=now;
    this.recordAngle=(this.recordAngle??0)+(this.isPlaying?dt*Math.PI/20:0);
    const round=(x,y,w,h,r,fill)=>{c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=fill;c.fill();c.stroke();};
    c.lineWidth=3;c.strokeStyle='#35483c';
    const cx=355,cy=225,r=211;
    c.beginPath();c.arc(cx,cy,r+7,0,Math.PI*2);c.fillStyle='#536458';c.fill();c.stroke();
    c.save();c.translate(cx,cy);c.rotate(this.recordAngle);
    c.beginPath();c.arc(0,0,r,0,Math.PI*2);c.clip();
    // Display-only clipping/rotation: analysis still reads the original artwork.
    const recordSource=this.sourceMode==='camera-live'?this.doodleCanvas:this.recordArtwork??this.doodleCanvas;
    const bounds=this.currentPreset==='upload'&&this.sourceMode==='doodle'?this.recordImageBounds:null;
    if(bounds&&recordSource===this.recordArtwork) {
      const side=Math.min(bounds.width,bounds.height);
      c.drawImage(recordSource,bounds.x+(bounds.width-side)/2,bounds.y+(bounds.height-side)/2,side,side,-r,-r,r*2,r*2);
    } else c.drawImage(recordSource,-r*800/450,-r,r*2*800/450,r*2);
    c.strokeStyle='#fff9e9';c.globalAlpha=.28;c.lineWidth=1;
    for(let radius=60;radius<r;radius+=10) {c.beginPath();c.arc(0,0,radius,0,Math.PI*2);c.stroke();}
    c.restore();
    c.strokeStyle='#35483c';c.lineWidth=3;
    c.beginPath();c.arc(cx,cy,r,0,Math.PI*2);c.stroke();
    c.beginPath();c.arc(cx,cy,42,0,Math.PI*2);c.fillStyle='rgba(247,215,131,.4)';c.fill();c.stroke();
    c.beginPath();c.arc(cx,cy,6,0,Math.PI*2);c.fillStyle='#35483c';c.fill();
    // Tonearm traverses inward and outward on the existing A/B scan clock.
    const tipX=cx+r-15-this.scanPos*95,tipY=cy+65;
    c.lineCap='round';c.lineJoin='round';
    c.beginPath();c.moveTo(630,96);c.lineTo(610,175);c.lineTo(tipX,tipY);
    c.strokeStyle='#35483c';c.lineWidth=17;c.stroke();
    c.strokeStyle='#fffaf0';c.lineWidth=10;c.stroke();
    c.strokeStyle='#35483c';c.lineWidth=3;
    round(tipX-15,tipY-8,32,20,6,'#eeac81');
    c.beginPath();c.arc(630,96,24,0,Math.PI*2);c.fillStyle='#f7d783';c.fill();c.stroke();
    c.beginPath();c.arc(630,96,9,0,Math.PI*2);c.stroke();
  }

  renderOverlays(now) {
    const ctx = this.animCtx;
    const w = this.canvasWidth;
    const h = this.canvasHeight;

    ctx.clearRect(0, 0, w, h);
    if(!this.horizontalScan) {
      this.ripples.length=0;this.particles.length=0;
      this.renderRecordPlayer(now);
      return;
    }

    const scanX = this.scanPos * w;

    // 1. Draw Expanding Visual Ripples
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const r = this.ripples[i];
      r.radius += 1.8;
      r.alpha -= 0.045;

      if (r.alpha <= 0 || r.radius >= r.maxRadius) {
        this.ripples.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
      ctx.strokeStyle = r.color;
      ctx.globalAlpha = r.alpha;
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();
    }

    // 2. Draw Floating Musical Note Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 0.035;

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.font = `bold ${p.size}px sans-serif`;
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 10;
      ctx.fillText(p.char, p.x, p.y);
      ctx.restore();
    }

    // 3. Draw Camera Viewfinder Reticle & Guide Brackets if in camera-live mode
    if (this.sourceMode === "camera-live") {
      ctx.save();
      const pad = 28;
      const cornerLen = 32;

      // Viewfinder corner brackets (Tech / Futuristic optical frame)
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.shadowColor = "#0284c7";
      ctx.shadowBlur = 8;

      // Top-Left
      ctx.beginPath();
      ctx.moveTo(pad, pad + cornerLen);
      ctx.lineTo(pad, pad);
      ctx.lineTo(pad + cornerLen, pad);
      ctx.stroke();

      // Top-Right
      ctx.beginPath();
      ctx.moveTo(w - pad - cornerLen, pad);
      ctx.lineTo(w - pad, pad);
      ctx.lineTo(w - pad, pad + cornerLen);
      ctx.stroke();

      // Bottom-Left
      ctx.beginPath();
      ctx.moveTo(pad, h - pad - cornerLen);
      ctx.lineTo(pad, h - pad);
      ctx.lineTo(pad + cornerLen, h - pad);
      ctx.stroke();

      // Bottom-Right
      ctx.beginPath();
      ctx.moveTo(w - pad - cornerLen, h - pad);
      ctx.lineTo(w - pad, h - pad);
      ctx.lineTo(w - pad, h - pad - cornerLen);
      ctx.stroke();

      // Delicate rule-of-thirds grid
      ctx.strokeStyle = "rgba(56, 189, 248, 0.2)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.moveTo(w * 0.333, pad);
      ctx.lineTo(w * 0.333, h - pad);
      ctx.moveTo(w * 0.666, pad);
      ctx.lineTo(w * 0.666, h - pad);
      ctx.moveTo(pad, h * 0.333);
      ctx.lineTo(w - pad, h * 0.333);
      ctx.moveTo(pad, h * 0.666);
      ctx.lineTo(w - pad, h * 0.666);
      ctx.stroke();
      ctx.setLineDash([]);

      // Top Center Live Viewfinder Banner
      ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
      ctx.beginPath();
      ctx.roundRect(w * 0.5 - 130, 10, 260, 28, 14);
      ctx.fill();
      ctx.strokeStyle = "rgba(56, 189, 248, 0.5)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Blinking Live Red Dot
      const blink = Math.sin(now * 0.005) > 0;
      ctx.fillStyle = blink ? "#ef4444" : "#991b1b";
      ctx.beginPath();
      ctx.arc(w * 0.5 - 105, 24, 4.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = "bold 11px system-ui, sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText("📷 摄像头取景框 · 实时扫描谱曲", w * 0.5 - 92, 24);

      ctx.restore();
    }

    // 4. Draw The Glowing Vertical Scan Laser Line (Like initial frame / music reader)
    if (!this.isPlaying) return;
    ctx.save();

    // Laser trail glow behind line
    const grad = ctx.createLinearGradient(scanX - 16, 0, scanX + 16, 0);
    grad.addColorStop(0, "rgba(230, 233, 238, 0)");
    grad.addColorStop(0.5, "rgba(255, 255, 255, 0.42)");
    grad.addColorStop(1, "rgba(230, 233, 238, 0)");
    ctx.fillStyle = grad;
    ctx.fillRect(scanX - 16, 0, 32, h);

    // Core sharp laser line
    ctx.beginPath();
    ctx.moveTo(scanX, 0);
    ctx.lineTo(scanX, h);
    ctx.strokeStyle = "#e8ebef";
    ctx.lineWidth = 3;
    ctx.shadowColor = "#ffffff";
    ctx.shadowBlur = 12;
    ctx.stroke();

    // Inner bright white laser core
    ctx.beginPath();
    ctx.moveTo(scanX, 0);
    ctx.lineTo(scanX, h);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Top & Bottom Scanhead Indicator Badges
    ctx.fillStyle = "#e8ebef";
    ctx.beginPath();
    ctx.arc(scanX, 10, 8, 0, Math.PI * 2);
    ctx.arc(scanX, h - 10, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(scanX, 10, 3.5, 0, Math.PI * 2);
    ctx.arc(scanX, h - 10, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
