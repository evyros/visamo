import Image from "next/image";
import { existsSync } from "node:fs";
import path from "node:path";

// Founder photos in /public/images: a small one for the round avatar and a
// larger one for the About page. A neutral placeholder shows if a file is missing.
const PHOTOS = { sm: "/images/evyatar.jpg", lg: "/images/evyatar-lg.jpg" } as const;
const exists = (src: string) => existsSync(path.join(process.cwd(), "public", src));
const hasPhoto = { sm: exists(PHOTOS.sm), lg: exists(PHOTOS.lg) };

export function FounderPhoto({ size, alt }: { size: "sm" | "lg"; alt: string }) {
  const box = size === "sm" ? "size-32 rounded-full ring-4 ring-white shadow-soft" : "aspect-[4/5] w-full rounded-xl";

  if (hasPhoto[size]) {
    return (
      <div className={`relative shrink-0 overflow-hidden ${box}`}>
        <Image
          src={PHOTOS[size]}
          alt={alt}
          fill
          sizes={size === "sm" ? "128px" : "(min-width: 1024px) 440px, 60vw"}
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div
      role="img"
      aria-label={alt}
      className={`flex shrink-0 items-center justify-center bg-sage-200 text-navy-900/40 ${box}`}
    >
      <svg
        viewBox="0 0 24 24"
        className={size === "sm" ? "size-10" : "size-24"}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        aria-hidden="true"
      >
        <circle cx="9" cy="8" r="3.5" />
        <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
        <circle cx="16.5" cy="9" r="3" />
        <path d="M14 14.6a6 6 0 0 1 8 5.4" />
      </svg>
    </div>
  );
}
