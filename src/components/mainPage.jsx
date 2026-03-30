import React, { useRef, useState } from "react";
import "../App.css";

import {
  ScanFace,
  Hand,
  BrainCircuit,
  Mic,
  StopCircle,
  Play,
  Activity,
} from "lucide-react";

export default function MainPage() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const requestRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [facingMode, setFacingMode] = useState("user");
  const [activeModel, setActiveModel] = useState(null); // يمكن أن يكون 'face' أو 'hand' أو null

  // 🔴 Stop webcam
  // 🔴 إيقاف الكاميرا والموديلات تماماً
  const stopWebcam = () => {
    // 1. إيقاف حلقة الرسم (Animation Loop) فوراً
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }

    // 2. إيقاف مسارات الكاميرا (Stream Tracks)
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }

    // 3. ✅ مسح الموديل النشط من الذاكرة (هنا نضع الكود)
    setActiveModel(null);

    // 4. تنظيف الفيديو والكانفاس
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }

    console.log("All Models and Camera Terminated 🔴");
  };

  // 👤 FACE DETECTION
  const startFaceDetection = async () => {
    // 1. تنظيف أي عمليات سابقة لتجنب تداخل الـ Loops
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    if (stream) stream.getTracks().forEach((track) => track.stop());

    const mediaStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: facingMode,
        width: { ideal: 740 }, // 👈 قلل العرض لـ 480 أو حتى 320
        height: { ideal: 580 },
      },
    });

    videoRef.current.srcObject = mediaStream;
    setStream(mediaStream);

    const { loadFaceModel, detectFace } = await import("../utils/faceModel");
    await loadFaceModel();

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const run = () => {
      if (!videoRef.current || !videoRef.current.srcObject) return;

      if (videoRef.current.readyState < 2) {
        requestRef.current = requestAnimationFrame(run);
        return;
      }

      if (canvas.width !== videoRef.current.videoWidth) {
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
      }

      const result = detectFace(videoRef.current);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (result && result.faceLandmarks) {
        result.faceLandmarks.forEach((landmarks) => {
          // 🛠️ دالة الرسم الذكية للمربعات
          const drawPartBox = (indices, color, label, padding = 0.01) => {
            let minX = 1,
              minY = 1,
              maxX = 0,
              maxY = 0;

            indices.forEach((idx) => {
              const p = landmarks[idx];
              if (p.x < minX) minX = p.x;
              if (p.y < minY) minY = p.y;
              if (p.x > maxX) maxX = p.x;
              if (p.y > maxY) maxY = p.y;
            });

            const x = (minX - padding) * canvas.width;
            const y = (minY - padding) * canvas.height;
            const w = (maxX - minX + padding * 2) * canvas.width;
            const h = (maxY - minY + padding * 2) * canvas.height;

            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, w, h);

            // ملصق النص (Label)
            ctx.fillStyle = color;
            ctx.fillRect(x, y - 15, label.length * 10, 15);
            ctx.fillStyle = "white";
            ctx.font = "bold 10px Arial";
            ctx.fillText(label, x + 3, y - 4);
          };

          // 🎯 تحديد نقاط (Indices) أجزاء الوجه المحدثة
          const leftEyeIndices = [33, 133, 160, 159, 158, 144, 145, 153];
          const rightEyeIndices = [263, 362, 387, 386, 385, 373, 374, 380];

          // نقاط الفم (الشفتين الخارجية والداخلية)
          const mouthIndices = [
            61,
            146,
            91,
            181,
            84,
            17,
            314,
            405,
            321,
            375,
            291, // الشفة السفلية
            185,
            40,
            39,
            37,
            0,
            267,
            269,
            270,
            409, // الشفة العلوية
          ];

          // 🎨 رسم المربعات المحددة
          drawPartBox(leftEyeIndices, "#3498db", "EYE-L"); // أزرق للعين اليسرى
          drawPartBox(rightEyeIndices, "#3498db", "EYE-R"); // أزرق للعين اليمنى
          drawPartBox(mouthIndices, "#f1c40f", "MOUTH"); // أصفر للفم

          // 👤 رسم المربع الرئيسي للوجه بالكامل (أخضر)
          drawPartBox(
            Array.from({ length: 468 }, (_, i) => i),
            "#00FF00",
            "FACE ENGINE",
            0.02,
          );
        });
      }

      requestRef.current = requestAnimationFrame(run);
    };
    setActiveModel("face");
    run();
  };
  // ✋ HAND DETECTION
  const startHandDetection = async () => {
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    if (stream) stream.getTracks().forEach((track) => track.stop());

    const mediaStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: facingMode, width: 740, height: 580 },
    });

    videoRef.current.srcObject = mediaStream;
    setStream(mediaStream);

    const { loadHandModel, detectHands } = await import("../utils/handModel");
    await loadHandModel();

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const HAND_CONNECTIONS = [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [0, 5],
      [5, 6],
      [6, 7],
      [7, 8],
      [5, 9],
      [9, 10],
      [10, 11],
      [11, 12],
      [9, 13],
      [13, 14],
      [14, 15],
      [15, 16],
      [13, 17],
      [0, 17],
      [17, 18],
      [18, 19],
      [19, 20],
    ];

    const run = () => {
      if (!videoRef.current || !videoRef.current.srcObject) return;

      if (videoRef.current.readyState < 2) {
        requestRef.current = requestAnimationFrame(run);
        return;
      }

      if (canvas.width !== videoRef.current.videoWidth) {
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
      }

      const result = detectHands(videoRef.current);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (result && result.landmarks) {
        result.landmarks.forEach((hand) => {
          // رسم العظام (Lines)
          ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
          ctx.lineWidth = 2;
          HAND_CONNECTIONS.forEach(([i, j]) => {
            ctx.beginPath();
            ctx.moveTo(hand[i].x * canvas.width, hand[i].y * canvas.height);
            ctx.lineTo(hand[j].x * canvas.width, hand[j].y * canvas.height);
            ctx.stroke();
          });

          // رسم المفاصل (Points)
          hand.forEach((point) => {
            ctx.beginPath();
            ctx.arc(
              point.x * canvas.width,
              point.y * canvas.height,
              5,
              0,
              2 * Math.PI,
            );
            ctx.fillStyle = "#FF5722"; // لون برتقالي احترافي
            ctx.fill();
          });
        });
      }

      requestRef.current = requestAnimationFrame(run);
    };
    setActiveModel("hand");

    run();
  };

  const toggleCamera = async () => {
    // 1. الاحتفاظ بنوع الموديل الذي يعمل الآن قبل إغلاقه
    const currentModelBeforeSwitch = activeModel;

    // 2. إيقاف الكاميرا والموديل الحالي تماماً
    // ملاحظة: تأكد أن stopWebcam لا تمسح activeModel إلا إذا كان الضغط على زر الإيقاف الأحمر
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }

    // 3. تبديل وضع الكاميرا
    const newFacingMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(newFacingMode);

    // 4. إعادة التشغيل التلقائي للموديل الصحيح
    if (currentModelBeforeSwitch === "face") {
      console.log("Re-starting Face Engine on new camera...");
      setTimeout(() => startFaceDetection(), 500); // تأخير بسيط لضمان استقرار الهاردوير
    } else if (currentModelBeforeSwitch === "hand") {
      console.log("Re-starting Gesture Pro on new camera...");
      setTimeout(() => startHandDetection(), 500);
    }
  };

  return (
    <div className="main-container">
      <header className="hero-header">
        <div className="brand-badge">NEURAL CORE v1.0</div>
        <h1>AI ORCHESTRATOR</h1>
        <p className="system-status">
          <Activity size={14} /> ALL SYSTEMS OPERATIONAL
        </p>
      </header>
      <button className="btn-secondary" onClick={toggleCamera}>
        <Activity size={16} />
        SWITCH TO {facingMode === "user" ? "BACK CAMERA" : "FRONT CAMERA"}
      </button>
      {/* 🎥 CAMERA */}
      <div className="camera-box">
        <div className="camera-stage">
          <video ref={videoRef} autoPlay className="camera-video" playsInline />
          <canvas ref={canvasRef} className="camera-canvas" />
        </div>
      </div>

      <div className="models-grid">
        {/* FACE DETECTION */}
        <section className="model-card-premium">
          <div className="card-glow"></div>
          <div className="card-content">
            <div className="card-header">
              <div className="title-group">
                <div className="icon-box">
                  <ScanFace size={20} />
                </div>
                <h3>FACE ENGINE</h3>
              </div>
            </div>
            <div className="command-box">
              <span className="label">VOICE COMMAND (not wrok)</span>
              <code>"Start Face Detection"</code>
            </div>
            <div className="action-area">
              <button className="btn-primary" onClick={startFaceDetection}>
                <Play size={16} fill="currentColor" /> LAUNCH
              </button>
              <button className="btn-icon">
                <Mic size={18} />
              </button>
            </div>
          </div>
        </section>

        {/* HAND DETECTION */}
        <section className="model-card-premium">
          <div className="card-glow"></div>
          <div className="card-content">
            <div className="card-header">
              <div className="title-group">
                <div className="icon-box">
                  <Hand size={20} />
                </div>
                <h3>Hand PRO</h3>
              </div>
            </div>
            <div className="command-box">
              <span className="label">VOICE COMMAND (not wrok)</span>
              <code>"Track Hand Gestures"</code>
            </div>
            <div className="action-area">
              <button className="btn-primary" onClick={startHandDetection}>
                <Play size={16} fill="currentColor" /> LAUNCH
              </button>
              <button className="btn-icon">
                <Mic size={18} />
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* 🔴 EMERGENCY STOP */}
      <button className="emergency-stop" onClick={stopWebcam}>
        <StopCircle size={20} /> TERMINATE NEURAL THREADS
      </button>
    </div>
  );
}
