/**
 * Brand logos used across the Aegis site for credibility and partner display.
 * All logos are hosted on CDN and referenced by URL.
 */

export interface BrandLogo {
  name: string;
  url: string;
  /** Display height in pixels */
  h: number;
  /** Category for filtering */
  category: "ai" | "blockchain" | "infra" | "payments";
}

export const BRAND_LOGOS: BrandLogo[] = [
  {
    name: "Solana",
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663305557175/YNULcqsamfwqB8eQkc2VNX/solana-gradient_e9806652.png",
    h: 20,
    category: "blockchain",
  },
  {
    name: "OpenAI",
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663305557175/YNULcqsamfwqB8eQkc2VNX/openai-white_4b364713.jpg",
    h: 22,
    category: "ai",
  },
  {
    name: "NVIDIA",
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663305557175/YNULcqsamfwqB8eQkc2VNX/nvidia-white_d4d5229f.png",
    h: 18,
    category: "infra",
  },
  {
    name: "Anthropic",
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663305557175/YNULcqsamfwqB8eQkc2VNX/anthropic-white_87a29411.png",
    h: 20,
    category: "ai",
  },
  {
    name: "Hugging Face",
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663305557175/YNULcqsamfwqB8eQkc2VNX/huggingface_84f07b1f.png",
    h: 22,
    category: "ai",
  },
  {
    name: "Mistral",
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663305557175/YNULcqsamfwqB8eQkc2VNX/mistral_aa896415.png",
    h: 20,
    category: "ai",
  },
  {
    name: "Google DeepMind",
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663305557175/YNULcqsamfwqB8eQkc2VNX/google-deepmind_da5c7d6c.png",
    h: 20,
    category: "ai",
  },
  {
    name: "Meta Llama",
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663305557175/YNULcqsamfwqB8eQkc2VNX/meta-llama_5d945f05.png",
    h: 20,
    category: "ai",
  },
  {
    name: "Coinbase",
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663305557175/YNULcqsamfwqB8eQkc2VNX/coinbase_905e55fc.png",
    h: 20,
    category: "blockchain",
  },
  {
    name: "Stripe",
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663305557175/YNULcqsamfwqB8eQkc2VNX/stripe-white_d1db3bdd.png",
    h: 18,
    category: "payments",
  },
  {
    name: "Phantom",
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663305557175/YNULcqsamfwqB8eQkc2VNX/phantom_b39a6f92.jpeg",
    h: 22,
    category: "blockchain",
  },
];

/** Get logos filtered by category */
export function getLogosByCategory(category: BrandLogo["category"]): BrandLogo[] {
  return BRAND_LOGOS.filter((l) => l.category === category);
}

/** Get a subset of the most prominent logos for compact displays */
export function getTopLogos(count = 6): BrandLogo[] {
  return BRAND_LOGOS.slice(0, count);
}
