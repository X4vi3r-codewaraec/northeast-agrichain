/**
 * Assistant engine — rule-based intent router + deterministic numbers
 * (hard project rule: the LLM never produces scores/amounts/ETAs).
 *
 * The intent router and action map are shared between the client fallback
 * (`answerMessage`, works offline) and the server route
 * `POST /api/v1/assistant/chat`, where gpt-4o mini narrates the facts the
 * deterministic engines computed.
 */

export type AssistantAction = {
  label: string;
  href: string;
  icon: "scanPlus" | "cloudRain" | "chart" | "coin" | "truck" | "radio" | "store" | "shield" | "sparkles";
};

export type ChatReply = {
  text: string;
  actions: AssistantAction[];
  intent: string;
  offline?: boolean;
};

/** Where a reply came from — surfaced in the UI footer. */
export type ChatSource = "ai" | "rules" | "offline";

export const QUICK_REPLIES = [
  "What should I sow this week?",
  "Is my turmeric price good?",
  "Find cold storage near Jorhat",
  "My chilli leaves have spots",
  "How do I get a loan?",
];

/** Guardrail: clearly out-of-scope topics get a friendly refusal. */
const OFF_SCOPE: [string, string][] = [
  ["cricket", "I only help with Northeast farming, weather, trade and finance for agriculture."],
  ["recipe", "I can tell you how to store or grade King Chilli for sale — cooking recipes are better suited to a food app."],
  ["movie", "I stick to NER agriculture, climate and supply-chains. Try me on sowing, prices or cold storage."],
  ["share market", "Stock-market tips are outside my scope. For agri credit and insurance numbers, I can help."],
];

const ROUTES: Record<string, [string, string, AssistantAction["icon"]]> = {
  diagnosis: ["AI Crop Protection", "Snap a leaf, get a diagnosis", "scanPlus"],
  weather: ["Weather & Climate", "Block-level forecast + sowing calendar", "cloudRain"],
  prices: ["Price Intelligence", "Mandi vs eNAM, sell or hold", "chart"],
  credit: ["Credit & Insurance", "Loan readiness + index payouts", "coin"],
  map: ["Facilities Map", "Cold storage, labs, pooling hubs", "truck"],
  shipments: ["Shipments", "Track consignments, pool loads", "truck"],
  alerts: ["Early Alerts", "Flood, landslide & frost warnings", "radio"],
  marketplace: ["Marketplace", "Verified lots with escrow", "store"],
} as const;

function act(id: string): AssistantAction {
  const [label, hint, icon] = ROUTES[id];
  return { label: `${label} → ${hint}`, href: `/${id === "diagnosis" ? "diagnose" : id}`, icon };
}

/** Deep-link actions for an intent. Shared by the client and the API. */
const INTENT_ACTIONS: Record<string, string[]> = {
  diagnosis: ["diagnosis", "weather"],
  credit: ["credit", "prices"],
  marketplace: ["marketplace", "prices"],
  map: ["map", "shipments"],
  shipments: ["shipments", "map"],
  alerts: ["alerts", "weather"],
  prices: ["prices", "marketplace", "alerts"],
  weather: ["weather", "alerts"],
  general: ["weather", "diagnosis", "prices", "map"],
};

/** Resolve the action buttons for a detected intent (falls back to `general`). */
export function actionsForIntent(intent: string): AssistantAction[] {
  return (INTENT_ACTIONS[intent] ?? INTENT_ACTIONS.general).map(act);
}

/** Exported so the server route reuses the exact same intent router. */
export function detectIntent(q: string): string {
  const s = q.toLowerCase();
  if (/(leaf|disease|spot|blight|diagnos|photo|image|fungus|yellowing|wilt)/.test(s)) return "diagnosis";
  if (/(loan|credit|insurance|interest|finance|kcc|premium|payout)/.test(s)) return "credit";
  if (/(es crow|escrow|buy |offer|supply|listing|lot)/.test(s)) return "marketplace";
  if (/(cold storage|storage|godown|warehouse|packhouse|laboratory|lab|ripening|auction)/.test(s)) return "map";
  if (/(shipment|shipping|dispatch|track (my )?load|consignment|pool|truck|transport|freight)/.test(s)) return "shipments";
  if (/(price|mandi|enam|sell|sale|market rate|rate now|turmeric price|chilli price|fair value)/.test(s)) return "prices";
  if (/(alert|warning|flood|landslide|frost|early warn)/.test(s)) return "alerts";
  if (/(sow|sowing|plant(ing)?|calendar|itk|variety|crop (suitable|list)|december|january|this week|next week)/.test(s))
    return "weather";
  if (/(forecast|rain|temperature|humidity|weather|hail|storm|drought|sunny)/.test(s)) return "weather";
  return "general";
}

export function answerMessage(raw: string): ChatReply {
  const q = raw.trim().replace(/\s+/g, " ");
  if (!q) {
    return {
      intent: "general",
      text: "Ask me anything about your farm — sowing, weather, prices, cold storage, loans or a sick crop.",
      actions: QUICK_REPLIES.slice(0, 3).map((label) => ({
        label,
        href: "/features",
        icon: "sparkles",
      })),
    };
  }

  for (const [needle, text] of OFF_SCOPE) {
    if (q.toLowerCase().includes(needle)) {
      return { text, actions: [{ label: "See what I can do", href: "/features", icon: "sparkles" }], intent: "off-scope" };
    }
  }

  const intent = detectIntent(q);
  switch (intent) {
    case "diagnosis": {
      return {
        intent,
        text:
          "Take a close-up photo of the affected part in good daylight (under 1.5 MB). I'll pre-process it on your phone, then gpt-4o mini reads the symptoms against the NER registry — 11 crops, graded severity, organic + chemical remedies with dosage and re-visit days. Results sit in your offline history too.",
        actions: actionsForIntent(intent),
      };
    }
    case "credit": {
      return {
        intent,
        text:
          "Your credit readiness comes from district climate risk plus farm history — not a middleman's guess. Pick your district on the Credit page and you'll get an estimated approval band, rate and tenure, plus weather-index policies that auto-pay when rainfall crosses the trigger. Numbers are code-computed, never guessed by the model.",
        actions: actionsForIntent(intent),
      };
    }
    case "marketplace": {
      return {
        intent,
        text:
          "Listings carry grade, organic/GI certification and trace-to-farm proof. Payment goes into escrow and releases on delivery proof — that's how a smallholder sells 400 kg without a middleman, and a buyer buys without a default. You can filter by crop, state, grade and organic-only.",
        actions: actionsForIntent(intent),
      };
    }
    case "map": {
      return {
        intent,
        text:
          "There are 8 demo facilities across the NER map. The route engine is elevation-aware: it slows the estimate over climbs, shows the gain profile, and predicts shelf life on arrival. Bookings currently open through the demo hub on the Map page.",
        actions: actionsForIntent(intent),
      };
    }
    case "shipments": {
      return {
        intent,
        text:
          "The board tracks status from pickup to delivery with a shelf-life index for perishable lots. Pooling combines small consignments on one truck to cut freight per kilo — say the word and the wizard will suggest a pool for your route.",
        actions: actionsForIntent(intent),
      };
    }
    case "alerts": {
      return {
        intent,
        text:
          "Early warnings are organized by severity with district subscriptions and phone-bridge delivery. Acknowledge an alert and the board learns you've seen it — the advisory TTS reads it aloud even offline.",
        actions: actionsForIntent(intent),
      };
    }
    case "prices": {
      return {
        intent,
        text:
          "King Chilli, Lakadong Turmeric, Queen Pineapple and more each have a 30-day trend, mandi vs eNAM quote and a rule-based sell-or-hold signal from momentum math. The fair-value band tells you if today's rate is high, inside, or below the range. Live feeds land with the FastAPI service.",
        actions: actionsForIntent(intent),
      };
    }
    case "weather": {
      return {
        intent,
        text:
          "This week's block forecast drives the sowing calendar for your district, with indigenous-knowledge tips (ITK) in the loop. If rain or frost crosses warning thresholds, the alert board fires — subscribe your district to stay ahead.",
        actions: actionsForIntent(intent),
      };
    }
    default: {
      return {
        intent,
        text:
          "I can help with 7 things today: sow-and-weather, crop diagnosis, prices, cold storage & routing, shipments, early alerts, and credit or insurance. Pick a quick reply, or ask in your own words — voice works too via the mic button.",
        actions: actionsForIntent(intent),
      };
    }
  }
}

/** Simulated SSE streaming: yield the reply in ~24ms chunks. */
export function chunkReply(text: string): string[] {
  const words = text.split(" ");
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += 4) {
    chunks.push(words.slice(i, i + 4).join(" "));
  }
  return chunks;
}
