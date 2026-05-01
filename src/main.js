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
  
  // Modal Elements
  const btnInfo = document.getElementById('btn-info');
  const modal = document.getElementById('modal-instructions');
  const btnCloseModal = document.getElementById('btn-close-modal');
  const spanClose = document.querySelector('.close-modal');

  // BPM slider
  bpmInput.addEventListener('input', () => {
    bpmValue.innerText = bpmInput.value;
  });

  btnStart.addEventListener('click', async () => {
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
  });

  btnRestart.addEventListener('click', () => {
    document.getElementById('game-over-screen').style.display = 'none';
    gameEngine.start();
  });

  // Modal Logic
  const openModal = () => { modal.style.display = 'flex'; };
  const closeModal = () => { modal.style.display = 'none'; };

  btnInfo.addEventListener('click', openModal);
  btnCloseModal.addEventListener('click', closeModal);
  spanClose.addEventListener('click', closeModal);

  // Close modal when clicking outside of it
  window.addEventListener('click', (event) => {
    if (event.target === modal) closeModal();
  });
});
