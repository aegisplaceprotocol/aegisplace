import { motion } from "framer-motion";
import { fadeInView } from "@/lib/animations";
import Navbar from "@/components/Navbar";
import MobileBottomNav from "@/components/MobileBottomNav";
import Tokenomics from "@/components/sections/Tokenomics";
import Footer from "@/components/sections/Footer";

export default function TokenomicsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="pt-[64px]">
        <Tokenomics />
      </div>
      <Footer />
      <MobileBottomNav />
      <div className="h-14 lg:hidden" />
    </div>
  );
}
