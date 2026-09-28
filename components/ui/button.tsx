import { cn } from "@/lib/utils";
import { type ButtonHTMLAttributes } from "react";

export const buttonVariants = {
  primary:
    "bg-coral text-[var(--fixed-ink)] font-bold hover:brightness-95 disabled:opacity-50 disabled:pointer-events-none",
  secondary:
    "bg-transparent text-ink border border-ink/15 hover:border-ink/40 hover:bg-ink/5",
  ghost: "bg-transparent text-ink hover:bg-ink/5",
  dark: "bg-[var(--fixed-paper)] text-[var(--fixed-ink)] hover:bg-[var(--fixed-white)]",
} as const;

export const buttonSizes = {
  md: "h-12 px-6 text-[15px]",
  lg: "h-14 px-8 text-base",
  sm: "h-10 px-4 text-sm",
} as const;

export type ButtonVariant = keyof typeof buttonVariants;
export type ButtonSize = keyof typeof buttonSizes;

export function buttonClassName(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string,
) {
  return cn(
    "inline-flex items-center justify-center rounded-full font-medium tracking-tight transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
    buttonVariants[variant],
    buttonSizes[size],
    className,
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClassName(variant, size, className)}
      {...props}
    />
  );
}
