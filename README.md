# Reto-Ritmo 🎶

Un juego educativo de ritmo que utiliza **Inteligencia Artificial** y seguimiento de manos en tiempo real para enseñar el valor de las notas musicales de una manera física y divertida.

## 🚀 La Nueva Experiencia: Empuje Lateral (Swipe)

A diferencia de los juegos de ritmo tradicionales, **Reto-Ritmo** utiliza una mecánica de "barrido" o empuje lateral (Swipe). Las notas caen verticalmente y, cuando llegan a la línea de objetivo, el jugador debe "aventarlas" hacia los lados.

### Características Principales:
- **Seguimiento de Palma Estable**: Olvídate de los fallos por ruido de cámara. El motor calcula el centro de masa de tu palma, ignorando el parpadeo de los dedos para una precisión profesional.
- **Física Dinámica**: Las notas salen volando en la dirección en la que las empujas. Si haces un barrido hacia adentro (aplauso), la nota vuela al centro; si barres hacia afuera, vuela a los bordes.
- **Control Omnidireccional**: Detecta impulsos rápidos en cualquier dirección horizontal.
- **Feedback Visual Zen**: Interfaz limpia y minimalista con una línea reactiva que brilla al detectar tus movimientos.

## 📖 Cómo Jugar

1.  **Calibra tu cámara**: Asegúrate de que tus manos sean visibles en el encuadre.
2.  **Usa la Palma**: Mantén la mano abierta y relajada. El sistema seguirá el centro de tu palma.
3.  **El Gesto (Swipe)**: Cuando una nota toque la línea horizontal, haz un movimiento rápido hacia la izquierda o derecha para "aventarla".
4.  **Sigue el Ritmo**:
    - **Redonda (𝅝)**: 1 golpe cada 4 tiempos.
    - **Blanca (𝅗𝅥)**: 2 golpes (uno cada 2 tiempos).
    - **Negra (♩)**: 4 golpes (uno por tiempo).
    - **Corchea (♪)**: 8 golpes rápidos.

## 🛠️ Tecnología
- **Vite**: Entorno de desarrollo ultra rápido.
- **MediaPipe Hands**: Seguimiento de manos mediante IA de alto rendimiento.
- **Web Audio API**: Motor de sonido de baja latencia para una respuesta rítmica perfecta.
- **Canvas API**: Renderizado fluido a 60fps.

## 💻 Instalación Local

```bash
# Clonar el repositorio
git clone https://github.com/PabloGGuizar/reto-ritmo.git

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

Desarrollado con ❤️ para la educación musical.
