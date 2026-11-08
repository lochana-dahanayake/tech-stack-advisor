import { cn } from "@/lib/utils";

/**
 * The brand mark: three layers of a stack seen from above (a solid top layer on two lighter ones).
 * Same drawing as `src/app/icon.svg` (the favicon); keep them in sync.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn("size-7 shrink-0", className)}>
      <rect width="32" height="32" rx="8" className="fill-primary" />
      <path d="M16 5.5 26 10.5 16 15.5 6 10.5Z" className="fill-primary-foreground" />
      <g
        fill="none"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-primary-foreground"
      >
        <path d="M6 15.5 16 20.5 26 15.5" opacity="0.8" />
        <path d="M6 20.5 16 25.5 26 20.5" opacity="0.6" />
      </g>
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-semibold tracking-tight", className)}>
      <LogoMark />
      Tech Stack Advisor
    </span>
  );
}
