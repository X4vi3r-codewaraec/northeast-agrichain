import type { ReactNode } from "react";

export type IconName =
  | "leaf"
  | "cloudRain"
  | "scanPlus"
  | "truck"
  | "route"
  | "store"
  | "coin"
  | "shield"
  | "mic"
  | "globe"
  | "phone"
  | "arrowRight"
  | "check"
  | "sun"
  | "drop"
  | "wind"
  | "thermometer"
  | "seedling"
  | "building"
  | "chart"
  | "users"
  | "radio"
  | "clock"
  | "book"
  | "sparkles"
  | "menu"
  | "x"
  | "chevronDown"
  | "image"
  | "mapPin"
  | "cloud"
  | "fog"
  | "thunder"
  | "droplet";

const paths: Record<IconName, ReactNode> = {
  leaf: (
    <>
      <path d="M20.5 3.5C12 4 5.8 8.4 5.5 15.4c0 1.5.2 2.8.7 4.1C9 17.7 13.3 12.6 17.8 8.2" />
      <path d="M3.5 20.5C6.4 16.8 10.9 12.2 15 9.6" />
    </>
  ),
  cloudRain: (
    <>
      <path d="M7 17.5a4.3 4.3 0 1 1 .7-8.55 5.8 5.8 0 0 1 11.3 1.4A3.4 3.4 0 0 1 17.6 17.5" />
      <path d="M8.5 18.5v3M12.2 18.5v3M15.9 18.5v3" />
    </>
  ),
  scanPlus: (
    <>
      <path d="M3 8V5a2 2 0 0 1 2-2h3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M8 21H5a2 2 0 0 1-2-2v-3" />
      <path d="M12 8.5v7M8.5 12h7" />
    </>
  ),
  truck: (
    <>
      <path d="M2.5 6.5h12v9.5h-12z" />
      <path d="M14.5 9.5h3.8l3.2 3.8v2.7h-7" />
      <circle cx="6.3" cy="17.2" r="1.9" />
      <circle cx="17.6" cy="17.2" r="1.9" />
    </>
  ),
  route: (
    <>
      <circle cx="6" cy="6" r="2.6" />
      <circle cx="18" cy="18" r="2.6" />
      <path d="M6 8.6c0 5.4 12 1.6 12 7.4" />
    </>
  ),
  store: (
    <>
      <path d="M3.5 9h17M4.3 9L3 6h18l-1.3 3" />
      <path d="M5 9v11.5h14V9" />
      <path d="M8.8 20.5v-5h6.4v5" />
    </>
  ),
  coin: (
    <>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M9.4 15.3c.5.6 1.6 1.1 2.7 1.1 1.7 0 2.6-.8 2.6-2 0-3.1-5.4-1.6-5.4-3.7 0-1 .9-1.8 2.4-1.8 1 0 1.9.4 2.4 1" />
      <path d="M12 6.6v10.8" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3l7 2.4V12c0 4.4-3 7.6-7 9-4-1.4-7-4.6-7-9V5.4z" />
      <path d="M9 11.6l2.1 2.1 4-4.2" />
    </>
  ),
  mic: (
    <>
      <rect x="9" y="3" width="6" height="11.5" rx="3" />
      <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0" />
      <path d="M12 18v3" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M3.4 12h17.2" />
      <path d="M12 3.4c2.6 2.3 4 5.1 4 8.6s-1.4 6.3-4 8.6c-2.6-2.3-4-5.1-4-8.6s1.4-6.3 4-8.6z" />
    </>
  ),
  phone: (
    <>
      <rect x="7" y="2.5" width="10" height="19" rx="2.6" />
      <path d="M11 18.2h2" />
    </>
  ),
  arrowRight: <path d="M4.5 12h15M13.5 6.5l5.5 5.5-5.5 5.5" />,
  check: <path d="M4.5 12.5l5 5 10-11" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.8v2.2M12 19v2.2M4.2 4.2l1.6 1.6M18.2 18.2l1.6 1.6M2.8 12H5M19 12h2.2M4.2 19.8l1.6-1.6M18.2 5.8l1.6-1.6" />
    </>
  ),
  drop: (
    <>
      <path d="M12 3.5S6 9.8 6 14a6 6 0 0 0 12 0c0-4.2-6-10.5-6-10.5z" />
      <path d="M9.4 17.4a2.6 2.6 0 0 0 2.6 2.6" />
    </>
  ),
  wind: (
    <>
      <path d="M3 8h9a2.6 2.6 0 1 0-2.5-3.3" />
      <path d="M3 12h13a2.6 2.6 0 1 1-2.5 3.3" />
      <path d="M3 16h6.5" />
    </>
  ),
  thermometer: (
    <>
      <path d="M10 13.6V5a2 2 0 0 1 4 0v8.6a4.6 4.6 0 1 1-4 0z" />
      <circle cx="12" cy="17.4" r="2.5" />
    </>
  ),
  seedling: (
    <>
      <path d="M12 22v-8.5" />
      <path d="M12 13.5C12 9.5 9.5 7 5 7c0 4 2.5 6.5 7 6.5z" />
      <path d="M12 9c0-3-2-5-6-5.5 0 3 2 5.5 6 5.5z" />
    </>
  ),
  building: (
    <>
      <path d="M3 20.5h18" />
      <path d="M4.5 20.5V10.2M9.7 20.5V10.2M14.9 20.5V10.2M19.5 20.5V10.2" />
      <path d="M3.5 10.2l8.5-6 8.5 6" />
    </>
  ),
  chart: (
    <>
      <path d="M5 20v-7.5M10.3 20V6.5M15.5 20v-5M19.5 20V4" />
      <path d="M3 20.5h18" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.6" />
      <path d="M3 20c.5-3.8 2.7-6 6-6s5.5 2.2 6 6" />
      <path d="M16.4 4.7a3.6 3.6 0 0 1 0 6.6" />
      <path d="M20.5 19.5c-.3-2.5-1.7-4.3-3.8-5.2" />
    </>
  ),
  radio: (
    <>
      <circle cx="12" cy="12" r="2" />
      <path d="M16.4 7.6a5.8 5.8 0 0 1 0 8.8" />
      <path d="M7.6 16.4a5.8 5.8 0 0 1 0-8.8" />
      <circle cx="12" cy="12" r="9" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M12 7v5.2l3.4 2" />
    </>
  ),
  book: (
    <>
      <path d="M4.5 19V5.5A2 2 0 0 1 6.5 3.5H20v16" />
      <path d="M4.5 19a2 2 0 0 0 2 2H20" />
      <path d="M8.5 8h7M8.5 11.5h7" />
    </>
  ),
  sparkles: (
    <>
      <path d="M12 4l1.6 4.3 4.3 1.6-4.3 1.6L12 15.8l-1.6-4.3-4.3-1.6 4.3-1.6z" />
      <path d="M18.5 15.3l.8 2.1 2.1.8-2.1.8-.8 2.1-.8-2.1-2.1-.8 2.1-.8z" />
    </>
  ),
  menu: <path d="M4 6.5h16M4 12h16M4 17.5h16" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  chevronDown: <path d="M6 9.5l6 6 6-6" />,
  image: (
    <>
      <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
      <circle cx="9" cy="10" r="1.8" />
      <path d="M4.5 17.5l4.5-4.5 3.5 3.5 3-3 4 4" />
    </>
  ),
  mapPin: (
    <>
      <path d="M12 21.5S5.5 15.8 5.5 10.3a6.5 6.5 0 0 1 13 0c0 5.5-6.5 11.2-6.5 11.2z" />
      <circle cx="12" cy="10.3" r="2.4" />
    </>
  ),
  cloud: (
    <>
      <path d="M7 17.5a4.3 4.3 0 1 1 .7-8.55 5.8 5.8 0 0 1 11.3 1.4A3.4 3.4 0 0 1 17.6 17.5" />
      <path d="M7 17.5h10.6" />
    </>
  ),
  fog: (
    <>
      <path d="M4 9.5h11M4 13h15M4 16.5h8.5M7 6.5h10" />
    </>
  ),
  thunder: (
    <>
      <path d="M7 17.5a4.3 4.3 0 1 1 .7-8.55 5.8 5.8 0 0 1 11.3 1.4A3.4 3.4 0 0 1 17.6 17.5" />
      <path d="M11.5 18.5l-1.7 3.6 2.6-.9-1.2 3.3" />
    </>
  ),
  droplet: (
    <>
      <path d="M12 3.5S6 9.8 6 14a6 6 0 0 0 12 0c0-4.2-6-10.5-6-10.5z" />
    </>
  ),
};

export function Icon({
  name,
  className = "h-5 w-5",
  strokeWidth = 1.7,
}: {
  name: IconName;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

export function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="logo-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2e6b3e" />
          <stop offset="100%" stopColor="#0a1e12" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="44" height="44" rx="12" fill="url(#logo-g)" />
      <path
        d="M14 34C14 22 22 13.5 34 11c1.2 13-6 22.6-17.5 24.5"
        fill="none"
        stroke="#f2c266"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <path
        d="M14 34c2-7.5 7.5-12.5 13-15"
        fill="none"
        stroke="#8cc49c"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}