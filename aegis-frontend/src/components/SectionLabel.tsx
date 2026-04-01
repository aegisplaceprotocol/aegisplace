export default function SectionLabel({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      <span className="w-1.5 h-1.5 bg-white/60 rounded-full" />
      <span className="text-[11px] font-medium tracking-wider uppercase text-white/30 font-medium">
        {text}
      </span>
    </div>
  );
}
