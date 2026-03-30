import { useCallback, useEffect, useState, createContext, useContext, type ReactNode } from "react";
import { useWallet, type Wallet } from "@solana/wallet-adapter-react";
import { WalletReadyState } from "@solana/wallet-adapter-base";

/* ---- Context for controlling modal visibility ---- */
interface WalletModalContextState {
  visible: boolean;
  setVisible: (open: boolean) => void;
}

const WalletModalContext = createContext<WalletModalContextState>({
  visible: false,
  setVisible: () => {},
});

export function useWalletModal() {
  return useContext(WalletModalContext);
}

export function WalletModalProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  return (
    <WalletModalContext.Provider value={{ visible, setVisible }}>
      {children}
      <WalletModalDialog />
    </WalletModalContext.Provider>
  );
}

const AEGIS_LOGO = "/assets/fullvectorwhite.svg";

/* ---- Wallet icons (inline SVGs for wallets without icons) ---- */
function DefaultWalletIcon({ name }: { name: string }) {
  const letter = name.charAt(0).toUpperCase();
  return (
    <div className="w-11 h-11 rounded bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-zinc-400 font-bold text-sm">
      {letter}
    </div>
  );
}

/* ---- Individual wallet row ---- */
function WalletRow({
  wallet,
  onSelect,
  detected,
}: {
  wallet: Wallet;
  onSelect: (wallet: Wallet) => void;
  detected: boolean;
}) {
  return (
    <button
      onClick={() => onSelect(wallet)}
      className="w-full flex items-center gap-4 px-4 py-3.5 rounded hover:bg-white/[0.04] transition-all duration-200 group cursor-pointer"
    >
      {wallet.adapter.icon ? (
        <img
          src={wallet.adapter.icon}
          alt={wallet.adapter.name}
          className="w-11 h-11 rounded object-contain"
        />
      ) : (
        <DefaultWalletIcon name={wallet.adapter.name} />
      )}
      <div className="flex-1 text-left">
        <div className="text-[14px] font-medium text-zinc-200 group-hover:text-white transition-colors">
          {wallet.adapter.name}
        </div>
        {detected && (
          <div className="text-[11px] text-emerald-400/70 font-medium mt-0.5 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/80 animate-pulse-live" />
            Detected
          </div>
        )}
      </div>
      <div className="w-8 h-8 rounded bg-white/[0.03] group-hover:bg-white/[0.06] flex items-center justify-center transition-all">
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          className="text-zinc-600 group-hover:text-zinc-400 transition-colors"
        >
          <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </button>
  );
}

/* ---- Main Modal Dialog ---- */
function WalletModalDialog() {
  const { visible, setVisible } = useWalletModal();
  const { wallets, select } = useWallet();
  const [showMore, setShowMore] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);

  // Categorize wallets
  const installed = wallets.filter(
    (w) =>
      w.readyState === WalletReadyState.Installed ||
      w.readyState === WalletReadyState.Loadable
  );
  const notInstalled = wallets.filter(
    (w) => w.readyState === WalletReadyState.NotDetected
  );

  const handleSelect = useCallback(
    (wallet: Wallet) => {
      select(wallet.adapter.name);
      setVisible(false);
    },
    [select, setVisible]
  );

  // Animate in
  useEffect(() => {
    if (visible) {
      requestAnimationFrame(() => setAnimateIn(true));
    } else {
      setAnimateIn(false);
    }
  }, [visible]);

  // Close on Escape
  useEffect(() => {
    if (!visible) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setVisible(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [visible, setVisible]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (visible) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop with deeper blur */}
      <div
        className={`absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-300 ${animateIn ? "opacity-100" : "opacity-0"}`}
        onClick={() => setVisible(false)}
      />

      {/* Modal */}
      <div
        className={`relative w-full max-w-[420px] overflow-hidden transition-all duration-300 ease-out ${
          animateIn ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-4"
        }`}
        style={{
          background: "linear-gradient(180deg, rgba(20,20,26,0.98) 0%, rgba(14,14,18,0.99) 100%)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "1.25rem",
          boxShadow: "0 25px 60px -12px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.03) inset",
        }}
      >
        {/* Subtle top accent line */}
        <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

        {/* Header with Aegis logo */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <img
              src={AEGIS_LOGO}
              alt="Aegis"
              className="h-7 w-auto opacity-90"
            />
            <div className="w-px h-5 bg-white/[0.08]" />
            <div>
              <h2 className="text-[16px] font-normal text-white leading-tight">Connect Wallet</h2>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Secure connection to Aegis Protocol
              </p>
            </div>
          </div>
          <button
            onClick={() => setVisible(false)}
            className="w-8 h-8 rounded bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center text-zinc-500 hover:text-zinc-300 transition-all mt-0.5"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Protocol info bar */}
        <div className="mx-6 mb-4 flex items-center gap-3 px-3.5 py-2.5 rounded bg-white/[0.02] border border-white/[0.04]">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/70 animate-live-glow" />
            <span className="text-[11px] text-zinc-500">Solana Mainnet</span>
          </div>
          <div className="w-px h-3 bg-white/[0.06]" />
          <span className="text-[11px] text-zinc-500">x402 Payments</span>
          <div className="w-px h-3 bg-white/[0.06]" />
          <span className="text-[11px] text-zinc-500">NeMo Validated</span>
        </div>

        {/* Wallet list */}
        <div className="px-3 pb-3 max-h-[360px] overflow-y-auto no-scrollbar">
          {/* Detected wallets */}
          {installed.length > 0 && (
            <div className="mb-2">
              <div className="px-3 py-2 text-[10px] font-medium text-zinc-600 uppercase tracking-wider">
                Available Wallets
              </div>
              {installed.map((wallet) => (
                <WalletRow
                  key={wallet.adapter.name}
                  wallet={wallet}
                  onSelect={handleSelect}
                  detected={wallet.readyState === WalletReadyState.Installed}
                />
              ))}
            </div>
          )}

          {/* Not installed wallets */}
          {notInstalled.length > 0 && (
            <div>
              <button
                onClick={() => setShowMore(!showMore)}
                className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-medium text-zinc-600 hover:text-zinc-500 transition-colors cursor-pointer uppercase tracking-wider"
              >
                <span>More Wallets ({notInstalled.length})</span>
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 10 10"
                  fill="none"
                  className={`transition-transform duration-200 ${showMore ? "rotate-180" : ""}`}
                >
                  <path d="M2.5 4l2.5 2.5L7.5 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
              </button>
              {showMore &&
                notInstalled.map((wallet) => (
                  <WalletRow
                    key={wallet.adapter.name}
                    wallet={wallet}
                    onSelect={handleSelect}
                    detected={false}
                  />
                ))}
            </div>
          )}

          {/* Empty state */}
          {installed.length === 0 && notInstalled.length === 0 && (
            <div className="py-12 text-center">
              <div className="w-14 h-14 rounded bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-4">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-zinc-500">
                  <rect x="2" y="6" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M2 10h20" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="17" cy="15" r="2" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </div>
              <p className="text-[14px] text-zinc-400 font-medium mb-1">No wallets found</p>
              <p className="text-[12px] text-zinc-600 leading-relaxed max-w-[260px] mx-auto">
                Install a Solana wallet extension like Phantom or Solflare to connect
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/[0.04]" style={{ background: "rgba(10,10,14,0.5)" }}>
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-zinc-600">
              By connecting, you agree to the Terms of Service
            </p>
            <a
              href="https://solana.com/ecosystem/explore?categories=wallet"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors font-medium"
            >
              Get a wallet
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WalletModalDialog;
