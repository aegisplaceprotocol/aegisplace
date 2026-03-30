import ComingSoon from "@/components/ComingSoon";
import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import Navbar from "@/components/Navbar";
import RequireWallet from "@/components/RequireWallet";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@/components/WalletModal";
import { toast } from "sonner";

/* ── Animated counter ─────────────────────────────────────────────────── */

function AnimNum({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const [vis, setVis] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!vis) return;
    let step = 0;
    const steps = 40;
    const iv = setInterval(() => {
      step++;
      const p = 1 - Math.pow(1 - step / steps, 3);
      setDisplay(Math.round(value * p));
      if (step >= steps) clearInterval(iv);
    }, 25);
    return () => clearInterval(iv);
  }, [vis, value]);

  return <span ref={ref}>{prefix}{display.toLocaleString()}{suffix}</span>;
}

/* ── Validation Timeline Step ─────────────────────────────────────────── */

function TimelineStep({ step, title, desc, duration, active }: {
  step: number; title: string; desc: string; duration: string; active: boolean;
}) {
  return (
    <div className={`relative pl-10 pb-10 last:pb-0 group ${active ? "opacity-100" : "opacity-40"}`}>
      {/* Vertical line */}
      <div className="absolute left-[15px] top-8 bottom-0 w-px bg-white/[0.08] group-last:hidden" />
      {/* Step circle */}
      <div className={`absolute left-0 top-0 w-8 h-8 flex items-center justify-center text-[11px] font-medium font-bold ${
        active ? "bg-white/10 text-zinc-300 border border-white/30" : "bg-white/[0.03] text-white/30 border border-white/[0.08]"
      }`}>
        {step}
      </div>
      <div>
        <div className="flex items-center gap-3 mb-1.5">
          <h4 className="text-[15px] font-normal text-white/90">{title}</h4>
          <span className="text-[10px] font-medium text-white/25 bg-white/[0.03] border border-white/[0.07] px-2 py-0.5">{duration}</span>
        </div>
        <p className="text-[13px] text-white/40 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

/* ── Revenue Calculator ───────────────────────────────────────────────── */

function RevenueCalc() {
  const [invocations, setInvocations] = useState(1000);
  const [price, setPrice] = useState(0.02);

  const gross = invocations * price;
  const creatorShare = gross * 0.70;
  const validatorShare = gross * 0.20;
  const treasuryShare = gross * 0.09;
  const disputeShare = gross * 0.01;

  return (
    <div className="border border-white/[0.08] bg-white/[0.02] p-8">
      <h3 className="text-[13px] font-medium text-zinc-300/60 tracking-wider mb-6">REVENUE CALCULATOR</h3>

      {/* Sliders */}
      <div className="space-y-6 mb-8">
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-[13px] text-white/50">Monthly invocations</span>
            <span className="text-[15px] text-white/90 font-normal">{invocations.toLocaleString()}</span>
          </div>
          <input
            type="range"
            min={100}
            max={100000}
            step={100}
            value={invocations}
            onChange={(e) => setInvocations(Number(e.target.value))}
            className="w-full h-1 bg-white/[0.08] appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer"
          />
          <div className="flex justify-between mt-1">
            <span className="text-[10px] font-medium text-white/20">100</span>
            <span className="text-[10px] font-medium text-white/20">100,000</span>
          </div>
        </div>

        <div>
          <div className="flex justify-between mb-2">
            <span className="text-[13px] text-white/50">Price per invocation (USDC)</span>
            <span className="text-[15px] text-white/90 font-normal">${price.toFixed(3)}</span>
          </div>
          <input
            type="range"
            min={0.001}
            max={1}
            step={0.001}
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="w-full h-1 bg-white/[0.08] appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer"
          />
          <div className="flex justify-between mt-1">
            <span className="text-[10px] font-medium text-white/20">$0.001</span>
            <span className="text-[10px] font-medium text-white/20">$1.000</span>
          </div>
        </div>
      </div>

      {/* Revenue breakdown */}
      <div className="border-t border-white/[0.07] pt-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white/[0.04] border border-white/15 p-4">
            <div className="text-[10px] font-medium text-zinc-300/50 mb-1">YOUR SHARE (70%)</div>
            <div className="text-xl font-bold text-zinc-300">${creatorShare.toFixed(2)}</div>
            <div className="text-[10px] font-medium text-white/20 mt-1">per month</div>
          </div>
          <div className="bg-white/[0.02] border border-white/[0.08] p-4">
            <div className="text-[10px] font-medium text-white/30 mb-1">VALIDATORS (20%)</div>
            <div className="text-xl font-bold text-white/70">${validatorShare.toFixed(2)}</div>
            <div className="text-[10px] font-medium text-white/20 mt-1">per month</div>
          </div>
          <div className="bg-white/[0.02] border border-white/[0.08] p-4">
            <div className="text-[10px] font-medium text-white/30 mb-1">TREASURY (9%)</div>
            <div className="text-xl font-bold text-white/70">${treasuryShare.toFixed(2)}</div>
            <div className="text-[10px] font-medium text-white/20 mt-1">per month</div>
          </div>
          <div className="bg-white/[0.02] border border-white/[0.08] p-4">
            <div className="text-[10px] font-medium text-white/30 mb-1">DISPUTE POOL (1%)</div>
            <div className="text-xl font-bold text-white/70">${disputeShare.toFixed(2)}</div>
            <div className="text-[10px] font-medium text-white/20 mt-1">per month</div>
          </div>
        </div>

        <div className="flex items-center justify-between bg-white/[0.02] border border-white/[0.07] p-4 rounded">
          <span className="text-[13px] text-white/50">Gross monthly revenue</span>
          <span className="text-2xl font-bold text-white/90">${gross.toFixed(2)}</span>
        </div>

        <p className="text-[11px] text-white/20 mt-4 leading-relaxed">
          Revenue paid in USDC via x402 micropayments. Agents pay per invocation  -  no subscriptions, no minimums.
          Your 70% share is streamed to your Solana wallet in real-time after each successful invocation.
        </p>
      </div>
    </div>
  );
}

/* ── Submit Button (wired to tRPC + Wallet) ──────────────────────────── */

function SubmitButton({ formData, bondTier }: {
  formData: { operatorName: string; namespace: string; githubUrl: string; description: string; category: string; operatorClass: string; price: string; bondTier: string };
  bondTier: string;
}) {
  const { publicKey, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const CATEGORY_MAP: Record<string, string> = {
    "Development": "code-review",
    "Security": "security-audit",
    "Data": "data-extraction",
    "Productivity": "other",
    "AI / ML": "text-generation",
    "Infrastructure": "other",
    "DeFi": "financial-analysis",
    "Social": "other",
    "Knowledge": "summarization",
    "Documentation": "summarization",
    "Automation": "other",
    "Research": "data-extraction",
    "Finance": "financial-analysis",
    "Healthcare": "other",
    "Writing": "text-generation",
    "Planning": "other",
    "Voice": "other",
    "Legal": "other",
    "Education": "other",
    "Media": "image-generation",
  };

  const registerMutation = trpc.operator.register.useMutation({
    onSuccess: (op) => {
      toast.success("Operator registered!", {
        description: `${op?.name} is now pending validation.`,
      });
      setTimeout(() => setLocation(`/marketplace/${op?.slug}`), 1500);
    },
    onError: (err) => {
      toast.error("Registration failed", { description: err.message });
    },
  });

  const handleSubmit = () => {
    if (!connected || !publicKey) {
      setVisible(true);
      return;
    }
    if (!isAuthenticated) {
      toast.error("Please sign in first", { description: "You need to be logged in to register an operator." });
      return;
    }
    if (!formData.operatorName || !formData.namespace) {
      toast.error("Missing fields", { description: "Operator name and namespace are required." });
      return;
    }

    const slug = `${formData.namespace}-${formData.operatorName}`.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");

    registerMutation.mutate({
      name: formData.operatorName,
      slug,
      tagline: formData.description?.slice(0, 200) || undefined,
      description: formData.description || undefined,
      category: (CATEGORY_MAP[formData.category] || "other") as any,
      pricePerCall: formData.price || "0.02",
      creatorWallet: publicKey.toBase58(),
      tags: [formData.operatorClass, formData.category].filter(Boolean),
      githubUrl: formData.githubUrl || undefined,
    });
  };

  return (
    <button
      onClick={handleSubmit}
      disabled={registerMutation.isPending}
      className="w-full bg-white text-zinc-900 font-normal text-[15px] py-4 hover:bg-zinc-200 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {registerMutation.isPending
        ? "Submitting..."
        : connected
        ? "Submit Registration"
        : "Connect Wallet & Submit Registration"
      }
    </button>
  );
}

/* ── Main Page ────────────────────────────────────────────────────────── */

export default function RecruitOperator() {
  return <ComingSoon title="Submit Operator" description="Register your AI skill on the Aegis marketplace." />;
}

function _RecruitOperator() {
  const { publicKey, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const [activeStep, setActiveStep] = useState(1);
  const [formData, setFormData] = useState({
    operatorName: "",
    namespace: "",
    githubUrl: "",
    description: "",
    category: "",
    operatorClass: "",
    price: "0.02",
    bondTier: "standard",
  });

  const OPERATOR_CLASSES = [
    { id: "RECON", name: "RECON", color: "#A1A1AA", role: "Intelligence", desc: "Crawlers, scrapers, data enrichment, research agents. Operators that gather and synthesize information from external sources.", examples: ["web-crawler", "wallet-resolver", "tx-analyzer", "position-scanner"] },
    { id: "FORGE", name: "FORGE", color: "#71717A", role: "Builder", desc: "Code generators, report writers, formatters, deployment agents. Operators that produce artifacts and transform data into deliverables.", examples: ["report-gen", "code-writer", "lint-runner", "data-formatter"] },
    { id: "CIPHER", name: "CIPHER", color: "#52525B", role: "Security", desc: "Auditors, vulnerability scanners, risk scorers, encryption agents. Operators that verify, protect, and assess security posture.", examples: ["vuln-detector", "pda-validator", "risk-scorer", "authority-audit"] },
    { id: "AEGIS", name: "AEGIS", color: "#A1A1AA", role: "Validator", desc: "Quality gates, consensus agents, attestation engines. Operators that verify other operators and enforce protocol standards.", examples: ["quality-gate", "launch-report", "consensus-check"] },
    { id: "GHOST", name: "GHOST", color: "#4A7A82", role: "Stealth", desc: "Background daemons, alert dispatchers, monitoring agents. Operators that run silently and surface only when conditions are met.", examples: ["alert-dispatcher", "cron-monitor", "threshold-watcher"] },
  ];

  const selectedClass = OPERATOR_CLASSES.find(c => c.id === formData.operatorClass);

  const bondTiers = [
    { id: "starter", label: "Starter", amount: 5000, desc: "New creators. Basic visibility in the index.", validators: 1, reviewTime: "48h" },
    { id: "standard", label: "Standard", amount: 25000, desc: "Recommended. Featured placement and priority validation.", validators: 3, reviewTime: "24h" },
    { id: "premium", label: "Premium", amount: 100000, desc: "Maximum visibility. Dedicated validator team and instant listing.", validators: 5, reviewTime: "4h" },
  ];

  const selectedBond = bondTiers.find(t => t.id === formData.bondTier) || bondTiers[1];

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <RequireWallet>
    <div className="min-h-screen bg-white/[0.02]">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-20 border-b border-white/[0.07]">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-8">
              <span className="text-[10px] font-medium text-zinc-300/60 bg-white/[0.04] border border-white/[0.10] px-3 py-1 rounded-full">
                OPERATOR RECRUITMENT
              </span>
              <span className="text-[10px] font-medium text-white/20">
                avg. review time: {selectedBond.reviewTime}
              </span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[0.95] mb-8">
              <span className="text-white/90">Register</span>
              <br />
              <span className="text-white/30">your operator.</span>
            </h1>

            <p className="text-lg md:text-xl text-white/40 leading-relaxed max-w-xl">
              Stake $AEGIS, pass bonded validation, and start earning 60% of every
              invocation. Your operator becomes discoverable across 82K+ indexed operators
              across the x402 payment network.
            </p>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-b border-white/[0.07] bg-white/[0.01]">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="text-2xl md:text-3xl font-bold text-white/90"><AnimNum value={2847} /> </div>
              <div className="text-[11px] text-white/25 mt-1 tracking-wider">OPERATORS DEPLOYED</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold text-white/90"><AnimNum value={127} suffix="M" /></div>
              <div className="text-[11px] text-white/25 mt-1 tracking-wider">$AEGIS BONDED</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold text-white/90"><AnimNum prefix="$" value={4200000} /></div>
              <div className="text-[11px] text-white/25 mt-1 tracking-wider">REVENUE PAID (USDC)</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold text-white/90"><AnimNum value={70} suffix="%" /></div>
              <div className="text-[11px] text-white/25 mt-1 tracking-wider">CREATOR SHARE</div>
            </div>
          </div>
        </div>
      </section>

      {/* Wallet gate banner */}
      {!connected && (
        <section className="border-b border-amber-500/20 bg-amber-500/[0.03]">
          <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-amber-400 shrink-0">
                <path d="M8 1L15 14H1L8 1Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                <path d="M8 6v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="8" cy="12" r="0.5" fill="currentColor" />
              </svg>
              <span className="text-[13px] text-amber-400/80">Connect your Phantom wallet to register an operator. Your wallet address will be stored as the creator identity.</span>
            </div>
            <button
              onClick={() => setVisible(true)}
              className="shrink-0 text-[12px] font-normal text-zinc-900 bg-amber-400 hover:bg-amber-300 px-4 py-1.5 transition-colors"
            >
              Connect Wallet
            </button>
          </div>
        </section>
      )}

      {/* Connected wallet indicator */}
      {connected && publicKey && (
        <section className="border-b border-white/15 bg-white/[0.02]">
          <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-3 flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span className="text-[12px] font-medium text-zinc-300/70">Wallet connected: {publicKey.toBase58().slice(0, 6)}...{publicKey.toBase58().slice(-4)}</span>
            <span className="text-[10px] text-white/20">This address will be stored as the operator creator.</span>
          </div>
        </section>
      )}

      {/* Main content  -  two column */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
          <div className="grid lg:grid-cols-[1fr_420px] gap-16">

            {/* Left  -  Form */}
            <div className={!connected ? "opacity-60 pointer-events-none select-none" : ""}>
              {/* Step 1: Operator Details */}
              <div className="mb-16">
                <div className="flex items-center gap-3 mb-8">
                  <span className={`w-8 h-8 flex items-center justify-center text-[11px] font-medium font-bold ${
                    activeStep >= 1 ? "bg-white/10 text-zinc-300 border border-white/30" : "bg-white/[0.03] text-white/30 border border-white/[0.08]"
                  }`}>1</span>
                  <h2 className="text-xl font-normal text-white/90">Operator Details</h2>
                </div>

                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[11px] font-medium text-white/30 tracking-wider mb-2">OPERATOR CALLSIGN</label>
                      <input
                        type="text"
                        placeholder="e.g. code-review-agent"
                        value={formData.operatorName}
                        onChange={(e) => handleChange("operatorName", e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/[0.08] text-[15px] text-white/90 px-4 py-3 placeholder:text-white/15 focus:outline-none focus:border-white/30 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-white/30 tracking-wider mb-2">NAMESPACE</label>
                      <input
                        type="text"
                        placeholder="e.g. yourname"
                        value={formData.namespace}
                        onChange={(e) => handleChange("namespace", e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/[0.08] text-[15px] text-white/90 px-4 py-3 placeholder:text-white/15 focus:outline-none focus:border-white/30 transition-colors"
                      />
                      {formData.namespace && formData.operatorName && (
                        <div className="mt-2 text-[11px] font-medium text-zinc-300/50">
                          Registry ID: {formData.namespace}/{formData.operatorName}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-white/30 tracking-wider mb-2">GITHUB REPOSITORY</label>
                    <input
                      type="text"
                      placeholder="https://github.com/yourname/operator-repo"
                      value={formData.githubUrl}
                      onChange={(e) => handleChange("githubUrl", e.target.value)}
                      className="w-full bg-white/[0.03] border border-white/[0.08] text-[15px] text-white/90 px-4 py-3 placeholder:text-white/15 focus:outline-none focus:border-white/30 transition-colors"
                    />
                    <p className="text-[11px] text-white/20 mt-1.5">Must contain a valid OPERATOR.md at the repository root</p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-white/30 tracking-wider mb-2">DESCRIPTION</label>
                    <textarea
                      placeholder="What does your operator do? What problems does it solve?"
                      rows={4}
                      value={formData.description}
                      onChange={(e) => handleChange("description", e.target.value)}
                      className="w-full bg-white/[0.03] border border-white/[0.08] text-[15px] text-white/90 px-4 py-3 placeholder:text-white/15 focus:outline-none focus:border-white/30 transition-colors resize-none"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[11px] font-medium text-white/30 tracking-wider mb-2">CATEGORY</label>
                      <select
                        value={formData.category}
                        onChange={(e) => handleChange("category", e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/[0.08] text-[15px] text-white/90 px-4 py-3 focus:outline-none focus:border-white/30 transition-colors appearance-none cursor-pointer"
                      >
                        <option value="" className="bg-zinc-800">Select category</option>
                        {["Development", "Security", "Data", "Productivity", "AI / ML", "Infrastructure", "DeFi", "Social", "Knowledge", "Documentation", "Automation", "Research", "Finance", "Healthcare", "Writing", "Planning", "Voice", "Legal", "Education", "Media"].map(cat => (
                          <option key={cat} value={cat} className="bg-zinc-800">{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-white/30 tracking-wider mb-2">PRICE PER INVOCATION (USDC)</label>
                      <input
                        type="text"
                        placeholder="0.02"
                        value={formData.price}
                        onChange={(e) => handleChange("price", e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/[0.08] text-[15px] text-white/90 px-4 py-3 placeholder:text-white/15 focus:outline-none focus:border-white/30 transition-colors"
                      />
                      <p className="text-[11px] text-white/20 mt-1.5">Paid via x402 micropayments</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setActiveStep(2)}
                  className="mt-8 bg-white/10 text-zinc-300 border border-white/25 hover:bg-white/15 hover:border-white/40 text-[13px] font-medium font-normal px-8 py-3 transition-all duration-300"
                >
                  CONTINUE TO CLASS SELECTION
                </button>
              </div>

              {/* Step 2: Operator Class */}
              <div className={`mb-16 ${activeStep >= 2 ? "opacity-100" : "opacity-30 pointer-events-none"}`}>
                <div className="flex items-center gap-3 mb-8">
                  <span className={`w-8 h-8 flex items-center justify-center text-[11px] font-medium font-bold ${
                    activeStep >= 2 ? "bg-white/10 text-zinc-300 border border-white/30" : "bg-white/[0.03] text-white/30 border border-white/[0.08]"
                  }`}>2</span>
                  <h2 className="text-xl font-normal text-white/90">Operator Class</h2>
                </div>

                <p className="text-[13px] text-white/40 leading-relaxed mb-8 max-w-lg">
                  Every operator in the Aegis army belongs to a class. Your class determines how your operator
                  is categorized, discovered, and chained into mission blueprints.
                </p>

                <div className="grid gap-3">
                  {OPERATOR_CLASSES.map(cls => (
                    <button
                      key={cls.id}
                      onClick={() => handleChange("operatorClass", cls.id)}
                      className={`text-left p-5 border transition-all duration-300 ${
                        formData.operatorClass === cls.id
                          ? "border-opacity-30 bg-opacity-[0.04]"
                          : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15]"
                      }`}
                      style={{
                        borderColor: formData.operatorClass === cls.id ? `${cls.color}4D` : undefined,
                        backgroundColor: formData.operatorClass === cls.id ? `${cls.color}0A` : undefined,
                      }}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ background: cls.color }}
                        />
                        <span className="text-[13px] font-medium font-bold tracking-wider" style={{ color: formData.operatorClass === cls.id ? cls.color : "rgba(255,255,255,0.6)" }}>
                          {cls.name}
                        </span>
                        <span className="text-[10px] font-medium text-white/25">{cls.role}</span>
                      </div>
                      <p className="text-[12px] text-white/35 leading-relaxed ml-[22px]">{cls.desc}</p>
                      <div className="flex flex-wrap gap-2 mt-3 ml-[22px]">
                        {cls.examples.map(ex => (
                          <span key={ex} className="text-[9px] font-medium text-white/20 bg-white/[0.03] border border-white/[0.07] px-2 py-0.5">{ex}</span>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setActiveStep(3)}
                  className="mt-8 bg-white/10 text-zinc-300 border border-white/25 hover:bg-white/15 hover:border-white/40 text-[13px] font-medium font-normal px-8 py-3 transition-all duration-300"
                >
                  CONTINUE TO BOND SELECTION
                </button>
              </div>

              {/* Step 3: Bond Selection */}
              <div className={`mb-16 ${activeStep >= 3 ? "opacity-100" : "opacity-30 pointer-events-none"}`}>
                <div className="flex items-center gap-3 mb-8">
                  <span className={`w-8 h-8 flex items-center justify-center text-[11px] font-medium font-bold ${
                    activeStep >= 3 ? "bg-white/10 text-zinc-300 border border-white/30" : "bg-white/[0.03] text-white/30 border border-white/[0.08]"
                  }`}>3</span>
                  <h2 className="text-xl font-normal text-white/90">$AEGIS Bond</h2>
                </div>

                <p className="text-[13px] text-white/40 leading-relaxed mb-8 max-w-lg">
                  Your bond is staked on Solana via Token-2022. It secures the network and signals quality to consumers.
                  Bonds are slashed only if your operator is proven malicious through the dispute resolution process.
                </p>

                <div className="grid md:grid-cols-3 gap-4">
                  {bondTiers.map(tier => (
                    <button
                      key={tier.id}
                      onClick={() => handleChange("bondTier", tier.id)}
                      className={`text-left p-6 border transition-all duration-300 ${
                        formData.bondTier === tier.id
                          ? "border-white/30 bg-white/[0.04]"
                          : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15]"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <span className={`text-[10px] font-medium tracking-wider ${
                          formData.bondTier === tier.id ? "text-zinc-300/70" : "text-white/30"
                        }`}>{tier.label.toUpperCase()}</span>
                        {tier.id === "standard" && (
                          <span className="text-[9px] font-medium text-zinc-300/50 bg-white/[0.06] px-2 py-0.5">RECOMMENDED</span>
                        )}
                      </div>
                      <div className={`text-2xl font-bold mb-1 ${
                        formData.bondTier === tier.id ? "text-zinc-300" : "text-white/70"
                      }`}>
                        {tier.amount.toLocaleString()}
                      </div>
                      <div className="text-[11px] font-medium text-white/25 mb-3">$AEGIS</div>
                      <p className="text-[12px] text-white/35 leading-relaxed mb-4">{tier.desc}</p>
                      <div className="flex items-center gap-4 text-[10px] font-medium text-white/20">
                        <span>{tier.validators} validator{tier.validators > 1 ? "s" : ""}</span>
                        <span>{tier.reviewTime} review</span>
                      </div>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setActiveStep(4)}
                  className="mt-8 bg-white/10 text-zinc-300 border border-white/25 hover:bg-white/15 hover:border-white/40 text-[13px] font-medium font-normal px-8 py-3 transition-all duration-300"
                >
                  CONTINUE TO REVIEW
                </button>
              </div>

              {/* Step 4: Review & Submit */}
              <div className={` ${activeStep >= 4 ? "opacity-100" : "opacity-30 pointer-events-none"}`}>
                <div className="flex items-center gap-3 mb-8">
                  <span className={`w-8 h-8 flex items-center justify-center text-[11px] font-medium font-bold ${
                    activeStep >= 4 ? "bg-white/10 text-zinc-300 border border-white/30" : "bg-white/[0.03] text-white/30 border border-white/[0.08]"
                  }`}>4</span>
                  <h2 className="text-xl font-normal text-white/90">Review & Submit</h2>
                </div>

                {/* Summary */}
                <div className="border border-white/[0.08] bg-white/[0.02] p-6 mb-6">
                  <h3 className="text-[11px] font-medium text-white/30 tracking-wider mb-4">REGISTRATION SUMMARY</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-[13px]">
                      <span className="text-white/40">Operator</span>
                      <span className="text-white/80 ">{formData.namespace || "namespace"}/{formData.operatorName || "operator-name"}</span>
                    </div>
                    <div className="flex justify-between text-[13px]">
                      <span className="text-white/40">Category</span>
                      <span className="text-white/80 ">{formData.category || "--"}</span>
                    </div>
                    <div className="flex justify-between text-[13px]">
                      <span className="text-white/40">Operator class</span>
                      <span className="font-normal" style={{ color: selectedClass?.color || "rgba(255,255,255,0.8)" }}>{selectedClass?.name || "--"} <span className="text-white/25">{selectedClass?.role || ""}</span></span>
                    </div>
                    <div className="flex justify-between text-[13px]">
                      <span className="text-white/40">Price per invocation</span>
                      <span className="text-white/80 ">${formData.price} USDC</span>
                    </div>
                    <div className="h-px bg-white/[0.06] my-2" />
                    <div className="flex justify-between text-[13px]">
                      <span className="text-white/40">Bond tier</span>
                      <span className="text-white/80 ">{selectedBond.label}</span>
                    </div>
                    <div className="flex justify-between text-[13px]">
                      <span className="text-white/40">Bond amount</span>
                      <span className="text-zinc-300 font-normal">{selectedBond.amount.toLocaleString()} $AEGIS</span>
                    </div>
                    <div className="flex justify-between text-[13px]">
                      <span className="text-white/40">Validators assigned</span>
                      <span className="text-white/80 ">{selectedBond.validators}</span>
                    </div>
                    <div className="flex justify-between text-[13px]">
                      <span className="text-white/40">Estimated review time</span>
                      <span className="text-white/80 ">{selectedBond.reviewTime}</span>
                    </div>
                  </div>
                </div>

                {/* CLI equivalent */}
                <div className="border border-white/[0.08] bg-white/[0.02] p-6 mb-8">
                  <h3 className="text-[11px] font-medium text-white/30 tracking-wider mb-4">CLI EQUIVALENT</h3>
                  <pre className="text-[13px] font-medium text-zinc-300/70 leading-relaxed overflow-x-auto">
{`$ agent-aegis register \\
    --name "${formData.operatorName || "operator-name"}" \\
    --namespace "${formData.namespace || "namespace"}" \\
    --repo "${formData.githubUrl || "https://github.com/..."}" \\
    --category "${formData.category || "Development"}" \\
    --price ${formData.price || "0.02"} \\
    --bond ${selectedBond.amount} \\
    --class ${formData.operatorClass || "RECON"} \\
    --tier ${selectedBond.id}`}
                  </pre>
                </div>

                {/* Submit button */}
                <SubmitButton formData={formData} bondTier={selectedBond.id} />
                <p className="text-[11px] text-white/20 mt-3 text-center">
                  Requires a Solana wallet with sufficient $AEGIS balance
                </p>
              </div>
            </div>

            {/* Right sidebar */}
            <div className="space-y-8">
              {/* Validation Timeline */}
              <div className="border border-white/[0.08] bg-white/[0.02] p-8">
                <h3 className="text-[13px] font-medium text-zinc-300/60 tracking-wider mb-8">VALIDATION PIPELINE</h3>
                <TimelineStep
                  step={1}
                  title="Submission"
                  desc="Your OPERATOR.md and repository are submitted to the Aegis Registry. Bond is locked in escrow."
                  duration="Instant"
                  active={true}
                />
                <TimelineStep
                  step={2}
                  title="Automated Scan"
                  desc="Static analysis checks for malicious code, permission abuse, and OPERATOR.md spec compliance."
                  duration="~2 min"
                  active={true}
                />
                <TimelineStep
                  step={3}
                  title="Validator Review"
                  desc={`${selectedBond.validators} bonded validator${selectedBond.validators > 1 ? "s" : ""} independently review your operator. Each stakes their own $AEGIS on their attestation.`}
                  duration={selectedBond.reviewTime}
                  active={true}
                />
                <TimelineStep
                  step={4}
                  title="Consensus"
                  desc="Validators must reach consensus. If approved, your operator is listed in the Aegis Index immediately."
                  duration="~5 min"
                  active={true}
                />
                <TimelineStep
                  step={5}
                  title="Live"
                  desc="Your operator is discoverable by all agents. Revenue streams begin on first invocation via x402."
                  duration="Ongoing"
                  active={true}
                />
              </div>

              {/* Bond explainer */}
              <div className="border border-white/[0.08] bg-white/[0.02] p-8">
                <h3 className="text-[13px] font-medium text-zinc-300/60 tracking-wider mb-6">WHY BOND $AEGIS?</h3>
                <div className="space-y-5">
                  {[
                    { title: "Quality Signal", desc: "Higher bonds signal higher confidence. Consumers prefer operators with larger stakes." },
                    { title: "Slash Protection", desc: "Your bond is only slashed if your operator is proven malicious through the prediction market dispute system." },
                    { title: "Featured Placement", desc: "Standard and Premium tiers get priority placement in search results and curated sections." },
                    { title: "Faster Review", desc: "Higher tiers attract more validators and get reviewed faster. Premium operators can go live in under 4 hours." },
                    { title: "Reputation Multiplier", desc: "Bond size contributes to your on-chain reputation score, which compounds over time." },
                  ].map((item, i) => (
                    <div key={i}>
                      <h4 className="text-[13px] font-normal text-white/70 mb-1">{item.title}</h4>
                      <p className="text-[12px] text-white/30 leading-relaxed">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* OPERATOR.md spec */}
              <div className="border border-white/[0.08] bg-white/[0.02] p-8">
                <h3 className="text-[13px] font-medium text-zinc-300/60 tracking-wider mb-6">OPERATOR.MD SPEC</h3>
                <p className="text-[12px] text-white/35 leading-relaxed mb-4">
                  Every operator must include a OPERATOR.md file at the repository root. This is the standard format
                  used across the agent ecosystem  -  compatible with Claude Code, Claude Cowork, Codex CLI, Codex App, ChatGPT, Cursor, and more.
                </p>
                <pre className="text-[11px] font-medium text-white/40 leading-relaxed bg-white/[0.02] border border-white/[0.07] p-4 rounded overflow-x-auto">
{`# Operator Callsign

> One-line description

## Instructions
Step-by-step usage guide

## Tools Required
- tool_name: description

## Examples
\`\`\`
Example invocation
\`\`\`

## Permissions
- network: why needed
- filesystem: why needed`}
                </pre>
                <a
                  href="/docs"
                  className="inline-block mt-4 text-[12px] font-medium text-zinc-300/50 hover:text-zinc-300 transition-colors"
                >
                  View full specification →
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Revenue Calculator  -  full width */}
      <section className="py-24 border-t border-white/[0.07]">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
          <div className="max-w-3xl mb-16">
            <span className="text-[11px] font-medium text-zinc-300/40 tracking-widest">EARNINGS</span>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mt-4 mb-6">
              <span className="text-white/90">Estimate your</span>
              <br />
              <span className="text-white/30">revenue.</span>
            </h2>
            <p className="text-lg text-white/40 leading-relaxed">
              Creators earn 60% of every invocation. Adjust the sliders to see projected monthly earnings
              based on your operator's usage and pricing.
            </p>
          </div>
          <RevenueCalc />
        </div>
      </section>

      {/* x402 callout */}
      <section className="py-16 border-t border-white/[0.07] bg-white/[0.01]">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            <div className="max-w-lg">
              <h3 className="text-xl font-normal text-white/80 mb-3">Built on the x402 Open Standard</h3>
              <p className="text-[14px] text-white/35 leading-relaxed">
                Every invocation is paid via the x402 micropayment protocol, an open standard for machine-to-machine payments.
                Agents pay in USDC. No subscriptions. No minimums. No friction.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {["x402 Standard", "USDC", "Solana", "Token-2022", "MCP Compatible"].map(name => (
                <span key={name} className="text-[10px] font-medium text-white/20 bg-white/[0.02] border border-white/[0.07] px-3 py-1.5">
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-24 border-t border-white/[0.07]">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white/90 mb-4">Ready to ship?</h2>
          <p className="text-[15px] text-white/40 mb-8 max-w-md mx-auto">
            Register your operator, stake your bond, and start earning from the first invocation.
          </p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="bg-white text-zinc-900 font-normal text-[14px] px-8 py-3 hover:bg-zinc-200 transition-colors"
            >
              Start Registration
            </button>
            <a
              href="/docs"
              className="text-[14px] font-medium text-white/40 hover:text-white/70 border border-white/[0.1] hover:border-white/[0.2] px-8 py-3 transition-all"
            >
              Read the Docs
            </a>
          </div>
        </div>
      </section>

      {/* Minimal footer */}
      <footer className="border-t border-white/[0.07] py-8">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 flex items-center justify-between">
          <span className="text-[11px] font-medium text-white/15">AEGIS PROTOCOL</span>
          <span className="text-[11px] font-medium text-white/15">$AEGIS on Solana</span>
        </div>
      </footer>
    </div>
    </RequireWallet>
  );
}
