/**
 * Metrónomo preciso con Web Audio API.
 * Expone el beat fraccionario actual para sincronizar animaciones.
 */
export class Metronome {
  constructor(bpm = 80) {
    this.bpm = bpm;
    this.audioCtx = null;
    this.isPlaying = false;
    this.startTime = 0; // audioCtx time when we started
    this.onBeatCallbacks = [];
    this._lastFiredBeat = -1;
    this._timerId = null;
  }

  init() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  get beatDuration() {
    return 60.0 / this.bpm;
  }

  /** Current fractional beat since start (e.g. 5.73) */
  get currentBeat() {
    if (!this.isPlaying || !this.audioCtx) return 0;
    const elapsed = this.audioCtx.currentTime - this.startTime;
    return elapsed / this.beatDuration;
  }

  onBeat(callback) {
    this.onBeatCallbacks.push(callback);
  }

  _tick() {
    if (!this.isPlaying) return;
    const beat = Math.floor(this.currentBeat);
    if (beat > this._lastFiredBeat) {
      this._lastFiredBeat = beat;
      this._playClick(beat);
      for (const cb of this.onBeatCallbacks) cb(beat);
    }
    this._timerId = requestAnimationFrame(() => this._tick());
  }

  _playClick(beatNumber) {
    const ctx = this.audioCtx;
    const time = this.startTime + beatNumber * this.beatDuration;
    // Only play if not too far in the past
    if (time < ctx.currentTime - 0.1) return;
    const playAt = Math.max(time, ctx.currentTime);

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    const isDownbeat = (beatNumber % 4 === 0);
    osc.frequency.value = isDownbeat ? 1000 : 700;
    osc.type = 'sine';

    gain.gain.setValueAtTime(isDownbeat ? 0.6 : 0.35, playAt);
    gain.gain.exponentialRampToValueAtTime(0.001, playAt + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(playAt);
    osc.stop(playAt + 0.05);
  }

  start() {
    if (this.isPlaying) return;
    this.init();
    if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

    this.isPlaying = true;
    this.startTime = this.audioCtx.currentTime + 0.1;
    this._lastFiredBeat = -1;
    this._tick();
  }

  stop() {
    this.isPlaying = false;
    if (this._timerId) cancelAnimationFrame(this._timerId);
  }

  setBpm(v) { this.bpm = v; }
}
