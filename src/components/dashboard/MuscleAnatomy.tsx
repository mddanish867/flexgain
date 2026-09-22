"use client";

import { MUSCLE_LABELS, type MuscleId } from "@/lib/ai/muscles";

export type Emphasis = "primary" | "secondary" | "none";

interface MuscleAnatomyProps {
  primary?: MuscleId[];
  secondary?: MuscleId[];
  /** Render one view only; defaults to both side by side. */
  view?: "front" | "back" | "both";
  className?: string;
  showLegend?: boolean;
}

const FILL: Record<Emphasis, string> = {
  primary: "#FF3B30",
  secondary: "#B2261F",
  none: "#181818",
};

const STROKE = "#0A0A0A";

/**
 * Front and back muscle map with every muscle individually addressable.
 *
 * Anatomy is drawn rather than generated: an image model produces
 * plausible-looking bodies but cannot be trusted to put the lats in the
 * right place or to highlight exactly the muscles a movement trains. The
 * model picks ids from the shared vocabulary in lib/ai/muscles and this
 * component lights up the matching shapes, so the picture always agrees
 * with the text beside it.
 */
export function MuscleAnatomy({
  primary = [],
  secondary = [],
  view = "both",
  className,
  showLegend = true,
}: MuscleAnatomyProps) {
  const emphasis = (m: MuscleId): Emphasis =>
    primary.includes(m) ? "primary" : secondary.includes(m) ? "secondary" : "none";

  const f = (m: MuscleId) => FILL[emphasis(m)];
  const shared = {
    stroke: STROKE,
    strokeWidth: 1.2,
    strokeLinejoin: "round" as const,
  };

  const front = (
    <svg
      viewBox="0 0 240 430"
      className="w-full h-auto"
      role="img"
      aria-label="Front view muscle map"
    >
      <title>Front view</title>
      <ellipse cx="120" cy="34" rx="19" ry="22" fill="#101010" {...shared} />
      <path d="M110 54 h20 l2 16 h-24 z" fill={f("neck")} {...shared} />

      {/* trapezius sloping to the shoulders */}
      <path
        d="M108 68 Q120 60 132 68 L160 84 L150 94 Q120 80 90 94 L80 84 Z"
        fill={f("traps")}
        {...shared}
      />

      {/* deltoids */}
      <path
        d="M80 86 Q62 92 58 112 Q57 124 66 128 Q76 118 84 98 Z"
        fill={f("front_delts")}
        {...shared}
      />
      <path
        d="M160 86 Q178 92 182 112 Q183 124 174 128 Q164 118 156 98 Z"
        fill={f("front_delts")}
        {...shared}
      />
      <path
        d="M58 112 Q48 118 50 134 Q54 146 66 140 Q64 130 66 128 Z"
        fill={f("side_delts")}
        {...shared}
      />
      <path
        d="M182 112 Q192 118 190 134 Q186 146 174 140 Q176 130 174 128 Z"
        fill={f("side_delts")}
        {...shared}
      />

      {/* pectorals */}
      <path
        d="M92 96 Q108 90 118 95 L118 130 Q100 136 88 126 Q85 110 92 96 Z"
        fill={f("chest")}
        {...shared}
      />
      <path
        d="M148 96 Q132 90 122 95 L122 130 Q140 136 152 126 Q155 110 148 96 Z"
        fill={f("chest")}
        {...shared}
      />

      {/* biceps and forearms */}
      <path
        d="M60 140 Q52 158 54 180 L70 184 Q74 160 70 140 Z"
        fill={f("biceps")}
        {...shared}
      />
      <path
        d="M180 140 Q188 158 186 180 L170 184 Q166 160 170 140 Z"
        fill={f("biceps")}
        {...shared}
      />
      <path
        d="M54 184 Q48 208 50 232 L66 234 Q70 208 70 188 Z"
        fill={f("forearms")}
        {...shared}
      />
      <path
        d="M186 184 Q192 208 190 232 L174 234 Q170 208 170 188 Z"
        fill={f("forearms")}
        {...shared}
      />

      {/* abdominals: three rows of pairs */}
      {[0, 1, 2].map((row) => (
        <g key={row}>
          <rect
            x="102"
            y={140 + row * 26}
            width="16"
            height="22"
            rx="4"
            fill={f("abs")}
            {...shared}
          />
          <rect
            x="122"
            y={140 + row * 26}
            width="16"
            height="22"
            rx="4"
            fill={f("abs")}
            {...shared}
          />
        </g>
      ))}
      <path d="M102 218 h36 l-4 24 h-28 z" fill={f("abs")} {...shared} />

      {/* obliques flanking the abs */}
      <path
        d="M90 140 Q84 176 92 218 L100 216 Q96 176 98 140 Z"
        fill={f("obliques")}
        {...shared}
      />
      <path
        d="M150 140 Q156 176 148 218 L140 216 Q144 176 142 140 Z"
        fill={f("obliques")}
        {...shared}
      />

      {/* pelvis */}
      <path d="M96 242 h48 l4 18 h-56 z" fill="#101010" {...shared} />

      {/* quadriceps and adductors */}
      <path
        d="M92 262 Q84 300 88 344 L110 346 Q116 302 112 262 Z"
        fill={f("quads")}
        {...shared}
      />
      <path
        d="M148 262 Q156 300 152 344 L130 346 Q124 302 128 262 Z"
        fill={f("quads")}
        {...shared}
      />
      <path d="M114 262 h12 l-2 52 h-8 z" fill={f("adductors")} {...shared} />

      {/* tibialis / lower leg, front */}
      <path
        d="M92 352 Q88 384 94 414 L110 414 Q112 384 110 354 Z"
        fill={f("calves")}
        {...shared}
      />
      <path
        d="M148 352 Q152 384 146 414 L130 414 Q128 384 130 354 Z"
        fill={f("calves")}
        {...shared}
      />
      <text
        x="120"
        y="428"
        textAnchor="middle"
        fill="#555"
        fontSize="9"
        fontFamily="monospace"
      >
        FRONT
      </text>
    </svg>
  );

  const back = (
    <svg
      viewBox="0 0 240 430"
      className="w-full h-auto"
      role="img"
      aria-label="Back view muscle map"
    >
      <title>Back view</title>
      <ellipse cx="120" cy="34" rx="19" ry="22" fill="#101010" {...shared} />
      <path d="M110 54 h20 l2 16 h-24 z" fill={f("neck")} {...shared} />

      {/* trapezius: the big upper-back diamond */}
      <path
        d="M108 66 Q120 58 132 66 L162 86 L150 118 Q120 108 90 118 L78 86 Z"
        fill={f("traps")}
        {...shared}
      />

      {/* rear deltoids */}
      <path
        d="M78 88 Q60 94 56 114 Q55 126 64 130 Q74 120 82 100 Z"
        fill={f("rear_delts")}
        {...shared}
      />
      <path
        d="M162 88 Q180 94 184 114 Q185 126 176 130 Q166 120 158 100 Z"
        fill={f("rear_delts")}
        {...shared}
      />

      {/* latissimus dorsi, sweeping to the waist */}
      <path
        d="M88 118 Q74 150 84 196 L116 200 L116 124 Q102 114 88 118 Z"
        fill={f("lats")}
        {...shared}
      />
      <path
        d="M152 118 Q166 150 156 196 L124 200 L124 124 Q138 114 152 118 Z"
        fill={f("lats")}
        {...shared}
      />

      {/* erector spinae */}
      <path d="M110 128 h20 v112 h-20 z" fill={f("lower_back")} {...shared} />

      {/* triceps and forearms */}
      <path
        d="M58 132 Q50 152 52 178 L70 182 Q74 156 70 132 Z"
        fill={f("triceps")}
        {...shared}
      />
      <path
        d="M182 132 Q190 152 188 178 L170 182 Q166 156 170 132 Z"
        fill={f("triceps")}
        {...shared}
      />
      <path
        d="M52 182 Q46 208 48 232 L66 234 Q70 208 70 186 Z"
        fill={f("forearms")}
        {...shared}
      />
      <path
        d="M188 182 Q194 208 192 232 L174 234 Q170 208 170 186 Z"
        fill={f("forearms")}
        {...shared}
      />

      {/* gluteus maximus */}
      <path
        d="M92 240 Q86 268 100 282 Q114 286 118 262 L118 242 Z"
        fill={f("glutes")}
        {...shared}
      />
      <path
        d="M148 240 Q154 268 140 282 Q126 286 122 262 L122 242 Z"
        fill={f("glutes")}
        {...shared}
      />

      {/* hamstrings */}
      <path
        d="M94 288 Q88 318 92 346 L112 348 Q116 316 114 288 Z"
        fill={f("hamstrings")}
        {...shared}
      />
      <path
        d="M146 288 Q152 318 148 346 L128 348 Q124 316 126 288 Z"
        fill={f("hamstrings")}
        {...shared}
      />

      {/* gastrocnemius */}
      <path
        d="M92 354 Q86 382 94 414 L112 414 Q114 382 112 356 Z"
        fill={f("calves")}
        {...shared}
      />
      <path
        d="M148 354 Q154 382 146 414 L128 414 Q126 382 128 356 Z"
        fill={f("calves")}
        {...shared}
      />
      <text
        x="120"
        y="428"
        textAnchor="middle"
        fill="#555"
        fontSize="9"
        fontFamily="monospace"
      >
        BACK
      </text>
    </svg>
  );

  return (
    <div className={className}>
      <div className={view === "both" ? "grid grid-cols-2 gap-3" : ""}>
        {view !== "back" ? front : null}
        {view !== "front" ? back : null}
      </div>
      {showLegend && primary.length + secondary.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {primary.map((m) => (
            <span
              key={`p-${m}`}
              className="text-[10px] font-mono-label px-2 py-1 rounded border border-accent-red/60 text-accent-red"
            >
              {MUSCLE_LABELS[m]}
            </span>
          ))}
          {secondary.map((m) => (
            <span
              key={`s-${m}`}
              className="text-[10px] font-mono-label px-2 py-1 rounded border border-border text-fg-muted"
            >
              {MUSCLE_LABELS[m]}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
