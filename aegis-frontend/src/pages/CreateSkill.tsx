import { useMemo, useState } from "react";
import { useLocation, Link } from "wouter";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import Navbar from "@/components/Navbar";
import MobileBottomNav from "@/components/MobileBottomNav";
import ConnectWalletButton from "@/components/ConnectWalletButton";
import { toast } from "sonner";
import { trpc, type RouterOutputs } from "@/lib/trpc";
import { API_BASE_URL } from "@/lib/api";
import {
  sanitizeSlug,
  sendSkillRegistrationTransaction,
  type PreparedSkillRegistrationPlan,
} from "@/lib/solanaSkillRegistry";
import { useAuth } from "@/_core/hooks/useAuth";

const CATEGORY_OPTIONS = [
  ["code-review", "Code Review"],
  ["sentiment-analysis", "Sentiment Analysis"],
  ["data-extraction", "Data Extraction"],
  ["image-generation", "Image Generation"],
  ["text-generation", "Text Generation"],
  ["translation", "Translation"],
  ["summarization", "Summarization"],
  ["classification", "Classification"],
  ["search", "Search"],
  ["financial-analysis", "Financial Analysis"],
  ["security-audit", "Security Audit"],
  ["other", "Other"],
] as const;

function parseOptionalJson(value: string) {
  if (!value.trim()) return undefined;
  return JSON.parse(value);
}

export default function CreateSkill() {
  const [, navigate] = useLocation();
  const { connection } = useConnection();
  const { publicKey, connected, sendTransaction } = useWallet();
  const { isAuthenticated, user } = useAuth();
  const utils = trpc.useUtils();
  const registerMutation = trpc.operator.register.useMutation();

  const [form, setForm] = useState({
    name: "",
    slug: "",
    tagline: "",
    description: "",
    category: "other",
    endpointUrl: "",
    httpMethod: "POST",
    pricePerCall: "0.050000",
    tags: "",
    iconUrl: "",
    docsUrl: "",
    githubUrl: "",
    requestSchema: "{\n  \"input\": \"string\"\n}",
    responseSchema: "{\n  \"result\": \"string\"\n}",
  });
  const [submitting, setSubmitting] = useState(false);

  const typedUser = user as RouterOutputs["auth"]["me"] | null;

  const walletAddress = publicKey?.toBase58() ?? typedUser?.walletAddress ?? "";
  const apiBaseUrl = useMemo(() => {
    if (API_BASE_URL) return API_BASE_URL;
    if (typeof window !== "undefined") return window.location.origin;
    return "";
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!connected || !publicKey || !sendTransaction) {
      toast.error("Connect a Solana wallet before creating a skill");
      return;
    }

    if (!isAuthenticated) {
      toast.error("Authenticate with your wallet before publishing a skill");
      return;
    }

    const slug = sanitizeSlug(form.slug || form.name);
    if (!slug) {
      toast.error("Provide a valid skill slug");
      return;
    }

    setSubmitting(true);
    try {
      const requestSchema = parseOptionalJson(form.requestSchema);
      const responseSchema = parseOptionalJson(form.responseSchema);

      const plan = await utils.operator.prepareRegistration.fetch({
        slug,
        creatorWallet: walletAddress,
        apiBaseUrl,
        endpointUrl: form.endpointUrl,
      }) as PreparedSkillRegistrationPlan;

      const txSignature = await sendSkillRegistrationTransaction({
        connection,
        sendTransaction,
        creatorWallet: walletAddress,
        plan,
        payload: {
          name: form.name.trim(),
          slug,
          endpointUrl: form.endpointUrl.trim(),
          metadataUri: plan.metadataUri,
          pricePerCall: form.pricePerCall,
          category: form.category,
        },
      });

      const operator = await registerMutation.mutateAsync({
        name: form.name.trim(),
        slug,
        tagline: form.tagline.trim() || undefined,
        description: form.description.trim() || undefined,
        category: form.category as any,
        endpointUrl: form.endpointUrl.trim(),
        httpMethod: form.httpMethod as "GET" | "POST" | "PUT",
        requestSchema,
        responseSchema,
        pricePerCall: form.pricePerCall,
        creatorWallet: walletAddress,
        tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
        iconUrl: form.iconUrl.trim() || undefined,
        docsUrl: form.docsUrl.trim() || undefined,
        githubUrl: form.githubUrl.trim() || undefined,
        onChainProgramId: plan.programId,
        onChainConfigPda: plan.configPda,
        onChainOperatorPda: plan.operatorPda,
        onChainOperatorId: plan.operatorId,
        onChainTxSignature: txSignature,
        onChainMetadataUri: plan.metadataUri,
        onChainCluster: plan.cluster as "devnet" | "mainnet-beta" | "testnet" | "localnet",
      });

      toast.success("Skill registered on Solana and published to the marketplace");
      navigate(`/marketplace/${operator.slug}`);
    } catch (error: any) {
      toast.error(error?.message || "Failed to create skill");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#060816] text-white">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 pb-28 pt-24 md:px-6">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-emerald-300">
              Creator Flow
            </div>
            <h1 className="text-4xl font-normal tracking-tight text-white md:text-5xl">Create a skill with on-chain presence.</h1>
            <p className="mt-3 text-sm leading-6 text-white/60 md:text-base">
              This flow registers the skill in the Aegis Solana program first, then publishes the full marketplace metadata used by the frontend, REST API, and MCP server.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ConnectWalletButton />
            <Link href="/skill-marketplace" className="rounded-md border border-white/10 px-4 py-2 text-sm text-white/70 transition hover:border-white/20 hover:text-white">
              Back to marketplace
            </Link>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <form onSubmit={handleSubmit} className="rounded-xl border border-white/10 bg-white/3 p-5 md:p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm text-white/70">Skill name</span>
                <input className="w-full rounded-md border border-white/10 bg-[#0d1224] px-3 py-2.5 text-sm outline-none" value={form.name} onChange={(e) => setForm((current) => ({ ...current, name: e.target.value, slug: current.slug || sanitizeSlug(e.target.value) }))} required />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm text-white/70">Slug</span>
                <input className="w-full rounded-md border border-white/10 bg-[#0d1224] px-3 py-2.5 text-sm outline-none" value={form.slug} onChange={(e) => setForm((current) => ({ ...current, slug: sanitizeSlug(e.target.value) }))} required />
              </label>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm text-white/70">Tagline</span>
                <input className="w-full rounded-md border border-white/10 bg-[#0d1224] px-3 py-2.5 text-sm outline-none" value={form.tagline} onChange={(e) => setForm((current) => ({ ...current, tagline: e.target.value }))} />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm text-white/70">Category</span>
                <select className="w-full rounded-md border border-white/10 bg-[#0d1224] px-3 py-2.5 text-sm outline-none" value={form.category} onChange={(e) => setForm((current) => ({ ...current, category: e.target.value }))}>
                  {CATEGORY_OPTIONS.map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </label>
            </div>

            <label className="mt-4 block">
              <span className="mb-2 block text-sm text-white/70">Description</span>
              <textarea className="min-h-28 w-full rounded-md border border-white/10 bg-[#0d1224] px-3 py-2.5 text-sm outline-none" value={form.description} onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))} />
            </label>

            <div className="mt-4 grid gap-4 md:grid-cols-[1fr_140px_140px]">
              <label className="block">
                <span className="mb-2 block text-sm text-white/70">Endpoint URL</span>
                <input className="w-full rounded-md border border-white/10 bg-[#0d1224] px-3 py-2.5 text-sm outline-none" value={form.endpointUrl} onChange={(e) => setForm((current) => ({ ...current, endpointUrl: e.target.value }))} placeholder="https://api.example.com/skill" required />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm text-white/70">Method</span>
                <select className="w-full rounded-md border border-white/10 bg-[#0d1224] px-3 py-2.5 text-sm outline-none" value={form.httpMethod} onChange={(e) => setForm((current) => ({ ...current, httpMethod: e.target.value }))}>
                  <option value="POST">POST</option>
                  <option value="GET">GET</option>
                  <option value="PUT">PUT</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm text-white/70">Price / call</span>
                <input className="w-full rounded-md border border-white/10 bg-[#0d1224] px-3 py-2.5 text-sm outline-none" value={form.pricePerCall} onChange={(e) => setForm((current) => ({ ...current, pricePerCall: e.target.value }))} placeholder="0.050000" required />
              </label>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <label className="block">
                <span className="mb-2 block text-sm text-white/70">Tags</span>
                <input className="w-full rounded-md border border-white/10 bg-[#0d1224] px-3 py-2.5 text-sm outline-none" value={form.tags} onChange={(e) => setForm((current) => ({ ...current, tags: e.target.value }))} placeholder="mcp, summarization, finance" />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm text-white/70">Docs URL</span>
                <input className="w-full rounded-md border border-white/10 bg-[#0d1224] px-3 py-2.5 text-sm outline-none" value={form.docsUrl} onChange={(e) => setForm((current) => ({ ...current, docsUrl: e.target.value }))} />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm text-white/70">GitHub URL</span>
                <input className="w-full rounded-md border border-white/10 bg-[#0d1224] px-3 py-2.5 text-sm outline-none" value={form.githubUrl} onChange={(e) => setForm((current) => ({ ...current, githubUrl: e.target.value }))} />
              </label>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm text-white/70">Request schema JSON</span>
                <textarea className="min-h-36 w-full rounded-md border border-white/10 bg-[#0d1224] px-3 py-2.5 font-mono text-xs outline-none" value={form.requestSchema} onChange={(e) => setForm((current) => ({ ...current, requestSchema: e.target.value }))} />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm text-white/70">Response schema JSON</span>
                <textarea className="min-h-36 w-full rounded-md border border-white/10 bg-[#0d1224] px-3 py-2.5 font-mono text-xs outline-none" value={form.responseSchema} onChange={(e) => setForm((current) => ({ ...current, responseSchema: e.target.value }))} />
              </label>
            </div>

            <button type="submit" disabled={submitting || registerMutation.isPending} className="mt-6 inline-flex items-center rounded-md bg-emerald-400 px-5 py-3 text-sm font-medium text-[#04110b] transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60">
              {submitting ? "Registering on Solana..." : "Register skill on-chain"}
            </button>
          </form>

          <aside className="space-y-4">
            <div className="rounded-xl border border-white/10 bg-white/3 p-5">
              <div className="text-[11px] uppercase tracking-[0.24em] text-white/35">Wallet</div>
              <div className="mt-3 text-sm text-white/80">{walletAddress || "No wallet connected"}</div>
              <div className="mt-2 text-xs text-white/50">
                {connected ? "This wallet will be the on-chain creator identity for the skill." : "Connect a wallet to prepare and sign the Solana registration."}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/3 p-5">
              <div className="text-[11px] uppercase tracking-[0.24em] text-white/35">Publish flow</div>
              <ol className="mt-3 space-y-3 text-sm text-white/65">
                <li>1. Backend validates your slug and endpoint.</li>
                <li>2. Your wallet signs the Solana register_operator transaction.</li>
                <li>3. Aegis stores the rich listing and serves metadata from the marketplace API.</li>
                <li>4. Agents discover and invoke the skill through REST, MCP, and x402 payment gates.</li>
              </ol>
            </div>

            <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-5 text-sm text-amber-100/85">
              The on-chain program enforces a minimum price floor of $0.01 USDC per call. If you want cheaper metering later, add prepaid balances or batched settlement off-chain.
            </div>
          </aside>
        </div>
      </main>
      <MobileBottomNav />
    </div>
  );
}