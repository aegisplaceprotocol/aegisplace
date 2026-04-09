import { useState, useRef } from "react";
import { useParams, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import MobileBottomNav from "@/components/MobileBottomNav";
import { NvidiaEyeLogo } from "@/components/NvidiaLogo";
import { useWalletModal } from "@/components/WalletModal";
import { mcpConnectivityUrl } from "@/lib/api";
import { trpc, type RouterOutputs } from "@/lib/trpc";
import { invokeWithPaywall, type PaidInvokeResult } from "@/lib/x402";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { toast } from "sonner";

type InvocationRecord = RouterOutputs["invoke"]["byOperator"][number];

/* ─────────────────────────────────────────────────────────────────────────────
   DESIGN TOKENS — exact match to SkillsMarketplace
───────────────────────────────────────────────────────────────────────────── */
const T = {
  bg: "#0A0A0B",
  card: "rgba(255,255,255,0.015)",
  cardHover: "rgba(255,255,255,0.025)",
  border: "rgba(255,255,255,0.05)",
  borderSubtle: "rgba(255,255,255,0.03)",
  borderHover: "rgba(255,255,255,0.08)",
  text95: "rgba(255,255,255,0.92)",
  text80: "rgba(255,255,255,0.72)",
  text50: "rgba(255,255,255,0.44)",
  text30: "rgba(255,255,255,0.28)",
  text20: "rgba(255,255,255,0.18)",
  text12: "rgba(255,255,255,0.10)",
  accent: "rgba(52,211,153,0.60)",
  accentSubtle: "rgba(52,211,153,0.12)",
  accentBorder: "rgba(52,211,153,0.25)",
  white2: "rgba(255,255,255,0.02)",
  white4: "rgba(255,255,255,0.04)",
  white6: "rgba(255,255,255,0.06)",
};

const FONT_SANS = "'DM Sans', 'Helvetica Neue', sans-serif";
const FONT_MONO = "'DM Mono', 'SF Mono', 'Fira Code', monospace";

/* ─────────────────────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────────────────────── */
function parseDecimal(val: any): number {
  if (!val) return 0;
  if (typeof val === "number") return val;
  if (val.$numberDecimal) return parseFloat(val.$numberDecimal);
  return parseFloat(String(val)) || 0;
}

function extractUnlockedSkill(result: PaidInvokeResult | null): string | null {
  if (!result || !result.result || typeof result.result !== "object") return null;
  const skill = (result.result as { skill?: unknown }).skill;
  return typeof skill === "string" ? skill : null;
}

function fmtPrice(price: number): string {
  if (price <= 0) return "Free";
  if (price < 0.001) return `$${price.toFixed(6)}`;
  if (price < 0.01) return `$${price.toFixed(5)}`;
  if (price < 0.1) return `$${price.toFixed(4)}`;
  return `$${price.toFixed(3)}`;
}

function catLabel(cat: string): string {
  return cat.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function shortWallet(w: string): string {
  if (!w || w.length < 8) return w || "";
  return `${w.slice(0, 6)}…${w.slice(-4)}`;
}

function fmtUsdLike(value: unknown, digits = 6): string {
  const amount = parseDecimal(value);
  return `$${amount.toFixed(digits)}`;
}

function fmtTimestamp(value: unknown): string {
  if (!value) return "Unknown time";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return "Unknown time";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function getSolscanClusterParam(cluster?: string | null): string {
  if (!cluster || cluster === "mainnet-beta") return "";
  return `?cluster=${cluster}`;
}

function buildSolscanTxUrl(signature: string, cluster?: string | null): string {
  return `https://solscan.io/tx/${signature}${getSolscanClusterParam(cluster)}`;
}

/* ─────────────────────────────────────────────────────────────────────────────
   TABS
───────────────────────────────────────────────────────────────────────────── */
type Tab = "overview" | "how-to-use" | "invoke" | "history";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview",    label: "Overview"    },
  { id: "how-to-use",  label: "How to Use"  },
  { id: "invoke",      label: "Invoke"      },
  { id: "history",     label: "History"     },
];

/* ─────────────────────────────────────────────────────────────────────────────
   ICONS
───────────────────────────────────────────────────────────────────────────── */
function IconCopy() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <rect x="4" y="4" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.1" />
      <path d="M1 8V1h7" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}
function IconCheck() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconArrowLeft() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M9.5 6H2.5M5.5 3l-3 3 3 3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconExternalLink() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
      <path d="M6.5 1.5H9.5V4.5M9.5 1.5L5 6M2 3H1V10H8V9" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconVerified() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <circle cx="6.5" cy="6.5" r="5.5" stroke={T.accentBorder} strokeWidth="1" />
      <path d="M4 6.5l2 2 3-3" stroke={T.accent} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   COPY BUTTON
───────────────────────────────────────────────────────────────────────────── */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };
  return (
    <button
      onClick={handle}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        padding: "4px 10px",
        background: copied ? T.accentSubtle : T.white4,
        border: `1px solid ${copied ? T.accentBorder : T.border}`,
        borderRadius: 5,
        color: copied ? T.accent : T.text50,
        fontSize: 10,
        fontFamily: FONT_SANS,
        fontWeight: 500,
        cursor: "pointer",
        letterSpacing: "0.04em",
        transition: "all 0.2s ease",
      }}
    >
      {copied ? <IconCheck /> : <IconCopy />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   CODE BLOCK — syntax-highlighted via color spans
───────────────────────────────────────────────────────────────────────────── */
function CodeBlock({ code, lang = "bash" }: { code: string; lang?: string }) {
  // Minimal coloring: strings, keys, comments, keywords
  function colorize(line: string): React.ReactNode {
    // For bash-style: highlight flags (--header, -H, -X), strings, urls
    const parts: React.ReactNode[] = [];
    let i = 0;
    const src = line;

    // simple tokenizer pass
    while (i < src.length) {
      // comment
      if (src[i] === "#") {
        parts.push(<span key={i} style={{ color: "rgba(255,255,255,0.22)" }}>{src.slice(i)}</span>);
        break;
      }
      // string (single or double quoted)
      if (src[i] === '"' || src[i] === "'") {
        const q = src[i];
        let j = i + 1;
        while (j < src.length && src[j] !== q) j++;
        parts.push(<span key={i} style={{ color: "rgba(134,239,172,0.85)" }}>{src.slice(i, j + 1)}</span>);
        i = j + 1;
        continue;
      }
      // flags / keys
      if (src[i] === "-" && i > 0 && src[i - 1] === " ") {
        let j = i;
        while (j < src.length && src[j] !== " " && src[j] !== "\n") j++;
        parts.push(<span key={i} style={{ color: "rgba(147,197,253,0.85)" }}>{src.slice(i, j)}</span>);
        i = j;
        continue;
      }
      // json key  "foo":
      const jsonKey = src.slice(i).match(/^"([^"]+)"(\s*:)/);
      if (jsonKey) {
        parts.push(<span key={i} style={{ color: "rgba(196,181,253,0.85)" }}>{`"${jsonKey[1]}"`}</span>);
        parts.push(<span key={i + "c"} style={{ color: T.text50 }}>{jsonKey[2]}</span>);
        i += jsonKey[0].length;
        continue;
      }
      // url
      const url = src.slice(i).match(/^https?:\/\/[^\s'"]+/);
      if (url) {
        parts.push(<span key={i} style={{ color: "rgba(251,191,36,0.8)" }}>{url[0]}</span>);
        i += url[0].length;
        continue;
      }
      // keyword
      const kw = src.slice(i).match(/^(curl|POST|GET|PUT|DELETE|const|await|fetch|method|headers|body|JSON\.stringify|Use|Then|Share|GET|POST)\b/);
      if (kw) {
        parts.push(<span key={i} style={{ color: "rgba(96,165,250,0.9)" }}>{kw[0]}</span>);
        i += kw[0].length;
        continue;
      }
      // default char
      let j = i + 1;
      while (j < src.length) {
        const c = src[j];
        if (c === '"' || c === "'" || c === "#") break;
        if (c === "-" && j > 0 && src[j - 1] === " ") break;
        if (src.slice(j).match(/^https?:\/\//)) break;
        if (src.slice(j).match(/^(curl|POST|GET|PUT|DELETE|const|await|fetch|method|headers|body|JSON\.stringify|Use|Then|Share)\b/)) break;
        j++;
      }
      parts.push(<span key={i} style={{ color: T.text80 }}>{src.slice(i, j)}</span>);
      i = j;
    }
    return parts;
  }

  const lines = code.split("\n");

  return (
    <div style={{
      background: "#0D0D0F",
      border: `1px solid ${T.border}`,
      borderRadius: 8,
      overflow: "hidden",
    }}>
      {/* bar */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 14px",
        borderBottom: `1px solid ${T.borderSubtle}`,
        background: T.white2,
      }}>
        <span style={{ fontSize: 10, fontFamily: FONT_MONO, color: T.text30, letterSpacing: "0.06em" }}>
          {lang}
        </span>
        <CopyButton text={code} />
      </div>
      <pre style={{
        margin: 0,
        padding: "16px 18px",
        overflowX: "auto",
        fontFamily: FONT_MONO,
        fontSize: 12,
        lineHeight: 1.7,
        color: T.text80,
        background: "transparent",
      }}>
        {lines.map((line, idx) => (
          <div key={idx}>{colorize(line)}</div>
        ))}
      </pre>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   STAT CARD — used in 2x2 hero grid
───────────────────────────────────────────────────────────────────────────── */
function StatCard({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{
      background: T.card,
      border: `1px solid ${T.border}`,
      borderRadius: 8,
      padding: "18px 20px",
      display: "flex",
      flexDirection: "column",
      gap: 6,
    }}>
      <div style={{
        fontSize: 10,
        fontWeight: 500,
        color: T.text30,
        letterSpacing: "0.09em",
        textTransform: "uppercase",
        fontFamily: FONT_SANS,
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 24,
        fontWeight: 300,
        color: T.text95,
        letterSpacing: "-0.03em",
        lineHeight: 1,
        fontFamily: mono ? FONT_MONO : FONT_SANS,
        fontVariantNumeric: "tabular-nums",
      }}>
        {value}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   SECTION HEADING
───────────────────────────────────────────────────────────────────────────── */
function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{
      fontSize: 13,
      fontWeight: 500,
      color: T.text50,
      letterSpacing: "0.07em",
      textTransform: "uppercase",
      fontFamily: FONT_SANS,
      margin: "0 0 16px",
    }}>
      {children}
    </h2>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   INTEGRATION CARD — each "how to use" method
───────────────────────────────────────────────────────────────────────────── */
function IntegrationCard({
  title,
  description,
  code,
  lang,
  learnMore,
}: {
  title: string;
  description: string;
  code: string;
  lang: string;
  learnMore?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        background: T.card,
        border: `1px solid ${T.border}`,
        borderRadius: 10,
        padding: "24px 26px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <div>
        <div style={{
          fontSize: 14,
          fontWeight: 500,
          color: T.text95,
          fontFamily: FONT_SANS,
          marginBottom: 6,
          letterSpacing: "-0.01em",
        }}>
          {title}
        </div>
        <div style={{
          fontSize: 12.5,
          color: T.text50,
          fontFamily: FONT_SANS,
          lineHeight: 1.6,
        }}>
          {description}
        </div>
      </div>
      <CodeBlock code={code} lang={lang} />
      {learnMore && (
        <a
          href={learnMore}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            fontSize: 11,
            color: T.accent,
            fontFamily: FONT_SANS,
            textDecoration: "none",
            letterSpacing: "0.02em",
          }}
        >
          Learn more <IconExternalLink />
        </a>
      )}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   LOADING STATE
───────────────────────────────────────────────────────────────────────────── */
function LoadingState() {
  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: FONT_SANS }}>
      <Navbar />
      <div style={{ paddingTop: 120, maxWidth: 1520, margin: "0 auto", padding: "120px 48px 80px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[280, 420, 180, 340].map((w, i) => (
            <motion.div
              key={i}
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ repeat: Infinity, duration: 1.8, delay: i * 0.12, ease: "easeInOut" }}
              style={{ height: i === 0 ? 36 : i === 1 ? 14 : 14, width: w, background: T.white4, borderRadius: 5 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   NOT FOUND STATE
───────────────────────────────────────────────────────────────────────────── */
function NotFoundState({ slug }: { slug: string }) {
  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: FONT_SANS }}>
      <Navbar />
      <div style={{ paddingTop: 120, textAlign: "center", padding: "160px 48px" }}>
        <div style={{ fontSize: 11, fontWeight: 500, color: T.text30, letterSpacing: "0.09em", textTransform: "uppercase", marginBottom: 20, fontFamily: FONT_SANS }}>
          404 Not Found
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 300, color: T.text95, letterSpacing: "-0.03em", marginBottom: 12, fontFamily: FONT_SANS }}>
          Skill not found
        </h1>
        <p style={{ fontSize: 14, color: T.text50, marginBottom: 40, fontFamily: FONT_SANS }}>
          No skill or operator registered under <span style={{ fontFamily: FONT_MONO, color: T.text80 }}>"{slug}"</span>.
        </p>
        <Link href="/marketplace" style={{ textDecoration: "none" }}>
          <button style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "transparent",
            border: `1px solid ${T.border}`,
            borderRadius: 8,
            padding: "10px 20px",
            color: T.text80,
            fontSize: 13,
            fontFamily: FONT_SANS,
            fontWeight: 500,
            cursor: "pointer",
          }}>
            <IconArrowLeft /> Back to Marketplace
          </button>
        </Link>
      </div>
      <MobileBottomNav />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────────────────────── */
export default function OperatorDetail() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug || "";
  const [tab, setTab] = useState<Tab>("overview");
  const { connection } = useConnection();
  const { publicKey, connected, sendTransaction } = useWallet();
  const { setVisible } = useWalletModal();
  const invokeResultRef = useRef<HTMLDivElement>(null);
  const [invokeLoading, setInvokeLoading] = useState(false);
  const [invokeResult, setInvokeResult] = useState<PaidInvokeResult | null>(null);

  // ── Data fetching ────────────────────────────────────────────────────────
  const { data: operator, isLoading, error } = trpc.operator.bySlug.useQuery(
    { slug },
    { enabled: !!slug }
  );

  const operatorHistoryId = operator?.id ? String(operator.id) : "";

  const {
    data: invocations,
    isLoading: invocationsLoading,
    error: invocationsError,
  } = trpc.invoke.byOperator.useQuery(
    { operatorId: operatorHistoryId, limit: 20 },
    { enabled: !!operatorHistoryId }
  );

  const { data: operatorEarnings } = trpc.operator.earnings.useQuery(
    { operatorId: operatorHistoryId },
    { enabled: !!operatorHistoryId }
  );

  const handleInvoke = async () => {
    if (!operator || invokeLoading) return;

    const requiresPayment = parseDecimal(operator.pricePerCall) > 0;
    if (requiresPayment && (!connected || !publicKey || !sendTransaction)) {
      setVisible(true);
      toast.info("Connect a Solana wallet to pay for this skill.");
      return;
    }

    setInvokeLoading(true);

    try {
      const result = await invokeWithPaywall({
        slug,
        payload: { test: true, timestamp: new Date().toISOString() },
        callerWallet: publicKey?.toBase58(),
        connection,
        publicKey,
        sendTransaction: sendTransaction || undefined,
      });

      setInvokeResult(result);
      toast.success(`Skill unlocked. ${result.execution.durationMs}ms`, {
        description: `Fee: $${parseDecimal(result.payment.amount).toFixed(4)} ${result.payment.token}`,
      });
      setTimeout(() => invokeResultRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 100);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Invocation failed";
      toast.error("Invocation error", { description: message });
    } finally {
      setInvokeLoading(false);
    }
  };

  if (isLoading) return <LoadingState />;
  if (error || !operator) return <NotFoundState slug={slug} />;

  // ── Computed values ──────────────────────────────────────────────────────
  const price = parseDecimal(operator.pricePerCall);
  const priceStr = fmtPrice(price);
  const successRate = operator.totalInvocations > 0
    ? ((operator.successfulInvocations / operator.totalInvocations) * 100).toFixed(1)
    : "100.0";
  const avgResponseMs = invocations && invocations.length > 0
    ? Math.round(invocations.reduce((a, b) => a + b.responseMs, 0) / invocations.length)
    : null;
  const creatorEarningsTotal = operatorEarnings?.total != null
    ? parseFloat(String(operatorEarnings.total))
    : parseFloat(String(operator.totalEarned || 0));

  // Correct fee split: 85/10/3/1.5/0.5
  const feeCreator    = price * 0.85;
  const feeValidators = price * 0.10;
  const feeTreasury   = price * 0.03;
  const feeInsurance  = price * 0.015;
  const feeBurn       = price * 0.005;

  const tags = (operator.tags as string[]) || [];
  const category = operator.category || "General";
  const unlockedSkill = extractUnlockedSkill(invokeResult);

  // ── Code examples (dynamic with real slug) ───────────────────────────────
  const invokeUrl = `https://aegisplace.com/api/v1/operators/${slug}/invoke`;
  const checkoutUrl = `https://aegisplace.com/checkout?operatorSlug=${slug}`;

  const curlExample = `# 1. Start with a normal invoke request. No payment headers yet.
curl \
  -X POST \
  ${invokeUrl} \
  -H "Content-Type: application/json" \
  -d '{"input": "your query here"}'

# 2. A paid operator returns HTTP 402 with a checkout URL.
#    The response includes the amount due and where to complete payment.
{
  "error": "PAYMENT_REQUIRED",
  "payment": {
    "amount": "${price.toFixed(6)}",
    "token": "USDC"
  },
  "instructions": {
    "step1": "Open checkout and sign the payment",
    "step2": "Copy the updated curl after payment",
    "step3": "Retry the invoke to get the result"
  },
  "checkoutUrl": "${checkoutUrl}"
}

# 3. Open the checkout URL, connect your wallet, and sign/send the USDC payment.
#    Checkout returns the transaction signature and wallet address to reuse.

# 4. Retry the same invoke with the payment proof headers added.
curl \
  -X POST \
  ${invokeUrl} \
  -H "Content-Type: application/json" \
  -H "X-Payment-Proof: <confirmed-solana-tx-signature>" \
  -H "X-Payer-Wallet: <wallet-used-in-checkout>" \
  -d '{"input": "your query here"}'

# 5. The retry returns the unlocked private SKILL.md result.`;

  const mcpUrl = mcpConnectivityUrl();

  const mcpExample = `{
  "mcpServers": {
    "aegis": {
      "url": "${mcpUrl}"
    }
  }
}`;

  const mcpUsage = `# Then use the tool in Claude Code or Cursor:
1. Use aegis_get_operator with slug "${slug}"
2. Copy the returned operatorId
3. Use aegis_invoke_operator with that operatorId
4. If the operator is paid, the tool returns PAYMENT_REQUIRED plus the checkout URL
5. Open checkout, connect the wallet, and sign/send the USDC payment
6. Copy the confirmed transaction signature from checkout
7. Run aegis_invoke_operator again with:
   - operatorId
   - x-payer-wallet
   - x-payment-proof
8. The second call returns the unlocked private SKILL.md result`;

  const jsExample = `const response = await fetch(
  '${invokeUrl}',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Payment-Proof': process.env.AEGIS_PAYMENT_TX,
      'X-Payer-Wallet': process.env.AEGIS_WALLET,
    },
    body: JSON.stringify({ input: 'your query here' }),
  }
);
const data = await response.json();
console.log(data.result);`;

  const pythonExample = `import os
import requests

response = requests.post(
    "${invokeUrl}",
    headers={
        "Content-Type": "application/json",
    "X-Payment-Proof": os.environ["AEGIS_PAYMENT_TX"],
    "X-Payer-Wallet": os.environ["AEGIS_WALLET"],
    },
    json={"input": "your query here"},
)
print(response.json()["result"])`;

  const responseSchemaRows = [
    { field: "success", type: "boolean", desc: "Whether the private skill unlock completed successfully" },
    { field: "operatorId", type: "string", desc: "The Mongo operator identifier returned by the backend for this skill" },
    { field: "operatorName", type: "string", desc: "Human-readable operator name for the unlocked skill" },
    { field: "operator.slug", type: "string", desc: "Marketplace slug for the operator that was unlocked" },
    { field: "operator.skillStatus", type: "string", desc: "Readiness state of the private skill payload, such as ready" },
    { field: "result.kind", type: "string", desc: "Result payload type returned by the invoke route, currently skill_markdown" },
    { field: "result.skill", type: "string", desc: "The unlocked private SKILL.md markdown content" },
    { field: "result.requestedWith.source", type: "string", desc: "Which entrypoint executed the unlock, for example rest or mcp" },
    { field: "result.requestedWith.callerWallet", type: "string", desc: "Wallet that paid for the unlock when a paid call is made" },
    { field: "execution.durationMs", type: "number", desc: "Backend processing time for the invoke flow" },
    { field: "execution.timestamp", type: "string", desc: "ISO timestamp for when the invoke completed" },
    { field: "payment.amount", type: "string", desc: "Total skill charge settled for this unlock in USDC base units as a decimal string" },
    { field: "payment.txSignature", type: "string", desc: "Confirmed Solana transaction signature used as payment proof" },
    { field: "payment.settlementMethod", type: "string", desc: "Settlement backend used for payment verification, currently aegis_program" },
    { field: "payment.feeSplit.creator", type: "string", desc: "Creator share percentage for this invocation payment" },
    { field: "invocationId", type: "string", desc: "Stored invocation record id for history, payments, and audits" },
    { field: "guardrails.inputPassed", type: "boolean", desc: "Whether the input guardrails allowed the request" },
    { field: "guardrails.violations", type: "string[]", desc: "List of guardrail violation codes, empty when the invoke passes cleanly" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: FONT_SANS }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@300;400;500&display=swap');
        * { box-sizing: border-box; -webkit-font-smoothing: antialiased; }
        ::-webkit-scrollbar { width: 0; height: 0; }
        ::selection { background: rgba(52,211,153,0.18); }
        a { text-decoration: none; }
      `}</style>

      <Navbar />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <div style={{
        width: "100%",
        paddingTop: 64,
        position: "relative",
        overflow: "hidden",
        borderBottom: `1px solid ${T.borderSubtle}`,
      }}>
        {/* Video background */}
        <video
          autoPlay
          loop
          muted
          playsInline
          style={{
            position: "absolute",
            top: 0, left: 0,
            width: "100%", height: "100%",
            objectFit: "cover",
            opacity: 0.15,
            pointerEvents: "none",
            zIndex: 0,
          }}
        >
          <source src="/videos/AegisSprite.mp4" type="video/mp4" />
        </video>
        {/* Dark gradient overlay */}
        <div style={{
          position: "absolute", inset: 0,
          background: `linear-gradient(180deg, rgba(10,10,11,0.3) 0%, rgba(10,10,11,0.75) 70%, ${T.bg} 100%)`,
          zIndex: 1, pointerEvents: "none",
        }} />
        {/* Emerald radial accents */}
        <div style={{
          position: "absolute", inset: 0,
          background: `
            radial-gradient(ellipse 55% 45% at 85% 15%, rgba(52,211,153,0.05) 0%, transparent 60%),
            radial-gradient(ellipse 40% 50% at 5% 90%, rgba(52,211,153,0.025) 0%, transparent 50%)
          `,
          zIndex: 2, pointerEvents: "none",
        }} />

        <div style={{ maxWidth: 1520, margin: "0 auto", padding: "40px 48px 44px", position: "relative", zIndex: 3 }}>
          {/* Breadcrumb */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 32 }}
          >
            <Link href="/marketplace" style={{ color: T.text30, fontSize: 11, fontFamily: FONT_SANS, letterSpacing: "0.02em" }}>
              Marketplace
            </Link>
            <span style={{ color: T.text20, fontSize: 10 }}>/</span>
            <span style={{ color: T.text30, fontSize: 11, fontFamily: FONT_SANS, letterSpacing: "0.02em" }}>
              {catLabel(category)}
            </span>
            <span style={{ color: T.text20, fontSize: 10 }}>/</span>
            <span style={{ color: T.text50, fontSize: 11, fontFamily: FONT_MONO }}>
              {operator.name}
            </span>
          </motion.div>

          <div style={{ display: "flex", gap: 48, flexWrap: "wrap", alignItems: "flex-start" }}>
            {/* Left — identity */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              style={{ flex: "1 1 420px", minWidth: 0 }}
            >
              {/* Category label */}
              <div style={{
                fontSize: 10,
                fontWeight: 500,
                color: T.text30,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                fontFamily: FONT_SANS,
                marginBottom: 14,
              }}>
                {catLabel(category)}
                {operator.isVerified && (
                  <span style={{ display: "inline-flex", alignItems: "center", marginLeft: 8, verticalAlign: "middle" }}>
                    <IconVerified />
                  </span>
                )}
              </div>

              {/* Name */}
              <h1 style={{
                fontSize: "clamp(28px, 3.5vw, 42px)",
                fontWeight: 300,
                color: T.text95,
                letterSpacing: "-0.03em",
                lineHeight: 1.1,
                fontFamily: FONT_SANS,
                margin: "0 0 14px",
              }}>
                {operator.name}
              </h1>

              {/* Description */}
              <p style={{
                fontSize: 14,
                color: T.text50,
                lineHeight: 1.7,
                fontFamily: FONT_SANS,
                maxWidth: 560,
                margin: "0 0 20px",
              }}>
                {operator.tagline || operator.description?.slice(0, 220) || "No description available."}
              </p>

              {/* Creator wallet */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
                <span style={{ fontSize: 11, color: T.text30, fontFamily: FONT_SANS }}>Creator</span>
                <span style={{ fontSize: 11, fontFamily: FONT_MONO, color: T.text50, letterSpacing: "0.03em" }}>
                  {shortWallet(operator.creatorWallet)}
                </span>
              </div>

              {/* Tags as dot-separated text */}
              {tags.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 0, flexWrap: "wrap" }}>
                  {tags.slice(0, 6).map((tag, i) => (
                    <span key={tag} style={{ display: "flex", alignItems: "center" }}>
                      {i > 0 && <span style={{ color: T.text12, margin: "0 8px", fontSize: 10 }}>·</span>}
                      <span style={{ fontSize: 11, color: T.text30, fontFamily: FONT_SANS }}>{tag}</span>
                    </span>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Right — 2x2 stat grid */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.08, ease: "easeOut" }}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
                width: 320,
                flexShrink: 0,
                alignSelf: "flex-start",
              }}
            >
              <StatCard label="Price / Call" value={priceStr} mono />
              <StatCard label="Total Calls" value={operator.totalInvocations.toLocaleString()} mono />
              <StatCard label="Success Rate" value={`${successRate}%`} mono />
              <StatCard label="Avg Response" value={avgResponseMs ? `${avgResponseMs}ms` : "—"} mono />
            </motion.div>
          </div>
        </div>
      </div>

      {/* ── TAB BAR ──────────────────────────────────────────────────────── */}
      <div style={{ borderBottom: `1px solid ${T.borderSubtle}`, position: "sticky", top: 0, background: T.bg, zIndex: 10 }}>
        <div style={{ maxWidth: 1520, margin: "0 auto", padding: "0 48px", display: "flex", gap: 0 }}>
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                background: "none",
                border: "none",
                borderBottom: tab === t.id ? `2px solid rgba(255,255,255,0.85)` : "2px solid transparent",
                marginBottom: -1,
                padding: "14px 20px",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: tab === t.id ? 500 : 400,
                color: tab === t.id ? T.text95 : T.text30,
                fontFamily: FONT_SANS,
                letterSpacing: "0.01em",
                transition: "color 0.2s ease, border-color 0.2s ease",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => { if (tab !== t.id) e.currentTarget.style.color = T.text80; }}
              onMouseLeave={(e) => { if (tab !== t.id) e.currentTarget.style.color = T.text30; }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── TAB CONTENT ──────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1520, margin: "0 auto", padding: "52px 48px 120px" }}>
        <AnimatePresence mode="wait">
          {/* ── OVERVIEW ─────────────────────────────────────────────── */}
          {tab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 48, alignItems: "start" }}>
                {/* Main column */}
                <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
                  {/* Full description */}
                  <section>
                    <SectionHeading>About this skill</SectionHeading>
                    <p style={{
                      fontSize: 14,
                      color: T.text50,
                      lineHeight: 1.8,
                      fontFamily: FONT_SANS,
                      whiteSpace: "pre-wrap",
                      margin: 0,
                    }}>
                      {operator.description || operator.tagline || "No detailed description available."}
                    </p>
                  </section>

                  {/* Technical details */}
                  <section>
                    <SectionHeading>Technical Details</SectionHeading>
                    <div style={{
                      background: T.card,
                      border: `1px solid ${T.border}`,
                      borderRadius: 10,
                      overflow: "hidden",
                    }}>
                      {[
                        { label: "Auth",        value: "X-Payment-Proof + X-Payer-Wallet (x402)" },
                        { label: "Slug",        value: slug },
                        { label: "Category",    value: catLabel(category) },
                        { label: "Created",     value: operator.createdAt ? new Date(operator.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "Unknown" },
                        { label: "Registered",  value: operator.isVerified ? "Verified" : "Pending" },
                      ].map((row, i, rows) => (
                        <div
                          key={row.label}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "12px 20px",
                            borderBottom: i < rows.length - 1 ? `1px solid ${T.borderSubtle}` : "none",
                            gap: 16,
                          }}
                        >
                          <span style={{ fontSize: 12, color: T.text30, fontFamily: FONT_SANS, flexShrink: 0 }}>{row.label}</span>
                          <span style={{ fontSize: 12, color: T.text80, fontFamily: FONT_MONO, wordBreak: "break-all", textAlign: "right" }}>{row.value}</span>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Tags */}
                  {tags.length > 0 && (
                    <section>
                      <SectionHeading>Tags</SectionHeading>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {tags.map((tag) => (
                          <span
                            key={tag}
                            style={{
                              fontSize: 11,
                              color: T.text50,
                              background: T.white4,
                              border: `1px solid ${T.border}`,
                              borderRadius: 4,
                              padding: "4px 10px",
                              fontFamily: FONT_SANS,
                              letterSpacing: "0.02em",
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Success rate bar */}
                  <section>
                    <SectionHeading>Quality Score</SectionHeading>
                    <div style={{
                      background: T.card,
                      border: `1px solid ${T.border}`,
                      borderRadius: 10,
                      padding: "20px 24px",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                        <span style={{ fontSize: 12, color: T.text30, fontFamily: FONT_SANS }}>Composite quality index</span>
                        <span style={{ fontSize: 14, color: T.text80, fontFamily: FONT_MONO, fontWeight: 500 }}>
                          {operator.qualityScore}/100
                        </span>
                      </div>
                      <div style={{ height: 3, background: T.white4, borderRadius: 2, overflow: "hidden" }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${operator.qualityScore}%` }}
                          transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
                          style={{ height: "100%", borderRadius: 2, background: "rgba(52,211,153,0.55)" }}
                        />
                      </div>
                      <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginTop: 8,
                        fontSize: 10,
                        color: T.text20,
                        fontFamily: FONT_MONO,
                      }}>
                        <span>0</span>
                        <span>50</span>
                        <span>100</span>
                      </div>
                    </div>
                  </section>
                </div>

                {/* Sidebar */}
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {/* Invoke CTA */}
                  <div style={{
                    background: T.card,
                    border: `1px solid ${T.border}`,
                    borderRadius: 10,
                    padding: "20px 22px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                  }}>
                    <button
                      onClick={() => { setTab("invoke"); }}
                      style={{
                        background: "rgba(255,255,255,0.92)",
                        color: "#0A0A0B",
                        border: "none",
                        borderRadius: 8,
                        padding: "13px 20px",
                        fontSize: 13,
                        fontWeight: 500,
                        fontFamily: FONT_SANS,
                        cursor: "pointer",
                        letterSpacing: "0.01em",
                        transition: "background 0.2s ease",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,1)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.92)"; }}
                    >
                      Invoke, {priceStr} / call
                    </button>
                    <button
                      onClick={() => setTab("how-to-use")}
                      style={{
                        background: "transparent",
                        color: T.text50,
                        border: `1px solid ${T.border}`,
                        borderRadius: 8,
                        padding: "10px 20px",
                        fontSize: 12,
                        fontFamily: FONT_SANS,
                        cursor: "pointer",
                        letterSpacing: "0.01em",
                        transition: "color 0.2s ease, border-color 0.2s ease",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = T.text95; e.currentTarget.style.borderColor = T.borderHover; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = T.text50; e.currentTarget.style.borderColor = T.border; }}
                    >
                      Integration guide
                    </button>
                    <p style={{ fontSize: 10, color: T.text20, fontFamily: FONT_SANS, margin: 0, textAlign: "center", lineHeight: 1.5 }}>
                      Paid calls trigger an x402 challenge, then a wallet-signed USDC transfer on Solana before execution.
                    </p>
                  </div>

                  {/* Fee Breakdown */}
                  <div style={{
                    background: T.card,
                    border: `1px solid ${T.border}`,
                    borderRadius: 10,
                    padding: "20px 22px",
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 500, color: T.text30, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: FONT_SANS, marginBottom: 16 }}>
                      Fee Breakdown
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: `1px solid ${T.borderSubtle}` }}>
                        <span style={{ fontSize: 12, color: T.text50, fontFamily: FONT_SANS }}>Price per call</span>
                        <span style={{ fontSize: 12, color: T.text95, fontFamily: FONT_MONO }}>{priceStr}</span>
                      </div>
                      {[
                        { label: "Creator",    pct: "85%", amount: feeCreator },
                        { label: "Validators", pct: "10%", amount: feeValidators },
                        { label: "Treasury",   pct: "3%",  amount: feeTreasury },
                        { label: "Insurance",  pct: "1.5%",amount: feeInsurance },
                        { label: "Burn",       pct: "0.5%",amount: feeBurn },
                      ].map((row, i) => (
                        <div key={row.label} style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "9px 0",
                          borderBottom: i < 4 ? `1px solid ${T.borderSubtle}` : "none",
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontSize: 12, color: T.text50, fontFamily: FONT_SANS }}>{row.label}</span>
                            <span style={{ fontSize: 9, color: T.text20, fontFamily: FONT_MONO }}>{row.pct}</span>
                          </div>
                          <span style={{ fontSize: 11, color: T.text50, fontFamily: FONT_MONO }}>
                            {price > 0 ? `$${row.amount.toFixed(5)}` : "—"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* NeMo Safety */}
                  <div style={{
                    background: "rgba(52,211,153,0.02)",
                    border: `1px solid rgba(52,211,153,0.12)`,
                    borderRadius: 10,
                    padding: "20px 22px",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
                      <NvidiaEyeLogo size={13} className="text-[rgba(52,211,153,0.55)]" />
                      <span style={{ fontSize: 11, fontWeight: 500, color: "rgba(52,211,153,0.55)", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: FONT_SANS }}>
                        NeMo Guardrails
                      </span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                      {[
                        { layer: "Input guardrails",  status: "Active",      note: "Validates incoming request structure" },
                        { layer: "Evaluator",         status: "Benchmarked", note: "Scores response quality on every call" },
                        { layer: "NIM Runtime",       status: "Deployed",    note: "Optimized inference serving" },
                        { layer: "Nemotron Base",     status: "Active",      note: "Foundation model layer" },
                      ].map((item, i) => (
                        <div key={item.layer} style={{
                          padding: "9px 0",
                          borderBottom: i < 3 ? `1px solid rgba(52,211,153,0.06)` : "none",
                        }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                            <span style={{ fontSize: 12, color: T.text50, fontFamily: FONT_SANS }}>{item.layer}</span>
                            <span style={{ fontSize: 9, color: "rgba(52,211,153,0.55)", fontFamily: FONT_MONO, letterSpacing: "0.04em" }}>{item.status}</span>
                          </div>
                          <span style={{ fontSize: 10, color: T.text20, fontFamily: FONT_SANS }}>{item.note}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Lifetime earnings */}
                  <div style={{
                    background: T.card,
                    border: `1px solid ${T.border}`,
                    borderRadius: 10,
                    padding: "20px 22px",
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 500, color: T.text30, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: FONT_SANS, marginBottom: 10 }}>
                      Creator Earnings
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 300, color: T.text95, fontFamily: FONT_MONO, letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums" }}>
                      ${creatorEarningsTotal.toFixed(2)}
                    </div>
                    <div style={{ fontSize: 10, color: T.text20, fontFamily: FONT_SANS, marginTop: 4 }}>USDC paid to creator wallet</div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── HOW TO USE ───────────────────────────────────────────── */}
          {tab === "how-to-use" && (
            <motion.div
              key="how-to-use"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              style={{ maxWidth: 860 }}
            >
              <div style={{ marginBottom: 40 }}>
                <h2 style={{ fontSize: 24, fontWeight: 300, color: T.text95, letterSpacing: "-0.03em", fontFamily: FONT_SANS, margin: "0 0 10px" }}>
                  Integration Guide
                </h2>
                <p style={{ fontSize: 14, color: T.text50, fontFamily: FONT_SANS, lineHeight: 1.6, margin: 0 }}>
                  Four backend-supported ways to unlock <span style={{ color: T.text80, fontFamily: FONT_MONO }}>{slug}</span>, from one-line cURL to MCP and language SDKs.
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <IntegrationCard
                  title="Via x402 HTTP Micropayment"
                  description="The direct REST flow used by Aegis: send a plain curl first, receive the 402 payment challenge and checkout URL, pay through checkout with your wallet, then retry the same curl with X-Payment-Proof and X-Payer-Wallet to unlock the private SKILL.md content."
                  code={curlExample}
                  lang="bash"
                  learnMore="https://x402.org"
                />

                <IntegrationCard
                  title="Via MCP (Claude Code / Cursor)"
                  description="Point your MCP client at the backend's JSON-RPC endpoint. Aegis exposes marketplace tools there, including operator lookup and invocation."
                  code={mcpExample}
                  lang="json"
                />

                <div style={{
                  background: T.card,
                  border: `1px solid ${T.border}`,
                  borderRadius: 10,
                  padding: "24px 26px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: T.text95, fontFamily: FONT_SANS, marginBottom: 6 }}>
                      MCP Usage
                    </div>
                    <div style={{ fontSize: 12.5, color: T.text50, fontFamily: FONT_SANS, lineHeight: 1.6, marginBottom: 12 }}>
                      Once the server is configured, resolve the operator by slug and then unlock its private markdown skill with the returned operator ID.
                    </div>
                  </div>
                  <CodeBlock code={mcpUsage} lang="plaintext" />
                </div>

                <IntegrationCard
                  title="Via JavaScript / TypeScript SDK"
                  description="Fetch directly from any JS runtime: Node.js, Deno, Bun, or the browser. Retry the unlock call after your wallet submits the USDC transfer and returns a transaction signature."
                  code={jsExample}
                  lang="typescript"
                />

                <IntegrationCard
                  title="Via Python"
                  description="Use requests or httpx against the same backend unlock route. Paid calls must include the wallet address plus the on-chain transfer signature as proof."
                  code={pythonExample}
                  lang="python"
                />
              </div>

              {/* Response schema */}
              <div style={{ marginTop: 40 }}>
                <SectionHeading>Response Schema</SectionHeading>
                <div style={{
                  background: T.card,
                  border: `1px solid ${T.border}`,
                  borderRadius: 10,
                  overflow: "hidden",
                }}>
                  {responseSchemaRows.map((row, i) => (
                    <div key={row.field} style={{
                      display: "grid",
                      gridTemplateColumns: "180px 80px 1fr",
                      gap: 16,
                      padding: "12px 20px",
                      borderBottom: i < responseSchemaRows.length - 1 ? `1px solid ${T.borderSubtle}` : "none",
                      alignItems: "baseline",
                    }}>
                      <span style={{ fontSize: 11.5, fontFamily: FONT_MONO, color: "rgba(196,181,253,0.8)" }}>{row.field}</span>
                      <span style={{ fontSize: 10, fontFamily: FONT_MONO, color: "rgba(134,239,172,0.7)" }}>{row.type}</span>
                      <span style={{ fontSize: 12, fontFamily: FONT_SANS, color: T.text30 }}>{row.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── INVOKE ───────────────────────────────────────────────── */}
          {tab === "invoke" && (
            <motion.div
              key="invoke"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              style={{ maxWidth: 640 }}
            >
              <h2 style={{ fontSize: 22, fontWeight: 300, color: T.text95, letterSpacing: "-0.03em", fontFamily: FONT_SANS, margin: "0 0 10px" }}>
                Unlock Private Skill
              </h2>
              <p style={{ fontSize: 14, color: T.text50, lineHeight: 1.7, fontFamily: FONT_SANS, margin: "0 0 36px" }}>
                Unlock the creator-authored private SKILL.md through the backend paywall. Free skills unlock immediately; paid skills first require a USDC transfer signed by your connected Solana wallet.
              </p>

              {/* Invocation payload preview */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 11, color: T.text30, fontFamily: FONT_SANS, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 }}>
                  Unlock Request
                </div>
                <CodeBlock
                  code={JSON.stringify({ purpose: "unlock-skill", timestamp: new Date().toISOString() }, null, 2)}
                  lang="json"
                />
              </div>

              {/* Invoke button */}
              <button
                onClick={handleInvoke}
                disabled={invokeLoading}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: invokeLoading ? T.white4 : "rgba(255,255,255,0.92)",
                  color: invokeLoading ? T.text30 : "#0A0A0B",
                  border: "none",
                  borderRadius: 8,
                  padding: "13px 28px",
                  fontSize: 13,
                  fontWeight: 500,
                  fontFamily: FONT_SANS,
                  cursor: invokeLoading ? "not-allowed" : "pointer",
                  letterSpacing: "0.01em",
                  transition: "all 0.2s ease",
                  marginBottom: 10,
                }}
              >
                {invokeLoading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 0.9, ease: "linear" }}
                      style={{ width: 12, height: 12, border: `1.5px solid ${T.text20}`, borderTopColor: T.text50, borderRadius: "50%" }}
                    />
                    Invoking…
                  </>
                ) : (
                  `Invoke, ${priceStr} / call`
                )}
              </button>
              <p style={{ fontSize: 10, color: T.text20, fontFamily: FONT_SANS, margin: "0 0 40px" }}>
                Free skills unlock immediately. Paid skills open a real wallet payment step and then retry the request with your payment proof.
              </p>
              <p style={{ fontSize: 11, color: T.text30, fontFamily: FONT_SANS, lineHeight: 1.6, margin: "-28px 0 40px" }}>
                The authoritative skill charge for this invoke is {priceStr} USDC. Some wallet UIs may summarize only a single settlement leg or separate SOL account-creation costs rather than the full program-settled USDC amount.
              </p>

              {/* Result card */}
              <AnimatePresence>
                {invokeResult && (
                  <motion.div
                    ref={invokeResultRef}
                    key="result"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{
                      background: T.card,
                      border: `1px solid ${invokeResult.success ? T.border : "rgba(239,68,68,0.15)"}`,
                      borderRadius: 10,
                      overflow: "hidden",
                    }}
                  >
                    {/* Status bar */}
                    <div style={{
                      padding: "10px 20px",
                      borderBottom: `1px solid ${T.borderSubtle}`,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      background: invokeResult.success ? "rgba(52,211,153,0.04)" : "rgba(239,68,68,0.04)",
                    }}>
                      <div style={{
                        width: 6, height: 6, borderRadius: "50%",
                        background: invokeResult.success ? "#34D399" : "#EF4444",
                      }} />
                      <span style={{ fontSize: 12, fontWeight: 500, fontFamily: FONT_SANS, color: invokeResult.success ? "rgba(52,211,153,0.8)" : "rgba(239,68,68,0.8)" }}>
                        {invokeResult.success ? "Skill unlocked" : "Unlock failed"}
                      </span>
                    </div>
                    <div style={{ padding: "20px" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
                        {[
                          { label: "Unlock time", value: `${invokeResult.execution.durationMs}ms` },
                          { label: "Trust score", value: String(invokeResult.execution.trustScore) },
                          { label: "Guardrails", value: invokeResult.execution.guardrailsPass ? "Passed" : "Blocked" },
                          { label: "Amount paid", value: `$${parseDecimal(invokeResult.payment.amount).toFixed(5)} ${invokeResult.payment.token}` },
                          { label: "Chain", value: invokeResult.payment.chain },
                          { label: "Payment tx", value: invokeResult.payment.txSignature ? shortWallet(invokeResult.payment.txSignature) : "None" },
                        ].map((item) => (
                          <div key={item.label} style={{
                            background: T.white2,
                            border: `1px solid ${T.borderSubtle}`,
                            borderRadius: 6,
                            padding: "10px 14px",
                          }}>
                            <div style={{ fontSize: 10, color: T.text20, fontFamily: FONT_SANS, letterSpacing: "0.04em", marginBottom: 4 }}>{item.label}</div>
                            <div style={{ fontSize: 14, color: T.text80, fontFamily: FONT_MONO, fontVariantNumeric: "tabular-nums" }}>{item.value}</div>
                          </div>
                        ))}
                      </div>
                      {invokeResult.guardrails.violations.length > 0 && (
                        <div style={{ marginBottom: 16, padding: "10px 14px", background: "rgba(251,191,36,0.04)", border: "1px solid rgba(251,191,36,0.15)", borderRadius: 6 }}>
                          <span style={{ fontSize: 10, color: "rgba(251,191,36,0.7)", fontFamily: FONT_SANS, letterSpacing: "0.04em" }}>FLAGS  </span>
                          <span style={{ fontSize: 11, color: "rgba(251,191,36,0.8)", fontFamily: FONT_MONO }}>
                            {invokeResult.guardrails.violations.join("  ·  ")}
                          </span>
                        </div>
                      )}
                      {unlockedSkill && (
                        <div style={{ marginBottom: 16 }}>
                          <div style={{ fontSize: 10, color: T.text20, fontFamily: FONT_SANS, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>Private SKILL.md</div>
                          <CodeBlock
                            code={unlockedSkill}
                            lang="markdown"
                          />
                        </div>
                      )}
                      <div>
                        <div style={{ fontSize: 10, color: T.text20, fontFamily: FONT_SANS, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>Raw Unlock Response</div>
                        <CodeBlock
                          code={JSON.stringify(invokeResult.result, null, 2)}
                          lang="json"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ── HISTORY ──────────────────────────────────────────────── */}
          {tab === "history" && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <h2 style={{ fontSize: 22, fontWeight: 300, color: T.text95, letterSpacing: "-0.03em", fontFamily: FONT_SANS, margin: "0 0 24px" }}>
                Invocation History
              </h2>

              {invocationsLoading ? (
                <div style={{
                  textAlign: "center",
                  padding: "80px 40px",
                  color: T.text30,
                  fontSize: 13,
                  fontFamily: FONT_SANS,
                  background: T.card,
                  border: `1px solid ${T.border}`,
                  borderRadius: 10,
                }}>
                  Loading invocation history...
                </div>
              ) : invocationsError ? (
                <div style={{
                  textAlign: "center",
                  padding: "80px 40px",
                  color: "rgba(239,68,68,0.75)",
                  fontSize: 13,
                  fontFamily: FONT_SANS,
                  background: T.card,
                  border: `1px solid ${T.border}`,
                  borderRadius: 10,
                }}>
                  Failed to load invocation history: {invocationsError.message}
                </div>
              ) : invocations && invocations.length > 0 ? (
                <div style={{ display: "grid", gap: 14 }}>
                  {invocations.map((inv: InvocationRecord, idx) => {
                    const txLink = inv.txSignature ? buildSolscanTxUrl(inv.txSignature, operator.onChainCluster || null) : null;
                    const successTone = inv.success ? "rgba(52,211,153,0.7)" : "rgba(239,68,68,0.7)";
                    const successBg = inv.success ? "rgba(52,211,153,0.06)" : "rgba(239,68,68,0.06)";
                    const successBorder = inv.success ? "rgba(52,211,153,0.15)" : "rgba(239,68,68,0.15)";

                    return (
                      <motion.div
                        key={inv.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.22, delay: idx * 0.03 }}
                        style={{
                          background: T.card,
                          border: `1px solid ${T.border}`,
                          borderRadius: 10,
                          padding: 18,
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 14 }}>
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                              <span style={{ fontSize: 13, color: T.text95, fontFamily: FONT_MONO }}>
                                {fmtTimestamp(inv.createdAt)}
                              </span>
                              <span style={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: "4px 8px",
                                fontSize: 9,
                                fontWeight: 600,
                                fontFamily: FONT_MONO,
                                letterSpacing: "0.06em",
                                borderRadius: 4,
                                color: successTone,
                                background: successBg,
                                border: `1px solid ${successBorder}`,
                              }}>
                                {inv.success ? "SUCCESS" : "FAILED"}
                              </span>
                              <span style={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: "4px 8px",
                                fontSize: 9,
                                fontWeight: 600,
                                fontFamily: FONT_MONO,
                                letterSpacing: "0.06em",
                                borderRadius: 4,
                                color: inv.paymentVerified ? T.accent : T.text30,
                                background: inv.paymentVerified ? T.accentSubtle : T.white2,
                                border: `1px solid ${inv.paymentVerified ? T.accentBorder : T.borderSubtle}`,
                              }}>
                                {inv.paymentVerified ? "PAID" : "UNVERIFIED"}
                              </span>
                            </div>
                            <div style={{ marginTop: 8, fontSize: 11, color: T.text30, fontFamily: FONT_MONO }}>
                              Invocation ID: {String(inv.id)}
                            </div>
                          </div>

                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: 11, color: T.text30, textTransform: "uppercase", letterSpacing: "0.08em" }}>Amount Paid</div>
                            <div style={{ fontSize: 18, color: T.text95, fontFamily: FONT_MONO }}>{fmtUsdLike(inv.amountPaid)}</div>
                            <div style={{ marginTop: 4, fontSize: 11, color: T.text50, fontFamily: FONT_MONO }}>
                              {inv.responseMs ?? 0}ms · HTTP {inv.statusCode ?? "-"}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10, marginBottom: 14 }}>
                          {[
                            { label: "Invoked By", value: inv.callerWallet || "Anonymous" },
                            { label: "Settlement", value: inv.settlementMethod || "N/A" },
                            { label: "Receipt PDA", value: inv.onChainReceiptPda || "Not captured" },
                            { label: "Trust Delta", value: `${inv.trustDelta > 0 ? "+" : ""}${inv.trustDelta}` },
                          ].map((item) => (
                            <div key={item.label} style={{ padding: "10px 12px", borderRadius: 8, background: T.white2, border: `1px solid ${T.borderSubtle}` }}>
                              <div style={{ fontSize: 10, color: T.text20, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>{item.label}</div>
                              <div style={{ fontSize: 12, color: T.text80, fontFamily: FONT_MONO, wordBreak: "break-all" }}>
                                {item.label === "Invoked By" && inv.callerWallet ? shortWallet(inv.callerWallet) : item.value}
                              </div>
                              {item.label === "Invoked By" && inv.callerWallet ? (
                                <div style={{ marginTop: 4, fontSize: 10, color: T.text30, fontFamily: FONT_MONO, wordBreak: "break-all" }}>{inv.callerWallet}</div>
                              ) : null}
                            </div>
                          ))}
                        </div>

                        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center", marginBottom: 14 }}>
                          <div style={{ fontSize: 11, color: T.text30, textTransform: "uppercase", letterSpacing: "0.08em" }}>Payment Proof</div>
                          {inv.txSignature ? (
                            <>
                              <span style={{ fontSize: 12, color: T.text80, fontFamily: FONT_MONO }}>{shortWallet(inv.txSignature)}</span>
                              <CopyButton text={inv.txSignature} />
                              {txLink ? (
                                <a href={txLink} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 5, color: T.accent, fontSize: 11, textDecoration: "none", fontFamily: FONT_SANS }}>
                                  Solscan <IconExternalLink />
                                </a>
                              ) : null}
                            </>
                          ) : (
                            <span style={{ fontSize: 12, color: T.text50, fontFamily: FONT_MONO }}>No tx signature saved</span>
                          )}
                        </div>

                        <div>
                          <div style={{ fontSize: 11, color: T.text30, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Revenue Split</div>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10 }}>
                            {[
                              { label: "Creator", value: inv.creatorShare },
                              { label: "Validator", value: inv.validatorShare },
                              { label: "Treasury", value: inv.treasuryShare },
                              { label: "Insurance", value: inv.insuranceShare },
                              { label: "Burned", value: inv.burnAmount },
                            ].map((split) => (
                              <div key={split.label} style={{ padding: "10px 12px", borderRadius: 8, background: T.white2, border: `1px solid ${T.borderSubtle}` }}>
                                <div style={{ fontSize: 10, color: T.text20, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>{split.label}</div>
                                <div style={{ fontSize: 13, color: T.text95, fontFamily: FONT_MONO }}>{fmtUsdLike(split.value)}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div style={{
                  textAlign: "center",
                  padding: "80px 40px",
                  color: T.text20,
                  fontSize: 13,
                  fontFamily: FONT_SANS,
                  background: T.card,
                  border: `1px solid ${T.border}`,
                  borderRadius: 10,
                }}>
                  No invocations recorded for this skill yet.
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── BOTTOM NAV ──────────────────────────────────────────────── */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
          marginTop: 80,
          paddingTop: 28,
          borderTop: `1px solid ${T.borderSubtle}`,
        }}>
          <Link href="/marketplace" style={{ textDecoration: "none" }}>
            <button style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "transparent",
              border: `1px solid ${T.border}`,
              borderRadius: 7,
              padding: "9px 16px",
              color: T.text50,
              fontSize: 12,
              fontFamily: FONT_SANS,
              cursor: "pointer",
              transition: "color 0.2s ease, border-color 0.2s ease",
            }}
              onMouseEnter={(e) => { e.currentTarget.style.color = T.text95; e.currentTarget.style.borderColor = T.borderHover; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = T.text50; e.currentTarget.style.borderColor = T.border; }}
            >
              <IconArrowLeft /> Back to Marketplace
            </button>
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <a
              href={`mailto:support@aegisplace.com?subject=Issue report: ${slug}`}
              style={{
                fontSize: 12,
                color: T.text20,
                fontFamily: FONT_SANS,
                textDecoration: "none",
                letterSpacing: "0.01em",
                transition: "color 0.2s ease",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = T.text50; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = T.text20; }}
            >
              Report Issue
            </a>
            <span style={{ color: T.text12, fontSize: 10 }}>·</span>
            <a
              href={`https://explorer.solana.com/address/${operator.creatorWallet}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontSize: 12,
                color: T.text20,
                fontFamily: FONT_SANS,
                textDecoration: "none",
                letterSpacing: "0.01em",
                transition: "color 0.2s ease",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = T.text50; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = T.text20; }}
            >
              View on Solana <IconExternalLink />
            </a>
          </div>
        </div>
      </div>

      <MobileBottomNav />
    </div>
  );
}
