import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

let faceLandmarker;

/**
 * Load the FaceLandmarker model
 */
export async function loadFaceModel() {
  // Load WASM runtime
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
  );

  // Load FaceLandmarker model from public/models
  faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: "/models/face_landmarker.task",
      delegate: "GPU",
    },
    runningMode: "VIDEO", // real-time webcam
    numFaces: 1,          // max number of faces to detect
  });

  console.log("FaceLandmarker model loaded ✅");
}

/**
 * Detect faces on a video frame
 * @param {HTMLVideoElement} video
 * @returns {object} face landmarks and detections
 */
export function detectFace(video) {
  if (!faceLandmarker) throw new Error("FaceLandmarker not loaded");
  return faceLandmarker.detectForVideo(video, performance.now());
}