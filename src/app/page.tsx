import { TopBar } from "@/components/ui/TopBar";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingFeatures } from "@/components/landing/LandingFeatures";
import { LandingHowItWorks } from "@/components/landing/LandingHowItWorks";
import { LandingQuote } from "@/components/landing/LandingQuote";
import { LandingAthleteSection } from "@/components/landing/LandingAthleteSection";
import { LandingTestimonials } from "@/components/landing/LandingTestimonials";
import { LandingPricing } from "@/components/landing/LandingPricing";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { FloatingChatBubble } from "@/components/landing/FloatingChatBubble";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg text-fg">
      <TopBar />
      <main>
        <LandingHero />
        <LandingFeatures />
        <LandingHowItWorks />
        <LandingQuote />
        <LandingAthleteSection />
        <LandingTestimonials />
        <LandingPricing />
      </main>
      <LandingFooter />
      <FloatingChatBubble />
    </div>
  );
}
