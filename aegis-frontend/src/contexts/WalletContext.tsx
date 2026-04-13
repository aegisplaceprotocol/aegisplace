import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { ConnectionProvider, WalletProvider, useWallet } from "@solana/wallet-adapter-react";
import { WalletModalProvider, WALLET_AUTH_REQUEST_EVENT } from "@/components/WalletModal";
import { useAuth } from "@/_core/hooks/useAuth";
import { apiUrl } from "@/lib/api";
import { trpc } from "@/lib/trpc";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { SolflareWalletAdapter } from "@solana/wallet-adapter-solflare";
import { LedgerWalletAdapter } from "@solana/wallet-adapter-ledger";
import { TorusWalletAdapter } from "@solana/wallet-adapter-torus";
import { clusterApiUrl } from "@solana/web3.js";
import { toast } from "sonner";
import bs58 from "bs58";

interface Props {
  children: ReactNode;
}

async function parseErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const data = await response.json();
    if (typeof data?.error === "string" && data.error) return data.error;
    if (typeof data?.message === "string" && data.message) return data.message;
  } catch {
    // Ignore non-JSON responses and fall back to status text.
  }

  return response.statusText ? `${fallback}: ${response.status} ${response.statusText}` : fallback;
}

function WalletAuthSync() {
  const { publicKey, connected, signMessage } = useWallet();
  const { isAuthenticated, sessionChecked, user, refresh } = useAuth();
  const utils = trpc.useUtils();
  const authAttempted = useRef<string | null>(null);
  const authRequested = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleAuthRequested = () => {
      authRequested.current = true;
    };

    window.addEventListener(WALLET_AUTH_REQUEST_EVENT, handleAuthRequested);
    return () => {
      window.removeEventListener(WALLET_AUTH_REQUEST_EVENT, handleAuthRequested);
    };
  }, []);

  useEffect(() => {
    if (!connected || !publicKey || !signMessage || !sessionChecked) return;

    const wallet = publicKey.toBase58();
    const typedUser = user as { openId?: string; walletAddress?: string } | null;
    const authenticatedWallet = typedUser?.walletAddress || typedUser?.openId || null;

    if (isAuthenticated && authenticatedWallet === wallet) {
      authAttempted.current = wallet;
      authRequested.current = false;
      return;
    }

    if (!authRequested.current) return;
    if (authAttempted.current === wallet) return;
    authAttempted.current = wallet;
    authRequested.current = false;

    (async () => {
      try {
        const nonceRes = await fetch(apiUrl(`/api/auth/nonce?wallet=${wallet}`), {
          credentials: "include",
        });
        if (!nonceRes.ok) throw new Error(await parseErrorMessage(nonceRes, "Failed to get nonce"));
        const { nonce } = await nonceRes.json();

        const message = `Sign in to Aegis Protocol\nNonce: ${nonce}`;
        const encoded = new TextEncoder().encode(message);
        const sig = await signMessage(encoded);

        const verifyRes = await fetch(apiUrl("/api/auth/verify"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ wallet, signature: bs58.encode(sig), nonce }),
        });
        if (!verifyRes.ok) throw new Error(await parseErrorMessage(verifyRes, "Authentication failed"));

        const me = await utils.auth.me.fetch();
        utils.auth.me.setData(undefined, me);
        await refresh();

        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("aegis:wallet-authenticated", { detail: { wallet } }));
        }

        toast.success("Wallet authenticated");
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Authentication failed";
        toast.error(message);
      }
    })();
  }, [connected, isAuthenticated, publicKey, refresh, sessionChecked, signMessage, user, utils]);

  useEffect(() => {
    if (!connected) {
      authAttempted.current = null;
      authRequested.current = false;
    }
  }, [connected]);

  return null;
}

export default function SolanaWalletProvider({ children }: Props) {
  const endpoint = useMemo(() => {
    const custom = import.meta.env.VITE_SOLANA_RPC_URL;
    if (custom) return custom;
    return clusterApiUrl("mainnet-beta");
  }, []);

  const wallets = useMemo(() => [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
    new LedgerWalletAdapter(),
    new TorusWalletAdapter(),
  ], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <WalletAuthSync />
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
