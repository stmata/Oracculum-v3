import React from "react";

export default function ProgressRing({
  size = 64,
  stroke = 8,
  progress = 0,
  progressColor = "currentColor",
  emptyColor = "#bababaff",
}) {
  const clamped = Math.max(0, Math.min(100, progress));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (clamped / 100) * c;
  const gap = c - dash;

  const cx = size / 2;
  const cy = size / 2;

  const textOffset = stroke * 1.7;
  const textY = cy + textOffset / 2;

  const EPS = 0.0001;
  const dashSafe = Math.max(EPS, dash);
  const gapSafe = Math.max(EPS, gap);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-label={`${clamped}%`}>
      <circle
        cx={cx}
        cy={cy}
        r={r}
        stroke={emptyColor}
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
      />

      {clamped > 0 && (
        <circle
          cx={cx}
          cy={cy}
          r={r}
          stroke={progressColor}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${dashSafe} ${gapSafe}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ transition: "stroke-dasharray 0.35s ease" }}
        />
      )}

      <text
        x={cx}
        y={textY}
        dominantBaseline="middle"
        textAnchor="middle"
        fontSize={size * 0.3}
        fontWeight="900"
        fill={progressColor}
        opacity="0.9"
      >
        {Math.round(clamped)}%
      </text>
    </svg>
  );
}
