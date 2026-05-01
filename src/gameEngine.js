import { HandTracker } from './handTracker.js';
import { Metronome } from './metronome.js';
import { generateFullSchedule } from './noteTypes.js';

// ─── CONSTANTS ───
const FALL_BEATS = 4;          // beats que tarda una nota en caer a la línea
const TARGET_Y = 0.85;         // posición Y relativa de la línea objetivo
const LANE_X = { left: 0.30, right: 0.70 };
const PAD_RADIUS = 100;

// ─── TOLERANCIAS (estrictas) ───
const START_TOLERANCE = 0.45;  // Más generoso (antes 0.30)
const HOLD_PERFECT = 0.85;
const HOLD_GOOD = 0.60;
const LATE_PENALTY = 0.6;      // Más margen (antes 0.5)

export class GameEngine {
  constructor() {
    this.videoElement = document.getElementById('webcam');
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');

    this.handTracker = new HandTracker(this.videoElement);
    this.metronome = new Metronome(80);

    // UI
    this.scoreElement = document.getElementById('score');
    this.comboElement = document.getElementById('combo');
    this.gameOverScreen = document.getElementById('game-over-screen');
    this.finalScoreElement = document.getElementById('final-score');

    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.isPlaying = false;

    this.schedule = [];
    this.currentLevelName = '';
    this.levelDisplayTimer = 0;

    // Floating feedback texts
    this.feedbacks = [];

    // Pads state
    this.pads = {
      left:  { handOn: false, x: LANE_X.left,  _hx: 0.5, _hy: 0.5, _prevHx: 0.5, _vx: 0, _isStriking: false, _lastStrikeTime: 0 },
      right: { handOn: false, x: LANE_X.right, _hx: 0.5, _hy: 0.5, _prevHx: 0.5, _vx: 0, _isStriking: false, _lastStrikeTime: 0 },
    };

    this.particles = [];
    this.beatFlash = 0;

    window.addEventListener('resize', () => this.resizeCanvas());
  }

  async init() {
    await this.handTracker.init();
    this.metronome.init();
    this.resizeCanvas();
    this.metronome.onBeat(() => { this.beatFlash = 1.0; });
  }

  resizeCanvas() {
    const c = document.getElementById('game-container');
    this.canvas.width = c.clientWidth;
    this.canvas.height = c.clientHeight;
  }

  start() {
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.scoreElement.innerText = '0';
    this.comboElement.innerText = '';
    this.particles = [];
    this.feedbacks = [];
    this.currentLevelName = '';
    this.levelDisplayTimer = 0;
    this.isPlaying = true;

    this.schedule = generateFullSchedule(8);
    this.metronome.start();
    this._loop();
  }

  stop() {
    this.isPlaying = false;
    this.metronome.stop();
    this.finalScoreElement.innerText = this.score;
    document.getElementById('final-combo').innerText = this.maxCombo;
    this.gameOverScreen.style.display = 'flex';
  }

  // ─── CORE LOOP ───

  _loop() {
    if (!this.isPlaying) return;
    this._update();
    this._draw();
    requestAnimationFrame(() => this._loop());
  }

  // ─── UPDATE ───

  _update() {
    const beat = this.metronome.currentBeat;

    // Detect hands
    const results = this.handTracker.detectHands();
    this._processHands(results);

    // Level markers
    for (const item of this.schedule) {
      if (item.type === 'level-marker' && !item._shown && beat >= item.targetBeat) {
        this.currentLevelName = item.name;
        this.levelDisplayTimer = 200;
        item._shown = true;
      }
    }

    // Process each note
    for (const note of this.schedule) {
      if (note.type === 'level-marker' || note.hit || note.missed) continue;

      const pad = this.pads[note.lane];
      const headBeat = note.targetBeat;
      const endBeat = headBeat + note.type.beats;

      // ── INSTANT HIT (Drum style) ──
      if (pad._isStriking && note.holdStart < 0) {
        const diff = beat - headBeat;
        
        // Tolerance check for the strike
        if (diff >= -START_TOLERANCE && diff <= START_TOLERANCE) {
          // Perfect Hit!
          note.holdStart = beat; 
          this._evaluateNote(note, 'complete');
          pad._isStriking = false; // CONSUMIR el golpe para no atropellar la siguiente nota
        } else if (diff > START_TOLERANCE && diff <= LATE_PENALTY) {
          // Late Hit
          note.holdStart = beat;
          this._evaluateNote(note, 'late');
          pad._isStriking = false; // CONSUMIR
        }
      }

      // ── MISSED (never pressed) ──
      if (beat > endBeat + LATE_PENALTY && !note.hit && note.holdStart < 0) {
        note.missed = true;
        this.combo = 0;
        this.comboElement.innerText = '';
        this._addFeedback(note.lane, '¡Fallaste!', '#ef4444');
      }
    }

    // Check game over
    const notes = this.schedule.filter(n => n.type !== 'level-marker');
    if (notes.length > 0 && notes.every(n => n.hit || n.missed)) {
      this.isPlaying = false;
      setTimeout(() => this.stop(), 1500);
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx; p.y += p.vy;
      p.vy += 0.12;
      p.life -= 0.025;
      if (p.life <= 0) this.particles.splice(i, 1);
    }

    // Update feedbacks
    for (let i = this.feedbacks.length - 1; i >= 0; i--) {
      const f = this.feedbacks[i];
      f.y -= 0.8;
      f.life -= 0.015;
      if (f.life <= 0) this.feedbacks.splice(i, 1);
    }

    if (this.levelDisplayTimer > 0) this.levelDisplayTimer--;
    if (this.beatFlash > 0) this.beatFlash -= 0.06;

    // Update previous hand state for next frame
    this.pads.left.wasHandOn = this.pads.left.handOn;
    this.pads.right.wasHandOn = this.pads.right.handOn;
    this.pads.left._prevHx = this.pads.left._hx;
    this.pads.right._prevHx = this.pads.right._hx;
  }

  /**
   * Evalúa la presión de una nota.
   */
  _evaluateNote(note, status) {
    if (status === 'complete') {
      // ¡Perfecto!
      note.hit = true;
      note.result = 'perfect';
      note.resultTimer = 90;
      this.combo++;
      if (this.combo > this.maxCombo) this.maxCombo = this.combo;
      const pts = 30 + (this.combo > 1 ? this.combo * 3 : 0);
      this.score += pts;
      this._addFeedback(note.lane, `¡Perfecto! +${pts}`, '#22c55e');
      this._spawnParticles(LANE_X[note.lane] * this.canvas.width, TARGET_Y * this.canvas.height, note.type.color, 25);
      this._playSuccessSound(note.lane);

    } else if (status === 'late') {
      // Un poco tarde
      note.hit = true;
      note.result = 'good';
      note.resultTimer = 90;
      this.combo++;
      if (this.combo > this.maxCombo) this.maxCombo = this.combo;
      const pts = 15;
      this.score += pts;
      this._addFeedback(note.lane, `¡Tarde! +${pts}`, '#eab308');
      this._spawnParticles(LANE_X[note.lane] * this.canvas.width, TARGET_Y * this.canvas.height, '#eab308', 10);
    }

    this.scoreElement.innerText = this.score;
    this.comboElement.innerText = this.combo > 1 ? `Combo x${this.combo} 🔥` : '';
    
    // Guardamos la dirección del empuje para la animación
    const pad = this.pads[note.lane];
    note._hitDirection = Math.sign(pad._vx) || (note.lane === 'left' ? -1 : 1);
  }

  _addFeedback(lane, text, color) {
    this.feedbacks.push({
      x: LANE_X[lane] * this.canvas.width,
      y: TARGET_Y * this.canvas.height - 20,
      text, color, life: 1
    });
  }

  // ─── HAND DETECTION ───

  _processHands(results) {
    // Reset temporary striking flags
    for (const pad of Object.values(this.pads)) {
      pad._isStriking = false;
    }

    if (!results || !results.landmarks) {
      this.pads.left.handOn = false;
      this.pads.right.handOn = false;
      return;
    }

    // Umbrales para Empuje Lateral (Swipe)
    const PUSH_VELOCITY = 0.032; 
    const HIT_ZONE_Y_MIN = TARGET_Y - 0.25;
    const HIT_ZONE_Y_MAX = TARGET_Y + 0.15;
    const PUSH_COOLDOWN = 280; // Aumentado para evitar rebotes
    const now = Date.now();

    // Mapear manos detectadas a lanes
    for (const landmarks of results.landmarks) {
      const palmIndices = [0, 5, 9, 13, 17];
      let avgX = 0, avgY = 0;
      palmIndices.forEach(idx => {
        avgX += landmarks[idx].x;
        avgY += landmarks[idx].y;
      });
      const hx = 1 - (avgX / palmIndices.length);
      const hy = avgY / palmIndices.length;

      const lane = hx < 0.5 ? 'left' : 'right';
      const pad = this.pads[lane];

      pad._vx = hx - pad._prevHx; 
      pad._hx = hx;
      pad._hy = hy;
      pad._landmarks = landmarks;

      // Lógica de EMPUJE DISCRETO (Un movimiento = Un hit)
      const speed = Math.abs(pad._vx);
      const canPush = (now - pad._lastStrikeTime) > PUSH_COOLDOWN;
      
      // Si el movimiento es rápido y no estábamos ya en medio de un push...
      if (canPush && speed > PUSH_VELOCITY && hy > HIT_ZONE_Y_MIN && hy < HIT_ZONE_Y_MAX) {
        if (!pad._isPushingActive) {
          pad._isStriking = true; // Se activa solo en el primer frame del movimiento
          pad._isPushingActive = true; 
          pad._lastStrikeTime = now;
        }
      } else if (speed < PUSH_VELOCITY * 0.7) {
        // Resetear el estado de push cuando la mano se frena
        pad._isPushingActive = false;
      }

      // Feedback visual (brillo)
      if (hy > HIT_ZONE_Y_MIN && hy < HIT_ZONE_Y_MAX) {
        pad.handOn = true;
      } else {
        pad.handOn = false;
      }
    }

    // Si una mano desaparece, soltamos el pad correspondiente
    const detectedLanes = results.landmarks.map(l => {
      const pIdx = [0, 5, 9, 13, 17];
      let ax = 0;
      pIdx.forEach(i => ax += l[i].x);
      return (1 - (ax / 5)) < 0.5 ? 'left' : 'right';
    });
    if (!detectedLanes.includes('left')) this.pads.left.handOn = false;
    if (!detectedLanes.includes('right')) this.pads.right.handOn = false;
  }

  // ─── DRAW ───

  _draw() {
    const W = this.canvas.width;
    const H = this.canvas.height;
    const ctx = this.ctx;
    const beat = this.metronome.currentBeat;
    const targetYpx = TARGET_Y * H;
    const pixelsPerBeat = (targetYpx * 0.85) / FALL_BEATS;

    ctx.clearRect(0, 0, W, H);

    // Dark overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(0, 0, W, H);

    // Beat flash
    if (this.beatFlash > 0) {
      ctx.fillStyle = `rgba(255,255,255,${this.beatFlash * 0.07})`;
      ctx.fillRect(0, 0, W, H);
    }

    // ── Beat grid lines ──
    const firstVisibleBeat = Math.floor(beat - 1);
    const lastVisibleBeat = Math.ceil(beat + FALL_BEATS + 2);
    for (let b = firstVisibleBeat; b <= lastVisibleBeat; b++) {
      if (b < 0) continue;
      const y = targetYpx - (b - beat) * pixelsPerBeat;
      if (y < 0 || y > H) continue;
      const isDownbeat = b % 4 === 0;
      ctx.strokeStyle = isDownbeat ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)';
      ctx.lineWidth = isDownbeat ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    // ── Target line ──
    const glowL = this.pads.left.handOn;
    const glowR = this.pads.right.handOn;

    // Left segment
    ctx.lineWidth = glowL ? 6 : 2;
    ctx.strokeStyle = glowL ? '#00ccff' : 'rgba(255,255,255,0.15)';
    if (glowL) { ctx.shadowBlur = 20; ctx.shadowColor = '#00ccff'; }
    ctx.beginPath();
    ctx.moveTo(0, targetYpx);
    ctx.lineTo(W / 2, targetYpx);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Right segment
    ctx.lineWidth = glowR ? 6 : 2;
    ctx.strokeStyle = glowR ? '#ff3366' : 'rgba(255,255,255,0.15)';
    if (glowR) { ctx.shadowBlur = 20; ctx.shadowColor = '#ff3366'; }
    ctx.beginPath();
    ctx.moveTo(W / 2, targetYpx);
    ctx.lineTo(W, targetYpx);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // ── Falling notes ──
    for (const note of this.schedule) {
      if (note.type === 'level-marker') continue;

      const headBeat = note.targetBeat;
      const tailBeat = headBeat + note.type.beats;
      const lx = LANE_X[note.lane] * W;

      // Y positions
      const headY = targetYpx - (headBeat - beat) * pixelsPerBeat;
      const tailY = targetYpx - (tailBeat - beat) * pixelsPerBeat;
      const noteH = Math.max(headY - tailY, 2);

      // Skip if off-screen
      if (headY < -80 || tailY > H + 80) continue;

      const barW = 56;

      if (note.missed) {
        // Faded + red tint for missed
        ctx.globalAlpha = 0.15;
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(lx - barW / 2, tailY, barW, noteH, 10);
        ctx.fillStyle = '#ef4444';
        ctx.fill();
        ctx.restore();
        ctx.globalAlpha = 1;
        continue;
      }

      if (note.hit) {
        // Flying effect for hit notes
        if (!note._vX) {
          const dir = note._hitDirection || (note.lane === 'left' ? -1 : 1);
          note._vX = dir * 18; // Un poco más rápido para que sea más dramático
          note._vY = -12 + Math.random() * -6;
          note._rotation = 0;
          note._vRot = dir * (0.1 + Math.random() * 0.2);
        }
        note._vY += 0.8; // gravity
        note._hitX = (note._hitX || lx) + note._vX;
        note._hitY = (note._hitY || headY) + note._vY;
        note._rotation += note._vRot;
        
        const fade = Math.max(0, note.resultTimer / 90);
        ctx.globalAlpha = fade;
        ctx.save();
        ctx.translate(note._hitX, note._hitY);
        ctx.rotate(note._rotation);
        
        // Draw flying note head
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.fillStyle = note.type.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = note.type.color;
        ctx.fill();
        
        ctx.fillStyle = '#fff';
        ctx.font = "bold 18px serif";
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(note.type.symbol, 0, 0);
        ctx.restore();
        
        ctx.globalAlpha = 1;
        continue;
      }

      // ── Note bar body ──
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(lx - barW / 2, tailY, barW, noteH, 10);

      // Gradient fill
      const grad = ctx.createLinearGradient(0, tailY, 0, headY);
      grad.addColorStop(0, note.type.color + '44');
      grad.addColorStop(1, note.type.color + '99');
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.lineWidth = 2.5;
      ctx.strokeStyle = note.type.color;
      ctx.stroke();
      ctx.restore();

      // ── Hold progress fill ──
      if (note.holdStart >= 0 && !note.hit) {
        const progress = Math.min(note.holdBeats / note.type.beats, 1);
        const fillH = noteH * progress;

        ctx.save();
        ctx.beginPath();
        ctx.roundRect(lx - barW / 2, headY - fillH, barW, fillH + 2, 10);
        ctx.fillStyle = note.type.color + 'cc';
        ctx.fill();
        ctx.restore();
      }

      // ── Note head (bottom circle) ──
      ctx.beginPath();
      ctx.arc(lx, headY, 20, 0, Math.PI * 2);
      ctx.fillStyle = note.type.color;
      ctx.shadowBlur = 12;
      ctx.shadowColor = note.type.color;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Symbol
      ctx.fillStyle = '#fff';
      ctx.font = "bold 18px serif";
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(note.type.symbol, lx, headY);

      // Duration label (to the side)
      ctx.font = "bold 12px 'Nunito'";
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.textAlign = note.lane === 'left' ? 'right' : 'left';
      const labelX = note.lane === 'left' ? lx - barW / 2 - 8 : lx + barW / 2 + 8;
      ctx.fillText(note.type.description, labelX, headY);

      ctx.globalAlpha = 1;
    }

    // ── Note result timers ──
    for (const note of this.schedule) {
      if (note.type === 'level-marker') continue;
      if (note.resultTimer > 0) note.resultTimer--;
    }

    // ── Floating feedbacks ──
    for (const f of this.feedbacks) {
      ctx.globalAlpha = Math.min(f.life, 1);
      ctx.fillStyle = f.color;
      ctx.font = "bold 22px 'Fredoka One'";
      ctx.textAlign = 'center';
      ctx.fillText(f.text, f.x, f.y);
      ctx.globalAlpha = 1;
    }

    // ── Level banner ──
    if (this.levelDisplayTimer > 0) {
      const alpha = Math.min(this.levelDisplayTimer / 60, 1);
      ctx.save();
      ctx.globalAlpha = alpha;

      // Background bar
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      const bannerY = H * 0.3;
      ctx.fillRect(0, bannerY, W, 70);

      // Border accents
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, bannerY); ctx.lineTo(W, bannerY);
      ctx.moveTo(0, bannerY + 70); ctx.lineTo(W, bannerY + 70);
      ctx.stroke();

      // Text
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.min(W * 0.04, 36)}px 'Fredoka One'`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.currentLevelName, W / 2, bannerY + 35);

      ctx.globalAlpha = 1;
      ctx.restore();
    }

    // ── Countdown (first 8 beats) ──
    if (beat >= 0 && beat < 8) {
      const count = Math.ceil(8 - beat);
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.min(W * 0.1, 90)}px 'Fredoka One'`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.globalAlpha = 0.3 + (this.beatFlash * 0.4);
      ctx.fillText(count > 4 ? '🎵' : count, W / 2, H * 0.25);
      ctx.globalAlpha = 1;
    }

    // ── Particles ──
    for (const p of this.particles) {
      ctx.globalAlpha = p.life;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  // ─── EFFECTS ───

  _spawnParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 / count) * i;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * (2 + Math.random() * 3),
        vy: Math.sin(angle) * (2 + Math.random() * 3) - 2,
        life: 1,
        color,
        size: 3 + Math.random() * 5
      });
    }
  }

  _playSuccessSound(lane) {
    const ctx = this.metronome.audioCtx;
    if (!ctx) return;
    const now = ctx.currentTime;
    const freqs = lane === 'left' ? [523.25, 659.25] : [587.33, 739.99]; 
    freqs.forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = f;
      g.gain.setValueAtTime(0.1, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      o.connect(g); g.connect(ctx.destination);
      o.start(now);
      o.stop(now + 0.3);
    });
  }

  _playTapSound() {
    const ctx = this.metronome.audioCtx;
    if (!ctx) return;
    const now = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(150, now);
    o.frequency.exponentialRampToValueAtTime(40, now + 0.05);
    g.gain.setValueAtTime(0.3, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    o.connect(g);
    g.connect(ctx.destination);
    o.start(now);
    o.stop(now + 0.05);
  }
}
