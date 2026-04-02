import { useState, useCallback, CSSProperties } from "react";
import { useLocation } from "wouter";
import { T } from "./Dashboard/theme";
import { trpc } from "../lib/trpc";

/* ── Types ─────────────────────────────────────────────────── */

type Step = 1 | 2 | 3;

interface WizardState {
  name: string;
  description: string;
  category: string;
  endpointUrl: string;
  skipEndpoint: boolean;
  pricePerCall: string;
  customPrice: string;
}

const CATEGORIES = [
  "DeFi", "Research", "Content", "Security", "Data",
  "Infrastructure", "Social", "Gaming", "Other",
] as const;

const CATEGORY_ICONS: Record<string, string> = {
  DeFi: "\u{1F4B0}", Research: "\u{1F50D}", Content: "\u{270F}\u{FE0F}",
  Security: "\u{1F6E1}\u{FE0F}", Data: "\u{1F4CA}", Infrastructure: "\u{2699}\u{FE0F}",
  Social: "\u{1F310}", Gaming: "\u{1F3AE}", Other: "\u{2728}",
};

const PRICE_PRESETS = [
  { label: "Free", value: "0" },
  { label: "$0.003", value: "0.003" },
  { label: "$0.01", value: "0.01" },
  { label: "$0.05", value: "0.05" },
  { label: "Custom", value: "custom" },
];

/* ── Styles ────────────────────────────────────────────────── */

const s = {
  page: {
    minHeight: "100vh",
    background: T.bg,
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    padding: "60px 20px 100px",
    fontFamily: "'Inter', system-ui, sans-serif",
  } satisfies CSSProperties,
  wrapper: {
    width: "100%",
    maxWidth: 640,
    position: "relative" as const,
    overflow: "hidden",
  } satisfies CSSProperties,
  heading: {
    color: T.text90,
    fontSize: 28,
    fontWeight: 400,
    marginBottom: 6,
    letterSpacing: "-0.02em",
  } satisfies CSSProperties,
  sub: {
    color: T.text50,
    fontSize: 14,
    marginBottom: 40,
  } satisfies CSSProperties,
  stepBar: {
    display: "flex",
    gap: 8,
    marginBottom: 36,
  } satisfies CSSProperties,
  label: {
    display: "block",
    color: T.text70,
    fontSize: 13,
    fontWeight: 400,
    marginBottom: 8,
  } satisfies CSSProperties,
  input: {
    width: "100%",
    boxSizing: "border-box" as const,
    background: T.card,
    border: `1px solid ${T.border}`,
    borderRadius: 4,
    padding: "12px 14px",
    color: T.text90,
    fontSize: 14,
    outline: "none",
    transition: "border-color 0.2s",
  } satisfies CSSProperties,
  catGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: 10,
    marginTop: 8,
  } satisfies CSSProperties,
  btn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    height: 44,
    padding: "0 28px",
    borderRadius: 4,
    border: "none",
    fontSize: 14,
    fontWeight: 400,
    cursor: "pointer",
    transition: "all 0.2s",
  } satisfies CSSProperties,
  summary: {
    background: T.card,
    border: `1px solid ${T.border}`,
    borderRadius: 4,
    padding: 24,
    marginBottom: 28,
  } satisfies CSSProperties,
  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "10px 0",
    borderBottom: `1px solid ${T.border}`,
    fontSize: 14,
  } satisfies CSSProperties,
};

/* ── Helpers ───────────────────────────────────────────────── */

function isValidUrl(str: string): boolean {
  try {
    const u = new URL(str);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/* ── Sub-components ────────────────────────────────────────── */

function StepIndicator({ current }: { current: Step }) {
  return (
    <div style={s.stepBar}>
      {([1, 2, 3] as Step[]).map((n) => (
        <div
          key={n}
          style={{
            flex: 1,
            height: 4,
            borderRadius: 2,
            background: n <= current ? T.mint : T.border,
            transition: "background 0.3s",
          }}
        />
      ))}
    </div>
  );
}

function StepWhatWhere({
  state, setState, onNext,
}: { state: WizardState; setState: (s: WizardState) => void; onNext: () => void }) {
  const valid = state.name.trim().length > 0 && state.description.trim().length > 0 && state.category !== "";
  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <label style={s.label}>Name your skill</label>
        <input
          style={s.input}
          placeholder="e.g. DeFi Yield Optimizer"
          value={state.name}
          onChange={(e) => setState({ ...state, name: e.target.value })}
        />
      </div>
      <div style={{ marginBottom: 24 }}>
        <label style={s.label}>One-line description</label>
        <input
          style={s.input}
          placeholder="Describe what your skill does in one sentence"
          value={state.description}
          onChange={(e) => setState({ ...state, description: e.target.value })}
        />
      </div>
      <label style={s.label}>Category</label>
      <div style={s.catGrid}>
        {CATEGORIES.map((cat) => {
          const active = state.category === cat;
          return (
            <button
              key={cat}
              onClick={() => setState({ ...state, category: cat })}
              style={{
                background: active ? "rgba(52,211,153,0.12)" : T.card,
                border: `1px solid ${active ? T.mint : T.border}`,
                borderRadius: 4,
                padding: "16px 10px",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                transition: "all 0.2s",
                color: active ? T.mint : T.text70,
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              <span style={{ fontSize: 22 }}>{CATEGORY_ICONS[cat]}</span>
              {cat}
            </button>
          );
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 32 }}>
        <button
          disabled={!valid}
          onClick={onNext}
          style={{
            ...s.btn,
            background: valid ? T.mint : T.border,
            color: valid ? "#000" : T.text30,
          }}
        >
          Next
        </button>
      </div>
    </div>
  );
}

function StepConnect({
  state, setState, onNext, onBack,
}: { state: WizardState; setState: (s: WizardState) => void; onNext: () => void; onBack: () => void }) {
  const urlOk = state.skipEndpoint || isValidUrl(state.endpointUrl);
  const price = state.pricePerCall === "custom" ? state.customPrice : state.pricePerCall;
  const priceOk = price !== "" && !isNaN(Number(price)) && Number(price) >= 0;
  const valid = urlOk && priceOk;

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <label style={s.label}>Paste your API endpoint URL</label>
        <input
          style={{
            ...s.input,
            borderColor: state.endpointUrl && !state.skipEndpoint
              ? isValidUrl(state.endpointUrl) ? T.mint : T.red
              : T.border,
            opacity: state.skipEndpoint ? 0.4 : 1,
          }}
          placeholder="https://api.example.com/v1/skill"
          value={state.endpointUrl}
          disabled={state.skipEndpoint}
          onChange={(e) => setState({ ...state, endpointUrl: e.target.value })}
        />
        {state.endpointUrl && !state.skipEndpoint && !isValidUrl(state.endpointUrl) && (
          <span style={{ color: T.red, fontSize: 12, marginTop: 4, display: "block" }}>
            Enter a valid HTTP/HTTPS URL
          </span>
        )}
      </div>
      <label
        style={{
          display: "flex", alignItems: "center", gap: 10,
          color: T.text50, fontSize: 13, cursor: "pointer", marginBottom: 28,
        }}
      >
        <span
          onClick={() => setState({ ...state, skipEndpoint: !state.skipEndpoint, endpointUrl: "" })}
          style={{
            width: 36, height: 20, borderRadius: 4,
            background: state.skipEndpoint ? T.mint : T.border,
            position: "relative", cursor: "pointer", transition: "background 0.2s",
            display: "inline-block", flexShrink: 0,
          }}
        >
          <span style={{
            position: "absolute", top: 2, left: state.skipEndpoint ? 18 : 2,
            width: 16, height: 16, borderRadius: 8, background: "#fff",
            transition: "left 0.2s",
          }} />
        </span>
        I'll add an endpoint later
      </label>

      <label style={s.label}>Price per call</label>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        {PRICE_PRESETS.map((p) => {
          const active = state.pricePerCall === p.value;
          return (
            <button
              key={p.value}
              onClick={() => setState({ ...state, pricePerCall: p.value })}
              style={{
                ...s.btn,
                height: 36,
                padding: "0 16px",
                fontSize: 13,
                background: active ? "rgba(52,211,153,0.12)" : T.card,
                border: `1px solid ${active ? T.mint : T.border}`,
                color: active ? T.mint : T.text70,
              }}
            >
              {p.label}
            </button>
          );
        })}
      </div>
      {state.pricePerCall === "custom" && (
        <input
          style={{ ...s.input, maxWidth: 200 }}
          placeholder="0.00"
          type="number"
          min="0"
          step="0.001"
          value={state.customPrice}
          onChange={(e) => setState({ ...state, customPrice: e.target.value })}
        />
      )}

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 32 }}>
        <button onClick={onBack} style={{ ...s.btn, background: "transparent", color: T.text50, border: `1px solid ${T.border}` }}>
          Back
        </button>
        <button
          disabled={!valid}
          onClick={onNext}
          style={{ ...s.btn, background: valid ? T.mint : T.border, color: valid ? "#000" : T.text30 }}
        >
          Next
        </button>
      </div>
    </div>
  );
}

function ConfettiOverlay() {
  const colors = [T.mint, T.gold, T.blue, T.purple, "#fff"];
  const particles = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.6,
    dur: 1.2 + Math.random() * 1,
    color: colors[i % colors.length],
    size: 4 + Math.random() * 6,
  }));
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9999, overflow: "hidden" }}>
      <style>{`
        @keyframes confetti-fall { 0% { transform: translateY(-20px) rotate(0deg); opacity:1 } 100% { transform: translateY(100vh) rotate(720deg); opacity:0 } }
      `}</style>
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: "absolute",
            left: `${p.x}%`,
            top: -10,
            width: p.size,
            height: p.size * 1.4,
            borderRadius: 2,
            background: p.color,
            animation: `confetti-fall ${p.dur}s ease-in ${p.delay}s forwards`,
          }}
        />
      ))}
    </div>
  );
}

function StepDeploy({
  state, onBack,
}: { state: WizardState; onBack: () => void }) {
  const [, navigate] = useLocation();
  const [deployed, setDeployed] = useState(false);
  const [slug, setSlug] = useState("");

  const register = trpc.operator.register.useMutation({
    onSuccess: (data: any) => {
      const s = data?.slug || state.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      setSlug(s);
      setDeployed(true);
    },
  });

  const price = state.pricePerCall === "custom" ? state.customPrice : state.pricePerCall;

  const handleDeploy = useCallback(() => {
    const categoryMap: Record<string, string> = {
      DeFi: "financial-analysis", Research: "data-extraction", Content: "text-generation",
      Security: "security-audit", Data: "data-extraction", Infrastructure: "other",
      Social: "other", Gaming: "other", Other: "other",
    };
    register.mutate({
      name: state.name,
      tagline: state.description,
      category: categoryMap[state.category] || "other",
      endpointUrl: state.skipEndpoint ? undefined : state.endpointUrl,
      pricePerCall: price,
    } as any);
  }, [state, price, register]);

  if (deployed) {
    return (
      <div style={{ textAlign: "center", paddingTop: 40 }}>
        <ConfettiOverlay />
        <div style={{ fontSize: 48, marginBottom: 16 }}>&#x2705;</div>
        <h2 style={{ color: T.mint, fontSize: 24, fontWeight: 400, marginBottom: 8 }}>
          Skill Deployed!
        </h2>
        <p style={{ color: T.text50, fontSize: 14, marginBottom: 32 }}>
          "{state.name}" is now live on the Aegis marketplace.
        </p>
        <button
          onClick={() => navigate(`/marketplace/${slug}`)}
          style={{ ...s.btn, background: T.mint, color: "#000" }}
        >
          View Your Skill
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={s.summary}>
        <h3 style={{ color: T.text90, fontSize: 16, fontWeight: 400, marginBottom: 16 }}>
          Deployment Summary
        </h3>
        {([
          ["Name", state.name],
          ["Description", state.description],
          ["Category", state.category],
          ["Endpoint", state.skipEndpoint ? "Placeholder (add later)" : state.endpointUrl],
          ["Price / call", price === "0" ? "Free" : `$${price}`],
        ] as [string, string][]).map(([k, v], i) => (
          <div key={i} style={s.summaryRow}>
            <span style={{ color: T.text50 }}>{k}</span>
            <span style={{ color: T.text90, fontWeight: 500, maxWidth: "85%", textAlign: "right", wordBreak: "break-all" }}>{v}</span>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <button
          onClick={onBack}
          style={{ ...s.btn, background: "transparent", color: T.text50, border: `1px solid ${T.border}` }}
        >
          Back
        </button>
        <button
          onClick={handleDeploy}
          disabled={register.isPending}
          style={{
            ...s.btn,
            background: register.isPending ? T.border : T.mint,
            color: register.isPending ? T.text30 : "#000",
            minWidth: 160,
          }}
        >
          {register.isPending ? "Deploying..." : "Deploy Skill"}
        </button>
      </div>

      {register.isError && (
        <p style={{ color: T.red, fontSize: 13, marginTop: 16, textAlign: "center" }}>
          {register.error?.message || "Deployment failed. Please try again."}
        </p>
      )}
    </div>
  );
}

/* ── Main Component ────────────────────────────────────────── */

export default function DeployWizard() {
  const [step, setStep] = useState<Step>(1);
  const [state, setState] = useState<WizardState>({
    name: "",
    description: "",
    category: "",
    endpointUrl: "",
    skipEndpoint: false,
    pricePerCall: "0.003",
    customPrice: "",
  });

  const slideStyle = (target: Step): CSSProperties => ({
    transition: "transform 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.3s",
    transform: step === target ? "translateX(0)" : step > target ? "translateX(-40px)" : "translateX(40px)",
    opacity: step === target ? 1 : 0,
    position: step === target ? "relative" as const : "absolute" as const,
    width: "100%",
    pointerEvents: step === target ? "auto" as const : "none" as const,
  });

  return (
    <div style={s.page}>
      <div style={s.wrapper}>
        <h1 style={s.heading}>Deploy a Skill</h1>
        <p style={s.sub}>
          {step === 1 && "Step 1 of 3. Define your skill"}
          {step === 2 && "Step 2 of 3. Connect your endpoint"}
          {step === 3 && "Step 3 of 3. Review & deploy"}
        </p>
        <StepIndicator current={step} />

        <div style={{ position: "relative" }}>
          <div style={slideStyle(1)}>
            {step === 1 && (
              <StepWhatWhere state={state} setState={setState} onNext={() => setStep(2)} />
            )}
          </div>
          <div style={slideStyle(2)}>
            {step === 2 && (
              <StepConnect
                state={state}
                setState={setState}
                onNext={() => setStep(3)}
                onBack={() => setStep(1)}
              />
            )}
          </div>
          <div style={slideStyle(3)}>
            {step === 3 && (
              <StepDeploy state={state} onBack={() => setStep(2)} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
