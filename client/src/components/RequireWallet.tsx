import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { useEffect } from "react";
import type { ReactNode } from "react";

export default function RequireWallet({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      toast("Wallet connect coming soon", {
        description: "Full wallet integration launches with mainnet.",
      });
    }
  }, [loading, isAuthenticated]);

  return <>{children}</>;
}
