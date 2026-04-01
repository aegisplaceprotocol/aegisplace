import { useMemo, type ReactNode } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@/components/WalletModal";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { SolflareWalletAdapter } from "@solana/wallet-adapter-solflare";
import { LedgerWalletAdapter } from "@solana/wallet-adapter-ledger";
import { TorusWalletAdapter } from "@solana/wallet-adapter-torus";
import { clusterApiUrl } from "@solana/web3.js";

interface Props {
  children: ReactNode;
}

export default function SolanaWalletProvider({ children }: Props) {
  const endpoint = useMemo(() => {
    const custom = import.meta.env.VITE_SOLANA_RPC_URL;
    if (custom) return custom;
    return clusterApiUrl("devnet");
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
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
