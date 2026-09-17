/**
 * BarbellIllustration — inline SVG of a barbell viewed at a slight 3/4 angle.
 * Uses red accent strokes so it sits inside the dark theme.
 */
export function BarbellIllustration({
  className,
}: {
  className?: string;
}) {
  return (
    <svg
      role="img"
      aria-label="Barbell illustration"
      viewBox="0 0 400 200"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="plate" x1="0" x2="1">
          <stop offset="0" stopColor="#1a1a1a" />
          <stop offset="1" stopColor="#0a0a0a" />
        </linearGradient>
      </defs>
      {/* bar */}
      <rect x="40" y="94" width="320" height="12" rx="2" fill="#262626" />
      {/* sleeves (red accent collars) */}
      <rect x="56" y="86" width="10" height="28" fill="#FF3B30" />
      <rect x="334" y="86" width="10" height="28" fill="#FF3B30" />
      {/* inner plates */}
      <rect x="70" y="60" width="36" height="80" rx="3" fill="url(#plate)" stroke="#262626" />
      <rect x="110" y="50" width="40" height="100" rx="3" fill="url(#plate)" stroke="#262626" />
      <rect x="250" y="50" width="40" height="100" rx="3" fill="url(#plate)" stroke="#262626" />
      <rect x="294" y="60" width="36" height="80" rx="3" fill="url(#plate)" stroke="#262626" />
      {/* red outline plates */}
      <rect x="78" y="80" width="20" height="40" rx="2" fill="none" stroke="#FF3B30" strokeWidth="1" />
      <rect x="120" y="76" width="20" height="48" rx="2" fill="none" stroke="#FF3B30" strokeWidth="1" />
      <rect x="260" y="76" width="20" height="48" rx="2" fill="none" stroke="#FF3B30" strokeWidth="1" />
      <rect x="302" y="80" width="20" height="40" rx="2" fill="none" stroke="#FF3B30" strokeWidth="1" />
    </svg>
  );
}
