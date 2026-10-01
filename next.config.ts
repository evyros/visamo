import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PDFium (PDF thumbnails, lib/files/thumbnail.ts) loads its WebAssembly
  // file from its own folder: keep it out of the bundle, and ship the file.
  serverExternalPackages: ["@hyzyla/pdfium"],
  experimental: {
    // The contact form's attachments (lib/contact.ts): up to 4MB of files plus
    // the message, just under Vercel's 4.5MB request cap.
    serverActions: { bodySizeLimit: "4.5mb" },
  },
  outputFileTracingIncludes: {
    "/file/documents": ["./node_modules/@hyzyla/pdfium/dist/pdfium.wasm"],
    // The chat assistant and the document checker read the knowledge base at
    // run time (lib/knowledge-base.ts).
    "/api/chat": ["./lib/knowledge/**/*.md"],
    "/api/documents/check": ["./lib/knowledge/**/*.md"],
  },
};

export default nextConfig;
