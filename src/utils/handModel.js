import {
  HandLandmarker,
  FilesetResolver,
} from "@mediapipe/tasks-vision";

let handLandmarker;

export async function loadHandModel() {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
  );

  handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: "/models/hand_landmarker.task",
      delegate: "GPU",
    },
    runningMode: "VIDEO",
    numHands: 2,
  });
}

export function detectHands(video) {
  return handLandmarker.detectForVideo(video, performance.now());
}