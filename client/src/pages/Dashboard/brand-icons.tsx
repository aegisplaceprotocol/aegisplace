/**
 * Brand icon resolver for operator names.
 * Detects provider from name and returns the appropriate logo.
 * Unknown operators get the Aegis icon. never a generic placeholder.
 */

const BRAND_MAP: Record<string, { icon: string; color: string }> = {
  openai:     { icon: "/assets/icons/openai.svg",     color: "rgba(255,255,255,0.80)" },
  "gpt":      { icon: "/assets/icons/openai.svg",     color: "rgba(255,255,255,0.80)" },
  "dall-e":   { icon: "/assets/icons/openai.svg",     color: "rgba(255,255,255,0.80)" },
  claude:     { icon: "/assets/icons/claude.svg",      color: "rgba(217,119,87,0.70)" },
  anthropic:  { icon: "/assets/icons/anthropic.svg",   color: "rgba(217,119,87,0.70)" },
  gemini:     { icon: "/assets/icons/google.svg",      color: "rgba(66,133,244,0.60)" },
  google:     { icon: "/assets/icons/google.svg",      color: "rgba(66,133,244,0.60)" },
  deepmind:   { icon: "/assets/icons/deepmind.svg",   color: "rgba(66,133,244,0.60)" },
  mistral:    { icon: "/assets/icons/mistral.svg",     color: "rgba(255,128,0,0.60)" },
  meta:       { icon: "/assets/icons/meta.svg",        color: "rgba(0,136,255,0.55)" },
  llama:      { icon: "/assets/icons/meta.svg",        color: "rgba(0,136,255,0.55)" },
  nvidia:     { icon: "/assets/icons/nvidia.svg",      color: "rgba(118,185,0,0.60)" },
  nemo:       { icon: "/assets/icons/nvidia.svg",      color: "rgba(118,185,0,0.60)" },
  solana:     { icon: "/assets/icons/solana.svg",      color: "rgba(153,69,255,0.60)" },
  jupiter:    { icon: "/assets/icons/jupiter.svg",     color: "rgba(123,97,255,0.60)" },
  cursor:     { icon: "/assets/icons/cursor.svg",      color: "rgba(255,255,255,0.50)" },
  helius:     { icon: "/assets/icons/helius.svg",      color: "rgba(232,98,44,0.60)" },
  jito:       { icon: "/assets/icons/jito.svg",        color: "rgba(0,191,165,0.55)" },
  raydium:    { icon: "/assets/icons/raydium.svg",     color: "rgba(97,122,255,0.55)" },
  pyth:       { icon: "/assets/icons/pyth.svg",        color: "rgba(230,218,254,0.50)" },
  orca:       { icon: "/assets/icons/orca.svg",        color: "rgba(255,209,102,0.55)" },
  deepseek:   { icon: "/assets/icons/deepseek.svg",   color: "rgba(0,102,255,0.55)" },
  perplexity: { icon: "/assets/icons/perplexity.svg",  color: "rgba(32,178,170,0.55)" },
  stripe:     { icon: "/assets/icons/stripe.svg",      color: "rgba(99,91,255,0.55)" },
  coinbase:   { icon: "/assets/icons/coinbase.svg",    color: "rgba(0,82,255,0.55)" },
  x402:       { icon: "/assets/icons/coinbase.svg",    color: "rgba(0,82,255,0.55)" },
  bags:       { icon: "/assets/icons/bags.svg",        color: "#00D632" },
};

export function detectBrand(name: string): { icon: string; color: string } | null {
  const lower = name.toLowerCase();
  for (const [key, val] of Object.entries(BRAND_MAP)) {
    if (lower.includes(key)) return val;
  }
  return null;
}

export function BrandIcon({ name, size = 16 }: { name: string; size?: number }) {
  const brand = detectBrand(name);
  if (!brand) {
    // Fallback: Aegis icon. the four-pointed star
    return (
      <img
        src="/assets/vectorwhite.svg"
        alt=""
        width={size}
        height={size}
        style={{ opacity: 0.30, flexShrink: 0 }}
        loading="lazy"
      />
    );
  }
  return (
    <img
      src={brand.icon}
      alt=""
      width={size}
      height={size}
      style={{ opacity: 0.70, flexShrink: 0 }}
      loading="lazy"
    />
  );
}

/** Strip brand prefix from operator name for cleaner display */
export function cleanOperatorName(name: string): string {
  return name.replace(/^(OpenAI|Anthropic|Claude|Google|Gemini|Meta|Mistral|NVIDIA|Solana)\s*/i, "").trim() || name;
}
