import { site } from "./site";

const name = "Visamo";

/**
 * JSON-LD for the homepage. WebSite gives Google the site name for search
 * results; Organization ties both spellings of the brand, and its social
 * profiles, to one entity.
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
      sameAs: Object.values(site.social),
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

/**
 * JSON-LD for one version of the process guide (content/process): its steps,
 * the steps' questions and answers, and where it sits on the site. The URLs
 * are absolute.
 */
export function processStructuredData({
  guide,
  updated,
  published,
  url,
  image,
  crumbs,
  inLanguage,
}: {
  guide: {
    title: string;
    description: string;
    steps: { id: string; title: string; body: unknown[]; faq: { q: string; a: string }[] }[];
  };
  updated: string;
  published: string;
  url: string;
  /** The page's share image, absolute. */
  image: string;
  /** The pages above this one, from the top: the guides, then the landing page. */
  crumbs: { name: string; url: string }[];
  inLanguage: string;
}) {
  const publisher = { "@type": "Organization", name, url: site.url, logo: `${site.url}/logo.svg` };
  // A step's text is its first paragraph; a step that opens with a list has its title.
  const stepText = (step: (typeof guide.steps)[number]) => {
    const first = step.body.find((block): block is string => typeof block === "string");
    return plain(first ?? step.title);
  };
  return [
    {
      "@context": "https://schema.org",
      "@type": "HowTo",
      name: guide.title,
      description: guide.description,
      image,
      datePublished: published,
      dateModified: updated,
      inLanguage,
      mainEntityOfPage: url,
      author: publisher,
      publisher,
      step: guide.steps.map((step, i) => ({
        "@type": "HowToStep",
        position: i + 1,
        name: step.title,
        text: stepText(step),
        url: `${url}#step-${step.id}`,
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      inLanguage,
      mainEntity: guide.steps
        .flatMap((step) => step.faq)
        .map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: plain(item.a) },
        })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [...crumbs, { name: guide.title, url }].map((crumb, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: crumb.name,
        item: crumb.url,
      })),
    },
  ];
}

/**
 * JSON-LD for the process guide's landing page: a page (not an article), its
 * questions and answers, and where it sits on the site. The URLs are absolute.
 */
export function processLandingStructuredData({
  title,
  description,
  url,
  image,
  published,
  updated,
  faq,
  indexUrl,
  indexName,
  crumb,
  inLanguage,
}: {
  /** Its name in the breadcrumbs, shorter than the title. */
  crumb: string;
  title: string;
  description: string;
  url: string;
  image: string;
  published: string;
  updated: string;
  faq: { q: string; a: string }[];
  indexUrl: string;
  indexName: string;
  inLanguage: string;
}) {
  const publisher = { "@type": "Organization", name, url: site.url, logo: `${site.url}/logo.svg` };
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: title,
      description,
      url,
      image,
      datePublished: published,
      dateModified: updated,
      inLanguage,
      publisher,
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      inLanguage,
      mainEntity: faq.map((item) => ({
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
        { "@type": "ListItem", position: 2, name: crumb, item: url },
      ],
    },
  ];
}

/**
 * JSON-LD for the branches page (/branches): its numbers as a Dataset, for
 * Google's Dataset Search and for AI tools reading the page: what's measured,
 * over which months and where, how it was counted, and each stage's wait; and
 * its questions and answers. The URL is absolute.
 */
export function branchesStructuredData({
  title,
  description,
  url,
  temporalCoverage,
  measurementTechnique,
  variables,
  faq,
  inLanguage,
}: {
  title: string;
  description: string;
  url: string;
  /** The months the reports span, as an ISO 8601 interval: "2025-09/2026-10". */
  temporalCoverage: string;
  measurementTechnique: string;
  /** What the page shows: a stage's wait carries its typical days. */
  variables: { name: string; description: string; days?: number }[];
  faq: { q: string; a: string }[];
  inLanguage: string;
}) {
  const dataset = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    "@id": url,
    name: title,
    description,
    url,
    inLanguage,
    isAccessibleForFree: true,
    creator: { "@type": "Organization", name, url: site.url },
    temporalCoverage,
    spatialCoverage: { "@type": "Place", name: "Israel" },
    measurementTechnique,
    variableMeasured: variables.map((v) => ({
      "@type": "PropertyValue",
      name: v.name,
      description: v.description,
      ...(v.days !== undefined && { value: v.days, unitText: "days" }),
    })),
  };
  return [
    dataset,
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      inLanguage,
      mainEntity: faq.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    },
  ];
}

/**
 * JSON-LD for the glossary (content/glossary): its terms, each with its
 * anchor on the page, and where it sits on the site. The URLs are absolute.
 */
export function glossaryStructuredData({
  title,
  description,
  url,
  updated,
  terms,
  indexUrl,
  indexName,
  inLanguage,
}: {
  title: string;
  description: string;
  url: string;
  updated: string;
  terms: { id: string; name: string; alternateName: string[]; description?: string }[];
  indexUrl: string;
  indexName: string;
  inLanguage: string;
}) {
  return [
    {
      "@context": "https://schema.org",
      "@type": "DefinedTermSet",
      "@id": url,
      name: title,
      description,
      url,
      dateModified: updated,
      inLanguage,
      hasDefinedTerm: terms.map((term) => ({
        "@type": "DefinedTerm",
        "@id": `${url}#${term.id}`,
        url: `${url}#${term.id}`,
        name: term.name,
        alternateName: term.alternateName,
        ...(term.description && { description: term.description }),
        inDefinedTermSet: url,
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: indexName, item: indexUrl },
        { "@type": "ListItem", position: 2, name: title, item: url },
      ],
    },
  ];
}
