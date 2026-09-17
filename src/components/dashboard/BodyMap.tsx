"use client";

interface BodyMapProps {
  soreness: Record<string, number>;
}

function colorForGroup(soreness: number): string {
  if (soreness <= 0) return "#1f1f1f";
  if (soreness <= 3) return "#1f3a1f";
  if (soreness <= 7) return "#34C759";
  return "#FF3B30";
}

export function BodyMap({ soreness }: BodyMapProps) {
  const chest = colorForGroup(soreness["chest"] ?? 0);
  const shoulders = colorForGroup(soreness["shoulders"] ?? 0);
  const arms = colorForGroup(soreness["arms"] ?? 0);
  const core = colorForGroup(soreness["core"] ?? 0);
  const legs = colorForGroup(soreness["legs"] ?? 0);

  return (
    <svg viewBox="0 0 200 360" className="w-full max-w-[220px] mx-auto">
      {/* Head */}
      <circle cx="100" cy="30" r="18" fill="#0e0e0e" stroke="#1f1f1f" />

      {/* Neck */}
      <rect x="92" y="46" width="16" height="14" fill="#0e0e0e" />

      {/* Shoulders */}
      <path
        d="M55 70 Q100 60 145 70 L150 95 Q100 88 50 95 Z"
        fill={shoulders}
        stroke="#0e0e0e"
        strokeWidth="1"
      />

      {/* Chest */}
      <path
        d="M62 95 Q100 88 138 95 L138 130 Q100 135 62 130 Z"
        fill={chest}
        stroke="#0e0e0e"
        strokeWidth="1"
      />

      {/* Arms */}
      <path
        d="M40 70 Q35 100 42 160 L58 165 Q60 110 60 70 Z"
        fill={arms}
        stroke="#0e0e0e"
        strokeWidth="1"
      />
      <path
        d="M160 70 Q165 100 158 160 L142 165 Q140 110 140 70 Z"
        fill={arms}
        stroke="#0e0e0e"
        strokeWidth="1"
      />

      {/* Core / abs */}
      <rect x="68" y="135" width="64" height="80" fill={core} stroke="#0e0e0e" />
      <line x1="68" y1="155" x2="132" y2="155" stroke="#0e0e0e" strokeOpacity="0.4" />
      <line x1="68" y1="175" x2="132" y2="175" stroke="#0e0e0e" strokeOpacity="0.4" />
      <line x1="68" y1="195" x2="132" y2="195" stroke="#0e0e0e" strokeOpacity="0.4" />
      <line x1="100" y1="135" x2="100" y2="215" stroke="#0e0e0e" strokeOpacity="0.4" />

      {/* Legs */}
      <path
        d="M68 215 L130 215 L120 320 L82 320 Z"
        fill={legs}
        stroke="#0e0e0e"
        strokeWidth="1"
      />
      <line x1="100" y1="215" x2="100" y2="320" stroke="#0e0e0e" strokeOpacity="0.4" />

      {/* Back indicator (semi-transparent overlay so we can hint at back) */}
      <text x="100" y="350" textAnchor="middle" fill="#666" fontSize="9" fontFamily="monospace">
        FRONT VIEW
      </text>
    </svg>
  );
}
