import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import ScrollToTop from "./components/ScrollToTop";
import SolanaWalletProvider from "./contexts/WalletContext";
import { lazy, Suspense, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Lenis from "lenis";
import PageSkeleton from "./components/PageSkeleton";

const Home = lazy(() => import("./pages/Home"));
const Marketplace = lazy(() => import("./pages/Marketplace"));
const OperatorDetail = lazy(() => import("./pages/OperatorDetail"));
const RecruitOperator = lazy(() => import("./pages/RecruitOperator"));
const Playground = lazy(() => import("./pages/Playground"));
const Validators = lazy(() => import("./pages/Validators"));
const WhyAegis = lazy(() => import("./pages/WhyAegis"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const OpsDashboard = lazy(() => import("./pages/OpsDashboard"));
const SkillDirectory = lazy(() => import("./pages/SkillDirectory"));
const SkillMarketplace = lazy(() => import("./pages/SkillMarketplace"));
const SkillsMarketplace = lazy(() => import("./pages/SkillsMarketplace"));
const Pitch = lazy(() => import("./pages/Pitch"));
const MissionBuilder = lazy(() => import("./pages/MissionBuilder"));
const Docs = lazy(() => import("./pages/Docs"));
const Evolution = lazy(() => import("./pages/Evolution"));
const Swarms = lazy(() => import("./pages/Swarms"));
const Arsenal = lazy(() => import("./pages/Arsenal"));
const Compare = lazy(() => import("./pages/Compare"));
const Research = lazy(() => import("./pages/Research"));
const FAQPage = lazy(() => import("./pages/FAQPage"));
const TokenomicsPage = lazy(() => import("./pages/TokenomicsPage"));
const Missions = lazy(() => import("./pages/Missions"));
const LiveFeedPage = lazy(() => import("./pages/LiveFeedPage"));
const Delegation = lazy(() => import("./pages/Delegation"));
const SDKPage = lazy(() => import("./pages/SDKPage"));
const X402Page = lazy(() => import("./pages/X402Page"));
const Earn = lazy(() => import("./pages/Earn"));
const MyOperators = lazy(() => import("./pages/MyOperators"));
const Compute = lazy(() => import("./pages/Compute"));
const Ecosystem = lazy(() => import("./pages/Ecosystem"));
const NvidiaStack = lazy(() => import("./pages/NvidiaStack"));
const Admin = lazy(() => import("./pages/Admin"));
const Connect = lazy(() => import("./pages/Connect"));
const WalletPage = lazy(() => import("./pages/Wallet"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Tasks = lazy(() => import("./pages/Tasks"));
const TaskDetail = lazy(() => import("./pages/TaskDetail"));
const CreateTask = lazy(() => import("./pages/CreateTask"));
const LeaderboardPage = lazy(() => import("./pages/Leaderboard"));
const AgentsPage = lazy(() => import("./pages/Agents"));
const SkillFi = lazy(() => import("./pages/SkillFi"));
const CreateSkill = lazy(() => import("./pages/CreateSkill"));
const AegisXTerminal = lazy(() => import("./pages/AegisXTerminal"));
const Protocol = lazy(() => import("./pages/Protocol"));
const Royalties = lazy(() => import("./pages/Royalties"));
const GitHubPreview = lazy(() => import("./pages/GitHubPreview"));
const ZAuthPartnership = lazy(() => import("./pages/ZAuthPartnership"));
const DeployWizard = lazy(() => import("./pages/DeployWizard"));
const CategoryLanding = lazy(() => import("./pages/CategoryLanding"));
const Check = lazy(() => import("./pages/Check"));
const AegisChat = lazy(() => import("./pages/AegisChat"));
const McpCheckout = lazy(() => import("./pages/McpCheckout"));
const NotFound = lazy(() => import("./pages/NotFound"));

function Router() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Switch>
        <Route path={"/"} component={Home} />
        <Route path={"/marketplace"} component={Marketplace} />
        <Route path={"/marketplace/:slug"} component={OperatorDetail} />
        <Route path={"/submit"} component={RecruitOperator} />
        <Route path={"/playground"} component={Playground} />
        <Route path={"/validators"} component={Validators} />
        <Route path={"/why"} component={WhyAegis} />
        <Route path={"/dashboard"} component={Dashboard} />
        <Route path={"/ops"} component={OpsDashboard} />
        <Route path={"/skills"} component={SkillDirectory} />
        <Route path={"/skills/create"} component={CreateSkill} />
        <Route path={"/skill-marketplace"} component={SkillsMarketplace} />
        <Route path={"/skills-marketplace"} component={SkillsMarketplace} />
        <Route path={"/pitch"} component={Pitch} />
        <Route path={"/missions/new"} component={MissionBuilder} />
        <Route path={"/docs"} component={Docs} />
        <Route path={"/evolution"} component={Evolution} />
        <Route path={"/swarms"} component={Swarms} />
        <Route path={"/arsenal"} component={Arsenal} />
        <Route path={"/compare"} component={Compare} />
        <Route path={"/research"} component={Research} />
        <Route path={"/faq"} component={FAQPage} />
        <Route path={"/tokenomics"} component={TokenomicsPage} />
        <Route path={"/missions"} component={Missions} />
        <Route path={"/live-feed"} component={LiveFeedPage} />
        <Route path={"/delegation"} component={Delegation} />
        <Route path={"/sdk"} component={SDKPage} />
        <Route path={"/x402"} component={X402Page} />
        <Route path={"/earn"} component={Earn} />
        <Route path={"/my-operators"} component={MyOperators} />
        <Route path={"/compute"} component={Compute} />
        <Route path={"/ecosystem"} component={Ecosystem} />
        <Route path={"/nvidia"} component={NvidiaStack} />
        <Route path={"/connect"} component={Connect} />
        <Route path={"/wallet"} component={WalletPage} />
        <Route path={"/analytics"} component={Analytics} />
        <Route path={"/tasks"} component={Tasks} />
        <Route path={"/tasks/:id"} component={TaskDetail} />
        <Route path={"/create"} component={CreateTask} />
        <Route path={"/leaderboard"} component={LeaderboardPage} />
        <Route path={"/agents"} component={AgentsPage} />
        <Route path={"/skill-fi"} component={SkillFi} />
        <Route path={"/aegisx"} component={AegisXTerminal} />
        <Route path={"/protocol"} component={Protocol} />
        <Route path={"/royalties"} component={Royalties} />
        <Route path={"/githubpreview"} component={GitHubPreview} />
        <Route path={"/zauth"} component={ZAuthPartnership} />
        <Route path={"/deploy"} component={DeployWizard} />
        <Route path={"/category/:slug"} component={CategoryLanding} />
        <Route path={"/admin"} component={Admin} />
        <Route path={"/check"} component={Check} />
        <Route path={"/chat"} component={AegisChat} />
        <Route path={"/checkout"} component={McpCheckout} />
        <Route path={"/mcp/checkout"} component={McpCheckout} />
        <Route path={"/404"} component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

/* ── Lenis smooth scroll — site-wide premium feel ──────────────────────── */
function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.1,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: 1.5,
    });
    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
    return () => lenis.destroy();
  }, []);
  return <>{children}</>;
}

/* ── Page transition wrapper ───────────────────────────────────────────── */
function PageTransition({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18, ease: "easeInOut" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <SolanaWalletProvider>
          <TooltipProvider>
            <Toaster />
            <ScrollToTop />
            <SmoothScroll>
              <PageTransition>
                <Router />
              </PageTransition>
            </SmoothScroll>
          </TooltipProvider>
        </SolanaWalletProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
