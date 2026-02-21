/**
 * Canvas-based renderer for sharing scenes as 1080x1920 images.
 * Uses Canvas API directly - no DOM capture issues.
 *
 * All sizes are designed for 1080x1920 (Instagram Stories format).
 */

import type { GitHubData, AITexts } from "./types";

const W = 1080;
const H = 1920;
const CX = W / 2;
const BG = "#030712";
const FONT = "Poppins, system-ui, sans-serif";

let fontsLoaded = false;
async function loadFonts() {
  if (fontsLoaded) return;
  const weights = [
    { weight: "400", url: "https://fonts.gstatic.com/s/poppins/v22/pxiEyp8kv8JHgFVrJJfecg.woff2" },
    { weight: "500", url: "https://fonts.gstatic.com/s/poppins/v22/pxiByp8kv8JHgFVrLGT9Z1xlEA.woff2" },
    { weight: "600", url: "https://fonts.gstatic.com/s/poppins/v22/pxiByp8kv8JHgFVrLEj6Z1xlEA.woff2" },
    { weight: "700", url: "https://fonts.gstatic.com/s/poppins/v22/pxiByp8kv8JHgFVrLCz7Z1xlEA.woff2" },
    { weight: "800", url: "https://fonts.gstatic.com/s/poppins/v22/pxiByp8kv8JHgFVrLDD4Z1xlEA.woff2" },
  ];

  const results = await Promise.allSettled(
    weights.map(async ({ weight, url }) => {
      const face = new FontFace("Poppins", `url(${url})`, { weight });
      const loaded = await face.load();
      document.fonts.add(loaded);
    })
  );
  const failed = results.filter((r) => r.status === "rejected");
  if (failed.length > 0) {
    console.warn(`Failed to load ${failed.length} Poppins weights, using fallback`);
  }
  fontsLoaded = true;
}

interface RenderContext {
  ctx: CanvasRenderingContext2D;
  githubData: GitHubData;
  aiTexts: AITexts;
  periodStart: string;
  periodEnd: string;
}

export async function renderSceneToBlob(
  scene: number,
  githubData: GitHubData,
  aiTexts: AITexts,
  periodStart: string,
  periodEnd: string
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  await loadFonts();

  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  const rc: RenderContext = { ctx, githubData, aiTexts, periodStart, periodEnd };

  switch (scene) {
    case 0: await drawIntro(rc); break;
    case 1: drawCommits(rc); break;
    case 2: drawStreak(rc); break;
    case 3: drawLanguages(rc); break;
    case 4: drawRepo(rc); break;
    case 5: drawProductivity(rc); break;
    case 6: drawPrs(rc); break;
    case 7: drawPersonality(rc); break;
    case 8: drawOutro(rc); break;
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Canvas toBlob returned null"));
    }, "image/png");
  });
}

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

// --- Helpers ---

function f(weight: number, size: number) {
  return `${weight} ${size}px ${FONT}`;
}

function gradientText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
  colors: string[],
) {
  ctx.font = f(800, size);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const m = ctx.measureText(text);
  const left = x - m.width / 2;
  const grad = ctx.createLinearGradient(left, y, left + m.width, y);
  colors.forEach((c, i) => grad.addColorStop(i / (colors.length - 1), c));

  ctx.fillStyle = grad;
  ctx.fillText(text, x, y);
}

function text(
  ctx: CanvasRenderingContext2D,
  str: string,
  x: number,
  y: number,
  size: number,
  color: string,
  weight = 400,
  opts: { align?: CanvasTextAlign; wrap?: number } = {}
) {
  ctx.font = f(weight, size);
  ctx.fillStyle = color;
  ctx.textAlign = opts.align ?? "center";
  ctx.textBaseline = "middle";

  if (opts.wrap) {
    const words = str.split(" ");
    const lines: string[] = [];
    let line = "";
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > opts.wrap && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    lines.push(line);
    const lh = size * 1.5;
    let cy = y - ((lines.length - 1) * lh) / 2;
    for (const l of lines) {
      ctx.fillText(l, x, cy);
      cy += lh;
    }
  } else {
    ctx.fillText(str, x, y);
  }
}

async function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function circleImage(ctx: CanvasRenderingContext2D, img: HTMLImageElement, cx: number, cy: number, r: number) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(img, cx - r, cy - r, r * 2, r * 2);
  ctx.restore();

  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
}

function glow(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  const g = ctx.createRadialGradient(cx, cy, r * 0.3, cx, cy, r * 1.8);
  g.addColorStop(0, "rgba(139, 92, 246, 0.5)");
  g.addColorStop(0.5, "rgba(59, 130, 246, 0.2)");
  g.addColorStop(1, "transparent");
  ctx.fillStyle = g;
  ctx.fillRect(cx - r * 2, cy - r * 2, r * 4, r * 4);
}

const VIOLET = "rgba(255,255,255,0.5)";
const WHITE90 = "rgba(255,255,255,0.9)";
const WHITE70 = "rgba(255,255,255,0.7)";
const WHITE50 = "rgba(255,255,255,0.5)";

// --- Scene Renderers ---

async function drawIntro(rc: RenderContext) {
  const { ctx, githubData, periodStart, periodEnd } = rc;

  glow(ctx, CX, 650, 200);

  try {
    const img = await loadImage(githubData.profile.avatarUrl);
    circleImage(ctx, img, CX, 650, 160);
  } catch {
    ctx.fillStyle = "rgba(139, 92, 246, 0.3)";
    ctx.beginPath();
    ctx.arc(CX, 650, 160, 0, Math.PI * 2);
    ctx.fill();
  }

  gradientText(ctx, "Seu GitHub Wrapped", CX, 920, 80, ["#a78bfa", "#c084fc", "#60a5fa"]);
  text(ctx, `@${githubData.profile.username}`, CX, 1030, 48, "rgba(255,255,255,0.8)", 500);
  text(ctx, `${formatDate(periodStart)} — ${formatDate(periodEnd)}`, CX, 1130, 36, WHITE50);
}

function drawCommits(rc: RenderContext) {
  const { ctx, githubData, aiTexts } = rc;

  text(ctx, "TOTAL DE COMMITS", CX, 650, 36, WHITE50, 600);
  gradientText(ctx, githubData.commits.total.toLocaleString(), CX, 870, 200, ["#a78bfa", "#60a5fa"]);
  text(ctx, aiTexts.commitMessage, CX, 1120, 40, WHITE70, 400, { wrap: 850 });
}

function drawStreak(rc: RenderContext) {
  const { ctx, githubData, aiTexts } = rc;

  text(ctx, "🔥", CX, 600, 120, "white");
  gradientText(ctx, String(githubData.commits.maxStreak), CX, 820, 180, ["#f97316", "#ef4444"]);
  text(ctx, "dias de streak", CX, 960, 48, WHITE50);
  text(ctx, aiTexts.streakMessage, CX, 1120, 40, WHITE70, 400, { wrap: 850 });
}

function drawLanguages(rc: RenderContext) {
  const { ctx, githubData, aiTexts } = rc;
  const colors = ["#8b5cf6", "#a78bfa", "#60a5fa", "#22d3ee", "#34d399"];
  const top5 = githubData.languages.slice(0, 5);
  const maxPct = Math.max(...top5.map((l) => l.percentage), 1);

  text(ctx, "Linguagens", CX, 480, 52, WHITE90, 700);

  const startY = 600;
  const barH = 56;
  const gap = 90;
  const labelW = 240;
  const barW = 520;
  const baseX = 100;

  top5.forEach((lang, i) => {
    const y = startY + i * gap;

    // Label
    text(ctx, lang.name, baseX + labelW - 16, y + barH / 2, 34, WHITE70, 500, { align: "right" });

    // Bar bg
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    const bx = baseX + labelW + 16;
    ctx.beginPath();
    ctx.roundRect(bx, y, barW, barH, 10);
    ctx.fill();

    // Bar fill
    const fw = Math.max((lang.percentage / maxPct) * barW, 8);
    ctx.fillStyle = colors[i] ?? colors[0];
    ctx.beginPath();
    ctx.roundRect(bx, y, fw, barH, 10);
    ctx.fill();

    // Pct
    text(ctx, `${lang.percentage}%`, bx + barW + 60, y + barH / 2, 32, WHITE50);
  });

  const msgY = startY + top5.length * gap + 80;
  text(ctx, aiTexts.languageComment, CX, msgY, 38, WHITE70, 400, { wrap: 850 });
}

function drawRepo(rc: RenderContext) {
  const { ctx, githubData } = rc;
  const top = githubData.repositories.topContributed[0];

  text(ctx, "Repositorio destaque", CX, 580, 52, WHITE90, 700);

  if (top) {
    const cardX = 80;
    const cardW = W - 160;
    const cardY = 700;
    const cardH = 280;

    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    ctx.lineWidth = 2;
    ctx.fillStyle = "rgba(255,255,255,0.02)";
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, 20);
    ctx.fill();
    ctx.stroke();

    text(ctx, top.name, CX, cardY + 80, 44, "#a78bfa", 700);
    if (top.description) {
      text(ctx, top.description, CX, cardY + 170, 34, "rgba(255,255,255,0.6)", 400, { wrap: cardW - 80 });
    }
  }

  const sy = 1120;
  gradientText(ctx, String(githubData.repositories.newCreated), CX - 200, sy, 72, ["#a78bfa", "#a78bfa"]);
  text(ctx, "novos repos", CX - 200, sy + 70, 32, WHITE50);

  gradientText(ctx, String(githubData.repositories.starsReceived), CX + 200, sy, 72, ["#fbbf24", "#fbbf24"]);
  text(ctx, "stars", CX + 200, sy + 70, 32, WHITE50);
}

function drawProductivity(rc: RenderContext) {
  const { ctx, githubData, aiTexts } = rc;
  const dist = githubData.commits.hourlyDistribution;
  const max = Math.max(...dist, 1);
  const peakHour = dist.indexOf(Math.max(...dist));

  text(ctx, "Horario mais produtivo", CX, 500, 52, WHITE90, 700);

  const chartX = 80;
  const chartW = W - 160;
  const chartY = 620;
  const chartH = 500;
  const bw = chartW / 24 - 6;

  dist.forEach((count, hour) => {
    const bh = Math.max((count / max) * chartH, 6);
    const x = chartX + hour * (bw + 6);
    const y = chartY + chartH - bh;

    if (hour === peakHour) {
      const g = ctx.createLinearGradient(x, y + bh, x, y);
      g.addColorStop(0, "#8b5cf6");
      g.addColorStop(1, "#60a5fa");
      ctx.fillStyle = g;
    } else {
      ctx.fillStyle = "rgba(255,255,255,0.1)";
    }

    ctx.beginPath();
    ctx.roundRect(x, y, bw, bh, 4);
    ctx.fill();
  });

  text(ctx, `Pico as ${peakHour}h`, CX, chartY + chartH + 80, 44, "#a78bfa", 600);
  text(ctx, aiTexts.productivityMessage, CX, chartY + chartH + 180, 38, WHITE70, 400, { wrap: 850 });
}

function drawPrs(rc: RenderContext) {
  const { ctx, githubData, aiTexts } = rc;

  text(ctx, "Pull Requests & Reviews", CX, 600, 52, WHITE90, 700);

  const sy = 830;
  const gap = 300;

  gradientText(ctx, String(githubData.pullRequests.opened), CX - gap, sy, 100, ["#34d399", "#34d399"]);
  text(ctx, "abertos", CX - gap, sy + 80, 34, WHITE50);

  gradientText(ctx, String(githubData.pullRequests.merged), CX, sy, 100, ["#a78bfa", "#a78bfa"]);
  text(ctx, "mergeados", CX, sy + 80, 34, WHITE50);

  gradientText(ctx, String(githubData.pullRequests.reviewsDone), CX + gap, sy, 100, ["#60a5fa", "#60a5fa"]);
  text(ctx, "reviews", CX + gap, sy + 80, 34, WHITE50);

  text(ctx, aiTexts.prMessage, CX, 1120, 38, WHITE70, 400, { wrap: 850 });
}

function drawPersonality(rc: RenderContext) {
  const { ctx, aiTexts } = rc;

  text(ctx, "SUA PERSONALIDADE DEV", CX, 650, 38, WHITE50, 600);

  // Quote marks
  ctx.font = f(400, 160);
  ctx.fillStyle = "rgba(139, 92, 246, 0.3)";
  ctx.textAlign = "left";
  ctx.fillText("\u201C", 100, 810);
  ctx.textAlign = "right";
  ctx.fillText("\u201D", W - 100, 1200);

  text(ctx, aiTexts.personalitySummary, CX, 980, 46, WHITE90, 500, { wrap: 750 });
}

function drawOutro(rc: RenderContext) {
  const { ctx } = rc;

  gradientText(ctx, "GitHub Wrapped", CX, H / 2 - 40, 84, ["#a78bfa", "#c084fc", "#60a5fa"]);
  text(ctx, "Gere o seu em githubwrapped.dev", CX, H / 2 + 60, 36, WHITE50);
}
