import { useState, useEffect } from "react";
import SectionLabel from "@/components/SectionLabel";
import { useInView } from "@/hooks/useInView";

interface WorkflowStep {
  id: string;
  operator: string;
  domain: string;
  input: string;
  output: string;
  cost: string;
  latency: string;
  status: "complete" | "active" | "pending";
}

const WORKFLOWS: { name: string; description: string; steps: WorkflowStep[] }[] = [
  {
    name: "Document Intelligence Pipeline",
    description: "Agent receives a PDF, extracts text, translates it, summarizes it, and generates a structured report.",
    steps: [
      { id: "1", operator: "pdf-extract-pro", domain: "pdfextract.aegis.sol", input: "contract.pdf (2.4MB)", output: "raw_text (18K tokens)", cost: "$0.0034", latency: "310ms", status: "complete" },
      { id: "2", operator: "entity-extract", domain: "entities.aegis.sol", input: "raw_text (18K tokens)", output: "entities[] (47 items)", cost: "$0.0021", latency: "180ms", status: "complete" },
      { id: "3", operator: "aegis-translate-es", domain: "translate.aegis.sol", input: "raw_text (18K tokens)", output: "translated_text (19K tokens)", cost: "$0.0089", latency: "420ms", status: "complete" },
      { id: "4", operator: "text-summarize", domain: "summarize.aegis.sol", input: "translated_text", output: "summary (800 tokens)", cost: "$0.0012", latency: "95ms", status: "active" },
      { id: "5", operator: "chart-gen-v4", domain: "charts.aegis.sol", input: "entities[] + summary", output: "report.html", cost: "$0.0045", latency: "~600ms", status: "pending" },
    ],
  },
  {
    name: "Code Review & Optimization",
    description: "Agent analyzes a pull request, reviews code quality, optimizes SQL queries, and generates a test suite.",
    steps: [
      { id: "1", operator: "gpt4-code-review", domain: "codereview.aegis.sol", input: "diff.patch (340 lines)", output: "review{issues: 7}", cost: "$0.0067", latency: "142ms", status: "complete" },
      { id: "2", operator: "sql-optimize", domain: "sqlopt.aegis.sol", input: "queries[] (3 slow)", output: "optimized[] (3)", cost: "$0.0023", latency: "210ms", status: "complete" },
      { id: "3", operator: "api-test-suite", domain: "apitests.aegis.sol", input: "endpoints[] (12)", output: "tests[] (36 cases)", cost: "$0.0041", latency: "380ms", status: "active" },
      { id: "4", operator: "a11y-audit", domain: "a11y.aegis.sol", input: "components[] (8)", output: "audit_report", cost: "$0.0018", latency: "~150ms", status: "pending" },
    ],
  },
  {
    name: "Content Generation Pipeline",
    description: "Agent takes a topic, researches it, generates copy, creates images, and produces a social media kit.",
    steps: [
      { id: "1", operator: "sentiment-v3", domain: "sentiment.aegis.sol", input: "topic: 'AI safety'", output: "sentiment_context", cost: "$0.0008", latency: "67ms", status: "complete" },
      { id: "2", operator: "text-summarize", domain: "summarize.aegis.sol", input: "research_corpus (50K)", output: "brief (2K tokens)", cost: "$0.0031", latency: "280ms", status: "complete" },
      { id: "3", operator: "stable-diff-gen", domain: "imagegen.aegis.sol", input: "brief + style_guide", output: "images[] (4x 1024px)", cost: "$0.0120", latency: "4800ms", status: "active" },
      { id: "4", operator: "voice-clone-v2", domain: "voiceclone.aegis.sol", input: "script (500 words)", output: "audio.mp3 (2:30)", cost: "$0.0085", latency: "~6200ms", status: "pending" },
    ],
  },
];

function StepNode({ step, index }: { step: WorkflowStep; index: number }) {
  const statusColors = {
    complete: { border: "border-white/[0.08]", bg: "bg-white/[0.04]", text: "text-zinc-300/70" },
    active: { border: "border-amber-400/30", bg: "bg-amber-400/[0.04]", text: "text-amber-400/70" },
    pending: { border: "border-white/[0.04]", bg: "bg-white/[0.015]", text: "text-white/30" },
  };
  const c = statusColors[step.status];

  return (
    <div className={`p-4 border ${c.border} ${c.bg} rounded transition-all duration-300`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[10px] font-medium text-white/20 bg-white/[0.04] px-1.5 py-0.5 rounded shrink-0">STEP {index + 1}</span>
            <span className={`text-[12px] sm:text-[13px] font-normal ${c.text} truncate`}>{step.operator}</span>
          </div>
          <span className={`text-[10px] font-medium ${c.text} shrink-0 ml-2`}>{step.status.toUpperCase()}</span>
        </div>
      <div className="text-[10px] font-medium text-white/15 mb-3">{step.domain}</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-[11px] font-medium">
        <div><span className="text-white/20">in:</span> <span className="text-white/40">{step.input}</span></div>
        <div><span className="text-white/20">out:</span> <span className="text-white/40">{step.output}</span></div>
        <div><span className="text-white/20">cost:</span> <span className="text-zinc-300/50">{step.cost}</span></div>
        <div><span className="text-white/20">latency:</span> <span className="text-white/40">{step.latency}</span></div>
      </div>
    </div>
  );
}

export default function TaskDelegation() {
  const { ref, inView } = useInView(0.05);
  const [activeWorkflow, setActiveWorkflow] = useState(0);
  const [animatedStep, setAnimatedStep] = useState(0);

  const workflow = WORKFLOWS[activeWorkflow];
  const totalCost = workflow.steps.reduce((sum, s) => sum + parseFloat(s.cost.slice(1)), 0);

  // Animate steps progressing
  useEffect(() => {
    if (!inView) return;
    setAnimatedStep(0);
    const timer = setInterval(() => {
      setAnimatedStep(prev => {
        if (prev >= workflow.steps.length - 1) {
          clearInterval(timer);
          return prev;
        }
        return prev + 1;
      });
    }, 1200);
    return () => clearInterval(timer);
  }, [inView, activeWorkflow, workflow.steps.length]);

  return (
    <section id="delegation" className="py-16 sm:py-32 lg:py-40 border-t border-white/[0.04]" ref={ref}>
      <div className="container">
        <SectionLabel text="DELEGATION" />

        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-12">
          <div>
            <h2 className={`text-[clamp(2rem,4.5vw,3.5rem)] font-normal text-white leading-[1.05] tracking-tight`}>
              Agents chain operators.<br />
              <span className="text-white/30">Workflows emerge.</span>
            </h2>
            <p className={`text-[14px] text-white/30 max-w-lg leading-relaxed mt-4`}>
              A single <span className="font-medium text-white/50">POST /aegis/delegate</span> call lets any agent
              chain operators into multi-step workflows. Each step settles independently via x402.
              The network routes, validates, and settles automatically.
            </p>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-medium text-white/20 tracking-wider mb-2">PIPELINE COST</div>
            <div className="text-[28px] font-normal text-zinc-300 ">${totalCost.toFixed(4)}</div>
            <div className="text-[10px] font-medium text-white/15">{workflow.steps.length} operators chained</div>
          </div>
        </div>

        {/* Workflow selector */}
        <div className="flex flex-wrap gap-3 mb-8">
          {WORKFLOWS.map((w, i) => (
            <button
              key={i}
              onClick={() => setActiveWorkflow(i)}
              className={`px-3 sm:px-4 py-2 sm:py-2.5 text-[11px] sm:text-[12px] font-medium tracking-wider rounded transition-all ${activeWorkflow === i ? "bg-white/[0.04] text-zinc-300 border border-white/[0.08]" : "bg-white/[0.015] text-white/30 border border-white/[0.04] hover:text-white/50"}`}
            >
              {w.name}
            </button>
          ))}
        </div>

        {/* Workflow description */}
        <div className={`mb-8 p-4 border border-white/[0.04] bg-white/[0.015] rounded`}>
          <p className="text-[13px] text-white/40 leading-relaxed">{workflow.description}</p>
        </div>

        {/* Steps */}
        <div className={`grid gap-3`}>
          {workflow.steps.map((step, i) => {
            const animStatus = i < animatedStep ? "complete" : i === animatedStep ? "active" : "pending";
            return (
              <StepNode
                key={`${activeWorkflow}-${step.id}`}
                step={{ ...step, status: animStatus }}
                index={i}
              />
            );
          })}
        </div>

        {/* Bottom callout */}
        <div className="mt-8 sm:mt-12 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="p-5 border border-white/[0.04] bg-white/[0.015]">
            <div className="text-[10px] font-medium text-white/20 tracking-wider mb-2">ATOMIC SETTLEMENT</div>
            <p className="text-[13px] text-white/40 leading-relaxed">
              Each step settles independently. If step 3 fails, steps 1-2 are already paid.
              The caller's bond covers the failed step's cost.
            </p>
          </div>
          <div className="p-5 border border-white/[0.04] bg-white/[0.015]">
            <div className="text-[10px] font-medium text-white/20 tracking-wider mb-2">AUTOMATIC ROUTING</div>
            <p className="text-[13px] text-white/40 leading-relaxed">
              The protocol selects the highest-quality operator for each step.
              If an operator is degraded, the next-best alternative is routed automatically.
            </p>
          </div>
          <div className="p-5 border border-white/[0.04] bg-white/[0.015]">
            <div className="text-[10px] font-medium text-white/20 tracking-wider mb-2">RECEIPT CHAIN</div>
            <p className="text-[13px] text-white/40 leading-relaxed">
              Every step mints a cNFT receipt. The full pipeline produces a linked chain
              of verifiable proofs, queryable by any downstream agent.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
