import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link } from "react-router";
import { cn } from "../../utils/Functions";

type Variant =
  | "primary"
  | "gold"
  | "dark"
  | "outline"
  | "outline-light"
  | "ghost";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  /* royal blue — the default call to action on light surfaces */
  primary:
    "bg-royal text-white hover:bg-royal-deep shadow-[0_10px_26px_-12px_rgba(31,95,208,0.8)]",
  gold: "bg-gold text-head hover:bg-gold-soft shadow-[0_10px_26px_-12px_rgba(242,192,46,0.9)]",
  dark: "bg-ink text-bone hover:bg-ink-3",
  outline:
    "border border-line-strong bg-transparent text-head hover:border-royal hover:text-royal",
  "outline-light":
    "border border-white/30 bg-white/5 text-bone backdrop-blur hover:border-gold hover:text-gold",
  ghost: "bg-transparent text-body hover:text-head",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-4 text-[11px] tracking-[0.14em]",
  md: "h-11 px-6 text-[11px] tracking-[0.16em]",
  lg: "h-14 px-8 text-xs tracking-[0.16em]",
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-bold uppercase transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none";

interface CommonProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
  block?: boolean;
}

type ButtonProps = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">;

export const Button = ({
  variant = "primary",
  size = "md",
  className,
  block,
  children,
  ...rest
}: ButtonProps) => (
  <button
    className={cn(
      base,
      VARIANTS[variant],
      SIZES[size],
      block && "w-full",
      className,
    )}
    {...rest}
  >
    {children}
  </button>
);

interface LinkButtonProps extends CommonProps {
  to: string;
  state?: unknown;
}

export const LinkButton = ({
  to,
  state,
  variant = "primary",
  size = "md",
  className,
  block,
  children,
}: LinkButtonProps) => (
  <Link
    to={to}
    state={state}
    className={cn(
      base,
      VARIANTS[variant],
      SIZES[size],
      block && "w-full",
      className,
    )}
  >
    {children}
  </Link>
);

export default Button;
