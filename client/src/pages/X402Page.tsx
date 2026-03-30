import Navbar from "@/components/Navbar";
import MobileBottomNav from "@/components/MobileBottomNav";
import X402LiveTracker from "@/components/sections/X402LiveTracker";
import Footer from "@/components/sections/Footer";

export default function X402Page() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="pt-24">
        <X402LiveTracker />
      </div>
      <Footer />
      <MobileBottomNav />
      <div className="h-14 lg:hidden" />
    </div>
  );
}
