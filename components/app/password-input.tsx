"use client";

import { useState, type ComponentProps } from "react";
import { Icon } from "@/components/icons";
import { inputClass } from "./auth-ui";

export function PasswordInput({
  labels,
  className = "",
  ...props
}: Omit<ComponentProps<"input">, "type"> & { labels: { show: string; hide: string } }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input type={visible ? "text" : "password"} dir="ltr" className={`${inputClass} pe-12 text-start ${className}`} {...props} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? labels.hide : labels.show}
        aria-pressed={visible}
        className="absolute end-1.5 top-[calc(50%+3px)] inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-600 hover:text-navy-900"
      >
        <Icon name={visible ? "eyeOff" : "eye"} className="size-5" />
      </button>
    </div>
  );
}
