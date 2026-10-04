import { site } from "./site";

const name = "Visamo";

/**
 * JSON-LD for the homepage. WebSite gives Google the site name for search
 * results; Organization ties both spellings of the brand to one entity.
 */
export function homeStructuredData() {
  const alternateName = [site.nameHe];
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name,
      alternateName,
      url: site.url,
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name,
      alternateName,
      url: site.url,
      logo: `${site.url}/logo.svg`,
      email: site.supportEmail,
    },
  ];
}

/** Serialized for a <script type="application/ld+json">, with `<` escaped so no string can close the tag. */
export function jsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
