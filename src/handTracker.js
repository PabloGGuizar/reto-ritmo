import { HandLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

export class HandTracker {
  constructor(videoElement) {
    this.videoElement = videoElement;
    this.handLandmarker = null;
    this.isTracking = false;
    this.lastVideoTime = -1;
    this.results = null;
  }

  async init() {
    // 1. Inicializar MediaPipe
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.12/wasm"
    );
    
    this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
        delegate: "GPU"
      },
      runningMode: "VIDEO",
      numHands: 2,
      minHandDetectionConfidence: 0.5,
      minHandPresenceConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    // 2. Inicializar Cámara
    await this.setupCamera();
  }

  async setupCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("La API del navegador para la cámara no está disponible.");
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: "user"
      }
    });
    
    this.videoElement.srcObject = stream;
    
    return new Promise((resolve) => {
      this.videoElement.onloadedmetadata = () => {
        this.videoElement.play();
        resolve();
      };
    });
  }

  detectHands() {
    if (!this.handLandmarker || !this.videoElement || this.videoElement.readyState < 2) return null;

    let startTimeMs = performance.now();
    if (this.lastVideoTime !== this.videoElement.currentTime) {
      this.lastVideoTime = this.videoElement.currentTime;
      this.results = this.handLandmarker.detectForVideo(this.videoElement, startTimeMs);
    }
    return this.results;
  }
}
