import ComingSoon from "@/components/ComingSoon";
import Navbar from "@/components/Navbar";
import MobileBottomNav from "@/components/MobileBottomNav";
import Features from "@/components/sections/Features";
import FeatureHighlights from "@/components/sections/FeatureHighlights";
import Footer from "@/components/sections/Footer";

export default function Arsenal() {
  return <ComingSoon title="Arsenal" description="Bond tiers, escrow mechanics, insurance fund, and sandboxing." />;
}

function _Arsenal() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="pt-24">
        <Features />
        <FeatureHighlights />
      </div>
      <Footer />
      <MobileBottomNav />
      <div className="h-14 lg:hidden" />
    </div>
  );
}
