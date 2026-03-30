export interface BrandLogo {
  name: string;
  icon: string;
}

const BRANDS: BrandLogo[] = [
  { name: 'NVIDIA', icon: '/assets/icons/nvidia.svg' },
  { name: 'OpenAI', icon: '/assets/icons/openai.svg' },
  { name: 'Anthropic', icon: '/assets/icons/anthropic.svg' },
  { name: 'Solana', icon: '/assets/icons/solana.svg' },
  { name: 'Mistral AI', icon: '/assets/icons/mistral.svg' },
  { name: 'Google', icon: '/assets/icons/google.svg' },
  { name: 'Meta', icon: '/assets/icons/meta.svg' },
];

/* ========================================================================== */
/* Logo bar component                                                         */
/* ========================================================================== */

interface LogoBarProps {
  /** Which set of logos to show */
  variant?: "hero" | "full" | "ai" | "blockchain";
  /** Label above the logos */
  label?: string;
  className?: string;
}

export function LogoBar({ variant = "hero", label, className = "" }: LogoBarProps) {
  return (
    <div className={className}>
      <p
        style={{
          fontSize: 10,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.25)',
          marginBottom: 24,
          textAlign: 'center',
          fontWeight: 400,
        }}
      >
        SKILLS ON AEGIS LEVERAGE THE ENTIRE AI AND BLOCKCHAIN STACK
      </p>
      <div className="flex flex-wrap items-center justify-center gap-x-16 gap-y-6">
        {BRANDS.map((brand) => (
          <div
            key={brand.name}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              opacity: 0.30,
              transition: 'opacity 200ms',
              cursor: 'default',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.50'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.30'; }}
          >
            <img
              src={brand.icon}
              alt={brand.name}
              style={{
                height: 20,
                width: 'auto',
                objectFit: 'contain',
                filter: 'brightness(0) invert(1)',
              }}
              loading="lazy"
              draggable={false}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default LogoBar;
