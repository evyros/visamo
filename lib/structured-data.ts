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

/** Inline markup (**bold**, [links](…)) as the plain text search engines should read. */
const plain = (text: string) => text.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

/**
 * JSON-LD for a guide: the article, its questions and answers, and where it
 * sits on the site. `url` and `indexUrl` are absolute.
 */
export function guideStructuredData({
  guide,
  url,
  indexUrl,
  indexName,
  inLanguage,
}: {
  guide: { title: string; description: string; updated: string; faq: { q: string; a: string }[] };
  url: string;
  indexUrl: string;
  indexName: string;
  inLanguage: string;
}) {
  const publisher = { "@type": "Organization", name, url: site.url, logo: `${site.url}/logo.svg` };
  return [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: guide.title,
      description: guide.description,
      dateModified: guide.updated,
      inLanguage,
      mainEntityOfPage: url,
      author: publisher,
      publisher,
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      inLanguage,
      mainEntity: guide.faq.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: plain(item.a) },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: indexName, item: indexUrl },
        { "@type": "ListItem", position: 2, name: guide.title, item: url },
      ],
    },
  ];
}
