"use client";

import { useCallback, useEffect, useState } from "react";
import { getVoiceRate } from "@/lib/settings";

/** Web Speech API wrapper. Returns true when speech started; false when the
 *  browser has no speech engine (old Android, some desktop browsers). */
export function useSpeech(lang = "en-IN") {
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const has = "speechSynthesis" in window;
    const t = setTimeout(() => setSupported(has), 0);
    return () => {
      clearTimeout(t);
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        return false;
      }
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text.replace(/\s+/g, " ").trim());
      utter.lang = lang;
      utter.rate = getVoiceRate();
      utter.onend = () => setSpeaking(false);
      utter.onerror = () => setSpeaking(false);
      setSpeaking(true);
      window.speechSynthesis.speak(utter);
      return true;
    },
    [lang],
  );

  const stop = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
    }
  }, []);

  return { speak, stop, speaking, supported };
}