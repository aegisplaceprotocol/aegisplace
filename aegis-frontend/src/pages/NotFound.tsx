import Navbar from "@/components/Navbar";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />

      <div className="flex-1 flex items-center justify-center px-6">
        <div className="text-center max-w-lg">
          <div className="text-[120px] md:text-[160px] font-normal text-white/[0.03] leading-none select-none -mb-8">
            404
          </div>
          <h1 className="text-3xl md:text-4xl font-normal text-white/90 tracking-tight mb-3">
            Route not found.
          </h1>
          <p className="text-white/25 leading-relaxed mb-8">
            The page you're looking for doesn't exist or has been moved. Check the URL or navigate back to a known route.
          </p>
          <div className="border border-white/[0.04] bg-white/[0.01] p-4 mb-8 text-left">
            <pre className="text-[11px] font-medium text-white/30 leading-[1.8]">
{`$ agent-aegis navigate /unknown
Error: Route not found in registry.
Suggestion: Try one of the following:
  → /
  → /marketplace
  → /docs`}
            </pre>
          </div>
          <div className="flex items-center justify-center gap-3">
            <a href="/"
              className="text-sm font-normal bg-white text-zinc-900 px-6 py-3 hover:bg-zinc-200 transition-colors rounded">
              Back to Home
            </a>
            <a href="/marketplace"
              className="text-sm font-medium border border-white/[0.04] text-white/35 hover:text-white/55 hover:border-white/[0.12] px-6 py-3 transition-all">
              Marketplace
            </a>
            <a href="/docs"
              className="text-sm font-medium border border-white/[0.04] text-white/35 hover:text-white/55 hover:border-white/[0.12] px-6 py-3 transition-all">
              Docs
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
