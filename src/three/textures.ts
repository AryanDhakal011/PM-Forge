import * as THREE from "three";

type CardSpec = {
  kicker: string;
  title: string;
  value?: string;
  sub?: string;
  accent?: string;
  chart?: "line" | "bars" | "none";
  screen?: boolean;
  quote?: boolean;
};

const PAPER = "#fbf8f0";
const INK = "#25231f";
const MUTED = "#5f5a51";
const LINE = "rgba(37,35,31,0.16)";

function grain(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.save();
  ctx.globalAlpha = 0.05;
  for (let i = 0; i < 900; i += 1) {
    ctx.fillStyle = i % 3 === 0 ? "#8c6447" : "#25231f";
    const x = Math.random() * width;
    const y = Math.random() * height;
    ctx.fillRect(x, y, 1.2, 1.2);
  }
  ctx.restore();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function createCardTexture(spec: CardSpec): THREE.CanvasTexture {
  const width = 620;
  const height = 800;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D not available");

  ctx.fillStyle = spec.screen ? "#f1ece0" : PAPER;
  ctx.fillRect(0, 0, width, height);

  // Paper edge tint
  const edge = ctx.createLinearGradient(0, 0, width, height);
  edge.addColorStop(0, "rgba(255,253,247,0.5)");
  edge.addColorStop(0.55, "rgba(255,255,255,0)");
  edge.addColorStop(1, "rgba(140,100,71,0.07)");
  ctx.fillStyle = edge;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = LINE;
  ctx.lineWidth = 3;
  ctx.strokeRect(1.5, 1.5, width - 3, height - 3);

  const pad = 52;
  const accent = spec.accent ?? "#8f4635";

  // Kicker
  ctx.fillStyle = MUTED;
  ctx.font = "600 19px Inter, Arial, sans-serif";
  ctx.letterSpacing = "3px";
  ctx.fillText(spec.kicker.toUpperCase(), pad, pad + 12);
  ctx.letterSpacing = "0px";

  // Small accent rule
  ctx.fillStyle = accent;
  ctx.fillRect(pad, pad + 36, 46, 3);

  if (spec.screen) {
    // Tiny synthetic UI
    ctx.fillStyle = "#e6ded0";
    roundRect(ctx, pad, 128, width - pad * 2, 44, 8);
    ctx.fill();
    ctx.fillStyle = "#c9bda9";
    ctx.beginPath();
    ctx.arc(pad + 22, 150, 5, 0, Math.PI * 2);
    ctx.arc(pad + 40, 150, 5, 0, Math.PI * 2);
    ctx.arc(pad + 58, 150, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#f6f1e7";
    roundRect(ctx, pad, 196, width - pad * 2, 250, 6);
    ctx.fill();
    ctx.fillStyle = "#b85f45";
    ctx.font = "600 24px Inter, Arial, sans-serif";
    ctx.fillText("Payment failed", pad + 26, 250);
    ctx.fillStyle = MUTED;
    ctx.font = "18px Inter, Arial, sans-serif";
    ctx.fillText("Your card was not charged.", pad + 26, 284);
    ctx.fillStyle = "#58654e";
    roundRect(ctx, pad + 26, 316, 190, 52, 6);
    ctx.fill();
    ctx.fillStyle = "#fffdf7";
    ctx.font = "600 19px Inter, Arial, sans-serif";
    ctx.fillText("Try another method", pad + 46, 349);
    ctx.strokeStyle = "rgba(37,35,31,0.12)";
    ctx.lineWidth = 1;
    ctx.strokeRect(pad + 26, 388, width - pad * 2 - 52, 34);
  } else if (spec.quote) {
    ctx.fillStyle = "rgba(143,70,53,0.25)";
    ctx.font = "160px Georgia, serif";
    ctx.fillText("“", pad - 8, 250);
    ctx.fillStyle = INK;
    ctx.font = "italic 38px Georgia, serif";
    wrapText(ctx, spec.title, pad, 330, width - pad * 2, 48);
    ctx.fillStyle = MUTED;
    ctx.font = "600 17px Inter, Arial, sans-serif";
    ctx.fillText(spec.sub ?? "", pad, 610);
  } else {
    ctx.fillStyle = INK;
    ctx.font = "400 36px 'DM Serif Display', Georgia, serif";
    wrapText(ctx, spec.title, pad, 150, width - pad * 2, 42);

    if (spec.value) {
      ctx.fillStyle = accent;
      ctx.font = "400 108px 'DM Serif Display', Georgia, serif";
      ctx.fillText(spec.value, pad - 2, 360);
    }

    if (spec.chart === "line") {
      const baseY = 510;
      ctx.strokeStyle = "rgba(37,35,31,0.14)";
      ctx.lineWidth = 1;
      for (let i = 0; i < 4; i += 1) {
        ctx.beginPath();
        ctx.moveTo(pad, baseY + i * 34);
        ctx.lineTo(width - pad, baseY + i * 34);
        ctx.stroke();
      }
      const points = [
        [pad, baseY - 6],
        [pad + 58, baseY - 12],
        [pad + 112, baseY - 4],
        [pad + 172, baseY - 30],
        [pad + 232, baseY + 16],
        [pad + 292, baseY + 34],
        [pad + 352, baseY + 58],
        [pad + 412, baseY + 86],
        [pad + 468, baseY + 106],
      ];
      ctx.strokeStyle = accent;
      ctx.lineWidth = 5;
      ctx.lineJoin = "round";
      ctx.beginPath();
      points.forEach(([x, y], index) => {
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(points[points.length - 1][0], points[points.length - 1][1], 7, 0, Math.PI * 2);
      ctx.fill();
    }

    if (spec.chart === "bars") {
      const bars = [62, 74, 68, 80, 72, 54, 44];
      const baseY = 620;
      bars.forEach((bar, index) => {
        ctx.fillStyle = index === 5 || index === 6 ? accent : "rgba(88,101,78,0.55)";
        const h = bar * 2.3;
        const x = pad + index * 70;
        ctx.fillRect(x, baseY - h, 38, h);
      });
    }

    if (spec.sub) {
      ctx.fillStyle = MUTED;
      ctx.font = "500 19px Inter, Arial, sans-serif";
      ctx.fillText(spec.sub, pad, height - pad - 8);
    }
  }

  grain(ctx, width, height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

export function createStickyTexture(text: string, background: string): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D not available");

  ctx.fillStyle = background;
  ctx.fillRect(0, 0, size, size);

  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, "rgba(255,255,255,0.16)");
  gradient.addColorStop(0.6, "rgba(255,255,255,0)");
  gradient.addColorStop(1, "rgba(70,50,30,0.13)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  ctx.fillStyle = "rgba(37,35,31,0.72)";
  ctx.font = "600 58px Caveat, 'Segoe Script', cursive";
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > size - 92) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  lines.push(current);
  lines.forEach((line, index) => {
    ctx.fillText(line, 46, 150 + index * 64);
  });

  grain(ctx, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

export function createWhyTexture(): THREE.CanvasTexture {
  const size = 420;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);
  ctx.fillStyle = "#e8c98f";
  ctx.fillRect(0, 0, size, size);
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, "rgba(255,255,255,0.25)");
  gradient.addColorStop(1, "rgba(90,64,48,0.15)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = "rgba(37,35,31,0.78)";
  ctx.font = "600 96px Caveat, 'Segoe Script', cursive";
  ctx.fillText("why?", 90, 240);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createShaftTexture(): THREE.CanvasTexture {
  const width = 256;
  const height = 512;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "rgba(255,238,208,0)");
  gradient.addColorStop(0.35, "rgba(255,238,208,0.18)");
  gradient.addColorStop(1, "rgba(255,238,208,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  const side = ctx.createLinearGradient(0, 0, width, 0);
  side.addColorStop(0, "rgba(255,255,255,0)");
  side.addColorStop(0.4, "rgba(255,255,255,0.85)");
  side.addColorStop(0.6, "rgba(255,255,255,0.85)");
  side.addColorStop(1, "rgba(255,255,255,0)");
  ctx.globalCompositeOperation = "destination-in";
  ctx.fillStyle = side;
  ctx.fillRect(0, 0, width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(" ");
  let line = "";
  let offset = 0;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, y + offset);
      line = word;
      offset += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, y + offset);
}
