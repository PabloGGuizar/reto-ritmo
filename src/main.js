import './style.css';
import { GameEngine } from './gameEngine.js';

document.addEventListener('DOMContentLoaded', () => {
  const gameEngine = new GameEngine();

  const btnStart = document.getElementById('btn-start');
  const btnRestart = document.getElementById('btn-restart');
  const startScreen = document.getElementById('start-screen');
  const loadingText = document.getElementById('loading-text');
  const bpmInput = document.getElementById('bpm-input');
  const bpmValue = document.getElementById('bpm-value');
  
  // BPM slider
  if (bpmInput) {
    bpmInput.oninput = () => {
      bpmValue.innerText = bpmInput.value;
    };
  }

  if (btnStart) {
    btnStart.onclick = async () => {
      btnStart.style.display = 'none';
      loadingText.style.display = 'block';

      try {
        gameEngine.metronome.setBpm(parseInt(bpmInput.value, 10));
        document.getElementById('bpm-display').innerText = `♩ = ${bpmInput.value} BPM`;

        await gameEngine.init();
        startScreen.style.display = 'none';
        gameEngine.start();
      } catch (error) {
        console.error('Error iniciando el juego:', error);
        alert('No se pudo iniciar la cámara o el modelo de IA. Verifica los permisos de cámara.');
        btnStart.style.display = 'inline-block';
        loadingText.style.display = 'none';
      }
    };
  }

  if (btnRestart) {
    btnRestart.onclick = () => {
      document.getElementById('game-over-screen').style.display = 'none';
      gameEngine.start();
    };
  }

  // ─── Modal Logic (Versión Blindada) ───
  const modal = document.getElementById('modal-instructions');
  const btnInfo = document.getElementById('btn-info');
  const btnCloseModal = document.getElementById('btn-close-modal');
  const spanCloseModal = document.getElementById('span-close-modal');

  const closeModal = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    console.log('Cerrando modal...');
    if (modal) modal.style.display = 'none';
  };

  const openModal = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    console.log('Abriendo modal...');
    if (modal) modal.style.display = 'flex';
  };

  if (btnInfo) btnInfo.onclick = openModal;
  if (btnCloseModal) btnCloseModal.onclick = closeModal;
  if (spanCloseModal) spanCloseModal.onclick = closeModal;

  // Cerrar al hacer clic en el fondo oscuro
  if (modal) {
    modal.onclick = (e) => {
      if (e.target === modal) closeModal();
    };
  }
});
