export default function ComingSoon({ title, description }: { title: string; description?: string }) {
  return (
    <div className="pt-24 pb-16">
      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
          <div className="text-[11px] font-bold tracking-wider uppercase text-zinc-600 mb-6">Coming Soon</div>
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight">{title}</h1>
          {description && (
            <p className="text-base text-zinc-500 max-w-md leading-relaxed mb-10">{description}</p>
          )}
          <a
            href="/"
            className="text-sm text-zinc-500 hover:text-zinc-300 border border-zinc-800 px-6 py-2.5 rounded transition-colors"
          >
            Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
