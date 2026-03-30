// src/workers/ai.worker.js
import { FaceLandmarker, FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";

let faceLandmarker;
let handLandmarker;

async function init() {
  const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm");
  
  faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
    baseOptions: { modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`, delegate: "GPU" },
    runningMode: "VIDEO"
  });

  handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: { modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`, delegate: "GPU" },
    runningMode: "VIDEO"
  });
}

init();

self.onmessage = async (e) => {
  const { type, modelType, image, timestamp } = e.data;
  if (type === "DETECT") {
    let result;
    if (modelType === "face" && faceLandmarker) {
      result = faceLandmarker.detectForVideo(image, timestamp);
    } else if (modelType === "hand" && handLandmarker) {
      result = handLandmarker.detectForVideo(image, timestamp);
    }
    self.postMessage({ result, modelType });
    image.close(); // إغلاق الـ Bitmap ضروري جداً!
  }
};