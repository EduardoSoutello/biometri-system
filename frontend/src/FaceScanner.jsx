import React, { useRef, useEffect, useState } from 'react';
import * as faceapi from 'face-api.js';

const FaceScanner = ({ onScanSuccess, label = "Align your face to scan" }) => {
  const videoRef = useRef(null);
  const [isModelsLoaded, setIsModelsLoaded] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [status, setStatus] = useState("Loading AI Models...");
  const [error, setError] = useState(false);
  const streamRef = useRef(null);

  useEffect(() => {
    const loadModels = async () => {
      setStatus("Loading Core Systems...");
      try {
        await faceapi.nets.ssdMobilenetv1.loadFromUri('/models');
        await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
        await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
        setIsModelsLoaded(true);
        setStatus("System Ready. Requesting Camera Access...");
        startVideo();
      } catch (err) {
        setStatus("Failed to load models. Check console.");
        console.error(err);
      }
    };
    loadModels();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startVideo = () => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
        }
        setStatus("");
      })
      .catch((err) => {
        console.error("Camera access denied", err);
        setStatus("Camera Access Denied. Required for Biometric Unlock.");
        setError(true);
      });
  };

  const handleVideoOnPlay = async () => {
    if (!isModelsLoaded) return;
    setStatus(label);
  };

  const captureFace = async () => {
    if (!videoRef.current || !isModelsLoaded) return;
    
    setScanning(true);
    setStatus("Scanning Biometrics...");
    setError(false);

    try {
      const detection = await faceapi.detectSingleFace(videoRef.current)
        .withFaceLandmarks()
        .withFaceDescriptor();
      
      if (detection) {
        // detection.descriptor is a Float32Array (128 features)
        const descriptorArray = Array.from(detection.descriptor);
        setStatus("Scan Complete. Verifying...");
        onScanSuccess(descriptorArray);
      } else {
        setStatus("No face detected. Please align and try again.");
        setError(true);
      }
    } catch (err) {
      console.error(err);
      setStatus("Scan Error.");
      setError(true);
    } finally {
      setTimeout(() => setScanning(false), 500);
    }
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <div className={`scanner-frame ${scanning ? 'scanning' : ''} ${error ? 'error' : ''}`}>
        <video 
          ref={videoRef} 
          autoPlay 
          muted 
          onPlay={handleVideoOnPlay}
        />
      </div>
      <p style={{ marginTop: '1rem', height: '20px' }}>
        <span className="mono" style={{ color: error ? 'var(--secondary)' : 'var(--text-main)' }}>{status}</span>
      </p>
      {isModelsLoaded && !error && !scanning && (
        <button onClick={captureFace} className="btn" style={{ marginTop: '1.5rem' }}>
          Initialize Scan
        </button>
      )}
      {error && (
         <button onClick={captureFace} className="btn btn-danger" style={{ marginTop: '1.5rem' }}>
          Retry Scan
       </button>
      )}
    </div>
  );
};

export default FaceScanner;
