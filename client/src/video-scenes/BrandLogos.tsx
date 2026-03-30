import React from "react";

const O = 0.3;
const H = 22;

export const NvidiaLogo = () => (
  <svg height={H} viewBox="0 0 600 120" style={{ opacity: O }}>
    <g transform="translate(0,10) scale(4.2)">
      <path d="M8.948 8.798v-1.43a6.7 6.7 0 0 1 .424-.018c3.922-.124 6.493 3.374 6.493 3.374s-2.774 3.851-5.75 3.851c-.398 0-.787-.062-1.158-.185v-4.346c1.528.185 1.837.857 2.747 2.385l2.04-1.714s-1.492-1.952-4-1.952a6.016 6.016 0 0 0-.796.035m0-4.735v2.138l.424-.027c5.45-.185 9.01 4.47 9.01 4.47s-4.08 4.964-8.33 4.964c-.37 0-.733-.035-1.095-.097v1.325c.3.035.61.062.91.062 3.957 0 6.82-2.023 9.593-4.408.459.371 2.34 1.263 2.73 1.652-2.633 2.208-8.772 3.984-12.253 3.984-.335 0-.653-.018-.971-.053v1.864H24V4.063zm0 10.326v1.131c-3.657-.654-4.673-4.46-4.673-4.46s1.758-1.944 4.673-2.262v1.237H8.94c-1.528-.186-2.73 1.245-2.73 1.245s.68 2.412 2.739 3.11M2.456 10.9s2.164-3.197 6.5-3.533V6.201C4.153 6.59 0 10.653 0 10.653s2.35 6.802 8.948 7.42v-1.237c-4.84-.6-6.492-5.936-6.492-5.936z" fill="white"/>
    </g>
    <text x="120" y="82" fill="white" fontFamily="Aeonik, Outfit, system-ui, sans-serif" fontWeight="400" fontSize="72" letterSpacing="6">NVIDIA</text>
  </svg>
);

export const OpenAILogo = () => (
  <svg height={H} viewBox="0 0 520 120" style={{ opacity: O }}>
    <g transform="translate(10,10) scale(4.2)">
      <path d="M11.217 19.384a3.501 3.501 0 0 0 6.783 -1.217v-5.167l-6 -3.35" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M5.214 15.014a3.501 3.501 0 0 0 4.446 5.266l4.34 -2.534v-6.946" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M6 7.63c-1.391 -.236 -2.787 .395 -3.534 1.689a3.474 3.474 0 0 0 1.271 4.745l4.263 2.514l6 -3.348" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12.783 4.616a3.501 3.501 0 0 0 -6.783 1.217v5.067l6 3.45" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M18.786 8.986a3.501 3.501 0 0 0 -4.446 -5.266l-4.34 2.534v6.946" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M18 16.302c1.391 .236 2.787 -.395 3.534 -1.689a3.474 3.474 0 0 0 -1.271 -4.745l-4.308 -2.514l-5.955 3.42" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </g>
    <text x="120" y="82" fill="white" fontFamily="Aeonik, Outfit, system-ui, sans-serif" fontWeight="400" fontSize="68" letterSpacing="0">OpenAI</text>
  </svg>
);

export const AnthropicLogo = () => (
  <svg height={H} viewBox="0 0 700 120" style={{ opacity: O }}>
    <g transform="translate(5,8) scale(4.3)">
      <path d="M17.3041 3.541h-3.6718l6.696 16.918H24Zm-10.6082 0L0 20.459h3.7442l1.3693-3.5527h7.0052l1.3693 3.5528h3.7442L10.5363 3.5409Zm-.3712 10.2232 2.2914-5.9456 2.2914 5.9456Z" fill="white"/>
    </g>
    <text x="120" y="82" fill="white" fontFamily="Aeonik, Outfit, system-ui, sans-serif" fontWeight="400" fontSize="64" letterSpacing="8">ANTHROPIC</text>
  </svg>
);

export const SolanaLogo = () => (
  <svg height={H} viewBox="0 0 560 120" style={{ opacity: O }}>
    <g transform="translate(8,8) scale(4.3)">
      <path d="m23.8764 18.0313-3.962 4.1393a.9201.9201 0 0 1-.306.2106.9407.9407 0 0 1-.367.0742H.4599a.4689.4689 0 0 1-.2522-.0733.4513.4513 0 0 1-.1696-.1962.4375.4375 0 0 1-.0314-.2545.4438.4438 0 0 1 .117-.2298l3.9649-4.1393a.92.92 0 0 1 .3052-.2102.9407.9407 0 0 1 .3658-.0746H23.54a.4692.4692 0 0 1 .2523.0734.4531.4531 0 0 1 .1697.196.438.438 0 0 1 .0313.2547.4442.4442 0 0 1-.1169.2297zm-3.962-8.3355a.9202.9202 0 0 0-.306-.2106.941.941 0 0 0-.367-.0742H.4599a.4687.4687 0 0 0-.2522.0734.4513.4513 0 0 0-.1696.1961.4376.4376 0 0 0-.0314.2546.444.444 0 0 0 .117.2297l3.9649 4.1394a.9204.9204 0 0 0 .3052.2102c.1154.049.24.0744.3658.0746H23.54a.469.469 0 0 0 .2523-.0734.453.453 0 0 0 .1697-.1961.4382.4382 0 0 0 .0313-.2546.4444.4444 0 0 0-.1169-.2297zM.46 6.7225h18.7815a.9411.9411 0 0 0 .367-.0742.9202.9202 0 0 0 .306-.2106l3.962-4.1394a.4442.4442 0 0 0 .117-.2297.4378.4378 0 0 0-.0314-.2546.453.453 0 0 0-.1697-.196.469.469 0 0 0-.2523-.0734H4.7596a.941.941 0 0 0-.3658.0745.9203.9203 0 0 0-.3052.2102L.1246 5.9687a.4438.4438 0 0 0-.1169.2295.4375.4375 0 0 0 .0312.2544.4512.4512 0 0 0 .1692.196.4689.4689 0 0 0 .2518.0739z" fill="white"/>
    </g>
    <text x="125" y="82" fill="white" fontFamily="Aeonik, Outfit, system-ui, sans-serif" fontWeight="400" fontSize="68" letterSpacing="8">SOLANA</text>
  </svg>
);

export const StripeLogo = () => (
  <svg height={H} viewBox="0 0 400 120" style={{ opacity: O }}>
    <g transform="translate(8,8) scale(4.3)">
      <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z" fill="white"/>
    </g>
    <text x="120" y="82" fill="white" fontFamily="Aeonik, Outfit, system-ui, sans-serif" fontWeight="400" fontSize="68" letterSpacing="0">Stripe</text>
  </svg>
);

export const CoinbaseLogo = () => (
  <svg height={H} viewBox="0 0 560 120" style={{ opacity: O }}>
    <g transform="translate(12,12) scale(4)">
      <circle cx="12" cy="12" r="11" fill="none" stroke="white" strokeWidth="2"/>
      <rect x="8" y="8" width="8" height="8" rx="1" fill="white"/>
    </g>
    <text x="115" y="82" fill="white" fontFamily="Aeonik, Outfit, system-ui, sans-serif" fontWeight="400" fontSize="68" letterSpacing="0">Coinbase</text>
  </svg>
);

export const HuggingFaceLogo = () => (
  <svg height={H} viewBox="0 0 700 120" style={{ opacity: O }}>
    <g transform="translate(8,4) scale(4.6)">
      <path d="M12.025 1.13c-5.77 0-10.449 4.647-10.449 10.378 0 1.112.178 2.181.503 3.185.064-.222.203-.444.416-.577a.96.96 0 0 1 .524-.15c.293 0 .584.124.84.284.278.173.48.408.71.694.226.282.458.611.684.951v-.014c.017-.324.106-.622.264-.874s.403-.487.762-.543c.3-.047.596.06.787.203s.31.313.4.467c.15.257.212.468.233.542.01.026.653 1.552 1.657 2.54.616.605 1.01 1.223 1.082 1.912.055.537-.096 1.059-.38 1.572.637.121 1.294.187 1.967.187.657 0 1.298-.063 1.921-.178-.287-.517-.44-1.041-.384-1.581.07-.69.465-1.307 1.081-1.913 1.004-.987 1.647-2.513 1.657-2.539.021-.074.083-.285.233-.542.09-.154.208-.323.4-.467a1.08 1.08 0 0 1 .787-.203c.359.056.604.29.762.543s.247.55.265.874v.015c.225-.34.457-.67.683-.952.23-.286.432-.52.71-.694.257-.16.547-.284.84-.285a.97.97 0 0 1 .524.151c.228.143.373.388.43.625l.006.04a10.3 10.3 0 0 0 .534-3.273c0-5.731-4.678-10.378-10.449-10.378M8.327 6.583a1.487 1.487 0 0 1 1.33 2.187c-.183.343-.762-.214-1.102-.094-.38.134-.532.914-.917.71a1.487 1.487 0 0 1 .69-2.803m7.486 0a1.487 1.487 0 0 1 .689 2.803c-.385.204-.536-.576-.916-.71-.34-.12-.92.437-1.103.094a1.487 1.487 0 0 1 1.33-2.187M8.489 11.458c.588.01 1.965 1.157 3.572 1.164 1.607-.007 2.984-1.155 3.572-1.164.196-.003.305.12.305.454 0 .886-.424 2.328-1.563 3.202-.22-.756-1.396-1.366-1.63-1.32l-.02.006-.044.026-.01.008-.03.024-.035.036-.032.04a1 1 0 0 0-.058.09l-.014.025a3 3 0 0 1-.11.19 1 1 0 0 1-.083.116 1.2 1.2 0 0 1-.248.238 1.3 1.3 0 0 1-.251-.243 1 1 0 0 1-.076-.107c-.124-.193-.177-.363-.337-.444-.034-.016-.104-.008-.2.022a3 3 0 0 0-.341.15 5 5 0 0 0-.401.28 2 2 0 0 0-.226.249 1.2 1.2 0 0 0-.195.344c-.006.013-.016.048-.024.073-1.139-.875-1.563-2.317-1.563-3.203 0-.334.109-.457.305-.454" fill="white"/>
    </g>
    <text x="125" y="82" fill="white" fontFamily="Aeonik, Outfit, system-ui, sans-serif" fontWeight="400" fontSize="62" letterSpacing="-1">Hugging Face</text>
  </svg>
);

export const MistralLogo = () => (
  <svg height={H} viewBox="0 0 560 120" style={{ opacity: O }}>
    <g transform="translate(12,12) scale(4)">
      <rect x="0" y="0" width="4" height="4" fill="white"/>
      <rect x="20" y="0" width="4" height="4" fill="white"/>
      <rect x="0" y="5" width="4" height="4" fill="white"/>
      <rect x="5" y="5" width="4" height="4" fill="white"/>
      <rect x="15" y="5" width="4" height="4" fill="white"/>
      <rect x="20" y="5" width="4" height="4" fill="white"/>
      <rect x="0" y="10" width="4" height="4" fill="white"/>
      <rect x="10" y="10" width="4" height="4" fill="white"/>
      <rect x="20" y="10" width="4" height="4" fill="white"/>
      <rect x="0" y="15" width="4" height="4" fill="white"/>
      <rect x="20" y="15" width="4" height="4" fill="white"/>
      <rect x="0" y="20" width="4" height="4" fill="white"/>
      <rect x="20" y="20" width="4" height="4" fill="white"/>
    </g>
    <text x="120" y="82" fill="white" fontFamily="Aeonik, Outfit, system-ui, sans-serif" fontWeight="400" fontSize="66" letterSpacing="0">Mistral AI</text>
  </svg>
);

export const GoogleDeepMindLogo = () => (
  <svg height={H} viewBox="0 0 820 120" style={{ opacity: O }}>
    <g transform="translate(8,8) scale(4.3)">
      <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" fill="white"/>
    </g>
    <text x="125" y="80" fill="white" fontFamily="Aeonik, Outfit, system-ui, sans-serif" fontWeight="400" fontSize="58" letterSpacing="-1">Google</text>
    <text x="380" y="80" fill="white" fontFamily="Aeonik, Outfit, system-ui, sans-serif" fontWeight="400" fontSize="58" letterSpacing="-1">DeepMind</text>
  </svg>
);
