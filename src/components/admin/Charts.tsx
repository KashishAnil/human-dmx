import { useMemo, useRef, useState } from "react";
import { cn, compactMoney, money } from "../../utils/Functions";

/**
 * Chart palette — validated with the dataviz colour checks against the admin's
 * white surface: lightness band, chroma floor, CVD separation and the
 * normal-vision floor all pass in fixed order.
 *
 * Two checks come back as WARN rather than PASS — the categorical set sits in
 * the 6–8 CVD floor band, and #3fa96f lands just under 3:1 against white. Both
 * are only permissible with secondary encoding, so every categorical chart
 * below carries a direct label per row.
 */
export const CHART = {
  accent: "#1f5fd0",
  accentSoft: "rgba(31, 95, 208, 0.16)",
  royal: "#1f5fd0",
  categorical: ["#2f6fe0", "#b8890f", "#cc5fa0", "#3fa96f"],
  grid: "#e3ded1",
  axis: "#868ea0",
  surface: "#ffffff",
} as const;

export interface TrendPoint {
  label: string;
  value: number;
}

/* Fixed chart geometry — constant, so it stays out of the render closure. */
const W = 800;
const H = 260;
const pad = { top: 18, right: 16, bottom: 30, left: 52 };

/**
 * Single-series revenue trend. One series, so the title carries identity and
 * no legend box is needed; a crosshair + tooltip does the per-point reading
 * instead of labelling every point.
 */
export const TrendChart = ({
  data,
  height = 260,
  valueFormat = money,
}: {
  data: TrendPoint[];
  height?: number;
  valueFormat?: (n: number) => string;
}) => {
  const [hover, setHover] = useState<number | null>(null);
  const wrap = useRef<HTMLDivElement>(null);

  const { points, max, ticks } = useMemo(() => {
    const values = data.map((d) => d.value);
    const rawMax = Math.max(...values, 1);
    const step = Math.pow(10, Math.floor(Math.log10(rawMax)));
    const niceMax = Math.ceil(rawMax / (step / 2)) * (step / 2);
    const innerW = W - pad.left - pad.right;
    const innerH = H - pad.top - pad.bottom;

    return {
      max: niceMax,
      ticks: [0, 0.25, 0.5, 0.75, 1].map((t) => ({
        y: pad.top + innerH * (1 - t),
        value: niceMax * t,
      })),
      points: data.map((d, i) => ({
        ...d,
        x:
          pad.left +
          (data.length === 1 ? innerW / 2 : (innerW * i) / (data.length - 1)),
        y: pad.top + innerH * (1 - d.value / niceMax),
      })),
    };
  }, [data]);

  if (!data.length) return null;

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");
  const areaPath = `${linePath} L${points[points.length - 1].x.toFixed(1)},${H - pad.bottom} L${points[0].x.toFixed(1)},${H - pad.bottom} Z`;

  const onMove = (e: React.MouseEvent) => {
    const rect = wrap.current?.getBoundingClientRect();
    if (!rect) return;
    const ratio = (e.clientX - rect.left) / rect.width;
    const x = ratio * W;
    let nearest = 0;
    let best = Infinity;
    points.forEach((p, i) => {
      const d = Math.abs(p.x - x);
      if (d < best) {
        best = d;
        nearest = i;
      }
    });
    setHover(nearest);
  };

  const active = hover !== null ? points[hover] : null;

  return (
    <div
      ref={wrap}
      className="relative"
      style={{ minHeight: height }}
      onMouseMove={onMove}
      onMouseLeave={() => setHover(null)}
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        role="img"
        aria-label={`Revenue trend across ${data.length} days, peaking at ${valueFormat(max)}`}
      >
        <defs>
          <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART.accent} stopOpacity="0.28" />
            <stop offset="100%" stopColor={CHART.accent} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* recessive grid */}
        {ticks.map((tick) => (
          <g key={tick.y}>
            <line
              x1={pad.left}
              x2={W - pad.right}
              y1={tick.y}
              y2={tick.y}
              stroke={CHART.grid}
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
            <text
              x={pad.left - 10}
              y={tick.y + 4}
              textAnchor="end"
              fill={CHART.axis}
              fontSize="11"
              fontFamily="Inter, sans-serif"
            >
              {compactMoney(tick.value)}
            </text>
          </g>
        ))}

        <path d={areaPath} fill="url(#trend-fill)" />
        <path
          d={linePath}
          fill="none"
          stroke={CHART.accent}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />

        {/* sparse x labels — first, middle, last */}
        {[0, Math.floor(points.length / 2), points.length - 1].map((i) => (
          <text
            key={i}
            x={points[i].x}
            y={H - 10}
            textAnchor={
              i === 0 ? "start" : i === points.length - 1 ? "end" : "middle"
            }
            fill={CHART.axis}
            fontSize="11"
            fontFamily="Inter, sans-serif"
          >
            {points[i].label}
          </text>
        ))}

        {active && (
          <g>
            <line
              x1={active.x}
              x2={active.x}
              y1={pad.top}
              y2={H - pad.bottom}
              stroke={CHART.axis}
              strokeWidth="1"
              strokeDasharray="3 3"
              vectorEffect="non-scaling-stroke"
            />
            {/* 2px surface ring keeps the marker readable over the line */}
            <circle
              cx={active.x}
              cy={active.y}
              r="6"
              fill={CHART.accent}
              stroke={CHART.surface}
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
          </g>
        )}
      </svg>

      {active && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-line bg-card px-3 py-2 shadow-xl"
          style={{
            left: `${(active.x / W) * 100}%`,
            top: `${(active.y / H) * 100}%`,
            marginTop: -12,
          }}
        >
          <p className="whitespace-nowrap text-[10px] uppercase tracking-[0.14em] text-soft">
            {active.label}
          </p>
          <p className="whitespace-nowrap text-sm font-bold text-head">
            {valueFormat(active.value)}
          </p>
        </div>
      )}
    </div>
  );
};

export interface BarDatum {
  label: string;
  value: number;
  meta?: string;
}

/**
 * Horizontal magnitude bars. Every row is directly labelled, which is also the
 * secondary encoding the categorical palette requires.
 */
export const BarList = ({
  data,
  colorMode = "single",
  valueFormat = (n: number) => String(n),
  emptyCopy = "No data yet.",
}: {
  data: BarDatum[];
  colorMode?: "single" | "categorical";
  valueFormat?: (n: number) => string;
  emptyCopy?: string;
}) => {
  const max = Math.max(...data.map((d) => d.value), 1);

  if (!data.length) {
    return <p className="py-8 text-center text-sm text-soft">{emptyCopy}</p>;
  }

  return (
    <ul className="space-y-4">
      {data.map((datum, i) => {
        const color =
          colorMode === "categorical"
            ? CHART.categorical[i % CHART.categorical.length]
            : CHART.royal;
        return (
          <li key={datum.label}>
            <div className="flex items-baseline justify-between gap-4">
              <span className="flex min-w-0 items-center gap-2.5 text-xs text-head">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: color }}
                />
                <span className="truncate">{datum.label}</span>
              </span>
              <span className="shrink-0 text-xs font-bold tabular-nums text-head">
                {valueFormat(datum.value)}
              </span>
            </div>
            <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-well">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.max(2, (datum.value / max) * 100)}%`,
                  background: color,
                }}
              />
            </div>
            {datum.meta && (
              <p className="mt-1.5 text-[11px] text-soft">{datum.meta}</p>
            )}
          </li>
        );
      })}
    </ul>
  );
};

export const StatTile = ({
  label,
  value,
  delta,
  hint,
  className,
}: {
  label: string;
  value: string;
  delta?: number;
  hint?: string;
  className?: string;
}) => (
  <div
    className={cn(
      "rounded-xl border border-line bg-card p-6 transition hover:border-line-2",
      className,
    )}
  >
    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-soft">
      {label}
    </p>
    <p className="display mt-3 text-4xl tabular-nums text-head">{value}</p>
    <div className="mt-2 flex items-center gap-2">
      {delta !== undefined && (
        <span
          className={cn(
            "inline-flex items-center gap-1 text-[11px] font-bold",
            delta >= 0 ? "text-[#3fa96f]" : "text-coral",
          )}
        >
          {delta >= 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(1)}%
        </span>
      )}
      {hint && <span className="text-[11px] text-soft">{hint}</span>}
    </div>
  </div>
);
