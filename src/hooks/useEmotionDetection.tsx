import { useCallback, useEffect, useRef, useState } from 'react';
import * as faceapi from '@vladmandic/face-api';

const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/model';
const BUFFER_SIZE = 5;
const TRIGGER_THRESHOLD = 3; // need 3 matching frames -> avoids over-triggering on noise
const CONFIDENCE_THRESHOLD = 0.4; // balanced: catches real emotion, ignores random fluctuations
const COOLDOWN_MS = 45_000; // give the user time to chat without re-triggering
const CAPTURE_INTERVAL_MS = 3500;

export type Emotion = 'happy' | 'sad' | 'neutral' | 'angry' | 'fearful' | 'disgusted' | 'surprised';

export interface EmotionResult {
  emotion: Emotion;
  confidence: number;
  timestamp: number;
}

let modelsLoadedPromise: Promise<void> | null = null;
const loadModels = () => {
  if (!modelsLoadedPromise) {
    modelsLoadedPromise = Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
    ]).then(() => undefined);
  }
  return modelsLoadedPromise;
};

interface Options {
  enabled: boolean;
  /** Fires whenever a stable emotion is detected (any mood, not just sad). */
  onMoodTrigger: (latest: EmotionResult) => void;
}

export const useEmotionDetection = ({ enabled, onMoodTrigger }: Options) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<number | null>(null);
  const bufferRef = useRef<EmotionResult[]>([]);
  const lastTriggerRef = useRef<number>(0);
  const [status, setStatus] = useState<'idle' | 'loading' | 'active' | 'denied' | 'error'>('idle');
  const [latest, setLatest] = useState<EmotionResult | null>(null);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    bufferRef.current = [];
    setStatus('idle');
  }, []);

  const analyzeFrame = useCallback(async () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return;
    if (typeof document !== 'undefined' && document.hidden) return; // skip when tab hidden

    try {
      const detection = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.3 }))
        .withFaceExpressions();

      if (!detection?.expressions) return; // no face -> ignore

      const expressions = detection.expressions as unknown as Record<string, number>;
      let topEmotion: Emotion = 'neutral';
      let topScore = 0;
      for (const [name, score] of Object.entries(expressions)) {
        // Slightly down-weight neutral so subtle real emotions surface
        const adjusted = name === 'neutral' ? score * 0.7 : score;
        if (adjusted > topScore) {
          topScore = adjusted;
          topEmotion = name as Emotion;
        }
      }

      if (topScore < CONFIDENCE_THRESHOLD) return; // low confidence -> ignore

      const result: EmotionResult = { emotion: topEmotion, confidence: topScore, timestamp: Date.now() };
      setLatest(result);

      const buf = bufferRef.current;
      buf.push(result);
      if (buf.length > BUFFER_SIZE) buf.shift();

      // Trigger when same emotion appears in >= TRIGGER_THRESHOLD recent frames
      const counts: Record<string, number> = {};
      for (const r of buf) {
        if (r.confidence > CONFIDENCE_THRESHOLD) counts[r.emotion] = (counts[r.emotion] || 0) + 1;
      }
      let dominant: Emotion | null = null;
      let dominantCount = 0;
      for (const [name, c] of Object.entries(counts)) {
        if (c > dominantCount) { dominantCount = c; dominant = name as Emotion; }
      }
      const now = Date.now();
      if (dominant && dominantCount >= TRIGGER_THRESHOLD && now - lastTriggerRef.current > COOLDOWN_MS) {
        lastTriggerRef.current = now;
        bufferRef.current = [];
        onMoodTrigger({ ...result, emotion: dominant });
      }
    } catch (err) {
      // swallow per-frame errors
      console.warn('[emotion] frame error', err);
    }
  }, [onMoodTrigger]);

  const start = useCallback(async () => {
    setStatus('loading');
    try {
      await loadModels();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 320 }, height: { ideal: 240 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setStatus('active');
      intervalRef.current = window.setInterval(analyzeFrame, CAPTURE_INTERVAL_MS);
    } catch (err: any) {
      console.error('[emotion] start failed', err);
      setStatus(err?.name === 'NotAllowedError' ? 'denied' : 'error');
    }
  }, [analyzeFrame]);

  useEffect(() => {
    if (enabled && status === 'idle') {
      start();
    }
    if (!enabled && status !== 'idle') {
      stop();
    }
    return () => {
      // cleanup on unmount
      if (!enabled) return;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  useEffect(() => () => stop(), [stop]);

  return { videoRef, status, latest, start, stop };
};
