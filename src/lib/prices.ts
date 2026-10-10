/** Price intelligence — deterministic demo series + rule-based advisory.
 *  Series are code-generated random walks with trend; the "sell/hold" signal
 *  and fair-value band come from momentum math, never the LLM. (Live feeds:
 *  mandi/eNAM via the FastAPI service later.) */

export type PriceSignal = "sell" | "hold" | "watch";

export type CropPriceProfile = {
  cropId: string;
  cropName: string;
  unit: string;
  priceToday: number;
  price7: number;
  price30: number;
  avg90: number;
  high90: number;
  low90: number;
  trend7Pct: number;
  trend30Pct: number;
  mandiPrice: number;
  eNamPrice: number;
  fairValueBand: [number, number];
  signal: PriceSignal;
  signalNote: string;
  series: { date: string; price: number }[];
};

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const BASE_PRICE: Record<string, number> = {
  "king-chilli": 240,
  "lakadong-turmeric": 620,
  "queen-pineapple": 42,
  "large-cardamom": 1140,
  "joha-rice": 105,
  "assam-tea": 185,
  kiwi: 260,
  "mizo-ginger": 118,
};

const TREND: Record<string, number> = {
  "king-chilli": 0.32,
  "lakadong-turmeric": 0.18,
  "queen-pineapple": -0.1,
  "large-cardamom": 0.2,
  "joha-rice": 0.06,
  "assam-tea": -0.05,
  kiwi: 0.1,
  "mizo-ginger": 0.24,
};

const CROP_LABEL: Record<string, string> = {
  "king-chilli": "King Chilli",
  "lakadong-turmeric": "Lakadong Turmeric",
  "queen-pineapple": "Queen Pineapple",
  "large-cardamom": "Large Cardamom",
  "joha-rice": "Joha Rice",
  "assam-tea": "Assam Tea",
  kiwi: "Kiwi",
  "mizo-ginger": "Mizo Ginger",
};

export function buildPriceProfiles(now: Date = new Date()): CropPriceProfile[] {
  const profiles: CropPriceProfile[] = [];
  for (const cropId of Object.keys(BASE_PRICE)) {
    const rand = mulberry32(hashSeed(cropId));
    const base = BASE_PRICE[cropId];
    const trend = TREND[cropId];
    const out: { date: string; price: number }[] = [];
    let price = base * 0.82;
    for (let i = 89; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const seasonal = Math.sin((i / 90) * Math.PI) * (trend * base * 0.5);
      const step = (rand() - 0.47) * base * 0.02;
      price = Math.max(base * 0.5, price + step + seasonal / 15);
      out.push({ date: d.toISOString().slice(0, 10), price: Math.round(price) });
    }
    const series = out.slice(-30); // keep last 30 days for the UI
    const price7 = out[out.length - 8]?.price ?? price;
    const price30 = out[out.length - 31]?.price ?? price;
    const tail = out.slice(-90);
    const prices = tail.map((p) => p.price);
    const avg90 = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
    const high90 = Math.max(...prices);
    const low90 = Math.min(...prices);
    const priceToday = prices[prices.length - 1];
    const trend7Pct = Number((((priceToday - price7) / price7) * 100).toFixed(1));
    const trend30Pct = Number((((priceToday - price30) / price30) * 100).toFixed(1));

    const band = [Math.round(base * 0.88), Math.round(base * 1.12)] as [number, number];
    const fairMid = (band[0] + band[1]) / 2;

    let signal: PriceSignal;
    let signalNote: string;
    if (priceToday > fairMid * 1.04 && trend7Pct > 0) {
      signal = "sell";
      signalNote = "Above the 30-day fair band with upward momentum — good time to list surplus. Move before the next arrival wave.";
    } else if (priceToday < fairMid * 0.92) {
      signal = "watch";
      signalNote = "Below the fair band. Holding 5–7 days usually recovers price if cold-chain space is available; consider forward contracts instead.";
    } else {
      signal = "hold";
      signalNote = "Inside the fair band with steady momentum. Hold graded lots ~1 week or book a pooled load for the nearest peak.";
    }

    const mandiPrice = Math.round(priceToday * (rand() < 0.5 ? 0.94 : 0.97));
    const eNamPrice = Math.round(priceToday * (rand() < 0.5 ? 1.03 : 1.06));

    profiles.push({
      cropId,
      cropName: CROP_LABEL[cropId],
      unit: "₹/kg",
      priceToday,
      price7,
      price30,
      avg90,
      high90,
      low90,
      trend7Pct,
      trend30Pct,
      mandiPrice,
      eNamPrice,
      fairValueBand: band,
      signal,
      signalNote,
      series,
    });
  }
  return profiles;
}

export function signalMeta(s: PriceSignal): { label: string; cls: string; icon: "check" | "clock" | "sparkles" } {
  switch (s) {
    case "sell":
      return { label: "Sell now", cls: "bg-forest-600 text-white", icon: "check" };
    case "hold":
      return { label: "Hold ~1 week", cls: "bg-gold-500 text-ink-900", icon: "clock" };
    case "watch":
      return { label: "Watch closely", cls: "bg-orange-500 text-white", icon: "sparkles" };
  }
}

/** Rule-based 2–3 line market commentary (gpt-4o mini narration once live). */
export function marketCommentary(p: CropPriceProfile): string[] {
  const lines: string[] = [];
  if (p.trend7Pct > 2) {
    lines.push(`${p.cropName} is riding ${Math.abs(p.trend7Pct).toFixed(1)}% weekly momentum — arrivals are lighter than demand in the graded lots.`);
  } else if (p.trend7Pct < -2) {
    lines.push(`${p.cropName} softened ${Math.abs(p.trend7Pct).toFixed(1)}% this week as arrivals thickened. Focus on certified/grade-A lots that hold premium.`);
  } else {
    lines.push(`${p.cropName} is trading in a narrow band — buyers are offering near the mandi reference, no panic either way.`);
  }
  lines.push(
    `Your fair-value band is ₹${p.fairValueBand[0]}–${p.fairValueBand[1]}/kg; today sits ${p.priceToday >= p.fairValueBand[1] ? "above" : p.priceToday <= p.fairValueBand[0] ? "below" : "inside"} it.`,
  );
  if (p.eNamPrice > p.mandiPrice) {
    lines.push(`eNAM quotes ₹${p.eNamPrice} against ₹${p.mandiPrice} at the mandi — a remote-sale lot may add ~${Math.round(((p.eNamPrice - p.mandiPrice) / p.mandiPrice) * 100)}% before freight.`);
  }
  return lines;
}