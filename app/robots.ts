import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { site } from "@/lib/site";

// Every host serves this file (proxy.ts skips paths with a dot), so it asks
// which one it's on. The admin panel is closed to crawlers entirely.
export default async function robots(): Promise<MetadataRoute.Robots> {
  if ((await headers()).get("host") === new URL(site.adminUrl).host) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: new URL("/sitemap.xml", site.url).toString(),
  };
}
