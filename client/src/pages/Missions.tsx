import Navbar from "@/components/Navbar";
import MobileBottomNav from "@/components/MobileBottomNav";
import MissionBlueprints from "@/components/sections/MissionBlueprints";
import MissionEconomics from "@/components/sections/MissionEconomics";
import Footer from "@/components/sections/Footer";

export default function Missions() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="pt-24">
        <MissionBlueprints />
        <MissionEconomics />
      </div>
      <Footer />
      <MobileBottomNav />
      <div className="h-14 lg:hidden" />
    </div>
  );
}
