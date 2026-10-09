/**
 * Built-in Preset Doodles for Instant Demonstration
 * Kids drawings, rainbows, space, and nature that produce delightful music
 */
import { drawDemoArt } from './demoArt.js';
export function drawPresetDoodle(ctx, width, height, presetId = "scribble") {
  if (['scribble','building','tiedye','decorative'].includes(presetId)) return drawDemoArt(ctx,width,height,presetId);
  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  switch (presetId) {
    case "space":
      drawSpaceDoodle(ctx, width, height);
      break;
    case "sunflower":
      drawSunflowerDoodle(ctx, width, height);
      break;
    case "waves":
      drawWavesDoodle(ctx, width, height);
      break;
    case "rainbow":
    default:
      drawRainbowDoodle(ctx, width, height);
      break;
  }

  ctx.restore();
}

function drawRainbowDoodle(ctx, w, h) {
  // 1. Light background hills (Green)
  ctx.fillStyle = "#86efac";
  ctx.beginPath();
  ctx.moveTo(0, h * 0.85);
  ctx.quadraticCurveTo(w * 0.25, h * 0.72, w * 0.5, h * 0.82);
  ctx.quadraticCurveTo(w * 0.75, h * 0.92, w, h * 0.8);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();

  // Dark ground edge
  ctx.lineWidth = 5;
  ctx.strokeStyle = "#16a34a";
  ctx.beginPath();
  ctx.moveTo(0, h * 0.85);
  ctx.quadraticCurveTo(w * 0.25, h * 0.72, w * 0.5, h * 0.82);
  ctx.quadraticCurveTo(w * 0.75, h * 0.92, w, h * 0.8);
  ctx.stroke();

  // 2. Beautiful Rainbow Arcs (Red, Orange, Yellow, Green, Cyan, Blue, Purple)
  const rainbowColors = [
    "#ef4444", // Red - Marimba
    "#f97316", // Orange - Mallet
    "#eab308", // Yellow - Glockenspiel
    "#22c55e", // Green - Flute
    "#06b6d4", // Cyan - Crystal
    "#3b82f6", // Blue - Music Box
    "#a855f7", // Purple - Harp
  ];

  const centerX = w * 0.5;
  const centerY = h * 0.9;
  const baseRadius = Math.min(w, h) * 0.55;

  ctx.lineCap = "round";
  rainbowColors.forEach((color, i) => {
    ctx.lineWidth = 14;
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.arc(centerX, centerY, baseRadius - i * 16, Math.PI * 1.05, Math.PI * 1.95, false);
    ctx.stroke();
  });

  // 3. Fluffy Smiling Clouds at Rainbow ends (Soft Cyan & White)
  drawCloud(ctx, w * 0.18, h * 0.65, 36, "#38bdf8");
  drawCloud(ctx, w * 0.82, h * 0.65, 36, "#38bdf8");

  // 4. Cheerful Sun in Top Left (Gold/Yellow)
  ctx.fillStyle = "#fbbf24";
  ctx.beginPath();
  ctx.arc(w * 0.15, h * 0.2, 34, 0, Math.PI * 2);
  ctx.fill();

  // Sun rays
  ctx.strokeStyle = "#f59e0b";
  ctx.lineWidth = 4;
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
    const r1 = 40;
    const r2 = 54;
    ctx.beginPath();
    ctx.moveTo(w * 0.15 + Math.cos(a) * r1, h * 0.2 + Math.sin(a) * r1);
    ctx.lineTo(w * 0.15 + Math.cos(a) * r2, h * 0.2 + Math.sin(a) * r2);
    ctx.stroke();
  }

  // 5. Floating Music Notes in Sky (Red, Purple, Blue)
  drawDoodleNote(ctx, w * 0.38, h * 0.25, "#ef4444", "♪");
  drawDoodleNote(ctx, w * 0.5, h * 0.18, "#3b82f6", "♫");
  drawDoodleNote(ctx, w * 0.65, h * 0.24, "#a855f7", "♩");
  drawDoodleNote(ctx, w * 0.78, h * 0.3, "#eab308", "♬");
}

function drawSpaceDoodle(ctx, w, h) {
  // Dark blue starry background
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(0, 0, w, h);

  // 1. Golden Moon
  ctx.fillStyle = "#fef08a";
  ctx.beginPath();
  ctx.arc(w * 0.82, h * 0.2, 38, 0, Math.PI * 2);
  ctx.fill();

  // 2. Colorful Saturn / Ring Planet (Cyan & Purple)
  ctx.fillStyle = "#06b6d4";
  ctx.beginPath();
  ctx.arc(w * 0.2, h * 0.35, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#c084fc";
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.ellipse(w * 0.2, h * 0.35, 52, 16, Math.PI * 0.15, 0, Math.PI * 2);
  ctx.stroke();

  // 3. Cute Red Rocket ship flying diagonally (Red, White, Orange)
  ctx.save();
  ctx.translate(w * 0.45, h * 0.55);
  ctx.rotate(-Math.PI * 0.25);

  // Flame (Orange & Yellow)
  ctx.fillStyle = "#f97316";
  ctx.beginPath();
  ctx.moveTo(-16, 40);
  ctx.lineTo(0, 68);
  ctx.lineTo(16, 40);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#fde047";
  ctx.beginPath();
  ctx.moveTo(-10, 40);
  ctx.lineTo(0, 56);
  ctx.lineTo(10, 40);
  ctx.closePath();
  ctx.fill();

  // Rocket Body (White with Red tip)
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.moveTo(0, -45);
  ctx.quadraticCurveTo(22, -10, 18, 40);
  ctx.lineTo(-18, 40);
  ctx.quadraticCurveTo(-22, -10, 0, -45);
  ctx.closePath();
  ctx.fill();

  // Red nose
  ctx.fillStyle = "#ef4444";
  ctx.beginPath();
  ctx.moveTo(0, -45);
  ctx.quadraticCurveTo(14, -20, 14, -15);
  ctx.lineTo(-14, -15);
  ctx.quadraticCurveTo(-14, -20, 0, -45);
  ctx.closePath();
  ctx.fill();

  // Cyan Window
  ctx.fillStyle = "#38bdf8";
  ctx.beginPath();
  ctx.arc(0, 0, 10, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  // 4. Colorful Constellation trail (Green & Yellow)
  ctx.strokeStyle = "#22c55e";
  ctx.lineWidth = 4;
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.moveTo(w * 0.1, h * 0.8);
  ctx.quadraticCurveTo(w * 0.35, h * 0.75, w * 0.5, h * 0.85);
  ctx.quadraticCurveTo(w * 0.7, h * 0.95, w * 0.9, h * 0.8);
  ctx.stroke();
  ctx.setLineDash([]);

  // Little Yellow Stars
  const stars = [
    [0.12, 0.15], [0.35, 0.18], [0.55, 0.28], [0.72, 0.42], [0.88, 0.65],
    [0.28, 0.65], [0.65, 0.75], [0.42, 0.88]
  ];
  ctx.fillStyle = "#facc15";
  stars.forEach(([sx, sy]) => {
    ctx.beginPath();
    ctx.arc(w * sx, h * sy, 5, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawSunflowerDoodle(ctx, w, h) {
  // Sunny blue sky top, fresh green lawn bottom
  ctx.fillStyle = "#e0f2fe";
  ctx.fillRect(0, 0, w, h * 0.7);
  ctx.fillStyle = "#86efac";
  ctx.fillRect(0, h * 0.7, w, h * 0.3);

  // Big Sunflower 1 (Center)
  drawFlower(ctx, w * 0.48, h * 0.58, 48, "#f59e0b", "#78350f", "#15803d");

  // Smaller Flower 2 (Left)
  drawFlower(ctx, w * 0.22, h * 0.68, 34, "#ef4444", "#7f1d1d", "#15803d");

  // Flower 3 (Right)
  drawFlower(ctx, w * 0.78, h * 0.64, 38, "#a855f7", "#581c87", "#15803d");

  // Fluttering Blue Butterfly
  ctx.fillStyle = "#3b82f6";
  const bx = w * 0.32;
  const by = h * 0.28;
  ctx.beginPath();
  ctx.ellipse(bx - 10, by - 8, 12, 8, -Math.PI * 0.25, 0, Math.PI * 2);
  ctx.ellipse(bx + 10, by - 8, 12, 8, Math.PI * 0.25, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#06b6d4";
  ctx.beginPath();
  ctx.ellipse(bx - 8, by + 4, 8, 6, -Math.PI * 0.1, 0, Math.PI * 2);
  ctx.ellipse(bx + 8, by + 4, 8, 6, Math.PI * 0.1, 0, Math.PI * 2);
  ctx.fill();

  // Rainbow arc in background
  ctx.lineWidth = 6;
  ctx.strokeStyle = "#fbbf24";
  ctx.beginPath();
  ctx.arc(w * 0.5, h * 0.7, w * 0.38, Math.PI, Math.PI * 2);
  ctx.stroke();
}

function drawWavesDoodle(ctx, w, h) {
  // Gradient sunset sky
  const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.6);
  skyGrad.addColorStop(0, "#fed7aa");
  skyGrad.addColorStop(0.5, "#fbcfe8");
  skyGrad.addColorStop(1, "#bae6fd");
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, h * 0.6);

  // Big Orange Setting Sun
  ctx.fillStyle = "#f97316";
  ctx.beginPath();
  ctx.arc(w * 0.5, h * 0.42, 45, 0, Math.PI * 2);
  ctx.fill();

  // Wave layer 1 (Cyan / Light Blue)
  ctx.fillStyle = "#38bdf8";
  ctx.beginPath();
  ctx.moveTo(0, h * 0.58);
  for (let x = 0; x <= w; x += 30) {
    const y = h * 0.58 + Math.sin(x * 0.035) * 14;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();

  // Wave layer 2 (Royal Blue)
  ctx.fillStyle = "#2563eb";
  ctx.beginPath();
  ctx.moveTo(0, h * 0.7);
  for (let x = 0; x <= w; x += 30) {
    const y = h * 0.7 + Math.sin(x * 0.045 + 1.2) * 18;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();

  // Wave layer 3 (Deep Indigo)
  ctx.fillStyle = "#1e1b4b";
  ctx.beginPath();
  ctx.moveTo(0, h * 0.84);
  for (let x = 0; x <= w; x += 30) {
    const y = h * 0.84 + Math.sin(x * 0.05 + 2.5) * 15;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();

  // Playful Jumping Fish (Red/Orange)
  ctx.fillStyle = "#ef4444";
  ctx.beginPath();
  ctx.ellipse(w * 0.28, h * 0.52, 16, 9, -Math.PI * 0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(w * 0.28 - 14, h * 0.52 + 3);
  ctx.lineTo(w * 0.28 - 22, h * 0.52 - 4);
  ctx.lineTo(w * 0.28 - 22, h * 0.52 + 10);
  ctx.closePath();
  ctx.fill();
}

function drawCloud(ctx, cx, cy, size, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx - size * 0.6, cy, size * 0.65, 0, Math.PI * 2);
  ctx.arc(cx, cy - size * 0.45, size * 0.8, 0, Math.PI * 2);
  ctx.arc(cx + size * 0.6, cy, size * 0.65, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fill();
}

function drawFlower(ctx, cx, cy, petalR, petalColor, centerColor, stemColor) {
  // Stem
  ctx.strokeStyle = stemColor;
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.quadraticCurveTo(cx - 10, cy + 50, cx, cy + 100);
  ctx.stroke();

  // Petals
  ctx.fillStyle = petalColor;
  const count = 8;
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const px = cx + Math.cos(a) * petalR * 0.65;
    const py = cy + Math.sin(a) * petalR * 0.65;
    ctx.beginPath();
    ctx.arc(px, py, petalR * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }

  // Center
  ctx.fillStyle = centerColor;
  ctx.beginPath();
  ctx.arc(cx, cy, petalR * 0.45, 0, Math.PI * 2);
  ctx.fill();
}

function drawDoodleNote(ctx, x, y, color, char) {
  ctx.fillStyle = color;
  ctx.font = "bold 28px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(char, x, y);
}
