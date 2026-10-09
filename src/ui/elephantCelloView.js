/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export class ElephantCelloView {
  constructor(containerEl, overlayCanvas, options = {}) {
    this.container = containerEl;
    this.canvas = overlayCanvas;
    this.ctx = overlayCanvas.getContext("2d");

    // Bowing & conducting physics (0 to 1)
    this.bowPos = 0.5; // 0: left, 1: right
    this.targetBowPos = 0.5;
    this.bowSpeed = 0;
    this.direction = 1; // 1: push right, -1: pull left
    this.lastTriggerPulse = 0;
    this.onStroke = null;

    // Optional direct bitmap image mode (if user drops image file directly)
    this.customMouseImage = localStorage.getItem("custom_mouse_bg") || "";

    // Conductor baton trails & state
    this.conductorHand = null;
    this.batonTrail = [];

    // Musical floating particles & vibrations
    this.particles = [];
    this.stringVibration = 0;
    this.currentNotePitch = "F3";
    this.currentNoteIndex = 0;
    this.onResetSong = null;

    // High tolerance gesture stroke accumulator
    this.lastTriggerTime = 0;
    this.accumulatedMotion = 0;
    this.lastRawPos = 0.5;
    this.minStrokeIntervalMs = 240; // High tolerance: prevent stutter / accidental double-trigger
    this.minMotionThreshold = 0.045; // Must have clear deliberate stroke motion

    // Setup interactive overlay
    this.initViewDom();
  }

  initViewDom() {
    let stageEl = document.querySelector("#elephantCelloStage");
    if (!stageEl) {
      stageEl = document.createElement("div");
      stageEl.id = "elephantCelloStage";
      stageEl.className = "elephant-cello-stage mouse-stage";
      stageEl.innerHTML = `
        <!-- Pure Clean Backdrop -->
        <div class="mouse-backdrop">
          <!-- Subtle Floating Musical Notes around the mouse -->
          <div class="mouse-sparkles">
            <span class="m-note mn1">♪</span>
            <span class="m-note mn2">♫</span>
            <span class="m-note mn3">♩</span>
            <span class="m-note mn4">♬</span>
          </div>
        </div>

        <!-- The Elegant Musical Robot Playing Classical Cello (Solid Color Block Vector Art) -->
        <div class="mouse-character-wrap">
          <svg class="mouse-svg" viewBox="0 0 850 960" preserveAspectRatio="xMidYMid meet">
            <defs>
              <!-- Ambient soft drop shadow for grounding -->
              <filter id="solidFloorShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="12" />
                <feColorMatrix type="matrix" values="0 0 0 0 0.09  0 0 0 0 0.15  0 0 0 0 0.24  0 0 0 0 0.15 0" />
                <feBlend in="SourceGraphic" in2="blurOut" mode="normal" />
              </filter>
              <!-- Cello Soundboard Sunburst Gradient for Solid Wood Depth -->
              <radialGradient id="celloWoodSunburst" cx="50%" cy="58%" r="60%">
                <stop offset="0%" stop-color="#f59e0b" />
                <stop offset="45%" stop-color="#d97706" />
                <stop offset="85%" stop-color="#b45309" />
                <stop offset="100%" stop-color="#78350f" />
              </radialGradient>
              <linearGradient id="celloSideRibGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#581c0c" />
                <stop offset="100%" stop-color="#3d1308" />
              </linearGradient>
              <linearGradient id="robotWhiteShellGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#ffffff" />
                <stop offset="75%" stop-color="#ffffff" />
                <stop offset="100%" stop-color="#f8fafc" />
              </linearGradient>
            </defs>

            <!-- ==============================================
                 1. SOFT GROUND SHADOW (SOLID SHADOW BLOCKS)
                 ============================================== -->
            <g id="mouseStageFloor">
              <!-- Concentric solid tone shadow planes tinted with light blue ambient -->
              <ellipse cx="420" cy="915" rx="300" ry="22" fill="#94a3b8" opacity="0.28" />
              <ellipse cx="420" cy="915" rx="210" ry="15" fill="#64748b" opacity="0.22" />
              <ellipse cx="430" cy="918" rx="80" ry="9" fill="#475569" opacity="0.2" />
              <!-- Direct shadow under right-tilted cello endpin at (372, 915) -->
              <ellipse cx="372" cy="918" rx="16" ry="5" fill="#334155" opacity="0.65" />
            </g>

            <!-- ==============================================
                 2. ROBOT'S CONCERT STOOL / SEAT (SOLID BLOCKS)
                 ============================================== -->
            <g id="mouseChair">
              <!-- Stool Base Plate -->
              <ellipse cx="370" cy="760" rx="60" ry="16" fill="#334155" />
              <ellipse cx="370" cy="758" rx="45" ry="11" fill="#475569" />
              <!-- Stool Chrome Pedestal Cylinder -->
              <rect x="362" y="560" width="16" height="200" rx="5" fill="#64748b" />
              <rect x="368" y="560" width="6" height="200" fill="#94a3b8" />
              <!-- Hydraulic Collar Ring -->
              <rect x="357" y="650" width="26" height="12" rx="4" fill="#1e293b" />
              <!-- Padded Seat Cushion (Dark Slate & Charcoal Solid Blocks) -->
              <ellipse cx="370" cy="565" rx="75" ry="20" fill="#1e293b" />
              <ellipse cx="370" cy="558" rx="72" ry="18" fill="#334155" />
              <ellipse cx="370" cy="554" rx="58" ry="12" fill="#475569" opacity="0.7" />
            </g>

            <!-- ==============================================
                 3. ROBOT'S LEGS & FEET (SOLID COLOR BLOCKS)
                 ============================================== -->
            <g id="robotLegsAndFeet">
              <!-- LEFT LEG (Viewer's Left, Seated Pose) -->
              <g id="robotLeftLeg">
                <!-- Thigh Cylinder (Pure Brilliant White & Crisp Soft Ice-Blue Shadow) -->
                <path d="M 285,530 L 260,670 L 315,670 L 325,530 Z" fill="#ffffff" />
                <path d="M 260,670 L 285,670 L 295,530 L 285,530 Z" fill="#cbe4f7" />
                <!-- Knee Joint Sphere (Solid Titanium Graphite) -->
                <circle cx="285" cy="675" r="18" fill="#334155" />
                <circle cx="285" cy="675" r="11" fill="#64748b" />
                <circle cx="282" cy="672" r="4" fill="#94a3b8" />
                <!-- Shin Cylinder -->
                <path d="M 268,685 L 245,850 L 305,850 L 305,685 Z" fill="#ffffff" />
                <path d="M 245,850 L 270,850 L 278,685 L 268,685 Z" fill="#cbe4f7" />
                <!-- Ankle Pivot Block -->
                <rect x="245" y="842" width="60" height="14" rx="7" fill="#334155" />
                <!-- Boot Foot (Chunky Modern Rounded Pure White Block) -->
                <path d="M 235,852 C 205,852 188,875 188,900 C 188,920 228,924 308,924 C 330,924 330,892 305,852 Z" fill="#ffffff" />
                <path d="M 188,895 C 188,918 228,924 308,924 C 322,924 326,905 315,892 C 265,905 210,898 188,895 Z" fill="#e0f0fc" />
                <!-- Dark Rubber Sole Block -->
                <path d="M 188,912 C 220,928 290,928 326,916 L 326,926 C 290,936 220,936 188,920 Z" fill="#1e293b" />
              </g>

              <!-- RIGHT LEG (Viewer's Right, Positioned Behind Cello) -->
              <g id="robotRightLeg">
                <!-- Thigh Cylinder -->
                <path d="M 435,510 L 490,650 L 540,635 L 475,500 Z" fill="#d8ecfa" />
                <!-- Knee Joint Sphere -->
                <circle cx="512" cy="642" r="18" fill="#334155" />
                <circle cx="512" cy="642" r="11" fill="#64748b" />
                <!-- Shin Cylinder -->
                <path d="M 498,655 L 558,835 L 615,820 L 530,645 Z" fill="#ffffff" />
                <!-- Ankle Pivot Block -->
                <rect x="548" y="822" width="65" height="14" rx="7" transform="rotate(-14 580 829)" fill="#334155" />
                <!-- Boot Foot -->
                <path d="M 552,830 C 532,835 522,865 532,895 C 542,918 612,925 668,915 C 692,908 692,868 652,830 Z" fill="#ffffff" />
                <!-- Dark Rubber Sole Block -->
                <path d="M 534,904 C 582,926 642,926 684,904 L 684,916 C 642,936 582,936 534,916 Z" fill="#1e293b" />
              </g>
            </g>

            <!-- ==============================================
                 4. ROBOT TORSO & SHOULDERS (SOLID COLOR BLOCKS)
                 ============================================== -->
            <g id="mouseBodyGroup">
              <!-- Pelvis Base Block -->
              <path d="M 315,510 C 310,560 435,560 440,510 Z" fill="#334155" />
              <ellipse cx="378" cy="542" rx="42" ry="12" fill="#1e293b" />

              <!-- Main Torso Armor Shell (Pure Brilliant White Curved Block) -->
              <path d="M 290,380 C 265,455 285,535 350,540 C 420,545 460,475 455,380 C 455,350 410,335 375,335 C 335,335 295,350 290,380 Z" 
                    fill="#ffffff" />
              
              <!-- Torso Volume Shadow Block (Soft Ice-Blue Tone) -->
              <path d="M 290,380 C 265,455 285,535 350,540 C 320,530 305,470 310,390 C 310,370 320,350 330,340 C 310,350 295,365 290,380 Z" 
                    fill="#cbe4f7" />
              
              <!-- Torso Specular Highlight Block (Right Chest Tone) -->
              <path d="M 380,350 C 425,350 442,390 438,440 C 448,390 430,355 385,345 Z" fill="#ffffff" />

              <!-- Chest Music Reactor Core (Solid Glowing Cyan Rings) -->
              <circle cx="370" cy="425" r="24" fill="#1e293b" />
              <circle cx="370" cy="425" r="18" fill="#0284c7" />
              <circle cx="370" cy="425" r="13" fill="#00f0ff" />
              <circle cx="370" cy="425" r="7" fill="#38bdf8" />
              <circle cx="367" cy="422" r="3" fill="#ffffff" />

              <!-- Concert Maestro Golden Bow Tie (Solid Gold Geometric Blocks) -->
              <g id="robotBowTie">
                <!-- Left Wing -->
                <polygon points="344,342 344,364 366,353" fill="#f59e0b" />
                <polygon points="344,353 344,364 366,353" fill="#d97706" />
                <!-- Right Wing -->
                <polygon points="396,342 396,364 374,353" fill="#f59e0b" />
                <polygon points="396,353 396,364 374,353" fill="#d97706" />
                <!-- Center Knot -->
                <rect x="364" y="347" width="12" height="12" rx="3" fill="#b45309" />
                <rect x="366" y="348" width="8" height="6" rx="2" fill="#fbbf24" />
              </g>

              <!-- Neck Collar Joint Block -->
              <rect x="340" y="322" width="60" height="20" rx="8" fill="#334155" />
              <rect x="348" y="324" width="44" height="6" rx="3" fill="#64748b" />

              <!-- Left Shoulder Joint Sphere (Viewer's Right) -->
              <circle cx="445" cy="380" r="20" fill="#334155" />
              <circle cx="445" cy="380" r="13" fill="#64748b" />
              <!-- Right Shoulder Joint Sphere (Viewer's Left, Arm Anchor at 280, 405) -->
              <circle cx="280" cy="405" r="20" fill="#334155" />
              <circle cx="280" cy="405" r="13" fill="#64748b" />
            </g>

            <!-- ==============================================
                 5. ROBOT HEAD & ADORABLE VISOR (ANIMATED NOD)
                 ============================================== -->
            <g id="mouseHeadAnimated" style="transform-origin: 350px 315px;">
              <!-- Dual Antennas with Glowing Sphere Tips (Solid Blocks) -->
              <!-- Left Antenna -->
              <g id="robotAntennaLeft">
                <rect x="245" y="105" width="8" height="65" rx="4" transform="rotate(-30 249 137)" fill="#334155" />
                <circle cx="218" cy="95" r="15" fill="#0284c7" />
                <circle cx="218" cy="95" r="11" fill="#00f0ff" />
                <circle cx="215" cy="92" r="4" fill="#ffffff" />
              </g>
              <!-- Right Antenna -->
              <g id="robotAntennaRight">
                <rect x="390" y="85" width="8" height="70" rx="4" transform="rotate(18 394 120)" fill="#334155" />
                <circle cx="418" cy="75" r="15" fill="#0284c7" />
                <circle cx="418" cy="75" r="11" fill="#00f0ff" />
                <circle cx="415" cy="72" r="4" fill="#ffffff" />
              </g>

              <!-- Left Ear Pod Block -->
              <g id="robotEarLeft" transform="rotate(-8 226 235)">
                <rect x="216" y="205" width="20" height="60" rx="10" fill="#1e293b" />
                <rect x="220" y="215" width="8" height="40" rx="4" fill="#00f0ff" />
              </g>
              <!-- Right Ear Pod Block -->
              <g id="robotEarRight" transform="rotate(12 474 215)">
                <rect x="464" y="185" width="20" height="60" rx="10" fill="#1e293b" />
                <rect x="472" y="195" width="8" height="40" rx="4" fill="#00f0ff" />
              </g>

              <!-- Rounded Robot Head Housing (Tilted 9deg) -->
              <g transform="rotate(9 350 220)">
                <!-- Outer Head Shell (Pure Brilliant White Block) -->
                <rect x="236" y="115" width="230" height="195" rx="52" fill="#ffffff" />
                <!-- Head Volume Shadow Block (Soft Ice-Blue Plane) -->
                <path d="M 236,167 C 236,138 259,115 288,115 L 295,115 L 295,310 L 288,310 C 259,310 236,287 236,258 Z" fill="#cbe4f7" />
                <!-- Head Specular Highlight Block (Top Crown) -->
                <rect x="280" y="123" width="145" height="12" rx="6" fill="#ffffff" />

                <!-- Obsidian Dark Visor Screen (Solid Deep Pure Jet-Black Screen for Max Contrast) -->
                <rect x="254" y="145" width="194" height="140" rx="34" fill="#090d16" />
                <!-- Visor Glass Facet Reflection -->
                <path d="M 268,155 L 434,155 C 442,155 444,160 440,168 L 405,208 L 268,208 Z" fill="#1e293b" opacity="0.6" />

                <!-- Big Expressive Glowing Neon Eyes (Solid Vibrant Sky Blue) -->
                <!-- LEFT EYE -->
                <g id="robotEyeLeft">
                  <ellipse cx="308" cy="208" rx="24" ry="28" fill="#0284c7" />
                  <ellipse cx="308" cy="208" rx="19" ry="23" fill="#00f0ff" />
                  <!-- Catchlights -->
                  <circle cx="302" cy="198" r="8" fill="#ffffff" />
                  <circle cx="314" cy="216" r="4" fill="#ffffff" />
                  <!-- Cute Upper Brow -->
                  <rect x="290" y="168" width="34" height="5" rx="2.5" transform="rotate(-8 307 170)" fill="#00f0ff" />
                </g>

                <!-- RIGHT EYE -->
                <g id="robotEyeRight">
                  <ellipse cx="394" cy="200" rx="24" ry="28" fill="#0284c7" />
                  <ellipse cx="394" cy="200" rx="19" ry="23" fill="#00f0ff" />
                  <!-- Catchlights -->
                  <circle cx="388" cy="190" r="8" fill="#ffffff" />
                  <circle cx="400" cy="208" r="4" fill="#ffffff" />
                  <!-- Cute Upper Brow -->
                  <rect x="376" y="160" width="34" height="5" rx="2.5" transform="rotate(8 393 162)" fill="#00f0ff" />
                </g>

                <!-- Cheerful Glowing Smile Arc -->
                <path d="M 338,245 Q 352,260 366,245" fill="none" stroke="#00f0ff" stroke-width="5" stroke-linecap="round" />

                <!-- Cute Rosy Cheek Indicator Blushes -->
                <ellipse cx="275" cy="232" rx="11" ry="6" fill="#f43f5e" opacity="0.8" />
                <ellipse cx="425" cy="224" rx="11" ry="6" fill="#f43f5e" opacity="0.8" />
              </g>
            </g>

            <!-- ==============================================
                 6. THE AUTHENTIC CLASSICAL CELLO (ELEGANT SOLID WOOD BLOCKS)
                 ============================================== -->
            <!-- Classical Playing Angle Tilted Gracefully to the Right (+12 degrees around 425, 640) to keep robot head clear -->
            <g id="mouseCelloGroup" transform="rotate(12 425 640)">
              <!-- Cello Endpin (Solid Polished Steel Rod extending to floor) -->
              <rect x="427" y="776" width="6" height="142" rx="3" fill="#cbd5e1" />
              <rect x="430" y="776" width="2" height="142" fill="#f8fafc" />
              <!-- Black Rubber Floor Stopper Block -->
              <ellipse cx="430" cy="918" rx="9" ry="6" fill="#0f172a" />
              <!-- Solid Brass Collar Tightener Clamp -->
              <rect x="423" y="774" width="14" height="10" rx="3" fill="#d97706" />

              <!-- Cello Side Rib / Shadow Block (Gives Authentic 3D Wood Depth) -->
              <path d="M 430,358
                       C 462,358  546,380  546,436
                       C 546,456  540,463  548,469
                       C 536,480  510,502  510,514
                       C 510,527  524,547  532,557
                       C 541,570  582,612  582,678
                       C 582,740  516,786  430,786
                       C 344,786  278,740  278,678
                       C 278,612  319,570  328,557
                       C 336,547  350,527  350,514
                       C 350,502  324,480  312,469
                       C 320,463  314,456  314,436
                       C 314,380  398,358  430,358 Z"
                    fill="url(#celloSideRibGrad)" />

              <!-- Cello Soundboard Body Plate (Pure Authentic Classical Form: Upper Bout, C-Bouts, Lower Bout) -->
              <path id="celloMainBody" d="M 430,360
                       C 460,360  540,380  540,435
                       C 540,455  535,462  542,468
                       C 530,478  504,500  504,512
                       C 504,525  518,545  526,555
                       C 535,568  575,610  575,675
                       C 575,735  510,780  430,780
                       C 350,780  285,735  285,675
                       C 285,610  325,568  334,555
                       C 342,545  356,525  356,512
                       C 356,500  330,478  318,468
                       C 325,462  320,455  320,435
                       C 320,380  400,360  430,360 Z"
                    fill="url(#celloWoodSunburst)" />

              <!-- Classical Soundboard Purfling Line (Delicate Inlay Contour) -->
              <path d="M 430,368
                       C 456,368  532,386  532,434
                       C 532,451  527,457  533,462
                       C 521,472  498,494  498,512
                       C 498,524  510,540  517,549
                       C 525,561  565,602  565,672
                       C 565,727  504,772  430,772
                       C 356,772  295,727  295,672
                       C 295,602  335,561  343,549
                       C 350,540  362,524  362,512
                       C 362,494  339,472  327,462
                       C 333,457  328,451  328,434
                       C 328,386  404,368  430,368 Z"
                    fill="none" stroke="#78350f" stroke-width="2.5" />

              <!-- Golden Flamed Maple Center Resonance Block (Warm Radial Glow) -->
              <ellipse cx="430" cy="580" rx="55" ry="120" fill="#fbbf24" opacity="0.45" />
              <ellipse cx="430" cy="580" rx="30" ry="80" fill="#fef08a" opacity="0.3" />

              <!-- Authentic Classical Calligraphy F-Holes (Deep Ebony Solid Blocks) -->
              <g id="celloFHoles" fill="#18181b">
                <!-- Left F-Hole -->
                <circle cx="388" cy="516" r="6" />
                <path d="M 388,516 C 378,534 394,564 384,582 C 379,587 372,584 374,592 C 386,612 376,634 388,646 L 388,648" 
                      fill="none" stroke="#18181b" stroke-width="7" stroke-linecap="round" />
                <polygon points="378,582 386,585 382,590" fill="#18181b" />
                <circle cx="388" cy="646" r="7" />

                <!-- Right F-Hole -->
                <circle cx="472" cy="516" r="6" />
                <path d="M 472,516 C 482,534 466,564 476,582 C 481,587 488,584 486,592 C 474,612 484,634 472,646 L 472,648" 
                      fill="none" stroke="#18181b" stroke-width="7" stroke-linecap="round" />
                <polygon points="482,582 474,585 478,590" fill="#18181b" />
                <circle cx="472" cy="646" r="7" />
              </g>

              <!-- French Maple Cello Bridge (Authentic Classical Arched Bridge Block) -->
              <g id="celloBridge">
                <!-- Bridge Body in Warm Solid Maple -->
                <path d="M 408,584 Q 430,574 452,584 L 456,602 Q 430,596 404,602 Z" fill="#fde68a" />
                <path d="M 408,584 Q 430,574 452,584 L 452,587 Q 430,577 408,587 Z" fill="#fef9c3" />
                <!-- Bridge Feet -->
                <rect x="406" y="602" width="13" height="8" rx="2" fill="#fde68a" />
                <rect x="441" y="602" width="13" height="8" rx="2" fill="#fde68a" />
                <!-- Classical Heart/Kidney Cutout in Bridge Face -->
                <circle cx="430" cy="587" r="3.5" fill="#b45309" />
                <ellipse cx="422" cy="593" rx="2.5" ry="3.5" fill="#b45309" />
                <ellipse cx="438" cy="593" rx="2.5" ry="3.5" fill="#b45309" />
              </g>

              <!-- Ebony Fingerboard & Neck (Solid Jet Black Block with Solid Specular Facet) -->
              <polygon points="418,210 442,210 448,565 412,565" fill="#18181b" />
              <polygon points="423,210 430,210 424,565 417,565" fill="#334155" opacity="0.6" />

              <!-- Sculpted Wooden Pegbox & Volute Scroll (Solid Warm Mahogany Blocks) -->
              <rect x="419" y="142" width="22" height="70" rx="4" fill="#78350f" />
              <rect x="424" y="144" width="12" height="66" fill="#92400e" />
              <!-- Volute Scroll Spiral Block -->
              <path d="M 430,146 C 414,130 416,98 442,100 C 458,104 458,122 446,128 C 432,132 428,118 436,116" 
                    fill="none" stroke="#92400e" stroke-width="16" stroke-linecap="round" />
              <path d="M 430,146 C 414,130 416,98 442,100 C 458,104 458,122 446,128 C 432,132 428,118 436,116" 
                    fill="none" stroke="#d97706" stroke-width="6" stroke-linecap="round" />

              <!-- 4 Classical Ebony Tuning Pegs (Solid Blocks with Brass Collars) -->
              <!-- Left Pegs -->
              <rect x="394" y="157" width="26" height="6" rx="3" fill="#18181b" />
              <circle cx="392" cy="160" r="7" fill="#18181b" />
              <circle cx="392" cy="160" r="3" fill="#d97706" />

              <rect x="394" y="186" width="26" height="6" rx="3" fill="#18181b" />
              <circle cx="392" cy="189" r="7" fill="#18181b" />
              <circle cx="392" cy="189" r="3" fill="#d97706" />

              <!-- Right Pegs -->
              <rect x="440" y="169" width="26" height="6" rx="3" fill="#18181b" />
              <circle cx="468" cy="172" r="7" fill="#18181b" />
              <circle cx="468" cy="172" r="3" fill="#d97706" />

              <rect x="440" y="198" width="26" height="6" rx="3" fill="#18181b" />
              <circle cx="468" cy="201" r="7" fill="#18181b" />
              <circle cx="468" cy="201" r="3" fill="#d97706" />

              <!-- Ebony Tailpiece (Solid Tapered Block with 4 Golden Fine Tuners) -->
              <polygon points="418,620 442,620 435,745 425,745" fill="#18181b" />
              <polygon points="421,620 427,620 428,745 425,745" fill="#334155" opacity="0.6" />
              <!-- 4 Golden Fine Tuners -->
              <circle cx="422" cy="625" r="2.5" fill="#f59e0b" />
              <circle cx="428" cy="624" r="2.5" fill="#f59e0b" />
              <circle cx="433" cy="624" r="2.5" fill="#f59e0b" />
              <circle cx="439" cy="625" r="2.5" fill="#f59e0b" />
              <!-- Tailgut Wire to Endpin -->
              <rect x="428" y="745" width="4" height="32" rx="2" fill="#0f172a" />

              <!-- 4 Silver Cello Strings (Authentically Spaced & Scaled) -->
              <!-- C String (Thickest) -->
              <line id="mString0" x1="422" y1="210" x2="422" y2="625" stroke="#ffffff" stroke-width="3.2" stroke-linecap="round" />
              <!-- G String -->
              <line id="mString1" x1="427" y1="210" x2="428" y2="624" stroke="#ffffff" stroke-width="2.6" stroke-linecap="round" />
              <!-- D String -->
              <line id="mString2" x1="433" y1="210" x2="433" y2="624" stroke="#ffffff" stroke-width="2.1" stroke-linecap="round" />
              <!-- A String (Thinnest) -->
              <line id="mString3" x1="438" y1="210" x2="439" y2="625" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round" />
            </g>

            <!-- ==============================================
                 7. ROBOT'S LEFT HAND HOLDING CELLO NECK (SOLID BLOCKS)
                 ============================================== -->
            <g id="mouseLeftFingeringArm">
              <!-- Upper Arm Segment (Pure Brilliant White Block reaching out to right-tilted neck) -->
              <path d="M 445,380 Q 525,380 568,335" fill="none" stroke="#ffffff" stroke-width="22" stroke-linecap="round" />
              <!-- Elbow Pivot Ball Joint -->
              <circle cx="568" cy="335" r="16" fill="#334155" />
              <circle cx="568" cy="335" r="10" fill="#64748b" />
              <!-- Forearm Reaching to Cello Neck -->
              <line x1="568" y1="335" x2="520" y2="260" stroke="#ffffff" stroke-width="18" stroke-linecap="round" />
              <!-- Solid Robotic 4-Finger Hand Gripping Fingerboard Neck (Tilted +12deg with neck) -->
              <g id="robotLeftHandFingers" transform="translate(495, 238) rotate(12 24 20)">
                <ellipse cx="24" cy="20" rx="13" ry="16" fill="#ffffff" />
                <!-- 4 Clenched Fingers Wrapped Around Fingerboard -->
                <rect x="0" y="6" width="25" height="7.5" rx="3.75" fill="#ffffff" />
                <rect x="2" y="15" width="25" height="7.5" rx="3.75" fill="#ffffff" />
                <rect x="4" y="24" width="23" height="7.5" rx="3.75" fill="#ffffff" />
                <rect x="6" y="33" width="21" height="7.5" rx="3.75" fill="#e0f0fc" />
              </g>
            </g>

            <!-- ==============================================
                 8. ROBOT'S RIGHT ARM & CELLO BOW (BOWING INTERACTION)
                 ============================================== -->
            <g id="mouseRightArmAndBow">
              <!-- Subtle Solid Arm Shadow Layer Behind Dynamic Arm (Soft Ice-Blue Shadow) -->
              <path id="mouseBowingArmOutline" d="M 280,405 Q 260,470 295,510" 
                    fill="none" stroke="#9ec7ea" stroke-width="28" stroke-linecap="round" />
              <!-- Smooth Articulated Robotic Bowing Arm (Pure Brilliant White Block) -->
              <path id="mouseBowingArm" d="M 280,405 Q 260,470 295,510" 
                    fill="none" stroke="#ffffff" stroke-width="22" stroke-linecap="round" />

              <!-- Bowing Hand & Horizontal Cello Bow Group (Slides horizontally with gestures) -->
              <g id="bowAndHandGroup">
                <!-- Wrist Joint Pivot -->
                <circle cx="295" cy="510" r="15" fill="#334155" />
                <circle cx="295" cy="510" r="9" fill="#64748b" />

                <!-- Solid Robotic Hand Holding the Bow Frog (Curled Fingers) -->
                <g transform="translate(272, 488)">
                  <!-- Palm Base Block -->
                  <ellipse cx="26" cy="24" rx="15" ry="13" fill="#ffffff" />
                  <!-- Thumb Gripping from Above -->
                  <path d="M 20,12 C 26,12 34,18 32,25 C 28,25 20,21 20,12 Z" fill="#ffffff" />
                  <!-- 3 Curved Fingers Wrapping Bow Frog from Below -->
                  <rect x="20" y="24" width="23" height="6.5" rx="3.25" fill="#ffffff" />
                  <rect x="20" y="32" width="21" height="6.5" rx="3.25" fill="#ffffff" />
                  <rect x="22" y="40" width="19" height="6.5" rx="3.25" fill="#e0f0fc" />
                </g>

                <!-- Straight Horizontal Wooden Cello Bow Across Strings (Solid Tone Blocks) -->
                <!-- Wooden Bow Stick (Warm Polished Pernambuco Wood) -->
                <line x1="175" y1="500" x2="725" y2="528" stroke="#78350f" stroke-width="6.5" stroke-linecap="round" />
                <line x1="175" y1="499" x2="725" y2="527" stroke="#b45309" stroke-width="3.5" stroke-linecap="round" />
                
                <!-- Pure White Horsehair Ribbon Running Parallel -->
                <line x1="185" y1="508" x2="715" y2="536" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" />
                
                <!-- Bow Frog (Ebony Block with Silver Eye) -->
                <rect x="190" y="497" width="28" height="15" rx="3" fill="#18181b" />
                <circle cx="200" cy="505" r="3.5" fill="#38bdf8" />
                <!-- Silver Tension Screw at Tip of Frog -->
                <rect x="182" y="501" width="8" height="7" rx="2" fill="#e2e8f0" />
                <!-- Ivory Bow Tip Plate (Right End) -->
                <polygon points="715,528 725,529 719,538" fill="#f8fafc" />
              </g>
            </g>
          </svg>
        </div>

        <input type="file" id="mouseImageFileInput" accept="image/*" style="display:none;" />
      `;

      this.container.prepend(stageEl);
      this.stageEl = stageEl;
      this.bindDragEvents();
    }
  }

  bindDragEvents() {
    let isDragging = false;
    let startX = 0;

    const conductTestBtn = document.querySelector("#btnConductTest");
    if (conductTestBtn) {
      conductTestBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.triggerStroke(0.9, this.direction === 1 ? -1 : 1);
      });
    }

    const resetMelodyBtn = document.querySelector("#btnResetMelody");
    if (resetMelodyBtn) {
      resetMelodyBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.currentNoteIndex = 0;
        if (typeof this.onResetSong === "function") {
          this.onResetSong();
        }
        this.renderMelodyTrack(0);
        const pitchEl = document.querySelector("#hudCurrentPitch");
        if (pitchEl) pitchEl.textContent = "1 (F3) · 第 1/42 音";
      });
    }

    const startCameraBtn = document.querySelector("#btnStartCameraDirect");
    if (startCameraBtn) {
      startCameraBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        startCameraBtn.textContent = "⌛ 正在启动镜头与手势...";
        if (typeof this.onStartCameraRequest === "function") {
          this.onStartCameraRequest();
        }
        const topStartBtn = document.querySelector("#startButton");
        if (topStartBtn && topStartBtn.textContent !== "运行中") {
          topStartBtn.click();
        }
      });
    }

    const onPointerDown = (e) => {
      if (document.body.dataset.playMode !== "interactive" || document.body.dataset.dancePaused === "true") return;
      if (this.container.classList.contains("is-sampling") || document.querySelector("#roiButton")?.classList.contains("is-active")) return;
      if (e.target.closest("button") || e.target.closest("select") || e.target.closest("input")) return;
      isDragging = true;
      startX = e.clientX;
      const rect = this.stageEl.getBoundingClientRect();
      const normX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      this.updateBowPosition(normX, 0.7);
    };

    const onPointerMove = (e) => {
      if (!isDragging) return;
      const rect = this.stageEl.getBoundingClientRect();
      const normX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const deltaX = Math.abs(e.clientX - startX);
      const speed = Math.min(1.0, deltaX / 16);
      startX = e.clientX;
      this.updateBowPosition(normX, speed);
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    this.container.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);

    // Support dropping or selecting the user's exact PNG image file directly
    const uploadBtn = document.querySelector("#btnUploadMousePic");
    const fileInput = document.querySelector("#mouseImageFileInput");
    if (uploadBtn && fileInput) {
      uploadBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        fileInput.click();
      });

      fileInput.addEventListener("change", (e) => {
        const file = e.target.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const dataUrl = event.target?.result;
            if (typeof dataUrl === "string") {
              this.applyCustomImage(dataUrl);
            }
          };
          reader.readAsDataURL(file);
        }
      });
    }

    // Direct drag and drop file into window
    this.stageEl.addEventListener("dragover", (e) => {
      e.preventDefault();
      this.stageEl.classList.add("drag-over");
    });
    this.stageEl.addEventListener("dragleave", (e) => {
      e.preventDefault();
      this.stageEl.classList.remove("drag-over");
    });
    this.stageEl.addEventListener("drop", (e) => {
      e.preventDefault();
      this.stageEl.classList.remove("drag-over");
      const file = e.dataTransfer?.files?.[0];
      if (file && file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target?.result;
          if (typeof dataUrl === "string") {
            this.applyCustomImage(dataUrl);
          }
        };
        reader.readAsDataURL(file);
      }
    });

    if (this.customMouseImage) {
      this.applyCustomImage(this.customMouseImage, false);
    }

    this.renderMelodyTrack(0);
  }

  applyCustomImage(dataUrl, save = true) {
    this.customMouseImage = dataUrl;
    if (save) {
      try {
        localStorage.setItem("custom_mouse_bg", dataUrl);
      } catch {}
    }
    let imgEl = document.querySelector("#userMouseExactImg");
    if (!imgEl) {
      imgEl = document.createElement("img");
      imgEl.id = "userMouseExactImg";
      imgEl.className = "user-mouse-exact-img";
      const wrap = document.querySelector(".mouse-character-wrap");
      if (wrap) {
        wrap.prepend(imgEl);
      }
    }
    if (imgEl) {
      imgEl.src = dataUrl;
      imgEl.style.display = "block";
    }
    const svgEl = document.querySelector(".mouse-svg");
    if (svgEl) {
      // Keep only the animated arm and bow on top of the exact image
      svgEl.classList.add("is-overlay-mode");
    }
    const uploadBtn = document.querySelector("#btnUploadMousePic");
    if (uploadBtn) {
      uploadBtn.textContent = "✅ 已载入PNG原图";
    }
  }

  /**
   * Trigger single note stroke: moves mouse arm & bow to new pose and triggers audio
   */
  triggerStroke(speed = 0.85, dir = 1) {
    this.direction = dir;
    this.lastTriggerPulse = performance.now();

    // Alternate bow target position: dir > 0 moves fully out (down-bow), dir < 0 moves fully in (up-bow)
    this.targetBowPos = dir > 0 ? 0.95 : 0.05;

    if (typeof this.onStroke === "function") {
      this.onStroke({
        direction: this.direction,
        speed: Math.max(0.5, speed),
        time: performance.now(),
      });
    }
  }

  /**
   * Update bow position from mouse drag or hand gesture
   * Uses high-tolerance debouncing and intentional stroke movement
   * @param {number} normX - 0 to 1
   * @param {number} speed - 0 to 1
   */
  updateBowPosition(normX, speed = 0.5) {
    const now = performance.now();
    this.targetBowPos = Math.max(0.02, Math.min(0.98, normX));

    const dx = this.targetBowPos - this.lastRawPos;
    this.lastRawPos = this.targetBowPos;

    let strokeTriggered = null;

    // Accumulate motion in current direction
    if (Math.abs(dx) > 0.003) {
      const stepDir = dx > 0 ? 1 : -1;
      if (stepDir === this.direction) {
        this.accumulatedMotion += Math.abs(dx);
      } else {
        // Direction flipped!
        const timePassed = now - this.lastTriggerTime > this.minStrokeIntervalMs;
        if (timePassed && this.accumulatedMotion > this.minMotionThreshold) {
          this.direction = stepDir;
          this.lastTriggerTime = now;
          this.accumulatedMotion = 0;

          strokeTriggered = {
            direction: this.direction,
            speed: Math.max(0.6, speed),
            time: now,
          };
          if (typeof this.onStroke === "function") {
            this.onStroke(strokeTriggered);
          }
        } else if (timePassed && Math.abs(dx) > 0.035) {
          // Significant direct reversal
          this.direction = stepDir;
          this.lastTriggerTime = now;
          this.accumulatedMotion = 0;

          strokeTriggered = {
            direction: this.direction,
            speed: Math.max(0.6, speed),
            time: now,
          };
          if (typeof this.onStroke === "function") {
            this.onStroke(strokeTriggered);
          }
        }
      }
    }

    return strokeTriggered;
  }

  updateRunway(song, noteIndex = 0) {
    this.currentNoteIndex = noteIndex;
    this.renderMelodyTrack(noteIndex);
  }

  /**
   * Render the note sequence with active note highlight
   */
  renderMelodyTrack(currentIndex = 0) {
    const trackEl = document.querySelector("#melodyNotesTrack");
    if (!trackEl) return;

    // Classic Twinkle Twinkle 42 notes
    const songNotes = [
      "1","1","5","5","6","6","5",
      "4","4","3","3","2","2","1",
      "5","5","4","4","3","3","2",
      "5","5","4","4","3","3","2",
      "1","1","5","5","6","6","5",
      "4","4","3","3","2","2","1"
    ];

    trackEl.innerHTML = songNotes.map((note, idx) => {
      let cls = "melody-pill";
      if (idx === currentIndex) cls += " is-current";
      else if (idx < currentIndex) cls += " is-done";
      return `<span class="${cls}" data-index="${idx}">${note}</span>`;
    }).join("");

    // Auto-scroll active pill into view smoothly
    const activePill = trackEl.querySelector(".is-current");
    if (activePill) {
      activePill.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }

  /**
   * Called when a note is played: animates arm, head nod and spawns musical notes
   */
  pulseNote(noteData, noteIndex = 0, totalNotes = 42) {
    this.stringVibration = 1.0;
    this.currentNotePitch = noteData?.pitch || "F3";
    this.currentNoteIndex = noteIndex;

    const noteText = `${noteData?.text || "1"} (${noteData?.pitch || "F3"}) · 第 ${noteIndex + 1}/${totalNotes} 音`;
    const pitchEl = document.querySelector("#hudCurrentPitch");
    if (pitchEl) pitchEl.textContent = noteText;

    // Update melody track pills
    this.renderMelodyTrack(noteIndex);

    // Head gentle nod / blissful sway
    const headEl = document.querySelector("#mouseHeadAnimated");
    if (headEl) {
      headEl.animate([
        { transform: "rotate(0deg)" },
        { transform: `rotate(${this.direction * 3.5}deg) translateY(-2px)` },
        { transform: "rotate(0deg)" }
      ], { duration: 240, easing: "ease-out" });
    }

    // Spawn floating playful musical notes around cello
    const notesChars = ["♪", "♫", "♬", "♩"];
    const char = notesChars[Math.floor(Math.random() * notesChars.length)];
    const canvasWidth = this.canvas.width;
    const canvasHeight = this.canvas.height;

    // Anchor around cello bridge / soundhole
    const spawnX = canvasWidth * (0.42 + (Math.random() - 0.5) * 0.12);
    const spawnY = canvasHeight * 0.62;

    this.particles.push({
      x: spawnX,
      y: spawnY,
      vx: (Math.random() - 0.5) * 2.8,
      vy: -3.5 - Math.random() * 2.5,
      char,
      size: 26 + Math.random() * 16,
      alpha: 1.0,
      color: "#2563eb"
    });
  }

  /**
   * Main 60fps render loop: interpolates arm and bow translation, draws string vibrations and baton
   */
  render(now, conductorHand = null) {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;

    // Smoothly interpolate bow position towards target (brings the mouse hand along!)
    this.bowPos += (this.targetBowPos - this.bowPos) * 0.28;

    // Calculate bow & hand travel offset in SVG coordinates (horizontal straight stroke)
    // 显著加大左右运弓行程至 260 像素，还原真实拉大提琴舒展宽阔的运弓手臂动态！
    const bowSlideRange = 260; // SVG pixels travel range (大大增加幅度)
    const slideDx = (this.bowPos - 0.5) * bowSlideRange;
    const slideDy = (this.bowPos - 0.5) * 16; // slight natural slant

    const bowGroup = document.querySelector("#bowAndHandGroup");
    const armPath = document.querySelector("#mouseBowingArm");
    const armOutline = document.querySelector("#mouseBowingArmOutline");

    if (bowGroup) {
      bowGroup.style.transform = `translate(${slideDx}px, ${slideDy}px)`;
    }

    // Dynamically flex the robot's bowing arm curve to follow the moving hand!
    if (armPath && armOutline) {
      const handX = 295 + slideDx;
      const handY = 510 + slideDy;
      // Elbow naturally flexes out/in as bow slides
      const elbowX = 260 + slideDx * 0.4 - Math.sin(Math.PI * this.bowPos) * 20;
      const elbowY = 465 + slideDy * 0.35 - Math.sin(Math.PI * this.bowPos) * 16;
      const newD = `M 280,405 Q ${elbowX},${elbowY} ${handX},${handY}`;
      armPath.setAttribute("d", newD);
      armOutline.setAttribute("d", newD);
    }

    // 1. Draw glowing vibration wave on cello strings (angled with right-tilted cello)
    if (this.stringVibration > 0.01) {
      const stringAnchorX = width * 0.52;
      const stringAnchorY = height * 0.62;

      ctx.save();
      ctx.beginPath();
      const wave = Math.sin(now * 0.1) * 3.5 * this.stringVibration;
      ctx.moveTo(stringAnchorX + 22, stringAnchorY - 55);
      ctx.quadraticCurveTo(stringAnchorX + wave, stringAnchorY, stringAnchorX - 22, stringAnchorY + 55);
      ctx.strokeStyle = `rgba(59, 130, 246, ${this.stringVibration * 0.8})`;
      ctx.lineWidth = 4;
      ctx.shadowColor = "#3b82f6";
      ctx.shadowBlur = 12;
      ctx.stroke();
      ctx.restore();

      this.stringVibration *= 0.90;
    }

    // 2. Render Hand Conductor Baton at user's hand if camera is running
    if (conductorHand && conductorHand.active) {
      const hx = conductorHand.x * width;
      const hy = conductorHand.y * height;

      this.batonTrail.push({ x: hx, y: hy, time: now });
      if (this.batonTrail.length > 12) this.batonTrail.shift();

      for (let i = 0; i < this.batonTrail.length; i++) {
        const p = this.batonTrail[i];
        const age = (now - p.time) / 300;
        if (age < 1) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, Math.max(1, (1 - age) * 6), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(37, 99, 235, ${1 - age})`;
          ctx.shadowColor = "#3b82f6";
          ctx.shadowBlur = 8;
          ctx.fill();
        }
      }

      ctx.save();
      ctx.translate(hx, hy);
      const angle = -0.65 + Math.sin(now * 0.005) * 0.1;
      ctx.rotate(angle);

      const batonLen = Math.min(130, width * 0.2);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(batonLen, 0);
      ctx.strokeStyle = "#2563eb";
      ctx.lineWidth = 4.5;
      ctx.lineCap = "round";
      ctx.shadowColor = "#60a5fa";
      ctx.shadowBlur = 10;
      ctx.stroke();

      // Baton Tip
      ctx.fillStyle = "#facc15";
      ctx.strokeStyle = "#1e1b4b";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(batonLen, 0, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    }

    // 3. Render and update floating musical notes
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 0.018;

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.font = `bold ${p.size}px system-ui, sans-serif`;
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.fillText(p.char, p.x, p.y);
      ctx.restore();
    }
  }

  destroy() {
    if (this.stageEl) {
      this.stageEl.remove();
      this.stageEl = null;
    }
  }
}
