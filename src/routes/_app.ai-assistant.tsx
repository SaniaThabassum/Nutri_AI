import { createFileRoute } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useState, useRef, useEffect } from "react";
import { Send, Bot, User as UserIcon } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { PageHeader } from "@/components/page-header";
import { VoiceInput } from "@/components/voice-input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/ai-assistant")({
  head: () => ({ meta: [{ title: "AI Assistant · NutriAI" }, { name: "description", content: "Chat with your AI nutrition coach for personalized advice and meal ideas." }] }),
  component: Assistant,
});

const QUICK = [
  "🍗 Suggest a high-protein meal under 500 calories",
  "💪 How can I gain muscle weight healthily?",
  "🥗 Create a vegetarian meal plan",
  "⚖️ What's my ideal daily protein intake?",
  "🏃 Best meals for post-workout recovery",
  "🌙 Healthy late-night snacks",
];

const INITIAL: UIMessage[] = [{
  id: "welcome",
  role: "assistant",
  parts: [{ type: "text", text: "Hello! I'm your AI Nutrition Assistant. Ask me about meals, macros, recovery snacks, or anything food-related." }],
}];

function Assistant() {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const transport = useRef(new DefaultChatTransport({ api: "/api/chat" }));
  const { messages, sendMessage, status } = useChat({
    messages: INITIAL,
    transport: transport.current,
    onError: (e) => console.error(e),
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const loading = status === "submitted" || status === "streaming";

  function submit(text: string) {
    const t = text.trim();
    if (!t || loading) return;
    void sendMessage({ text: t });
    setInput("");
  }

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-5rem)] flex flex-col">
      <PageHeader title="AI Nutrition Assistant" subtitle="Personalized advice powered by NutriAI." />

      <div ref={scrollRef} className="flex-1 glass rounded-3xl p-6 overflow-y-auto space-y-5">
        {messages.map((m) => {
          const text = m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
          const isUser = m.role === "user";
          return (
            <div
              key={m.id}
              className={cn("flex gap-3 animate-fade-in", isUser ? "flex-row-reverse" : "")}
            >
              <div className={cn("size-9 rounded-xl flex items-center justify-center shrink-0",
                isUser ? "gradient-ocean" : "gradient-primary glow-primary")}>
                {isUser ? <UserIcon className="size-4 text-primary-foreground" /> : <Bot className="size-4 text-primary-foreground" />}
              </div>
              <div className={cn("max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                isUser ? "gradient-primary text-primary-foreground" : "bg-white/5 text-foreground")}>
                {isUser ? (
                  <div>{text}</div>
                ) : (
                  <div className="prose prose-invert prose-sm max-w-none prose-p:my-2 prose-headings:mt-3 prose-headings:mb-1.5 prose-li:my-0.5">
                    <ReactMarkdown>{text || "…"}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {loading && (
          <div className="flex gap-3">
            <div className="size-9 rounded-xl gradient-primary glow-primary flex items-center justify-center"><Bot className="size-4 text-primary-foreground" /></div>
            <div className="bg-white/5 rounded-2xl px-4 py-3 text-sm text-muted-foreground inline-flex gap-1">
              <span className="animate-pulse">●</span><span className="animate-pulse [animation-delay:120ms]">●</span><span className="animate-pulse [animation-delay:240ms]">●</span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4">
        <div className="flex flex-wrap gap-2 mb-3">
          {QUICK.map((q) => (
            <button key={q} onClick={() => submit(q)} className="text-xs glass rounded-full px-3.5 py-2 hover:bg-white/10 transition">{q}</button>
          ))}
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); submit(input); }}
          className="glass-strong rounded-2xl p-3 flex items-center gap-3"
        >
          <VoiceInput onTranscript={(t) => setInput((v) => (v ? v + " " : "") + t)} />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about meals, macros, recovery…"
            className="flex-1 bg-transparent outline-none text-base placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="inline-flex items-center gap-1.5 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold px-4 py-2.5 disabled:opacity-50 glow-primary"
          >
            <Send className="size-4" /> Send
          </button>
        </form>
      </div>
    </div>
  );
}