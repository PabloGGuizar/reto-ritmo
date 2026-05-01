# 🎵 Reto Ritmo — Percusión con IA

**Reto Ritmo** es una aplicación educativa interactiva diseñada para enseñar el valor de las figuras musicales a través del movimiento y la percusión virtual. Utiliza inteligencia artificial para rastrear el movimiento de tus manos sin necesidad de controladores externos.

## 🚀 Características

- **Seguimiento de Puños (IA)**: Utiliza la cámara para detectar si tienes la mano cerrada y captura el gesto de "martilleo".
- **Gesto de Percusión**: El juego requiere que cierres el puño para activar los pads. ¡Si tienes la mano abierta, no habrá impacto!
- **Pads de Percusión Gigantes**: Área de impacto amplia en la base para una detección robusta y satisfactoria.
- **Feedback Auditivo**: Incluye un sonido de "tap" percusivo sincronizado con tus movimientos para ayudarte a mantener el pulso.
- **Currículo Educativo**: Progresión de niveles que enseña Redondas, Blancas, Negras y Corcheas.
- **Minimalismo Premium**: Interfaz limpia con efectos de brillo y glassmorphism.

## 🛠️ Tecnologías

- **Vite**: Entorno de desarrollo rápido.
- **Mediapipe Tasks (Vision)**: Para el seguimiento de manos en tiempo real mediante IA.
- **Web Audio API**: Para la síntesis de sonidos percusivos y el metrónomo de alta precisión.
- **Canvas 2D API**: Para la renderización fluida del juego a 60 FPS.

## 📖 Cómo Jugar

1. **Inicia el juego** y permite el acceso a la cámara.
2. **Cierra el puño**: El sistema solo registrará impactos si detecta que tu mano está cerrada.
3. **Golpea los Pads**: Cuando una nota baje y toque la zona de los rectángulos en la base, haz un gesto rápido de "martilleo" hacia abajo.
4. **Sigue el patrón**:
   - **Redonda (4 tiempos)**: 1 golpe al inicio del compás.
   - **Blanca (2 tiempos)**: 2 golpes (uno cada 2 clics del metrónomo).
   - **Negra (1 tiempo)**: 4 golpes (uno por cada clic del metrónomo).
   - **Corchea (1/2 tiempo)**: 8 golpes rápidos.

## 📦 Instalación

Si deseas ejecutarlo localmente:

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

## 🧠 Lógica Técnica

El corazón del proyecto reside en `gameEngine.js`, donde se calcula la velocidad vertical (`dy`) del centro del puño (Landmark 9). El sistema incluye un filtro `_isFist` que verifica la flexión de los dedos antes de permitir la activación del pad, lo que garantiza una jugabilidad intencional y física.

---
Creado por Antigravity para el aprendizaje musical interactivo.
