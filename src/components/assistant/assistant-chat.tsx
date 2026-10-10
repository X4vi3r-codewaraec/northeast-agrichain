"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { Eyebrow } from "@/components/ui/primitives";
import { useSpeech } from "@/hooks/use-speech";
import { answerMessage, chunkReply, QUICK_REPLIES, type AssistantAction } from "@/lib/assistant";

type Msg = {
  id: string;
  role: "user" | "assistant";
  text: string;
  actions: AssistantAction[];
  done: boolean;
};

let seq = 0;
const nextId = () => `m${++seq}`;

const GREETING: Msg = {
  id: nextId(),
  role: "assistant",
  text:
    "Hello! I'm your NER agriculture assistant — sowing, weather, sick crops, prices, storage, shipments and credit. Ask in your own words or tap a quick reply. Voice works via the mic.",
  actions: [
    { label: "Diagnose a crop", href: "/diagnose", icon: "scanPlus" },
    { label: "Check prices", href: "/prices", icon: "chart" },
    { label: "Cold storage near me", href: "/map", icon: "truck" },
  ],
  done: true,
};

function ActionButton({ a }: { a: AssistantAction }) {
  return (
    <Link
      href={a.href}
      className="inline-flex items-center gap-1.5 rounded-full border border-forest-950/12 bg-white px-3.5 py-1.5 text-xs font-bold text-forest-800 transition hover:border-forest-600/35 hover:bg-forest-50"
    >
      <Icon name={a.icon} className="h-3.5 w-3.5" />
      {a.label}
    </Link>
  );
}

export default function AssistantChat() {
  const { speak, stop, speaking, supported } = useSpeech("en-IN");
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [listening, setListening] = useState(false);
  const [micUnsupported, setMicUnsupported] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [rateNotice, setRateNotice] = useState(false);
  const [offline, setOffline] = useState(false);

  const streamRef = useRef<{ id: string; buf: string; chunks: string[] } | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recogRef = useRef<{ stop: () => void } | null>(null);
  const budgetRef = useRef(10); // token bucket: +1 per minute, max 10
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setOffline(typeof navigator !== "undefined" && navigator.onLine === false);
    }, 0);
    return () => {
      clearTimeout(t);
      if (intervalRef.current) clearInterval(intervalRef.current);
      recogRef.current?.stop?.();
    };
  }, []);

  // Keep latest message in view while streaming.
  useEffect(() => {
    if (streaming && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streaming]);

  const finishStream = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    streamRef.current = null;
    setStreaming(false);
  };

  const send = (raw: string) => {
    const text = raw.trim();
    if (!text || streaming) return;

    if (budgetRef.current <= 0) {
      setRateNotice(true);
      return;
    }
    budgetRef.current -= 1;
    setRateNotice(false);
    setTimeout(() => {
      budgetRef.current = Math.min(10, budgetRef.current + 1);
    }, 60_000);

    const userMsg: Msg = { id: nextId(), role: "user", text, actions: [], done: true };
    const reply = answerMessage(text);
    const replyId = nextId();
    const replyMsg: Msg = {
      id: replyId,
      role: "assistant",
      text: "",
      actions: reply.actions,
      done: false,
    };
    setMessages((prev) => [...prev, userMsg, replyMsg]);
    setInput("");

    const chunks = chunkReply(reply.text);
    streamRef.current = { id: replyId, buf: "", chunks };
    setStreaming(true);
    intervalRef.current = setInterval(() => {
      const s = streamRef.current;
      if (!s) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = null;
        return;
      }
      if (s.chunks.length === 0) {
        setMessages((prev) =>
          prev.map((m) => (m.id === s.id ? { ...m, text: s.buf, done: true } : m)),
        );
        const full = s.buf;
        finishStream();
        if (autoSpeak) speak(full);
        return;
      }
      s.buf = `${s.buf} ${s.chunks.shift()}`.trim();
      setMessages((prev) => prev.map((m) => (m.id === s.id ? { ...m, text: s.buf } : m)));
    }, 60);
  };

  const startMic = () => {
    if (typeof window === "undefined") return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setMicUnsupported(true);
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r: any = new SR();
    r.lang = "en-IN";
    r.interimResults = false;
    r.maxAlternatives = 1;
    r.onresult = (e: { results: { [k: number]: { [k: number]: { transcript: string } } } }) => {
      const transcript = e.results?.[0]?.[0]?.transcript ?? "";
      setInput(transcript);
    };
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    recogRef.current = r;
    r.start();
    setListening(true);
    setMicUnsupported(false);
  };

  return (
    <div className="bg-sand-50">
      <div className="border-b border-forest-950/6 bg-white">
        <div className="mx-auto w-full max-w-5xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-forest-800 text-gold-400">
                <Icon name="sparkles" className="h-6 w-6" />
                {streaming ? (
                  <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold-400 opacity-60" />
                    <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-gold-400" />
                  </span>
                ) : null}
              </span>
              <div>
                <h1 className="font-display text-2xl font-semibold tracking-tight text-ink-900">
                  Agri Assistant
                </h1>
                <p className="text-xs font-medium uppercase tracking-wide text-ink-400">
                  gpt-4o mini · voice-first · replies deep-link into modules
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAutoSpeak((v) => !v)}
                className={`inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-xs font-bold transition ${
                  autoSpeak
                    ? "bg-forest-800 text-sand-50"
                    : "border border-forest-950/12 bg-sand-50 text-ink-600"
                }`}
              >
                <Icon name="radio" className="h-3.5 w-3.5" />
                {autoSpeak ? "Read aloud on" : "Read aloud off"}
              </button>
              {supported ? (
                <button
                  onClick={() => (speaking ? stop() : messages[messages.length - 1]?.role === "assistant" && speak(messages[messages.length - 1].text))}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full border border-forest-950/12 bg-sand-50 px-3.5 text-xs font-bold text-ink-600 transition hover:border-forest-600/30"
                >
                  <Icon name={speaking ? "check" : "radio"} className="h-3.5 w-3.5" />
                  {speaking ? "Stop" : "Replay"}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-3xl border border-forest-950/8 bg-white shadow-sm">
          {/* Chat canvas */}
          <div ref={scrollRef} className="h-[480px] space-y-4 overflow-y-auto p-5 sm:p-6">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    m.role === "user"
                      ? "rounded-br-md bg-forest-800 text-sand-50"
                      : "rounded-bl-md border border-forest-950/8 bg-sand-50 text-ink-800"
                  }`}
                >
                  {m.role === "assistant" && !m.done && m.text === "" ? (
                    <span className="flex items-center gap-1.5 py-1 text-ink-400">
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className="h-2 w-2 animate-bounce rounded-full bg-forest-600"
                          style={{ animationDelay: `${i * 140}ms` }}
                        />
                      ))}
                    </span>
                  ) : (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.text}</p>
                  )}
                  {m.done && m.actions.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {m.actions.map((a, i) => (
                        <ActionButton key={`${m.id}-${i}`} a={a} />
                      ))}
                    </div>
                  ) : null}
                  {m.role === "assistant" && m.done ? (
                    <div className="mt-2 flex items-center gap-1.5 text-[10px] font-semibold text-ink-400">
                      <Icon name="sparkles" className="h-3 w-3" />
                      gpt-4o mini · rule-based demo
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          {/* Quick replies */}
          <div className="flex flex-wrap gap-2 border-t border-forest-950/6 bg-white px-5 pt-3 pb-1">
            {QUICK_REPLIES.map((q) => (
              <button
                key={q}
                onClick={() => send(q)}
                disabled={streaming}
                className="rounded-full border border-forest-950/12 bg-sand-50 px-3.5 py-1.5 text-xs font-semibold text-ink-700 transition hover:border-forest-600/35 hover:text-forest-800 disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Composer */}
          <div className="border-t border-forest-950/6 bg-white p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="flex items-center gap-2"
            >
              <button
                type="button"
                onClick={startMic}
                disabled={listening}
                title={micUnsupported ? "Voice input not supported in this browser" : "Speak your question"}
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition ${
                  listening
                    ? "bg-red-600 text-white"
                    : "bg-forest-50 text-forest-700 ring-1 ring-forest-600/15 hover:bg-forest-100"
                } disabled:opacity-60`}
              >
                <Icon name="mic" className="h-5 w-5" />
              </button>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={listening ? "Listening…" : "Ask about sowing, prices, storage or a sick crop…"}
                className="h-12 flex-1 rounded-full border border-forest-950/12 bg-sand-50 px-5 text-sm text-ink-900 outline-none transition placeholder:text-ink-400 focus:border-forest-600/50 focus:ring-2 focus:ring-forest-600/20"
              />
              <button
                type="submit"
                disabled={streaming || !input.trim()}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-forest-800 text-sand-50 transition hover:bg-forest-700 disabled:opacity-40"
                aria-label="Send"
              >
                <Icon name="arrowRight" className="h-5 w-5" />
              </button>
            </form>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-medium text-ink-400">
              <span className="inline-flex items-center gap-1">
                <Icon name="shield" className="h-3 w-3 text-forest-600" />
                Stays on NER agriculture; no personal data leaves your device until you send.
              </span>
              <span>10 msgs/min</span>
              {offline ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 font-bold text-orange-800">
                  Offline — canned answers only
                </span>
              ) : null}
              {rateNotice ? (
                <span className="rounded-full bg-orange-100 px-2 py-0.5 font-bold text-orange-800">
                  Slow down — limit is 10 per minute
                </span>
              ) : null}
              {micUnsupported ? (
                <span className="rounded-full bg-orange-100 px-2 py-0.5 font-bold text-orange-800">
                  Voice input needs Chrome/Edge
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-3xl bg-forest-900 p-6 text-sand-50 shadow-lg sm:p-8">
          <Eyebrow dark>How replies work</Eyebrow>
          <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: "chart" as const,
                title: "Numbers are code",
                body: "Scores, amounts and ETAs inside answers are computed, never generated by the model — it only narrates and routes.",
              },
              {
                icon: "scanPlus" as const,
                title: "Deep-link actions",
                body: "Every reply carries buttons that open the exact module — photo diagnosis, price signal, storage map, loan estimate.",
              },
              {
                icon: "radio" as const,
                title: "Voice-first",
                body: "Ask by mic, hear answers aloud via TTS. Low-literacy friendly, at 0.75–1.25× speed in Settings later.",
              },
            ].map((c) => (
              <div key={c.title}>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-400/15 text-gold-300">
                  <Icon name={c.icon} className="h-5 w-5" />
                </span>
                <h3 className="mt-3 font-display text-base font-semibold">{c.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-forest-100/75">{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}