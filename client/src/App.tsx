import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import ScrollToTop from "./components/ScrollToTop";
import SolanaWalletProvider from "./contexts/WalletContext";
import { lazy, Suspense } from "react";
import PageSkeleton from "./components/PageSkeleton";

const Home = lazy(() => import("./pages/Home"));
const Marketplace = lazy(() => import("./pages/Marketplace"));
const OperatorDetail = lazy(() => import("./pages/OperatorDetail"));
const RecruitOperator = lazy(() => import("./pages/RecruitOperator"));
const Playground = lazy(() => import("./pages/Playground"));
const Validators = lazy(() => import("./pages/Validators"));
const WhyAegis = lazy(() => import("./pages/WhyAegis"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const SkillMarketplace = lazy(() => import("./pages/SkillMarketplace"));
const Pitch = lazy(() => import("./pages/Pitch"));
const MissionBuilder = lazy(() => import("./pages/MissionBuilder"));
const Docs = lazy(() => import("./pages/Docs"));
const Evolution = lazy(() => import("./pages/Evolution"));
const Swarms = lazy(() => import("./pages/Swarms"));
const Arsenal = lazy(() => import("./pages/Arsenal"));
const Research = lazy(() => import("./pages/Research"));
const FAQPage = lazy(() => import("./pages/FAQPage"));
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
        <Route path={"/skill-marketplace"} component={SkillMarketplace} />
        <Route path={"/pitch"} component={Pitch} />
        <Route path={"/missions/new"} component={MissionBuilder} />
        <Route path={"/docs"} component={Docs} />
        <Route path={"/evolution"} component={Evolution} />
        <Route path={"/swarms"} component={Swarms} />
        <Route path={"/arsenal"} component={Arsenal} />
        <Route path={"/research"} component={Research} />
        <Route path={"/faq"} component={FAQPage} />
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
        <Route path={"/admin"} component={Admin} />
        <Route path={"/404"} component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
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
            <Router />
          </TooltipProvider>
        </SolanaWalletProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
