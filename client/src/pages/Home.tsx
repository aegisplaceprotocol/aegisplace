import Navbar from "@/components/Navbar";
import MobileBottomNav from "@/components/MobileBottomNav";
import Hero from "@/components/sections/Hero";
import ProblemSolution from "@/components/sections/ProblemSolution";
import HowItWorks from "@/components/sections/HowItWorks";
import SuccessEngine from "@/components/sections/SuccessEngine";
import Protections from "@/components/sections/Protections";
import TokenSection from "@/components/sections/TokenSection";
import WhyHoldAegis from "@/components/sections/WhyHoldAegis";
import BagSkills from "@/components/sections/BagSkills";
import PreFooterCTA from "@/components/sections/PreFooterCTA";
import Footer from "@/components/sections/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <Hero />
      <ProblemSolution />
      <HowItWorks />
      <SuccessEngine />
      <Protections />
      <TokenSection />
      <WhyHoldAegis />
      <BagSkills />
      <PreFooterCTA />
      <Footer />
      <MobileBottomNav />
      <div className="h-14 lg:hidden" />
    </div>
  );
}
