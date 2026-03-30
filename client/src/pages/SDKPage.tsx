import ComingSoon from "@/components/ComingSoon";
import Navbar from "@/components/Navbar";
import MobileBottomNav from "@/components/MobileBottomNav";
import SDKIntegration from "@/components/sections/SDKIntegration";
import Footer from "@/components/sections/Footer";

export default function SDKPage() {
  return <ComingSoon title="SDK" description="TypeScript, Python, and Rust SDKs for building on Aegis." />;
}

function _SDKPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="pt-24">
        <SDKIntegration />
      </div>
      <Footer />
      <MobileBottomNav />
      <div className="h-14 lg:hidden" />
    </div>
  );
}
