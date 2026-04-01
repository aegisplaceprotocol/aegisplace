import Navbar from "@/components/Navbar";
import MobileBottomNav from "@/components/MobileBottomNav";
import TaskDelegation from "@/components/sections/TaskDelegation";
import AgentStack from "@/components/sections/AgentStack";
import Footer from "@/components/sections/Footer";

export default function Delegation() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="pt-24">
        <TaskDelegation />
        <AgentStack />
      </div>
      <Footer />
      <MobileBottomNav />
      <div className="h-14 lg:hidden" />
    </div>
  );
}
