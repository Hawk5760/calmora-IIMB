import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Mic, MicOff, Loader2, X, Heart, Volume2, VolumeX, Settings2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useVoiceRecognition } from "@/hooks/useVoiceRecognition";
import { usePersonalization } from "@/hooks/usePersonalization";
import { inferThemes } from "@/utils/inferContext";
import mindoMascotBlue from "@/assets/mindo-mascot-blue.png";

interface ChatMessage {
  id: string;
  role: "user" | "ai";
  text: string;
  timestamp: number;
}

interface PastMoodEntry {
  mood: string;
  note: string;
  timestamp: Date | string;
}

interface MoodChatPanelProps {
  /** Detected emotion that triggers/contextualizes the chat. */
  triggerEmotion?: string | null;
  /** Optional confidence (0-1) to display. */
  confidence?: number;
  /** Whether the panel is open. */
  open: boolean;
  onClose: () => void;
  /** Recent past mood entries (most recent last) used as memory for personalization. */
  pastEntries?: PastMoodEntry[];
}

const warmOpeners: Record<string, string> = {
  sad: "Hey, I'm right here with you. I can see something feels heavy right now — and that's okay. Want to tell me what's going on? I'm listening, no judgment at all.",
  fearful: "Hey, take a breath with me. You look a little worried — I'm here, and you're safe. What's on your mind?",
  angry: "Hey, I see you. It looks like something's frustrating you, and that's completely valid. Want to talk it out with me?",
  disgusted: "Hey, something doesn't feel right, huh? I'm here to listen — share whatever's bothering you.",
  happy: "Hey, I love seeing that smile! You look really good right now. What's making your day feel bright?",
  surprised: "Oh wow, something caught you off guard! Tell me — what just happened?",
  neutral: "Hey, I'm Mindo. Just checking in — how are you really feeling right now? You can talk or type, I'm all ears.",
};

export const MoodChatPanel = ({ triggerEmotion, confidence, open, onClose, pastEntries = [] }: MoodChatPanelProps) => {
  const { data: personalization } = usePersonalization();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [volume, setVolume] = useState(0.85);
  const [rate, setRate] = useState(0.95);
  const listRef = useRef<HTMLDivElement>(null);
  const startedForRef = useRef<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const volumeRef = useRef(volume);
  const rateRef = useRef(rate);

  useEffect(() => { volumeRef.current = volume; if (audioRef.current) audioRef.current.volume = volume; }, [volume]);
  useEffect(() => { rateRef.current = rate; if (audioRef.current) audioRef.current.playbackRate = rate; }, [rate]);

  const { isRecording, startRecording, stopRecording } = useVoiceRecognition((t) => {
    setInput((prev) => prev + (prev ? " " : "") + t);
  });

  // Stop any ongoing speech (used for interrupts and mute)
  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  // Browser SpeechSynthesis — most reliable on mobile after user gesture
  const speakWithBrowser = useCallback((clean: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      setIsSpeaking(false);
      return;
    }
    const utter = new SpeechSynthesisUtterance(clean.slice(0, 500));
    utter.rate = rateRef.current;
    utter.pitch = 1.05;
    utter.volume = volumeRef.current;
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find((v) => /female|samantha|karen|google.*(female|us|uk)|zira/i.test(v.name))
      || voices.find((v) => v.lang?.startsWith("en"));
    if (preferred) utter.voice = preferred;
    utter.onend = () => setIsSpeaking(false);
    utter.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utter);
  }, []);

  // Speak text — try ElevenLabs first, gracefully fall back to browser TTS (mobile-friendly)
  const speak = useCallback(async (text: string) => {
    if (!voiceEnabled || !text) return;
    stopSpeaking();
    const clean = text
      .replace(/[\p{Extended_Pictographic}]/gu, "")
      .replace(/\*+/g, "")
      .trim();
    if (!clean) return;

    setIsSpeaking(true);
    try {
      const { data, error } = await supabase.functions.invoke("elevenlabs-tts", {
        body: { text: clean.slice(0, 500) },
      });
      if (error) throw error;

      let blob: Blob | null = null;
      if (data instanceof Blob) blob = data;
      else if (data instanceof ArrayBuffer) blob = new Blob([data], { type: "audio/mpeg" });

      if (blob && blob.size > 0) {
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.volume = volumeRef.current;
        audio.playbackRate = rateRef.current;
        audioRef.current = audio;
        audio.onended = () => { setIsSpeaking(false); URL.revokeObjectURL(url); };
        audio.onerror = () => { setIsSpeaking(false); URL.revokeObjectURL(url); speakWithBrowser(clean); };
        try {
          await audio.play();
          return;
        } catch {
          // Autoplay blocked on mobile — fall back to browser TTS
          speakWithBrowser(clean);
          return;
        }
      }
      throw new Error("No audio");
    } catch {
      speakWithBrowser(clean);
    }
  }, [voiceEnabled, stopSpeaking, speakWithBrowser]);

  // Auto-start conversation when opened with an emotion (only once per emotion session)
  useEffect(() => {
    if (!open || !triggerEmotion) return;
    const key = `${triggerEmotion}-${Math.floor(Date.now() / 60000)}`;
    if (startedForRef.current === key) return;
    startedForRef.current = key;

    const opener = warmOpeners[triggerEmotion] || warmOpeners.neutral;
    setMessages([{ id: crypto.randomUUID(), role: "ai", text: opener, timestamp: Date.now() }]);
    // Speak the opener
    speak(opener);
  }, [open, triggerEmotion, speak]);

  // Cleanup on close/unmount
  useEffect(() => {
    if (!open) stopSpeaking();
    return () => stopSpeaking();
  }, [open, stopSpeaking]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", text: trimmed, timestamp: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    const history = messages.slice(-10).map((m) => ({
      role: m.role === "user" ? "user" : "assistant",
      content: m.text,
    }));

    try {
      // Build a compact memory from past mood entries
      const memory = pastEntries.slice(-5).map((e) => {
        const t = typeof e.timestamp === 'string' ? new Date(e.timestamp) : e.timestamp;
        const when = isNaN(t.getTime()) ? '' : t.toLocaleDateString();
        return `- ${when} felt ${e.mood}: "${(e.note || '').slice(0, 120)}"`;
      }).join('\n');

      const contextParts: string[] = [];
      if (triggerEmotion) {
        contextParts.push(`[Facial sensor detected the user appearing "${triggerEmotion}". Be warm, gentle, and validating.]`);
      }
      if (memory) {
        contextParts.push(`[User's recent mood history for personalization — refer back naturally if relevant:\n${memory}]`);
      }
      contextParts.push(`[IMPORTANT: Reply in the SAME language/script the user wrote in. If they wrote pure English, reply in English. If they wrote Hindi in Devanagari, reply in Hindi. If they mixed (Hinglish), mirror their style. Never force Hinglish.]`);

      const contextNote = contextParts.join('\n');
      const recentText = [...messages.slice(-6).map(m => m.text), trimmed].join(' ');
      const themes = personalization.scope !== 'off' ? inferThemes(recentText) : [];
      const personaPayload = personalization.scope !== 'off'
        ? { gender: personalization.gender, ageRange: personalization.ageRange, role: personalization.role }
        : undefined;

      const { data, error } = await supabase.functions.invoke("gemini-chat", {
        body: {
          message: `${contextNote}\n\nUser: ${trimmed}`,
          mood: triggerEmotion || "neutral",
          history,
          personalization: personaPayload,
          inferredThemes: themes,
        },
      });
      const reply =
        (!error && data?.response) ||
        "I'm right here with you. Tell me a bit more about how you're feeling.";
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "ai", text: reply, timestamp: Date.now() }]);
      speak(reply);
    } catch {
      const fallback = "I'm here with you. Take your time — share whatever feels right.";
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "ai", text: fallback, timestamp: Date.now() },
      ]);
      speak(fallback);
    } finally {
      setIsLoading(false);
    }
  };

  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="w-full max-w-2xl mx-auto"
    >
      <Card className="overflow-hidden border border-primary/30 bg-card shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-primary/5">
          <div className="flex items-center gap-2.5">
            <img src={mindoMascotBlue} alt="Mindo" className="w-8 h-8 object-contain" />
            <div>
              <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                Mindo is here <Heart className="w-3 h-3 text-primary fill-primary" />
              </p>
              {triggerEmotion && (
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  <Badge variant="outline" className="text-[9px] rounded-full capitalize px-1.5 py-0 border-primary/30 text-primary">
                    {triggerEmotion}
                  </Badge>
                  {confidence ? (
                    <span className="text-[10px] text-muted-foreground">{Math.round(confidence * 100)}% sure · You're safe here</span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground">You're safe here</span>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" aria-label="Voice settings" title="Voice settings">
                  <Settings2 className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-60 p-3 space-y-3" align="end">
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-medium text-foreground">Volume</span>
                    <span className="text-[10px] text-muted-foreground">{Math.round(volume * 100)}%</span>
                  </div>
                  <Slider min={0} max={1} step={0.05} value={[volume]} onValueChange={(v) => setVolume(v[0])} />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-medium text-foreground">Speech rate</span>
                    <span className="text-[10px] text-muted-foreground">{rate.toFixed(2)}x</span>
                  </div>
                  <Slider min={0.7} max={1.2} step={0.05} value={[rate]} onValueChange={(v) => setRate(v[0])} />
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Mindo auto-pauses when you start talking or typing.
                </p>
              </PopoverContent>
            </Popover>
            <Button
              variant="ghost"
              size="icon"
              className={`h-7 w-7 ${isSpeaking ? "text-primary animate-pulse" : "text-muted-foreground"}`}
              onClick={() => {
                if (voiceEnabled) { stopSpeaking(); setVoiceEnabled(false); }
                else { setVoiceEnabled(true); }
              }}
              aria-label={voiceEnabled ? "Mute Mindo's voice" : "Unmute Mindo's voice"}
              title={voiceEnabled ? "Mute voice" : "Unmute voice"}
            >
              {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose} aria-label="Close chat">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>


        {/* Messages */}
        <div ref={listRef} className="h-[320px] overflow-y-auto px-4 py-4 space-y-3">
          <AnimatePresence initial={false}>
            {messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.role === "ai" && (
                  <img
                    src={mindoMascotBlue}
                    alt=""
                    className="w-7 h-7 rounded-full object-contain bg-muted/60 p-0.5 flex-shrink-0 mt-0.5"
                  />
                )}
                <div
                  className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted/60 text-foreground rounded-bl-md border border-border/40"
                  }`}
                >
                  {m.text}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {isLoading && (
            <div className="flex gap-2 items-end">
              <img src={mindoMascotBlue} alt="" className="w-7 h-7 rounded-full object-contain bg-muted/60 p-0.5" />
              <div className="bg-muted/60 rounded-2xl rounded-bl-md px-3.5 py-2.5 border border-border/40">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="px-3 py-3 border-t border-border/50 bg-background/40">
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center bg-muted/60 rounded-full border border-border/50 px-3 py-1.5 focus-within:border-primary/50 transition-colors">
              <input
                value={input}
                onChange={(e) => { if (isSpeaking) stopSpeaking(); setInput(e.target.value); }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send(input);
                  }
                }}
                placeholder="Talk to Mindo... I'm listening 💙"
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
              />
              <Button
                onClick={() => { stopSpeaking(); isRecording ? stopRecording() : startRecording(); }}
                variant="ghost"
                size="icon"
                className={`h-7 w-7 rounded-full flex-shrink-0 ${
                  isRecording ? "text-destructive animate-pulse" : "text-muted-foreground"
                }`}
                aria-label={isRecording ? "Stop voice" : "Start voice"}
              >
                {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
              </Button>
            </div>
            <Button
              onClick={() => send(input)}
              size="icon"
              className="rounded-full h-9 w-9 flex-shrink-0"
              disabled={isLoading || !input.trim()}
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground text-center mt-2">
            🌿 Camera stays on so Mindo can keep gently checking in. You're in control — close anytime.
          </p>
        </div>
      </Card>
    </motion.div>
  );
};
