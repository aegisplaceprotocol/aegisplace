import Navbar from "@/components/Navbar";
import MobileBottomNav from "@/components/MobileBottomNav";
import AutonomousSwarms from "@/components/sections/AutonomousSwarms";
import Footer from "@/components/sections/Footer";

export default function Swarms() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="pt-24">
        <AutonomousSwarms />
      </div>
      <Footer />
      <MobileBottomNav />
      <div className="h-14 lg:hidden" />
    </div>
  );
}
