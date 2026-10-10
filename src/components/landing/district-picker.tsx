"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/icons";
import { NER_STATES } from "@/lib/data";

export function DistrictPicker({ dark = true }: { dark?: boolean }) {
  const [stateId, setStateId] = useState(NER_STATES[0].id);
  const [district, setDistrict] = useState(NER_STATES[0].districts[0]);
  const router = useRouter();

  function onStateChange(id: string) {
    setStateId(id);
    const next = NER_STATES.find((s) => s.id === id);
    if (next) setDistrict(next.districts[0]);
  }

  function go() {
    router.push(`/signup?state=${stateId}&district=${encodeURIComponent(district)}`);
  }

  const selectCls = `h-12 w-full appearance-none rounded-xl border bg-white pr-9 pl-3.5 text-sm font-medium text-ink-900 outline-none transition focus:border-forest-500 focus:ring-2 focus:ring-forest-500/30 ${
    dark ? "border-white/10" : "border-forest-600/20"
  }`;

  return (
    <div>
      <p
        className={`mb-2 text-xs font-semibold tracking-[0.12em] uppercase ${
          dark ? "text-forest-200/80" : "text-ink-500"
        }`}
      >
        Start with your district
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <select
            aria-label="Choose state"
            value={stateId}
            onChange={(e) => onStateChange(e.target.value)}
            className={selectCls}
          >
            {NER_STATES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-ink-500">
            <Icon name="chevronDown" className="h-4 w-4" />
          </span>
        </div>
        <div className="relative flex-1">
          <select
            aria-label="Choose district"
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            className={selectCls}
          >
            {NER_STATES.find((s) => s.id === stateId)?.districts.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-ink-500">
            <Icon name="chevronDown" className="h-4 w-4" />
          </span>
        </div>
        <button
          type="button"
          onClick={go}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gold-500 px-6 text-sm font-bold text-forest-950 shadow-lg shadow-gold-500/25 transition hover:bg-gold-400"
        >
          Explore {district}
          <Icon name="arrowRight" className="h-4 w-4" strokeWidth={2.2} />
        </button>
      </div>
    </div>
  );
}