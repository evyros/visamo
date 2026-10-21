import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PDFium (PDF thumbnails, lib/files/thumbnail.ts) loads its WebAssembly
  // file from its own folder: keep it out of the bundle, and ship the file.
  serverExternalPackages: ["@hyzyla/pdfium"],
  // PostHog (components/posthog.tsx) sends to /ingest on our own hosts, and
  // these forward it to PostHog's US region. Its endpoints end in a slash, so
  // Next's trailing-slash redirect is off; proxy.ts does it for pages instead.
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return [
      { source: "/ingest/static/:path*", destination: "https://us-assets.i.posthog.com/static/:path*" },
      { source: "/ingest/array/:path*", destination: "https://us-assets.i.posthog.com/array/:path*" },
      { source: "/ingest/:path*", destination: "https://us.i.posthog.com/:path*" },
    ];
  },
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
    // The recommendation letter's fonts (lib/letters/pdf.ts), read at run time.
    "/api/letters/**": ["./assets/fonts/Rubik-*.ttf"],
  },
};

export default nextConfig;
