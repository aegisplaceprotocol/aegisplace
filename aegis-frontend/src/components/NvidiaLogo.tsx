/**
 * NVIDIA Eye Logo - inline SVG component
 * Source: Bootstrap Icons (MIT license)
 * Used with NVIDIA green (#76B900) by default
 */
export function NvidiaEyeLogo({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      fill="currentColor"
      viewBox="0 0 16 16"
      className={className}
      aria-label="NVIDIA"
    >
      <path d="M1.635 7.146S3.08 5.012 5.97 4.791v-.774C2.77 4.273 0 6.983 0 6.983s1.57 4.536 5.97 4.952v-.824c-3.23-.406-4.335-3.965-4.335-3.965M5.97 9.475v.753c-2.44-.435-3.118-2.972-3.118-2.972S4.023 5.958 5.97 5.747v.828h-.004c-1.021-.123-1.82.83-1.82.83s.448 1.607 1.824 2.07M6 2l-.03 2.017A7 7 0 0 1 6.252 4c3.637-.123 6.007 2.983 6.007 2.983s-2.722 3.31-5.557 3.31q-.39-.002-.732-.065v.883q.292.039.61.04c2.638 0 4.546-1.348 6.394-2.943.307.246 1.561.842 1.819 1.104-1.757 1.47-5.852 2.657-8.173 2.657a7 7 0 0 1-.65-.034V14H16l.03-12zm-.03 3.747v-.956a6 6 0 0 1 .282-.015c2.616-.082 4.332 2.248 4.332 2.248S8.73 9.598 6.743 9.598c-.286 0-.542-.046-.773-.123v-2.9c1.018.123 1.223.572 1.835 1.593L9.167 7.02s-.994-1.304-2.67-1.304a5 5 0 0 0-.527.031" />
    </svg>
  );
}

/**
 * NVIDIA badge with eye logo + text
 * Reusable across the site wherever we show "Powered by NVIDIA NeMo"
 */
export function NvidiaBadge({
  text = "NVIDIA NeMo",
  size = "sm",
  variant = "default",
}: {
  text?: string;
  size?: "xs" | "sm" | "md" | "lg";
  variant?: "default" | "bright" | "minimal";
}) {
  const sizeMap = {
    xs: { icon: 10, text: "text-[9px]", px: "px-1.5 py-0.5", gap: "gap-1" },
    sm: { icon: 14, text: "text-[10px]", px: "px-2.5 py-1", gap: "gap-1.5" },
    md: { icon: 18, text: "text-xs", px: "px-3 py-1.5", gap: "gap-2" },
    lg: { icon: 24, text: "text-sm", px: "px-4 py-2", gap: "gap-2.5" },
  };

  const s = sizeMap[size];

  if (variant === "minimal") {
    return (
      <span className={`inline-flex items-center ${s.gap}`}>
        <NvidiaEyeLogo size={s.icon} className="text-[#76B900]" />
        <span className={`font-medium ${s.text} text-[#76B900]/80 tracking-wide`}>{text}</span>
      </span>
    );
  }

  if (variant === "bright") {
    return (
      <span className={`inline-flex items-center ${s.gap} ${s.px} border border-[#76B900]/40 bg-[#76B900]/10`}>
        <NvidiaEyeLogo size={s.icon} className="text-[#76B900]" />
        <span className={`font-normal ${s.text} text-[#76B900] tracking-wide`}>{text}</span>
      </span>
    );
  }

  // default
  return (
    <span className={`inline-flex items-center ${s.gap} ${s.px} border border-[#76B900]/25 bg-[#76B900]/[0.02]`}>
      <NvidiaEyeLogo size={s.icon} className="text-[#76B900]/80" />
      <span className={`font-medium ${s.text} text-[#76B900]/80 tracking-wide`}>{text}</span>
    </span>
  );
}

export default NvidiaEyeLogo;
