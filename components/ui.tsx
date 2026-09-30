import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { Icon, type IconName } from "./icons";

export function Container({
  className = "",
  narrow = false,
  children,
}: {
  className?: string;
  /** Reading width (768px) instead of the 1200px page width. */
  narrow?: boolean;
  children: ReactNode;
}) {
  const width = narrow ? "max-w-[768px]" : "max-w-[1200px]";
  return <div className={`mx-auto w-full px-4 sm:px-6 lg:px-8 ${width} ${className}`}>{children}</div>;
}

const buttonStyles = {
  primary:
    "bg-teal-600 text-white hover:bg-teal-700 focus-visible:outline-teal-600 shadow-soft",
  secondary:
    "border-[1.5px] border-navy-900 text-navy-900 hover:bg-navy-900/5 focus-visible:outline-navy-900",
  inverse: "bg-white text-navy-900 hover:bg-sand-50 focus-visible:outline-white",
} as const;

type ButtonLinkProps = Omit<ComponentProps<typeof Link>, "className"> & {
  variant?: keyof typeof buttonStyles;
  size?: "md" | "sm";
  icon?: IconName;
  className?: string;
};

export function ButtonLink({
  variant = "primary",
  size = "md",
  icon,
  className = "",
  children,
  ...props
}: ButtonLinkProps) {
  const sizing = size === "md" ? "h-12 px-6 text-base" : "h-10 px-4 text-sm";
  return (
    <Link
      className={`inline-flex items-center justify-center gap-2 rounded-[10px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${sizing} ${buttonStyles[variant]} ${className}`}
      {...props}
    >
      {icon && <Icon name={icon} className="size-5" />}
      {children}
    </Link>
  );
}

export function TextLink({ className = "", children, ...props }: ComponentProps<typeof Link>) {
  return (
    <Link
      className={`inline-flex items-center gap-1.5 font-semibold text-teal-700 underline-offset-4 hover:underline ${className}`}
      {...props}
    >
      {children}
      <Icon name="arrow" className="size-4" />
    </Link>
  );
}

export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p className={`text-sm font-semibold tracking-wide text-teal-700 ${className}`}>{children}</p>
  );
}

/** Section headers are centered on mobile and start-aligned from `lg` up. */
export const mobileCenter = "text-center lg:text-start";

export function SectionTitle({
  children,
  className = "",
  as: Tag = "h2",
  align = "responsive",
}: {
  children: ReactNode;
  className?: string;
  as?: "h1" | "h2";
  /** `responsive`: centered on mobile, start-aligned on desktop. */
  align?: "responsive" | "center";
}) {
  const size = Tag === "h1" ? "text-4xl sm:text-5xl lg:text-[56px]" : "text-3xl sm:text-[40px]";
  const alignment = align === "center" ? "mx-auto text-center" : `mx-auto lg:mx-0 ${mobileCenter}`;
  return (
    <Tag
      className={`font-display font-semibold leading-[1.12] text-balance text-navy-900 ${size} ${alignment} ${className}`}
    >
      {children}
    </Tag>
  );
}

export function Badge({ icon, children, tone = "light" }: { icon: IconName; children: ReactNode; tone?: "light" | "dark" }) {
  const styles =
    tone === "light"
      ? "bg-sage-200 text-navy-900"
      : "border border-white/25 text-white";
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium ${styles}`}>
      <Icon name={icon} className="size-4" />
      {children}
    </span>
  );
}

export function IconTile({ name, tone = "sage" }: { name: IconName; tone?: "sage" | "dark" }) {
  const styles = tone === "sage" ? "bg-sage-200 text-navy-900" : "bg-white/10 text-sage-200";
  return (
    <span className={`inline-flex size-12 items-center justify-center rounded-xl ${styles}`}>
      <Icon name={name} className="size-6" />
    </span>
  );
}

export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-semibold text-teal-700">
      {children}
    </span>
  );
}
