import Navbar from "@/components/Navbar";
import MobileBottomNav from "@/components/MobileBottomNav";
import OperatorEvolution from "@/components/sections/OperatorEvolution";
import Footer from "@/components/sections/Footer";

export default function Evolution() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="pt-24">
        <OperatorEvolution />
      </div>
      <Footer />
      <MobileBottomNav />
      <div className="h-14 lg:hidden" />
    </div>
  );
}
