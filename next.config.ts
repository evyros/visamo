import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PDFium (PDF thumbnails, lib/files/thumbnail.ts) loads its WebAssembly
  // file from its own folder: keep it out of the bundle, and ship the file.
  serverExternalPackages: ["@hyzyla/pdfium"],
  outputFileTracingIncludes: {
    "/file/documents": ["./node_modules/@hyzyla/pdfium/dist/pdfium.wasm"],
  },
};

export default nextConfig;
