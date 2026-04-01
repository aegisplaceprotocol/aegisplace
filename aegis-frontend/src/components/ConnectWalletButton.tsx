import { useCallback, useState, useRef, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@/components/WalletModal";
import { trpc } from "@/lib/trpc";
import { withApiBase } from "@/lib/api";
import { toast } from "sonner";
import bs58 from "bs58";

function truncateAddress(addr: string): string {
  return addr.slice(0, 4) + "..." + addr.slice(-4);
}

interface Props {
  variant?: "navbar" | "mobile" | "hero";
}

export default function ConnectWalletButton({ variant = "navbar" }: Props) {
  const { publicKey, connected, connecting, disconnect, signMessage } = useWallet();
  const { setVisible } = useWalletModal();
  const [menuOpen, setMenuOpen] = useState(false);
  const [authenticating, setAuthenticating] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const authAttempted = useRef(false);
  const utils = trpc.useUtils();

  // After wallet connects, run the auth flow
  useEffect(() => {
    if (!connected || !publicKey || !signMessage) return;
    if (authAttempted.current) return;
    authAttempted.current = true;

    (async () => {
      setAuthenticating(true);
      try {
        const wallet = publicKey.toBase58();
        // Step 1: Get nonce
        const nonceRes = await fetch(withApiBase(`/api/auth/nonce?wallet=${wallet}`));
        if (!nonceRes.ok) throw new Error("Failed to get nonce");
        const { nonce } = await nonceRes.json();

        // Step 2: Sign message
        const message = `Sign in to Aegis Protocol\nNonce: ${nonce}`;
        const encoded = new TextEncoder().encode(message);
        const sig = await signMessage(encoded);

        // Step 3: Verify
        const verifyRes = await fetch(withApiBase("/api/auth/verify"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ wallet, signature: bs58.encode(sig), nonce }),
        });
        if (!verifyRes.ok) throw new Error("Authentication failed");

        // Step 4: Refresh auth state
        await utils.auth.me.invalidate();
        toast.success("Wallet authenticated");
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Authentication failed";
        toast.error(msg);
        disconnect();
      } finally {
        setAuthenticating(false);
      }
    })();
  }, [connected, publicKey, signMessage, disconnect, utils]);

  // Reset auth attempt flag on disconnect
  useEffect(() => {
    if (!connected) {
      authAttempted.current = false;
    }
  }, [connected]);

  const handleClick = useCallback(() => {
    if (connected && publicKey) {
      setMenuOpen((prev) => !prev);
    } else {
      setVisible(true);
    }
  }, [connected, publicKey, setVisible]);

  const handleDisconnect = useCallback(async () => {
    disconnect();
    setMenuOpen(false);
    await utils.auth.me.invalidate();
  }, [disconnect, utils]);

  const handleCopy = useCallback(() => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey.toBase58());
      setMenuOpen(false);
    }
  }, [publicKey]);

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const address = publicKey?.toBase58() || "";
  const isLoading = connecting || authenticating;

  if (variant === "hero") {
    return (
      <button
        onClick={handleClick}
        disabled={isLoading}
        className={`relative text-[13px] font-normal px-8 py-3.5 rounded transition-all duration-300 flex items-center justify-center gap-2 ${
          connected
            ? "text-white/40 border border-white/[0.05] bg-white/[0.03] hover:bg-white/[0.06]"
            : isLoading
            ? "text-white/40 border border-white/[0.05] bg-white/[0.03] cursor-wait"
            : "text-white/40 border border-white/[0.05] hover:border-white/[0.08] hover:text-white/60"
        }`}
      >
        {isLoading ? (
          <>
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
              <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
            </svg>
            {authenticating ? "Signing in..." : "Connecting..."}
          </>
        ) : connected ? (
          <>
            <span className="w-2 h-2 rounded-full bg-white/40 animate-pulse" />
            {truncateAddress(address)}
          </>
        ) : (
          "Connect Wallet"
        )}
      </button>
    );
  }

  if (variant === "mobile") {
    return (
      <button
        onClick={handleClick}
        disabled={isLoading}
        className={`block w-full text-center py-3 text-[13px] font-normal rounded transition-all duration-300 ${
          connected
            ? "text-white/40 border border-white/[0.05] bg-white/[0.03]"
            : isLoading
            ? "text-white/40 border border-white/[0.05] bg-white/[0.03] cursor-wait"
            : "text-white/40 border border-white/[0.05] hover:border-white/[0.08] hover:text-white/60"
        }`}
      >
        {isLoading ? (authenticating ? "Signing in..." : "Connecting...") : connected ? truncateAddress(address) : "Connect Wallet"}
      </button>
    );
  }

  // Default: navbar variant
  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={handleClick}
        disabled={isLoading}
        className={`relative text-[12px] font-normal px-4 py-1.5 rounded transition-all duration-300 flex items-center gap-2 ${
          connected
            ? "text-white/40 border border-white/[0.05] hover:border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06]"
            : isLoading
            ? "text-white/40 border border-white/[0.05] bg-white/[0.03] cursor-wait"
            : "text-white/40 border border-white/[0.05] hover:border-white/[0.08] hover:text-white/60"
        }`}
      >
        {isLoading ? (
          <>
            <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
              <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
            </svg>
            {authenticating ? "Signing in..." : "Connecting..."}
          </>
        ) : connected ? (
          <>
            <span className="w-2 h-2 rounded-full bg-white/40 animate-pulse" />
            {truncateAddress(address)}
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none" className={`transition-transform duration-200 ${menuOpen ? "rotate-180" : ""}`}>
              <path d="M1 3L4 6L7 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </>
        ) : (
          <>Connect Wallet</>
        )}
      </button>

      {/* Wallet dropdown menu */}
      {menuOpen && connected && (
        <div className="absolute top-full right-0 mt-2 w-56 bg-[#111] backdrop-blur-xl border border-white/[0.04] rounded shadow-2xl z-50">
          <div className="p-3 border-b border-white/[0.04]">
            <div className="text-[10px] font-normal text-white/20 mb-1">CONNECTED</div>
            <div className="text-[11px] font-normal text-white/40 break-all leading-relaxed">{address}</div>
          </div>
          <div className="p-1.5">
            <button
              onClick={handleCopy}
              className="w-full text-left text-[12px] text-white/50 hover:text-white/80 hover:bg-white/[0.04] px-3 py-2 transition-colors flex items-center gap-2"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2">
                <rect x="4" y="4" width="7" height="7" rx="1" />
                <path d="M8 4V2a1 1 0 00-1-1H2a1 1 0 00-1 1v5a1 1 0 001 1h2" />
              </svg>
              Copy Address
            </button>
            <button
              onClick={() => { window.open("/submit", "_self"); setMenuOpen(false); }}
              className="w-full text-left text-[12px] text-white/50 hover:text-white/80 hover:bg-white/[0.04] px-3 py-2 transition-colors flex items-center gap-2"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path d="M6 2v8M2 6h8" strokeLinecap="round" />
              </svg>
              Upload Operator
            </button>
            <button
              onClick={() => { window.open("/my-operators", "_self"); setMenuOpen(false); }}
              className="w-full text-left text-[12px] text-white/50 hover:text-white/80 hover:bg-white/[0.04] px-3 py-2 transition-colors flex items-center gap-2"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2">
                <rect x="1" y="3" width="10" height="7" rx="1" />
                <path d="M3 3V2a1 1 0 011-1h4a1 1 0 011 1v1" />
              </svg>
              My Operators
            </button>
            <button
              onClick={() => { window.open("/playground", "_self"); setMenuOpen(false); }}
              className="w-full text-left text-[12px] text-white/50 hover:text-white/80 hover:bg-white/[0.04] px-3 py-2 transition-colors flex items-center gap-2"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2">
                <rect x="1" y="2" width="10" height="8" rx="1" />
                <path d="M1 4h10" />
              </svg>
              Open Playground
            </button>
            <div className="my-1 border-t border-white/[0.04]" />
            <button
              onClick={handleDisconnect}
              className="w-full text-left text-[12px] font-normal text-white/30 hover:text-white/50 hover:bg-white/[0.04] px-3 py-2 transition-colors flex items-center gap-2"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path d="M8 4L11 7L8 10" />
                <path d="M11 7H4" />
                <path d="M7 1H2a1 1 0 00-1 1v8a1 1 0 001 1h5" />
              </svg>
              Disconnect
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
