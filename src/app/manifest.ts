import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Northeast AgriChain — Agriculture, Climate & Supply-Chain Intelligence",
    short_name: "AgriChain",
    description:
      "Hyper-local weather, AI crop diagnosis, cold-chain logistics and fair B2B trade for the 8 North-East Indian states. Works offline on hill connectivity.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#faf7f0",
    theme_color: "#14532d",
    categories: ["agriculture", "productivity", "utilities"],
    lang: "en-IN",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
