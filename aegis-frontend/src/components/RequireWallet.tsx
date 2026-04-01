import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { useEffect } from "react";
import type { ReactNode } from "react";

export default function RequireWallet({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      toast("Please connect your wallet", {
        description: "Connect a Solana wallet to access this feature.",
      });
    }
  }, [loading, isAuthenticated]);

  return <>{children}</>;
}
