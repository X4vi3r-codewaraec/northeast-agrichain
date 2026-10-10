import { AlertStrip, Hero } from "@/components/landing/hero";
import {
  CTABand,
  CropShowcase,
  HowItWorks,
  ModuleGrid,
  Personas,
  PriceTicker,
  StatsBand,
  VoiceBand,
} from "@/components/landing/sections";

export default function HomePage() {
  return (
    <>
      <AlertStrip />
      <Hero />
      <PriceTicker />
      <StatsBand />
      <ModuleGrid />
      <CropShowcase />
      <HowItWorks />
      <Personas />
      <VoiceBand />
      <CTABand />
    </>
  );
}