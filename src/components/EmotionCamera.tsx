import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, CameraOff, Loader2, ShieldCheck, Cpu, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useEmotionDetection, EmotionResult } from '@/hooks/useEmotionDetection';

interface EmotionCameraProps {
  onMoodDetected: (result: EmotionResult) => void;
}

// Prime browser audio so later auto-speech works on mobile (iOS/Android need a gesture).
const primeAudioOnGesture = () => {
  try {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const u = new SpeechSynthesisUtterance(' ');
      u.volume = 0; // silent unlock
      window.speechSynthesis.speak(u);
    }
    // Also unlock <audio> playback by playing a tiny silent buffer
    const a = new Audio(
      'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQxAADB8AhSmxhIIAAAAA/wAAAEluZm8AAAAPAAAAAwAAAbAAuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4//////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAA//OEZAAAAAGkAAAAAAAAA0gAAAAATEFNRTMuOTlyAc0AAAAALzkAABRGJAJAQgAAQAAAA0g7QAQAAAAA//OEZA8AAAGkAAAAAAAAA0gAAAAA',
    );
    a.volume = 0;
    a.play().catch(() => {});
  } catch {
    /* ignore */
  }
};

export const EmotionCamera = ({ onMoodDetected }: EmotionCameraProps) => {
  const [enabled, setEnabled] = useState(false);
  const [consented, setConsented] = useState(false);
  const { videoRef, status, latest } = useEmotionDetection({ enabled, onMoodTrigger: onMoodDetected });

  const handleAllow = () => {
    primeAudioOnGesture();
    setConsented(true);
    setEnabled(true);
  };

  const handleToggle = () => {
    primeAudioOnGesture();
    setEnabled((v) => !v);
  };

  if (!consented) {
    return (
      <Card className="p-4 border border-border bg-card">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-foreground">Optional: Facial mood sensing</h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Calmora can use your camera to gently sense how you're feeling and check in.
            </p>
            <ul className="mt-2 space-y-1 text-[11px] text-muted-foreground">
              <li className="flex items-center gap-1.5">
                <Cpu className="w-3 h-3 text-primary" /> Runs <strong className="text-foreground">100% on your device</strong> — no frames leave your phone.
              </li>
              <li className="flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-primary" /> Nothing is uploaded, recorded, or stored.
              </li>
              <li className="flex items-center gap-1.5">
                <CameraOff className="w-3 h-3 text-primary" /> You can turn it off anytime with one tap.
              </li>
            </ul>
            <div className="flex gap-2 mt-3">
              <Button size="sm" onClick={handleAllow}>
                <Camera className="w-3.5 h-3.5" /> Allow camera
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setConsented(true)}>
                Not now
              </Button>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-3 border border-border bg-card">
      <div className="flex items-center gap-3">
        <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
          <video ref={videoRef} muted playsInline className="w-full h-full object-cover" />
          <AnimatePresence>
            {status === 'active' && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute top-1 right-1 w-2 h-2 rounded-full bg-destructive animate-pulse"
                aria-label="Camera active"
              />
            )}
          </AnimatePresence>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-xs font-medium text-foreground">
              {status === 'loading' && 'Loading mood sensor…'}
              {status === 'active' && 'Sensing mood gently'}
              {status === 'denied' && 'Camera blocked'}
              {status === 'error' && 'Camera unavailable'}
              {status === 'idle' && 'Mood sensor off'}
            </p>
            {status === 'loading' && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
            {status === 'active' && (
              <Badge variant="outline" className="text-[10px] rounded-full gap-1 border-primary/30 text-primary">
                <Cpu className="w-2.5 h-2.5" /> On-device
              </Badge>
            )}
            {latest && status === 'active' && (
              <Badge variant="outline" className="text-[10px] rounded-full capitalize">
                {latest.emotion} · {Math.round(latest.confidence * 100)}%
              </Badge>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
            <Lock className="w-2.5 h-2.5" /> No images stored or sent · Tap the icon to disable anytime
          </p>
        </div>
        <Button
          size="icon"
          variant={enabled ? 'destructive' : 'default'}
          className="h-8 w-8 flex-shrink-0"
          onClick={handleToggle}
          aria-label={enabled ? 'Turn off camera' : 'Turn on camera'}
          title={enabled ? 'Stop facial detection' : 'Start facial detection'}
        >
          {enabled ? <CameraOff className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
        </Button>
      </div>
    </Card>
  );
};
