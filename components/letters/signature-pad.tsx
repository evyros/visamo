"use client";

import { useCallback, useEffect, useImperativeHandle, useRef, type Ref } from "react";

// A box to sign in with a finger, a pen or a mouse. The signature is exported
// as a PNG cropped to what was drawn, on a transparent background, so it sits
// on the letter like ink (lib/letters/pdf.ts).

export type SignaturePadHandle = {
  /** The drawn signature as a PNG, or null if nothing was drawn. */
  toBlob: () => Promise<Blob | null>;
  clear: () => void;
};

const INK = "#0f2a44";
const PADDING = 8;

export function SignaturePad({
  label,
  onChange,
  invalid,
  ref,
}: {
  label: string;
  /** Whether anything is drawn. Keep it stable (a state setter): it's called on every resize. */
  onChange: (signed: boolean) => void;
  invalid?: boolean;
  ref: Ref<SignaturePadHandle>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  // The drawn area, in canvas pixels, for cropping.
  const bounds = useRef<{ minX: number; minY: number; maxX: number; maxY: number } | null>(null);

  const context = () => canvasRef.current?.getContext("2d") ?? null;

  // Sized to the box on screen at the screen's pixel density, so lines are sharp.
  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = window.devicePixelRatio || 1;
    const { width, height } = canvas.getBoundingClientRect();
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    const ctx = context();
    if (!ctx) return;
    ctx.lineWidth = 1.6 * ratio;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = INK;
    bounds.current = null;
    onChange(false);
  }, [onChange]);

  useEffect(() => {
    resize();
    // A resize clears the canvas, so it only follows width changes (rotating a phone), not every scroll.
    let width = window.innerWidth;
    const onResize = () => {
      if (window.innerWidth === width) return;
      width = window.innerWidth;
      resize();
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [resize]);

  function point(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((event.clientY - rect.top) / rect.height) * canvas.height;
    const b = bounds.current;
    bounds.current = b
      ? { minX: Math.min(b.minX, x), minY: Math.min(b.minY, y), maxX: Math.max(b.maxX, x), maxY: Math.max(b.maxY, y) }
      : { minX: x, minY: y, maxX: x, maxY: y };
    return { x, y };
  }

  function start(event: React.PointerEvent<HTMLCanvasElement>) {
    event.preventDefault();
    canvasRef.current?.setPointerCapture(event.pointerId);
    drawing.current = true;
    last.current = point(event);
    // A tap leaves a dot.
    const ctx = context();
    if (ctx && last.current) {
      ctx.beginPath();
      ctx.arc(last.current.x, last.current.y, ctx.lineWidth / 2, 0, Math.PI * 2);
      ctx.fillStyle = INK;
      ctx.fill();
    }
  }

  function move(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current || !last.current) return;
    const ctx = context();
    if (!ctx) return;
    const next = point(event);
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(next.x, next.y);
    ctx.stroke();
    last.current = next;
  }

  function end() {
    if (!drawing.current) return;
    drawing.current = false;
    last.current = null;
    onChange(true);
  }

  useImperativeHandle(ref, () => ({
    clear() {
      const canvas = canvasRef.current;
      context()?.clearRect(0, 0, canvas?.width ?? 0, canvas?.height ?? 0);
      bounds.current = null;
      onChange(false);
    },
    async toBlob() {
      const canvas = canvasRef.current;
      const b = bounds.current;
      if (!canvas || !b) return null;
      const pad = PADDING * (window.devicePixelRatio || 1) + (context()?.lineWidth ?? 0);
      const x = Math.max(0, Math.floor(b.minX - pad));
      const y = Math.max(0, Math.floor(b.minY - pad));
      const width = Math.min(canvas.width, Math.ceil(b.maxX + pad)) - x;
      const height = Math.min(canvas.height, Math.ceil(b.maxY + pad)) - y;
      const cropped = document.createElement("canvas");
      cropped.width = width;
      cropped.height = height;
      cropped.getContext("2d")?.drawImage(canvas, x, y, width, height, 0, 0, width, height);
      return new Promise((resolve) => cropped.toBlob(resolve, "image/png"));
    },
  }));

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={label}
      onPointerDown={start}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
      className={`h-44 w-full cursor-crosshair touch-none rounded-[10px] border-2 border-dashed bg-white ${
        invalid ? "border-terracotta-600" : "border-slate-300"
      }`}
    />
  );
}
