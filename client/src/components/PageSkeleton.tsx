export default function PageSkeleton() {
  return (
    <div className="min-h-screen bg-black">
      <div className="h-16 border-b border-white/[0.06]" />
      <div className="flex items-center justify-center" style={{ height: "calc(100vh - 4rem)" }}>
        <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
      </div>
    </div>
  );
}
