import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
};

export function Button({ variant = "primary", className = "", ...props }: Props) {
  const base = "inline-flex items-center justify-center rounded-lg px-4 py-2";
  const styles =
    variant === "primary"
      ? "bg-[var(--color-primary)] text-white"
      : "bg-[var(--color-secondary)] text-black";

  return <button className={`${base} ${styles} ${className}`} {...props} />;
}
