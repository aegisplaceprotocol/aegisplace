import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { toast } from "sonner";
import ConnectWalletButton from "@/components/ConnectWalletButton";
import { API_BASE_URL } from "@/lib/api";
import {
  sanitizeSlug,
  sendSkillRegistrationTransaction,
  type PreparedSkillRegistrationPlan,
} from "@/lib/solanaSkillRegistry";
import { trpc } from "@/lib/trpc";
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
  ["development", "Development"],
  ["security", "Security"],
  ["data", "Data"],
  ["ai-ml", "AI/ML"],
  ["defi", "DeFi"],
  ["infrastructure", "Infrastructure"],
  ["other", "Other"],
] as const;

const MIN_PRICE_USDC = 0.0005;

type OnChainCluster = "devnet" | "mainnet-beta" | "testnet";

export function SkillUploadPanel({
  onSuccess,
  variant = "modal",
  mode = "skill",
}: {
  onSuccess?: (slug: string) => void;
  variant?: "modal" | "page";
  mode?: "skill" | "operator";
}) {
  const [, navigate] = useLocation();
  const { connection } = useConnection();
  const { publicKey, connected, sendTransaction } = useWallet();
  const { isAuthenticated, user, refresh, loading: authLoading } = useAuth();
  const utils = trpc.useUtils();
  const registerMutation = trpc.operator.register.useMutation();
  const [step, setStep] = useState(1);
  const [skillName, setSkillName] = useState("");
  const [skillSlug, setSkillSlug] = useState("");
  const [tagline, setTagline] = useState("");
  const [publicDescription, setPublicDescription] = useState("");
  const [privateSkill, setPrivateSkill] = useState("");
  const [skillCategory, setSkillCategory] = useState("other");
  const [priceAmount, setPriceAmount] = useState("0.050000");
  const [tags, setTags] = useState("");
  const [iconUrl, setIconUrl] = useState("");
  const [docsUrl, setDocsUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const isOperatorMode = mode === "operator";
  const entityLabel = isOperatorMode ? "Operator" : "Skill";
  const entityLabelLower = entityLabel.toLowerCase();
  const shellStyle = variant === "page"
    ? {
        background: "#0d0d0f",
        border: "1px solid rgba(255,255,255,0.10)",
        borderRadius: "8px",
        boxShadow: "0 0 60px rgba(0,0,0,0.5), 0 0 24px rgba(16,185,129,0.04)",
      }
    : {
        background: "#0d0d0f",
        border: "1px solid rgba(255,255,255,0.10)",
        borderRadius: "6px",
        boxShadow: "0 0 60px rgba(0,0,0,0.8), 0 0 24px rgba(16,185,129,0.05)",
        height: "min(720px, calc(100vh - 2rem))",
      } as const;

  const userWalletAddress = (user as { walletAddress?: string } | null)?.walletAddress ?? "";
  const walletAddress = publicKey?.toBase58() ?? userWalletAddress;
  const sessionWallet = userWalletAddress;
  const apiBaseUrl = useMemo(() => {
    if (API_BASE_URL) return API_BASE_URL;
    if (typeof window !== "undefined") return window.location.origin;
    return "";
  }, []);
  const slugValue = sanitizeSlug(skillSlug || skillName);
  const authReady = Boolean(isAuthenticated && walletAddress && (!sessionWallet || sessionWallet === walletAddress));
  const uploadEnabled = Boolean(connected && publicKey && sendTransaction && authReady) && !submitting && !registerMutation.isPending;
  const numericPrice = Number.parseFloat(priceAmount);
  const hasValidMinimumPrice = Number.isFinite(numericPrice) && numericPrice >= MIN_PRICE_USDC;
  const priceValidationMessage = !priceAmount.trim()
    ? "Set a price of at least $0.0005 USDC per call"
    : !Number.isFinite(numericPrice)
      ? "Enter a valid numeric price"
      : numericPrice < MIN_PRICE_USDC
        ? "Minimum price is $0.0005 USDC per call"
        : null;
  const canAdvanceForStep = (currentStep: number) =>
    (currentStep === 1 && Boolean(skillName.trim() && slugValue && skillCategory)) ||
    (currentStep === 2 && Boolean(publicDescription.trim() && privateSkill.trim() && hasValidMinimumPrice)) ||
    currentStep === 3 ||
    currentStep === 4;
  const canAdvance = canAdvanceForStep(step);

  useEffect(() => {
    if (!connected || !publicKey || authReady) return;

    const handleWalletAuthenticated = (event: Event) => {
      const customEvent = event as CustomEvent<{ wallet?: string }>;
      if (!customEvent.detail?.wallet || customEvent.detail.wallet === publicKey.toBase58()) {
        void refresh();
      }
    };

    window.addEventListener("aegis:wallet-authenticated", handleWalletAuthenticated as EventListener);
    return () => {
      window.removeEventListener("aegis:wallet-authenticated", handleWalletAuthenticated as EventListener);
    };
  }, [authReady, connected, publicKey, refresh]);

  async function handleUpload() {
    if (!connected || !publicKey || !sendTransaction) {
      toast.error("Connect a Solana wallet before uploading a skill");
      return;
    }

    if (!authReady) {
      toast.error("Authenticate with your wallet before publishing a skill");
      return;
    }

    if (!slugValue) {
      toast.error("Provide a valid skill slug");
      return;
    }

    if (!hasValidMinimumPrice) {
      toast.error("Set the price to at least 0.0005 USDC per call before publishing");
      return;
    }

    setSubmitting(true);
    try {
      const plan = await utils.operator.prepareRegistration.fetch({
        slug: slugValue,
        creatorWallet: walletAddress,
        apiBaseUrl,
      }) as PreparedSkillRegistrationPlan;

      const txSignature = await sendSkillRegistrationTransaction({
        connection,
        sendTransaction,
        creatorWallet: walletAddress,
        plan,
        payload: {
          name: skillName.trim(),
          slug: slugValue,
          metadataUri: plan.metadataUri,
          pricePerCall: priceAmount,
          category: skillCategory,
        },
      });

      await registerMutation.mutateAsync({
        name: skillName.trim(),
        slug: slugValue,
        tagline: tagline.trim() || undefined,
        description: publicDescription.trim(),
        skill: privateSkill.trim(),
        category: skillCategory as any,
        pricePerCall: priceAmount,
        creatorWallet: walletAddress,
        tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean),
        iconUrl: iconUrl.trim() || undefined,
        docsUrl: docsUrl.trim() || undefined,
        githubUrl: githubUrl.trim() || undefined,
        onChainProgramId: plan.programId,
        onChainConfigPda: plan.configPda,
        onChainOperatorPda: plan.operatorPda,
        onChainOperatorId: plan.operatorId,
        onChainTxSignature: txSignature,
        onChainMetadataUri: plan.metadataUri,
        onChainCluster: plan.cluster as OnChainCluster,
      });

      await Promise.all([
        utils.operator.list.invalidate(),
        utils.operator.mine.invalidate(),
      ]);

      toast.success(
        isOperatorMode
          ? "Operator registered on Solana and published to the marketplace"
          : "Skill registered on Solana and published to the marketplace"
      );
      if (onSuccess) {
        onSuccess(slugValue);
      } else {
        navigate(`/marketplace/${slugValue}`);
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to upload skill");
    } finally {
        setSubmitting(false);
    }
  }

  const inputClass = "w-full px-4 py-3 text-sm text-white/75 placeholder:text-white/20 transition-colors focus:outline-none";
  const inputStyle = {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "5px",
  };
  const inputFocusStyle = { borderColor: "rgba(16,185,129,0.40)" };
  const cardStyle = {
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "5px",
    background: "rgba(255,255,255,0.03)",
  } as const;
  const stepMeta = [
    { id: 1, label: "Basic Info", title: `Define the ${entityLabelLower}` },
    { id: 2, label: "Description", title: "Add private instructions" },
    { id: 3, label: "Links", title: "Attach links and publish metadata" },
    { id: 4, label: "Review", title: `Review and submit your ${entityLabelLower}` },
  ] as const;

  function renderStepContent(currentStep: number) {
    switch (currentStep) {
      case 1:
        return (
          <>
            <div className="mb-3 text-[9px] font-bold uppercase tracking-widest text-white/40">Basic Info</div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/55">{entityLabel} Name</label>
              <input
                type="text"
                value={skillName}
                onChange={(event) => {
                  setSkillName(event.target.value);
                  if (!skillSlug) setSkillSlug(sanitizeSlug(event.target.value));
                }}
                placeholder={isOperatorMode ? "e.g. Smart Contract Auditor" : "e.g. Smart Contract Auditor"}
                className={inputClass}
                style={inputStyle}
                onFocus={(event) => Object.assign(event.currentTarget.style, inputFocusStyle)}
                onBlur={(event) => Object.assign(event.currentTarget.style, inputStyle)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/55">{entityLabel} Slug</label>
              <input
                type="text"
                value={skillSlug}
                onChange={(event) => setSkillSlug(sanitizeSlug(event.target.value))}
                placeholder="e.g. smart-contract-auditor"
                className={inputClass}
                style={inputStyle}
                onFocus={(event) => Object.assign(event.currentTarget.style, inputFocusStyle)}
                onBlur={(event) => Object.assign(event.currentTarget.style, inputStyle)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/55">Tagline</label>
              <input
                type="text"
                value={tagline}
                onChange={(event) => setTagline(event.target.value)}
                placeholder={`One-line value proposition for the ${entityLabelLower} card`}
                className={inputClass}
                style={inputStyle}
                onFocus={(event) => Object.assign(event.currentTarget.style, inputFocusStyle)}
                onBlur={(event) => Object.assign(event.currentTarget.style, inputStyle)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/55">Category</label>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORY_OPTIONS.map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setSkillCategory(value)}
                    className="px-3 py-1.5 text-[11px] font-medium transition-all"
                    style={skillCategory === value ? {
                      background: "rgba(16,185,129,0.12)",
                      color: "#10B981",
                      border: "1px solid rgba(16,185,129,0.30)",
                      borderRadius: "4px",
                    } : {
                      background: "transparent",
                      color: "rgba(255,255,255,0.35)",
                      border: "1px solid rgba(255,255,255,0.07)",
                      borderRadius: "4px",
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </>
        );
      case 2:
        return (
          <>
            <div className="mb-3 text-[9px] font-bold uppercase tracking-widest text-white/40">Public Description, Private Instructions & Pricing</div>
            <p className="mb-3 text-xs text-white/45">Write a public marketplace description, then add the private SKILL.md content buyers unlock after payment.</p>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/55">Public Description (.md)</label>
              <textarea
                value={publicDescription}
                onChange={(event) => setPublicDescription(event.target.value)}
                placeholder="# Smart Contract Auditor\n\nExplain what the skill does publicly, what outcomes it helps with, and why someone should buy access."
                rows={6}
                className={`${inputClass} resize-none font-mono text-xs`}
                style={inputStyle}
                onFocus={(event) => Object.assign(event.currentTarget.style, inputFocusStyle)}
                onBlur={(event) => Object.assign(event.currentTarget.style, inputStyle)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/55">Private Instructions (SKILL.md)</label>
              <textarea
                value={privateSkill}
                onChange={(event) => setPrivateSkill(event.target.value)}
                placeholder="# Goal\n\nDescribe exactly how an agent should use this skill, required inputs, implementation notes, output expectations, caveats, and examples."
                rows={10}
                className={`${inputClass} resize-none font-mono text-xs`}
                style={inputStyle}
                onFocus={(event) => Object.assign(event.currentTarget.style, inputFocusStyle)}
                onBlur={(event) => Object.assign(event.currentTarget.style, inputStyle)}
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/55">Price / Call</label>
                <input
                  type="number"
                  min="0.0005"
                  step="0.000001"
                  inputMode="decimal"
                  value={priceAmount}
                  onChange={(event) => setPriceAmount(event.target.value)}
                  placeholder="0.050000"
                  className={inputClass}
                  style={inputStyle}
                  onFocus={(event) => Object.assign(event.currentTarget.style, inputFocusStyle)}
                  onBlur={(event) => Object.assign(event.currentTarget.style, inputStyle)}
                />
                <p className={`mt-1 text-[11px] ${priceValidationMessage ? "text-[#f59e0b]" : "text-white/45"}`}>
                  {priceValidationMessage ?? "Minimum price is $0.0005 USDC per call"}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <label className="mb-1.5 block text-xs font-medium text-white/55">Tags</label>
              <input
                type="text"
                value={tags}
                onChange={(event) => setTags(event.target.value)}
                placeholder="mcp, audits, security"
                className={inputClass}
                style={inputStyle}
                onFocus={(event) => Object.assign(event.currentTarget.style, inputFocusStyle)}
                onBlur={(event) => Object.assign(event.currentTarget.style, inputStyle)}
              />
            </div>
          </>
        );
      case 3:
        return (
          <>
            <div className="mb-3 text-[9px] font-bold uppercase tracking-widest text-white/40">Links & Publish</div>
            <p className="mb-3 text-xs text-white/45">Attach reference links for the marketplace listing. The public description is published openly, while the private SKILL.md stays paywalled behind the invoke route.</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <input
                type="url"
                value={docsUrl}
                onChange={(event) => setDocsUrl(event.target.value)}
                placeholder="Docs URL"
                className={inputClass}
                style={inputStyle}
                onFocus={(event) => Object.assign(event.currentTarget.style, inputFocusStyle)}
                onBlur={(event) => Object.assign(event.currentTarget.style, inputStyle)}
              />
              <input
                type="url"
                value={githubUrl}
                onChange={(event) => setGithubUrl(event.target.value)}
                placeholder="GitHub URL"
                className={inputClass}
                style={inputStyle}
                onFocus={(event) => Object.assign(event.currentTarget.style, inputFocusStyle)}
                onBlur={(event) => Object.assign(event.currentTarget.style, inputStyle)}
              />
              <input
                type="url"
                value={iconUrl}
                onChange={(event) => setIconUrl(event.target.value)}
                placeholder="Icon URL"
                className={inputClass}
                style={inputStyle}
                onFocus={(event) => Object.assign(event.currentTarget.style, inputFocusStyle)}
                onBlur={(event) => Object.assign(event.currentTarget.style, inputStyle)}
              />
            </div>
            <div className="mt-5 p-4" style={cardStyle}>
              <div className="mb-2 text-[9px] font-bold uppercase tracking-widest text-white/30">What Happens Next</div>
              <div className="space-y-2">
                {[
                  "The backend reserves your slug and stores both the public description and the private SKILL.md content",
                  "Your wallet signs the on-chain register_operator transaction",
                  "The Solana program stores the listing with a metadata URI that points to the public metadata document",
                  isOperatorMode
                    ? "The operator becomes discoverable publicly, and the private SKILL.md is revealed only after payment"
                    : "The skill becomes discoverable publicly, and the private SKILL.md is revealed only after payment",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2">
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="mt-0.5 shrink-0" style={{ color: "#10B981" }}>
                      <path d="M3 8l4 4 6-6" stroke="currentColor" strokeWidth="2" />
                    </svg>
                    <span className="text-[11px] text-white/50">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        );
      case 4:
        return (
          <>
            <div className="mb-4 text-[9px] font-bold uppercase tracking-widest text-white/40">Review and Submit</div>
            <div className="space-y-4">
              <div className="p-4" style={cardStyle}>
                <div className="mb-1 text-[8px] font-bold uppercase tracking-wider text-white/30">{entityLabel} Name</div>
                <div className="text-sm text-white/80">{skillName || `Untitled ${entityLabel}`}</div>
              </div>
              <div className="p-4" style={cardStyle}>
                <div className="mb-1 text-[8px] font-bold uppercase tracking-wider text-white/30">Slug</div>
                <div className="text-sm text-white/80">{slugValue || "not-set"}</div>
              </div>
              <div className="p-4" style={cardStyle}>
                <div className="mb-1 text-[8px] font-bold uppercase tracking-wider text-white/30">Public Description</div>
                <div
                  className="max-h-56 overflow-auto rounded-lg border border-white/6 bg-black/20 p-3 text-xs leading-relaxed text-white/60"
                  style={{ whiteSpace: "break-spaces" }}
                >
                  {publicDescription || "No description provided"}
                </div>
              </div>
              <div className="p-4" style={cardStyle}>
                <div className="mb-1 text-[8px] font-bold uppercase tracking-wider text-white/30">Private SKILL.md</div>
                <div
                  className="max-h-64 overflow-auto rounded-lg border border-white/6 bg-black/20 p-3 text-xs leading-relaxed text-white/60"
                  style={{ whiteSpace: "break-spaces" }}
                >
                  {privateSkill || "No private skill content provided"}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4" style={cardStyle}>
                  <div className="mb-1 text-[8px] font-bold uppercase tracking-wider text-white/30">Category</div>
                  <div className="text-sm text-white/80">{CATEGORY_OPTIONS.find(([value]) => value === skillCategory)?.[1] ?? skillCategory}</div>
                </div>
                <div className="p-4" style={cardStyle}>
                  <div className="mb-1 text-[8px] font-bold uppercase tracking-wider text-white/30">Pricing</div>
                  <div className="text-sm text-white/80">
                    {hasValidMinimumPrice ? `$${numericPrice.toFixed(6)}/call` : "Minimum is $0.0005"}
                  </div>
                </div>
              </div>
              <div className="p-4" style={cardStyle}>
                <div className="mb-1 text-[8px] font-bold uppercase tracking-wider text-white/30">Listing Mode</div>
                <div className="text-xs text-white/60">Public description plus private markdown skill payload. No live endpoint or deployment URL is required for registration.</div>
              </div>
              <div className="rounded-[5px] border border-[#10B981]/15 bg-[#10B981]/4 p-4">
                <div className="mb-2 text-[9px] font-bold uppercase tracking-widest text-[#10B981]">How You Will Earn</div>
                <p className="text-xs leading-relaxed text-white/55">
                  Every time an operator unlocks your private SKILL.md, the paywall charges {hasValidMinimumPrice ? `$${numericPrice.toFixed(6)}` : "$0.0005 or more"} and records the creator-owned listing on Solana while the public metadata stays openly discoverable.
                </p>
              </div>
              <div className="p-4" style={cardStyle}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="mb-1 text-[8px] font-bold uppercase tracking-wider text-white/30">Wallet</div>
                    <div className="break-all text-xs text-white/60">{walletAddress || "No wallet connected"}</div>
                  </div>
                  <ConnectWalletButton />
                </div>
                <p className="mt-3 text-[11px] text-white/45">
                  Connect and authenticate a wallet first. The {isOperatorMode ? "register" : "upload"} CTA unlocks after the session refresh completes for the connected wallet.
                </p>
                {connected && !authReady && authLoading ? (
                  <p className="mt-2 text-[11px] text-[#10B981]">Finalizing wallet session...</p>
                ) : null}
              </div>
            </div>
          </>
        );
      default:
        return null;
    }
  }

  function renderPrimaryAction(currentStep: number) {
    if (currentStep < 4) {
      const canContinue = canAdvanceForStep(currentStep);
      return (
        <button
          type="button"
          disabled={!canContinue}
          onClick={() => setStep(currentStep + 1)}
          className="bg-white/10 text-zinc-300 border border-white/25 hover:bg-white/15 hover:border-white/40 text-[13px] font-normal px-8 py-3 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Continue to Step {currentStep + 1}
        </button>
      );
    }

    return (
      <button
        type="button"
        disabled={!uploadEnabled}
        onClick={handleUpload}
        className="w-full py-3 text-sm font-semibold transition-all disabled:cursor-not-allowed"
        style={{
          background: uploadEnabled ? "#10B981" : "rgba(255,255,255,0.08)",
          color: uploadEnabled ? "#000" : "rgba(255,255,255,0.35)",
          borderRadius: "5px",
          boxShadow: uploadEnabled ? "0 0 16px rgba(16,185,129,0.25)" : "none",
        }}
      >
        {submitting || registerMutation.isPending
          ? isOperatorMode ? "Registering Operator..." : "Uploading Skill..."
          : connected && authReady
            ? isOperatorMode ? "Register Operator" : "Upload Skill"
            : isOperatorMode ? "Connect Wallet To Register" : "Connect Wallet To Upload"}
      </button>
    );
  }

  return (
    <div className={`flex w-full flex-col overflow-hidden ${variant === "modal" ? "max-w-xl" : "max-w-none"}`} style={shellStyle} data-lenis-prevent>
      {variant === "modal" ? (
        <>
          <div className="border-b border-white/6 p-4">
            <h2 className="text-lg font-medium tracking-[-0.025em] text-white/95">
              {isOperatorMode ? "Register Your Operator" : "Upload Your Skill"}
            </h2>
            <div className="mt-1 flex items-center gap-2">
              {[1, 2, 3, 4].map((currentStep) => (
                <div key={currentStep} className="flex items-center gap-1">
                  <div
                    className="flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold transition-all"
                    style={{
                      background: currentStep <= step ? "#10B981" : "rgba(255,255,255,0.06)",
                      color: currentStep <= step ? "#000" : "rgba(255,255,255,0.30)",
                      boxShadow: currentStep === step ? "0 0 10px rgba(16,185,129,0.35)" : "none",
                    }}
                  >
                    {currentStep}
                  </div>
                  {currentStep < 4 ? (
                    <div
                      className="h-px w-6 transition-all"
                      style={{ background: currentStep < step ? "#10B981" : "rgba(255,255,255,0.08)" }}
                    />
                  ) : null}
                </div>
              ))}
              <span className="ml-1 text-[10px] text-white/35">Step {step} of 4</span>
            </div>
          </div>

          <div className="h-0.5 bg-white/4">
            <div
              className="h-full transition-all duration-500"
              style={{
                width: `${(step / 4) * 100}%`,
                background: "#10B981",
                boxShadow: "0 0 8px rgba(16,185,129,0.5)",
              }}
            />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-4" data-lenis-prevent>
            <div className="space-y-4">{renderStepContent(step)}</div>
          </div>

          <div className="border-t border-white/6 p-4">
            <div className="flex gap-3">
              {step > 1 ? (
                <button
                  onClick={() => setStep(step - 1)}
                  className="px-5 py-2.5 text-sm font-medium text-white/50 transition-all hover:text-white/75"
                  style={{ border: "1px solid rgba(255,255,255,0.09)", borderRadius: "5px" }}
                >
                  Back
                </button>
              ) : null}

              {step < 4 ? (
                <button
                  type="button"
                  disabled={!canAdvance}
                  onClick={() => setStep(step + 1)}
                  className="flex-1 py-2.5 text-sm font-semibold transition-all"
                  style={{
                    background: canAdvance ? "#10B981" : "rgba(255,255,255,0.08)",
                    color: canAdvance ? "#000" : "rgba(255,255,255,0.35)",
                    borderRadius: "5px",
                    boxShadow: canAdvance ? "0 0 16px rgba(16,185,129,0.25)" : "none",
                  }}
                  onMouseEnter={(event) => {
                    if (!canAdvance) return;
                    event.currentTarget.style.background = "#059669";
                    event.currentTarget.style.boxShadow = "0 0 24px rgba(16,185,129,0.40)";
                  }}
                  onMouseLeave={(event) => {
                    event.currentTarget.style.background = canAdvance ? "#10B981" : "rgba(255,255,255,0.08)";
                    event.currentTarget.style.boxShadow = canAdvance ? "0 0 16px rgba(16,185,129,0.25)" : "none";
                  }}
                >
                  Continue
                </button>
              ) : (
                <button
                  type="button"
                  disabled={!uploadEnabled}
                  onClick={handleUpload}
                  className="flex-1 py-2.5 text-sm font-semibold transition-all"
                  style={{
                    background: uploadEnabled ? "#10B981" : "rgba(255,255,255,0.08)",
                    color: uploadEnabled ? "#000" : "rgba(255,255,255,0.35)",
                    borderRadius: "5px",
                    boxShadow: uploadEnabled ? "0 0 16px rgba(16,185,129,0.25)" : "none",
                  }}
                  onMouseEnter={(event) => {
                    if (!uploadEnabled) return;
                    event.currentTarget.style.background = "#059669";
                    event.currentTarget.style.boxShadow = "0 0 24px rgba(16,185,129,0.40)";
                  }}
                  onMouseLeave={(event) => {
                    event.currentTarget.style.background = uploadEnabled ? "#10B981" : "rgba(255,255,255,0.08)";
                    event.currentTarget.style.boxShadow = uploadEnabled ? "0 0 16px rgba(16,185,129,0.25)" : "none";
                  }}
                >
                  {submitting || registerMutation.isPending
                    ? isOperatorMode ? "Registering Operator..." : "Uploading Skill..."
                    : connected && authReady
                      ? isOperatorMode ? "Register Operator" : "Upload Skill"
                      : isOperatorMode ? "Connect Wallet To Register" : "Connect Wallet To Upload"}
                </button>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="p-6 md:p-8">
          <div className="space-y-10">
            {stepMeta.map((meta) => {
              const isUnlocked = step >= meta.id;
              const isCurrent = step === meta.id;
              const isComplete = step > meta.id;

              return (
                <section
                  key={meta.id}
                  className={`border border-white/8 bg-white/2 p-6 transition-all duration-300 ${isUnlocked ? "opacity-100" : "opacity-35 pointer-events-none select-none"}`}
                >
                  <div className="mb-6 flex items-start gap-4">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center text-[11px] font-medium ${isUnlocked ? "bg-white/10 text-zinc-300 border border-white/30" : "bg-white/3 text-white/30 border border-white/8"}`}>
                      {meta.id}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] font-medium tracking-[0.18em] text-white/30">{meta.label}</div>
                      <h3 className="mt-1 text-xl font-normal text-white/90">{meta.title}</h3>
                    </div>
                    {isComplete ? (
                      <span className="ml-auto rounded-full border border-[#10B981]/30 bg-[#10B981]/10 px-2.5 py-1 text-[10px] font-medium tracking-[0.16em] text-[#10B981]">
                        COMPLETE
                      </span>
                    ) : isCurrent ? (
                      <span className="ml-auto rounded-full border border-white/10 bg-white/4 px-2.5 py-1 text-[10px] font-medium tracking-[0.16em] text-white/55">
                        ACTIVE
                      </span>
                    ) : null}
                  </div>

                  <div className="space-y-4">{renderStepContent(meta.id)}</div>

                  {isCurrent ? (
                    <div className="mt-8">{renderPrimaryAction(meta.id)}</div>
                  ) : null}
                </section>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SkillUploadModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-120 flex items-start justify-center overflow-y-auto p-4 sm:items-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md" />
      <div className="relative z-10 my-4 w-full max-w-xl" onClick={(event) => event.stopPropagation()}>
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-20 p-1 text-white/35 transition-colors hover:text-white/70"
          aria-label="Close upload modal"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
        <SkillUploadPanel
          onSuccess={(slug) => {
            onClose();
            navigate(`/marketplace/${slug}`);
          }}
        />
      </div>
    </div>
  );
}