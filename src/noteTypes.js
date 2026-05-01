/**
 * Figuras musicales y generador de patrones educativos.
 * Cada nivel enseña la equivalencia: 4 tiempos = 1 redonda = 2 blancas = 4 negras = 8 corcheas.
 */

export const NOTE_TYPES = {
  redonda:  { name: 'Redonda',  beats: 4,   symbol: '𝅝',  color: '#a855f7', description: '4 tiempos' },
  blanca:   { name: 'Blanca',   beats: 2,   symbol: '𝅗𝅥', color: '#3b82f6', description: '2 tiempos' },
  negra:    { name: 'Negra',    beats: 1,   symbol: '♩',  color: '#22c55e', description: '1 tiempo'  },
  corchea:  { name: 'Corchea',  beats: 0.5, symbol: '♪',  color: '#eab308', description: '½ tiempo'  },
};

/**
 * Genera un compás de 4 tiempos con la figura indicada para un lane dado.
 * Ejemplo: 'blanca' genera 2 blancas consecutivas (2+2=4 tiempos).
 */
function makeMeasure(noteKey, lane, startBeat) {
  const type = NOTE_TYPES[noteKey];
  const count = 4 / type.beats; // cuántas notas caben en 4 tiempos
  const notes = [];
  for (let i = 0; i < count; i++) {
    notes.push({
      lane,
      type,
      targetBeat: startBeat + i * type.beats,
      hit: false,
      missed: false,
      holdStart: -1,
      holdBeats: 0,
      releaseGrace: false,
      result: null,   // 'perfect' | 'good' | 'early' | 'late' | 'short' | null
      resultTimer: 0,
    });
  }
  return notes;
}

/**
 * Genera el schedule educativo completo.
 * Progresión:
 *   Nivel 1: Redondas    → 1 nota  × 4 tiempos = 4 tiempos (izq, der, ambas)
 *   Nivel 2: Blancas     → 2 notas × 2 tiempos = 4 tiempos (izq, der, ambas)
 *   Nivel 3: Negras      → 4 notas × 1 tiempo  = 4 tiempos (izq, der, ambas)
 *   Nivel 4: Corcheas    → 8 notas × ½ tiempo  = 4 tiempos (izq, der, ambas)
 *   Nivel 5: Combinaciones libres
 */
export function generateFullSchedule(introBeats = 8) {
  const schedule = [];
  let beat = introBeats;
  const GAP = 2; // beats de pausa entre compases

  // ─── NIVEL 1: REDONDA ───
  schedule.push({ type: 'level-marker', name: '🟣 Nivel 1 — La Redonda (4 tiempos)', targetBeat: beat });
  beat += 4;

  // Izquierda
  schedule.push(...makeMeasure('redonda', 'left', beat));
  beat += 4 + GAP;
  // Derecha
  schedule.push(...makeMeasure('redonda', 'right', beat));
  beat += 4 + GAP;
  // Ambas manos
  schedule.push(...makeMeasure('redonda', 'left', beat));
  schedule.push(...makeMeasure('redonda', 'right', beat));
  beat += 4 + GAP;

  // ─── NIVEL 2: BLANCA ───
  schedule.push({ type: 'level-marker', name: '🔵 Nivel 2 — La Blanca (2 tiempos)', targetBeat: beat });
  beat += 4;

  schedule.push(...makeMeasure('blanca', 'left', beat));
  beat += 4 + GAP;
  schedule.push(...makeMeasure('blanca', 'right', beat));
  beat += 4 + GAP;
  schedule.push(...makeMeasure('blanca', 'left', beat));
  schedule.push(...makeMeasure('blanca', 'right', beat));
  beat += 4 + GAP;

  // ─── NIVEL 3: NEGRA ───
  schedule.push({ type: 'level-marker', name: '🟢 Nivel 3 — La Negra (1 tiempo)', targetBeat: beat });
  beat += 4;

  schedule.push(...makeMeasure('negra', 'left', beat));
  beat += 4 + GAP;
  schedule.push(...makeMeasure('negra', 'right', beat));
  beat += 4 + GAP;
  schedule.push(...makeMeasure('negra', 'left', beat));
  schedule.push(...makeMeasure('negra', 'right', beat));
  beat += 4 + GAP;

  // ─── NIVEL 4: CORCHEA ───
  schedule.push({ type: 'level-marker', name: '🟡 Nivel 4 — La Corchea (½ tiempo)', targetBeat: beat });
  beat += 4;

  schedule.push(...makeMeasure('corchea', 'left', beat));
  beat += 4 + GAP;
  schedule.push(...makeMeasure('corchea', 'right', beat));
  beat += 4 + GAP;
  schedule.push(...makeMeasure('corchea', 'left', beat));
  schedule.push(...makeMeasure('corchea', 'right', beat));
  beat += 4 + GAP;

  // ─── NIVEL 5: MEZCLA ───
  schedule.push({ type: 'level-marker', name: '🎶 Nivel 5 — ¡Mezcla!', targetBeat: beat });
  beat += 4;

  // 1 redonda izq + 2 blancas der
  schedule.push(...makeMeasure('redonda', 'left', beat));
  schedule.push(...makeMeasure('blanca', 'right', beat));
  beat += 4 + GAP;

  // 2 blancas izq + 4 negras der
  schedule.push(...makeMeasure('blanca', 'left', beat));
  schedule.push(...makeMeasure('negra', 'right', beat));
  beat += 4 + GAP;

  // 4 negras izq + 8 corcheas der
  schedule.push(...makeMeasure('negra', 'left', beat));
  schedule.push(...makeMeasure('corchea', 'right', beat));
  beat += 4 + GAP;

  // 8 corcheas izq + 1 redonda der
  schedule.push(...makeMeasure('corchea', 'left', beat));
  schedule.push(...makeMeasure('redonda', 'right', beat));
  beat += 4 + GAP;

  return schedule;
}
