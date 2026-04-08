import Navbar from "@/components/Navbar";
import MobileBottomNav from "@/components/MobileBottomNav";
import Footer from "@/components/sections/Footer";
import { useEffect } from "react";

export default function OpsDashboard() {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />
      <div className="pt-24 pb-20">
        <div className="container max-w-[1520px] px-12 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Ops Dashboard</h1>
          <p className="text-white/30">Live protocol telemetry. coming soon.</p>
        </div>
      </div>
      <Footer />
      <MobileBottomNav />
      <div className="h-14 lg:hidden" />
    </div>
  );
}
