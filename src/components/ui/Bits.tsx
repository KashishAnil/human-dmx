import type { ReactNode } from "react";
import { cn } from "../../utils/Functions";

type Tone = "light" | "dark";

export const Eyebrow = ({
  children,
  className,
  tone = "light",
}: {
  children: ReactNode;
  className?: string;
  tone?: Tone;
}) => (
  <p
    className={cn(
      "eyebrow-type flex items-center gap-3",
      tone === "light" ? "text-royal" : "text-gold",
      className,
    )}
  >
    <span
      className={cn(
        "h-px w-8",
        tone === "light" ? "bg-royal/40" : "bg-gold/50",
      )}
    />
    {children}
  </p>
);

export const SectionHeading = ({
  eyebrow,
  title,
  copy,
  align = "left",
  action,
  tone = "light",
}: {
  eyebrow?: string;
  title: ReactNode;
  copy?: string;
  align?: "left" | "center";
  action?: ReactNode;
  tone?: Tone;
}) => (
  <div
    className={cn(
      "flex flex-col gap-5 md:flex-row md:items-end md:justify-between",
      align === "center" && "md:flex-col md:items-center md:text-center",
    )}
  >
    <div
      className={cn("max-w-2xl", align === "center" && "mx-auto text-center")}
    >
      {eyebrow && (
        <Eyebrow
          tone={tone}
          className={align === "center" ? "justify-center" : undefined}
        >
          {eyebrow}
        </Eyebrow>
      )}
      <h2
        className={cn(
          "display mt-4 text-4xl sm:text-5xl lg:text-[3.4rem]",
          tone === "light" ? "text-head" : "text-bone",
        )}
      >
        {title}
      </h2>
      {copy && (
        <p
          className={cn(
            "mt-4 text-sm leading-relaxed",
            tone === "light" ? "text-body" : "text-muted",
          )}
        >
          {copy}
        </p>
      )}
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);

export const Badge = ({
  children,
  tone = "gold",
  className,
}: {
  children: ReactNode;
  tone?: "gold" | "royal" | "muted" | "coral" | "dark";
  className?: string;
}) => {
  const tones = {
    gold: "bg-gold text-head",
    royal: "bg-royal text-white",
    muted: "bg-head/70 text-white backdrop-blur",
    coral: "bg-coral text-white",
    dark: "bg-ink text-bone",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em]",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
};

export const Stars = ({
  rating,
  count,
  className,
  tone = "light",
}: {
  rating: number;
  count?: number;
  className?: string;
  tone?: Tone;
}) => {
  const empty = tone === "light" ? "#d8d2c2" : "#39435c";
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className="flex" aria-hidden>
        {[1, 2, 3, 4, 5].map((i) => {
          const id = `st-${i}-${Math.round(rating * 10)}-${tone}`;
          const fill = Math.max(0, Math.min(1, rating - i + 1)) * 100;
          return (
            <svg key={i} viewBox="0 0 20 20" className="h-3.5 w-3.5">
              <defs>
                <linearGradient id={id}>
                  <stop offset={`${fill}%`} stopColor="#f2c02e" />
                  <stop offset={`${fill}%`} stopColor={empty} />
                </linearGradient>
              </defs>
              <path
                fill={`url(#${id})`}
                d="M10 1.6l2.47 5.19 5.53.77-4.02 3.98.97 5.66L10 14.5l-4.95 2.7.97-5.66L2 7.56l5.53-.77z"
              />
            </svg>
          );
        })}
      </span>
      <span
        className={cn(
          "text-[11px]",
          tone === "light" ? "text-soft" : "text-muted",
        )}
      >
        {rating.toFixed(1)}
        {count !== undefined && ` (${count})`}
      </span>
    </span>
  );
};

export const EmptyState = ({
  title,
  copy,
  action,
  icon = "○",
}: {
  title: string;
  copy: string;
  action?: ReactNode;
  icon?: string;
}) => (
  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line-strong bg-card px-6 py-20 text-center">
    <span className="display text-5xl text-line-strong">{icon}</span>
    <h3 className="display mt-5 text-2xl text-head">{title}</h3>
    <p className="mt-2 max-w-sm text-sm text-body">{copy}</p>
    {action && <div className="mt-7">{action}</div>}
  </div>
);

export const Marquee = ({
  items,
  speed = "normal",
  tone = "dark",
}: {
  items: string[];
  speed?: "normal" | "slow";
  tone?: Tone | "blue";
}) => {
  const shell =
    tone === "blue"
      ? "bg-royal text-white"
      : tone === "dark"
        ? "bg-ink text-bone"
        : "bg-gold text-head";
  return (
    <div className={cn("relative flex overflow-hidden py-3.5", shell)}>
      <div
        className="flex shrink-0 items-center gap-10 whitespace-nowrap pr-10"
        style={{
          animation:
            speed === "slow"
              ? "marquee 70s linear infinite"
              : "marquee 40s linear infinite",
        }}
      >
        {[...items, ...items].map((item, i) => (
          <span
            key={`${item}-${i}`}
            className="display flex items-center gap-10 text-sm"
          >
            {item}
            <span className={tone === "light" ? "text-royal" : "text-gold"}>
              ★
            </span>
          </span>
        ))}
      </div>
    </div>
  );
};

/** Thin rule with a diamond, used to break up long light sections. */
export const Rule = ({ className }: { className?: string }) => (
  <div className={cn("flex items-center gap-4", className)}>
    <span className="h-px flex-1 bg-line" />
    <span className="text-gold">◆</span>
    <span className="h-px flex-1 bg-line" />
  </div>
);
