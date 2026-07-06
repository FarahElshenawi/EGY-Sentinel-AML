interface LogoProps { size?: number; className?: string; }
export default function Logo({ size = 48, className = '' }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} role="img" aria-label="EGY-Sentinel AML">
      <path d="M60 8 L104 22 L104 58 C104 84 86 104 60 114 C34 104 16 84 16 58 L16 22 Z" fill="#FFFFFF" stroke="#0A2B5C" strokeWidth="3" strokeLinejoin="round"/>
      <path d="M60 14 L98 26 L98 58 C98 80 83 98 60 107 C37 98 22 80 22 58 L22 26 Z" fill="#F8FAFC" opacity="0.5"/>
      <g stroke="#0A2B5C" strokeWidth="1.5" opacity="0.5"><line x1="60" y1="30" x2="84" y2="48"/><line x1="84" y1="48" x2="75" y2="76"/><line x1="75" y1="76" x2="45" y2="76"/><line x1="45" y1="76" x2="36" y2="48"/><line x1="36" y1="48" x2="60" y2="30"/></g>
      <g stroke="#0A2B5C" strokeWidth="1" opacity="0.3"><line x1="60" y1="56" x2="60" y2="30"/><line x1="60" y1="56" x2="84" y2="48"/><line x1="60" y1="56" x2="75" y2="76"/><line x1="60" y1="56" x2="45" y2="76"/><line x1="60" y1="56" x2="36" y2="48"/></g>
      <line x1="60" y1="30" x2="84" y2="48" stroke="#2A7FFF" strokeWidth="2" opacity="0.7"/>
      <line x1="45" y1="76" x2="36" y2="48" stroke="#2A7FFF" strokeWidth="2" opacity="0.7"/>
      <circle cx="60" cy="56" r="14" fill="none" stroke="#FFA500" strokeWidth="1.5" strokeDasharray="3 2" opacity="0.6"/>
      <circle cx="60" cy="56" r="9" fill="#FFA500"/>
      <circle cx="60" cy="56" r="3" fill="#0A2B5C" opacity="0.7"/>
      <circle cx="60" cy="30" r="5" fill="#2A7FFF"/>
      <circle cx="84" cy="48" r="5" fill="#1A1A1A"/>
      <circle cx="75" cy="76" r="5" fill="#1A1A1A"/>
      <circle cx="45" cy="76" r="5" fill="#2A7FFF"/>
      <circle cx="36" cy="48" r="5" fill="#1A1A1A"/>
    </svg>
  );
}
