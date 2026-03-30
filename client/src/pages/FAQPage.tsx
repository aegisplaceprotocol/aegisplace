import Navbar from "@/components/Navbar";
import MobileBottomNav from "@/components/MobileBottomNav";
import FAQ from "@/components/sections/FAQ";
import Footer from "@/components/sections/Footer";

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="pt-24">
        <FAQ />
      </div>
      <Footer />
      <MobileBottomNav />
      <div className="h-14 lg:hidden" />
    </div>
  );
}
