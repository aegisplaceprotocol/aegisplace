import "dotenv/config";

const jwtSecret = process.env.JWT_SECRET ?? "";
const frontendUrls = (process.env.FRONTEND_URLS ?? "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

if (!jwtSecret || jwtSecret.length < 16) {
  console.warn("[SECURITY] JWT_SECRET is missing or too short. Set a 32+ character secret in production.");
}

export const ENV = {
  databaseUrl: process.env.DATABASE_URL ?? "",
  jwtSecret,
  port: parseInt(process.env.PORT ?? "3000", 10),
  isProduction: process.env.NODE_ENV === "production",
  solanaRpcUrl: process.env.SOLANA_RPC_URL ?? "https://api.mainnet-beta.solana.com",
  treasuryWallet: process.env.TREASURY_WALLET ?? "",
  adminWallets: (process.env.ADMIN_WALLETS ?? "").split(",").filter(Boolean),
  nvidiaApiKey: process.env.NVIDIA_API_KEY ?? "",
  guardrailsServerUrl: process.env.GUARDRAILS_SERVER_URL ?? "http://localhost:4001",
  guardrailsEnabled: (process.env.GUARDRAILS_ENABLED ?? "true") === "true",
  frontendUrls,
  serveFrontend: (process.env.SERVE_FRONTEND ?? "false") === "true",
};
