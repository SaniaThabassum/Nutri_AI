import { Mic, MicOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type SR = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
  onend: () => void;
  onerror: (e: unknown) => void;
  start: () => void;
  stop: () => void;
};

export function VoiceInput({ onTranscript, className }: { onTranscript: (text: string) => void; className?: string }) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const recogRef = useRef<SR | null>(null);

  useEffect(() => {
    const win = window as unknown as { SpeechRecognition?: new () => SR; webkitSpeechRecognition?: new () => SR };
    const Ctor = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!Ctor) { setSupported(false); return; }
    const r = new Ctor();
    r.lang = "en-US";
    r.interimResults = false;
    r.continuous = false;
    r.onresult = (e) => {
      const text = Array.from(e.results).map((res) => res[0].transcript).join(" ").trim();
      if (text) onTranscript(text);
    };
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    recogRef.current = r;
    return () => r.stop();
  }, [onTranscript]);

  function toggle() {
    if (!recogRef.current) return;
    if (listening) { recogRef.current.stop(); setListening(false); }
    else { recogRef.current.start(); setListening(true); }
  }

  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={listening ? "Stop voice input" : "Start voice input"}
      className={cn(
        "relative size-11 rounded-full flex items-center justify-center transition-all",
        listening ? "gradient-primary text-primary-foreground glow-primary" : "glass text-foreground hover:bg-white/10",
        className,
      )}
    >
      {listening && <span className="absolute inset-0 rounded-full bg-primary/40 animate-ping" />}
      {listening ? <Mic className="size-5 relative" /> : <MicOff className="size-5 relative" />}
    </button>
  );
}