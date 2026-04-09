import { LogoBar } from "@/components/BrandLogos";

const LOGO_URL = "/assets/fullvectorwhite.svg";

const LINK_GROUPS = [
  {
    title: "Earn",
    links: [
      { label: "Creator Economy", href: "/earn" },
      { label: "Upload Operator", href: "/submit" },
      { label: "Marketplace", href: "/marketplace" },
      { label: "Earnings Calculator", href: "/earn" },
      { label: "Tokenomics", href: "/tokenomics" },
    ],
  },
  {
    title: "Protocol",
    links: [
      { label: "Arsenal", href: "/arsenal" },
      { label: "Evolution Engine", href: "/evolution" },
      { label: "Ecosystem", href: "/ecosystem" },
      { label: "GPU Compute", href: "/compute" },
      { label: "Research", href: "/research" },
    ],
  },
  {
    title: "Build",
    links: [
      { label: "GitHub", href: "https://github.com/aegisplaceprotocol/aegisplace", external: true },
      { label: "Documentation", href: "/docs" },
      { label: "SDK Integration", href: "/sdk" },
      { label: "Playground", href: "/playground" },
      { label: "FAQ", href: "/faq" },
    ],
  },
  {
    title: "Community",
    links: [
      { label: "Twitter / X", href: "#", external: true },
      { label: "Telegram", href: "#", external: true },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.04]/30 bg-white/[0.015]">
      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-12 sm:py-20 lg:py-24">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 sm:gap-12 lg:gap-16">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1 mb-4 lg:mb-0">
            <div className="mb-6">
              <img
                src={LOGO_URL}
                alt="Aegis"
                className="h-7 w-auto object-contain"
              />
            </div>
            <p className="text-[13px] font-light text-white/20 leading-relaxed max-w-xs">
              The skill layer for autonomous agents. Upload a skill, earn every time an agent uses it.
              Built on Solana. Powered by x402 and MCP.
            </p>
          </div>

          {/* Link groups */}
          {LINK_GROUPS.map((group) => (
            <div key={group.title}>
              <div className="text-[12px] text-white/20 font-normal mb-5">
                {group.title}
              </div>
              <div className="space-y-3">
                {group.links.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    target={(link as any).external ? "_blank" : undefined}
                    rel={(link as any).external ? "noopener noreferrer" : undefined}
                    onClick={() => {}}
                    className="block text-[13px] font-normal text-white/20 hover:text-white/40 transition-colors duration-200 cursor-pointer"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Logo bar: what skills on Aegis can leverage */}
        <div className="mt-12 sm:mt-16 pt-8 border-t border-white/[0.04]/20">
          <LogoBar
            variant="full"
            label="Skills on Aegis leverage the full AI and blockchain stack"
          />
        </div>

        {/* Bottom bar */}
        <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-white/[0.04]/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="text-[12px] text-white/[0.12] font-light">
            MIT License. Build Once. Earn Forever. Solana. x402. MCP.
          </div>
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <a href="https://github.com/aegisplaceprotocol/aegisplace" target="_blank" rel="noopener noreferrer" className="text-[12px] font-normal text-white/20 hover:text-white/35 transition-colors cursor-pointer">
              GitHub
            </a>
            <span className="text-[12px] text-white/[0.08]">|</span>
            <a href="/docs" className="text-[12px] font-normal text-white/20 hover:text-white/35 transition-colors">
              Docs
            </a>
            <span className="text-[12px] text-white/[0.08]">|</span>
            <span className="text-[12px] font-normal text-white/20">
              $AEGIS on Solana
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
