// Starforge: everything the player sees, painted on one canvas. The logical
// field is 960 x 600 and is scaled to fit the canvas with letterboxing, so
// the game looks the same at any window size and the screenshots are exact.
import { COLORS, CRUCIBLE, FIELD, HEAT, LIVES } from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';
export const SCREEN_WIN = 'win';

const PANEL = { x: FIELD.width / 2 - 150, y: 12, w: 300, h: 92 };

export function createRenderer(canvas, random) {
  const ctx = canvas.getContext('2d');

  // The sky's fixed furniture: twinkling stars and soft nebula blobs, placed
  // once from the seeded random source so every seeded run shares the sky.
  const skyStars = [];
  for (let i = 0; i < 110; i += 1) {
    skyStars.push({
      x: random.range(0, FIELD.width),
      y: random.range(0, FIELD.height * 0.62),
      r: random.range(0.6, 2.1),
      phase: random.range(0, Math.PI * 2),
      speed: random.range(0.6, 2.2),
    });
  }
  const nebulae = [
    { x: 150, y: 110, r: 190, c: 'rgba(88, 60, 160, 0.20)' },
    { x: 800, y: 80, r: 160, c: 'rgba(40, 90, 150, 0.16)' },
    { x: 480, y: 260, r: 220, c: 'rgba(150, 60, 110, 0.10)' },
  ];

  function fit() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth || FIELD.width;
    const h = canvas.clientHeight || FIELD.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    const scale = Math.min(canvas.width / FIELD.width, canvas.height / FIELD.height);
    const ox = (canvas.width - FIELD.width * scale) / 2;
    const oy = (canvas.height - FIELD.height * scale) / 2;
    return { dpr, scale, ox, oy };
  }

  function starPath(x, y, r, points = 4) {
    ctx.beginPath();
    for (let i = 0; i < points * 2; i += 1) {
      const rad = i % 2 === 0 ? r : r * 0.38;
      const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
      const px = x + Math.cos(a) * rad;
      const py = y + Math.sin(a) * rad;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }

  function drawSky(state) {
    const g = ctx.createLinearGradient(0, 0, 0, FIELD.height);
    g.addColorStop(0, '#070a1e');
    g.addColorStop(0.55, '#141038');
    g.addColorStop(1, '#241a4a');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    for (const n of nebulae) {
      const rg = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r);
      rg.addColorStop(0, n.c);
      rg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = rg;
      ctx.fillRect(n.x - n.r, n.y - n.r, n.r * 2, n.r * 2);
    }
    // The moon, top right, with a soft halo.
    const mg = ctx.createRadialGradient(830, 74, 8, 830, 74, 90);
    mg.addColorStop(0, 'rgba(255, 246, 210, 0.5)');
    mg.addColorStop(0.35, 'rgba(255, 246, 210, 0.14)');
    mg.addColorStop(1, 'rgba(255, 246, 210, 0)');
    ctx.fillStyle = mg;
    ctx.fillRect(730, -26, 200, 200);
    ctx.fillStyle = '#fff3c4';
    ctx.beginPath();
    ctx.arc(830, 74, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(220, 200, 150, 0.5)';
    ctx.beginPath();
    ctx.arc(820, 66, 6, 0, Math.PI * 2);
    ctx.arc(840, 82, 4, 0, Math.PI * 2);
    ctx.fill();
    // Twinkling stars.
    for (const s of skyStars) {
      const a = 0.35 + 0.65 * Math.abs(Math.sin(state.time * s.speed + s.phase));
      ctx.fillStyle = `rgba(255, 255, 240, ${a.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // Distant hills under the forge.
    ctx.fillStyle = '#0d0a24';
    ctx.beginPath();
    ctx.moveTo(0, FIELD.height);
    ctx.lineTo(0, 568);
    ctx.quadraticCurveTo(240, 540, 480, 566);
    ctx.quadraticCurveTo(720, 588, FIELD.width, 560);
    ctx.lineTo(FIELD.width, FIELD.height);
    ctx.closePath();
    ctx.fill();
  }

  function drawShard(s) {
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.angle * 0.4);
    if (s.kind === 'moonstone') {
      ctx.shadowColor = '#dfe6ff';
      ctx.shadowBlur = 18;
      ctx.fillStyle = '#e8ecff';
      ctx.beginPath();
      ctx.arc(0, 0, s.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#9fb0e8';
      ctx.beginPath();
      ctx.arc(-4, -4, 3, 0, Math.PI * 2);
      ctx.arc(5, 3, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(232, 236, 255, 0.8)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, s.r + 5, 0, Math.PI * 2);
      ctx.stroke();
    } else if (s.kind === 'comet') {
      ctx.shadowColor = '#fff7ae';
      ctx.shadowBlur = 22;
      ctx.fillStyle = '#fff7ae';
      starPath(0, 0, s.r + 6, 4);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff';
      starPath(0, 0, s.r * 0.55, 4);
      ctx.fill();
    } else {
      const c = COLORS[s.color];
      ctx.shadowColor = c.glow;
      ctx.shadowBlur = 16;
      ctx.fillStyle = c.fill;
      starPath(0, 0, s.r + 3, 4);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      starPath(0, 0, s.r * 0.42, 4);
      ctx.fill();
    }
    ctx.restore();
    // A short falling trail.
    ctx.strokeStyle = s.kind === 'moonstone' ? 'rgba(232,236,255,0.35)' : 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(s.x, s.y - 26);
    ctx.lineTo(s.x, s.y - 6);
    ctx.stroke();
  }

  function drawCrucible(state) {
    const x = state.crucibleX;
    const y = CRUCIBLE.y;
    const w = CRUCIBLE.width;
    // The pool of light the forge casts on the ground.
    const lg = ctx.createRadialGradient(x, y + 34, 4, x, y + 34, 110);
    lg.addColorStop(0, 'rgba(255, 190, 90, 0.30)');
    lg.addColorStop(1, 'rgba(255, 190, 90, 0)');
    ctx.fillStyle = lg;
    ctx.fillRect(x - 110, y - 40, 220, 110);
    // The bowl.
    ctx.save();
    ctx.shadowColor = '#ffb35c';
    ctx.shadowBlur = 22;
    const bg = ctx.createLinearGradient(x - w / 2, y - 14, x + w / 2, y + 16);
    bg.addColorStop(0, '#7a5a34');
    bg.addColorStop(0.5, '#3d2c1c');
    bg.addColorStop(1, '#241a10');
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.moveTo(x - w / 2, y - 12);
    ctx.quadraticCurveTo(x - w / 2 + 6, y + 16, x, y + 16);
    ctx.quadraticCurveTo(x + w / 2 - 6, y + 16, x + w / 2, y - 12);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // Molten glow inside the bowl, brighter with the heat.
    const heatGlow = 0.25 + (state.heat / HEAT.max) * 0.75;
    ctx.fillStyle = `rgba(255, 170, 60, ${heatGlow.toFixed(3)})`;
    ctx.beginPath();
    ctx.ellipse(x, y - 8, w / 2 - 12, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(255, 230, 150, ${(heatGlow * 0.85).toFixed(3)})`;
    ctx.beginPath();
    ctx.ellipse(x, y - 9, w / 2 - 26, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    // The rim and the little feet.
    ctx.strokeStyle = '#c9a06a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x - w / 2, y - 12);
    ctx.lineTo(x + w / 2, y - 12);
    ctx.stroke();
    ctx.fillStyle = '#3d2c1c';
    ctx.fillRect(x - w / 2 + 12, y + 14, 10, 8);
    ctx.fillRect(x + w / 2 - 22, y + 14, 10, 8);
    // The next colour the forge wants, floating above the bowl as a hint.
    const want = state.pattern.seq[state.patternIndex];
    if (want) {
      const c = COLORS[want];
      const bob = Math.sin(state.time * 3) * 3;
      ctx.save();
      ctx.shadowColor = c.glow;
      ctx.shadowBlur = 14;
      ctx.fillStyle = c.fill;
      starPath(x, y - 40 + bob, 9, 4);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawParticles(state) {
    for (const p of state.particles) {
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.font = 'bold 17px system-ui, sans-serif';
    ctx.textAlign = 'center';
    for (const p of state.popups) {
      ctx.globalAlpha = Math.min(1, p.life);
      ctx.fillStyle = p.color;
      ctx.fillText(p.text, p.x, p.y);
    }
    ctx.globalAlpha = 1;
  }

  function drawPanel(state) {
    const { x, y, w, h } = PANEL;
    ctx.save();
    ctx.fillStyle = 'rgba(8, 10, 30, 0.62)';
    ctx.strokeStyle = 'rgba(255, 215, 106, 0.45)';
    ctx.lineWidth = 1.5;
    roundRect(x, y, w, h, 10);
    ctx.fill();
    ctx.stroke();
    const p = state.pattern;
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd76a';
    ctx.fillText(`${p.name.toUpperCase()}  ·  LEVEL ${state.level}`, x + w / 2, y + 18);
    // The stars of the order, joined in sequence; forged ones shine gold.
    const scaleX = (w - 44) / 200;
    const scaleY = 34 / 64;
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(255, 215, 106, 0.5)';
    ctx.beginPath();
    p.stars.forEach((s, i) => {
      const px = x + 22 + s[0] * scaleX;
      const py = y + 30 + s[1] * scaleY;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();
    p.stars.forEach((s, i) => {
      const px = x + 22 + s[0] * scaleX;
      const py = y + 30 + s[1] * scaleY;
      const color = p.seq[i];
      const forged = i < state.patternIndex;
      const next = i === state.patternIndex;
      const r = next ? 8 + Math.sin(state.time * 5) * 1.6 : 7;
      ctx.save();
      if (forged || next) {
        ctx.shadowColor = COLORS[color].glow;
        ctx.shadowBlur = 12;
      }
      ctx.fillStyle = forged ? '#ffd76a' : COLORS[color].fill;
      if (!forged && !next) ctx.globalAlpha = 0.55;
      starPath(px, py, r, 4);
      ctx.fill();
      ctx.restore();
    });
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillStyle = '#c9cbe0';
    const done = state.patternIndex;
    const total = p.seq.length;
    ctx.fillText(`forged ${done} of ${total}  ·  ${state.constellations} constellation${state.constellations === 1 ? '' : 's'} done`, x + w / 2, y + h - 10);
    ctx.restore();
  }

  function drawHud(state, mult) {
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 30px system-ui, sans-serif';
    ctx.fillText(String(state.score), 22, 44);
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillStyle = '#aab0d0';
    ctx.fillText('SCORE', 22, 62);
    // Lives as little hearts.
    for (let i = 0; i < LIVES; i += 1) {
      const hx = 30 + i * 30;
      const hy = 82;
      ctx.fillStyle = i < state.lives ? '#ff6a7a' : 'rgba(255,255,255,0.18)';
      ctx.beginPath();
      ctx.moveTo(hx, hy + 6);
      ctx.bezierCurveTo(hx - 9, hy - 2, hx - 5, hy - 10, hx, hy - 4);
      ctx.bezierCurveTo(hx + 5, hy - 10, hx + 9, hy - 2, hx, hy + 6);
      ctx.fill();
    }
    // Heat gauge, top right.
    const gx = FIELD.width - 190;
    const gy = 24;
    ctx.fillStyle = 'rgba(8, 10, 30, 0.62)';
    ctx.strokeStyle = 'rgba(255, 170, 60, 0.5)';
    ctx.lineWidth = 1.5;
    roundRect(gx, gy, 168, 46, 9);
    ctx.fill();
    ctx.stroke();
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.fillStyle = '#ffb35c';
    ctx.textAlign = 'left';
    ctx.fillText('FORGE HEAT', gx + 10, gy + 16);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'right';
    ctx.fillText(`×${mult.toFixed(1)}`, gx + 158, gy + 16);
    ctx.textAlign = 'left';
    const bw = 148;
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    roundRect(gx + 10, gy + 24, bw, 10, 5);
    ctx.fill();
    const hg = ctx.createLinearGradient(gx + 10, 0, gx + 10 + bw, 0);
    hg.addColorStop(0, '#ff7a3c');
    hg.addColorStop(1, '#ffd76a');
    ctx.fillStyle = hg;
    if (state.heat > 0.5) {
      roundRect(gx + 10, gy + 24, (bw * state.heat) / HEAT.max, 10, 5);
      ctx.fill();
    }
    if (state.combo >= 2) {
      ctx.font = 'bold 15px system-ui, sans-serif';
      ctx.fillStyle = '#ffd76a';
      ctx.textAlign = 'right';
      ctx.fillText(`${state.combo} IN A ROW`, FIELD.width - 22, 112);
    }
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function overlay(alpha) {
    ctx.fillStyle = `rgba(5, 7, 20, ${alpha})`;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  }

  function bigTitle(text, sub, y) {
    ctx.textAlign = 'center';
    ctx.save();
    ctx.shadowColor = '#ffd76a';
    ctx.shadowBlur = 26;
    ctx.fillStyle = '#fff3c4';
    ctx.font = 'bold 64px Georgia, serif';
    ctx.fillText(text, FIELD.width / 2, y);
    ctx.restore();
    ctx.fillStyle = '#c9cbe0';
    ctx.font = '18px system-ui, sans-serif';
    ctx.fillText(sub, FIELD.width / 2, y + 34);
  }

  function button(label, y, active) {
    const w = 340;
    const h = 48;
    const x = FIELD.width / 2 - w / 2;
    ctx.fillStyle = active ? '#ffd76a' : 'rgba(255, 215, 106, 0.85)';
    roundRect(x, y, w, h, 12);
    ctx.fill();
    ctx.fillStyle = '#241a10';
    ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, FIELD.width / 2, y + 31);
  }

  function drawTitle(state, best) {
    drawSky(state);
    // A few decorative shards drifting on the title screen.
    for (const s of state.shards) drawShard(s);
    drawCrucible(state);
    overlay(0.25);
    // The title constellation: seven stars in a rising arc.
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 215, 106, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    const arc = [[250, 150], [340, 110], [430, 92], [520, 96], [610, 118], [690, 150], [760, 190]];
    arc.forEach(([px, py], i) => {
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();
    arc.forEach(([px, py], i) => {
      ctx.shadowColor = '#ffd76a';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#ffd76a';
      starPath(px, py, i === 3 ? 10 : 7, 4);
      ctx.fill();
    });
    ctx.restore();
    bigTitle('STARFORGE', 'Catch the shards. Forge the constellations.', 250);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#e8eaf6';
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillText('Move with  ← →  or the mouse. Catch each colour IN ORDER.', FIELD.width / 2, 310);
    ctx.fillText('Wrong colour: slag — a life lost. Moonstone: +1 life. Comet: bonus.', FIELD.width / 2, 334);
    ctx.fillText('Forge all 7 constellations to become Master Smith.', FIELD.width / 2, 358);
    ctx.fillStyle = '#aab0d0';
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillText('P pause  ·  M sound  ·  R restart', FIELD.width / 2, 392);
    button('PLAY  —  press SPACE or click', 424, true);
    if (best > 0) {
      ctx.fillStyle = '#ffd76a';
      ctx.font = 'bold 16px system-ui, sans-serif';
      ctx.fillText(`BEST  ${best}`, FIELD.width / 2, 508);
    }
  }

  function drawPaused(state) {
    overlay(0.6);
    bigTitle('PAUSED', 'The forge waits. The stars do not hurry.', 250);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#e8eaf6';
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillText('Press P or click to keep forging.', FIELD.width / 2, 310);
  }

  function drawOver(state, best, won) {
    overlay(0.62);
    if (won) {
      bigTitle('MASTER SMITH', 'All seven constellations burn in the sky.', 230);
    } else {
      bigTitle('THE FORGE WENT COLD', 'The last ember faded before the sky was finished.', 230);
    }
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 34px system-ui, sans-serif';
    ctx.fillText(`SCORE  ${state.score}`, FIELD.width / 2, 300);
    ctx.fillStyle = '#c9cbe0';
    ctx.font = '17px system-ui, sans-serif';
    ctx.fillText(
      `${state.constellations} constellation${state.constellations === 1 ? '' : 's'} forged  ·  best combo ${state.bestCombo}  ·  reached level ${state.level}`,
      FIELD.width / 2,
      334,
    );
    ctx.fillStyle = '#ffd76a';
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.fillText(`BEST  ${best}`, FIELD.width / 2, 366);
    button('FORGE AGAIN  —  press R or click', 404, true);
  }

  function draw(state, screen, best, mult) {
    const { scale, ox, oy } = fit();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#070a1e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(scale, 0, 0, scale, ox, oy);
    const shakeX = state.shake > 0 ? Math.sin(state.time * 90) * state.shake * 14 : 0;
    const shakeY = state.shake > 0 ? Math.cos(state.time * 80) * state.shake * 10 : 0;
    ctx.translate(shakeX, shakeY);
    drawSky(state);
    if (screen === SCREEN_TITLE) {
      drawTitle(state, best);
      return;
    }
    for (const s of state.shards) drawShard(s);
    drawCrucible(state);
    // Floating score popups belong to live play only: on the end screens
    // they would drift across the big title.
    if (screen === SCREEN_PLAY || screen === SCREEN_PAUSED) drawParticles(state);
    drawPanel(state);
    drawHud(state, mult);
    if (screen === SCREEN_PAUSED) drawPaused(state);
    else if (screen === SCREEN_OVER) drawOver(state, best, false);
    else if (screen === SCREEN_WIN) drawOver(state, best, true);
  }

  return { draw };
}
