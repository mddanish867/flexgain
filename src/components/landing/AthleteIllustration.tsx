/**
 * AthleteIllustration — large stylized silhouette of an athlete lifting.
 * Built from primitive SVG shapes, with a red accent overlay.
 */
export function AthleteIllustration({
  className,
}: {
  className?: string;
}) {
  return (
    <svg
      role="img"
      aria-label="Athlete lifting a barbell"
      viewBox="0 0 600 480"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="silhouette" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#1a1a1a" />
          <stop offset="1" stopColor="#0a0a0a" />
        </linearGradient>
      </defs>

      {/* ground line */}
      <line x1="40" y1="430" x2="560" y2="430" stroke="#262626" strokeWidth="1" />
      <line x1="40" y1="436" x2="560" y2="436" stroke="#1a1a1a" strokeWidth="1" />

      {/* barbell — wide overhead */}
      <rect x="60" y="170" width="480" height="10" rx="2" fill="#262626" />
      <rect x="80" y="160" width="6" height="30" fill="#FF3B30" />
      <rect x="514" y="160" width="6" height="30" fill="#FF3B30" />
      <rect x="90" y="138" width="22" height="64" rx="2" fill="url(#silhouette)" stroke="#262626" />
      <rect x="116" y="126" width="30" height="88" rx="2" fill="url(#silhouette)" stroke="#262626" />
      <rect x="454" y="126" width="30" height="88" rx="2" fill="url(#silhouette)" stroke="#262626" />
      <rect x="488" y="138" width="22" height="64" rx="2" fill="url(#silhouette)" stroke="#262626" />
      {/* red rings on plates */}
      <rect x="120" y="148" width="22" height="44" rx="1" fill="none" stroke="#FF3B30" strokeWidth="1" />
      <rect x="458" y="148" width="22" height="44" rx="1" fill="none" stroke="#FF3B30" strokeWidth="1" />

      {/* arms holding the bar */}
      <rect x="240" y="180" width="32" height="80" fill="#101010" stroke="#1a1a1a" />
      <rect x="328" y="180" width="32" height="80" fill="#101010" stroke="#1a1a1a" />

      {/* head */}
      <circle cx="300" cy="226" r="32" fill="url(#silhouette)" stroke="#1a1a1a" />
      {/* torso */}
      <path
        d="M260 258 Q260 252 268 250 L332 250 Q340 252 340 258 L350 380 Q350 388 342 390 L258 390 Q250 388 250 380 Z"
        fill="url(#silhouette)"
        stroke="#1a1a1a"
      />
      {/* legs */}
      <path
        d="M268 388 L262 430 L290 430 L298 388 Z"
        fill="url(#silhouette)"
        stroke="#1a1a1a"
      />
      <path
        d="M302 388 L310 430 L338 430 L332 388 Z"
        fill="url(#silhouette)"
        stroke="#1a1a1a"
      />
      {/* red accent stripe across torso */}
      <line
        x1="262"
        y1="310"
        x2="338"
        y2="310"
        stroke="#FF3B30"
        strokeWidth="2"
      />
      {/* knee dot */}
      <circle cx="276" cy="430" r="3" fill="#FF3B30" />
      <circle cx="324" cy="430" r="3" fill="#FF3B30" />
    </svg>
  );
}
