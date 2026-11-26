// Tells Bing (and the other IndexNow search engines) which public pages
// changed, so they recrawl them within hours. Run it after a deploy that
// changes a page, once the change is live, naming the pages that changed (see
// USAGE below). It doesn't guess from sitemap dates: most pages have none, and
// they can't tell two changes in one day apart.
//
// Pages and languages come from the live sitemap, so a path or language
// missing from it (a typo, or not deployed yet) is an error. The key is public
// by design: the search engines check it against public/<key>.txt on the site.

const KEY = "5a27795a90ca6c42f10e82890d661b91";
const SITE = process.env.INDEXNOW_SITE_URL ?? "https://www.visamo.co.il";

const USAGE = `Usage:
  npm run indexnow -- /pricing /about     these pages, in every language
  npm run indexnow -- /pricing --lang he  only the Hebrew version (--lang repeats)
  npm run indexnow -- /he/pricing         the same: a language in the path, or a full
                                          URL copied from the browser, sends just that one
  npm run indexnow -- --all               every page (first setup)
  npm run indexnow -- --all --lang ar     every page in one language (a language going live)
  add --dry-run to list the URLs without sending them`;

// --- Arguments ---------------------------------------------------------------
let all = false;
let dryRun = false;
const paths = [];
const langs = [];
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  const arg = argv[i];
  if (arg === "--all") all = true;
  else if (arg === "--dry-run") dryRun = true;
  else if (arg === "--lang") langs.push(valueAfter(i++, /^[a-z]{2,3}(-[A-Za-z0-9]+)?$/, "a language code like he"));
  else if (arg.startsWith("/") || /^https?:\/\//.test(arg)) paths.push(arg);
  else fail(`Unknown argument "${arg}". Paths start with "/", e.g. /pricing.`);
}
if (!all && !paths.length) fail(USAGE);
if (all && paths.length) fail("Use --all or page paths, not both.");

// --- The live sitemap --------------------------------------------------------
const response = await request(new URL("/sitemap.xml", SITE), undefined, "the sitemap");
if (!response.ok) fail(`Couldn't read the sitemap: ${response.status} ${response.statusText}`);
const xml = await response.text();
const entries = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, url]) => ({ url }));
if (!entries.length) fail("The sitemap has no URLs.");

// The live languages, as the sitemap's hreflang links list them.
const siteLangs = [...new Set([...xml.matchAll(/hreflang="([^"]+)"/g)].map(([, code]) => code))].filter(
  (code) => code !== "x-default",
);
const unknownLangs = langs.filter((code) => !siteLangs.includes(code));
if (unknownLangs.length) fail(`Not a language in the live sitemap: ${unknownLangs.join(", ")} (it has ${siteLangs.join(", ")})`);

// Splits /he/pricing into its language and its page path (/pricing; / for the
// home page). A path without a language prefix has lang undefined.
function split(pathname) {
  const [, first = "", rest = ""] = pathname.match(/^\/([^/]*)(.*)$/) ?? [];
  return siteLangs.includes(first) ? { lang: first, path: rest || "/" } : { path: pathname };
}
const sitemapHost = new URL(entries[0].url).host;
for (const entry of entries) {
  Object.assign(entry, split(new URL(entry.url).pathname));
  if (!entry.lang) fail(`Sitemap URL without a language prefix: ${entry.url}`);
}

// What the command line names: /pricing (every language), /he/pricing or a full
// URL (that language). Query strings, #anchors and a trailing slash are dropped.
function target(arg) {
  const url = new URL(arg, `https://${sitemapHost}`);
  if (url.host !== sitemapHost) fail(`${arg} isn't on ${sitemapHost}`);
  return { arg, ...split(url.pathname.replace(/(.)\/+$/, "$1")) };
}

// --- Which URLs --------------------------------------------------------------
let picked = entries;
if (paths.length) {
  const targets = paths.map(target);
  const matches = (t, e) => e.path === t.path && (!t.lang || e.lang === t.lang);
  const missing = targets.filter((t) => !entries.some((e) => matches(t, e)));
  if (missing.length) fail(`Not in the live sitemap: ${missing.map((t) => t.arg).join(", ")}`);
  picked = entries.filter((e) => targets.some((t) => matches(t, e)));
}
if (langs.length) picked = picked.filter((e) => langs.includes(e.lang));
const urls = picked.map((e) => e.url);
if (!urls.length) fail("Nothing to send: --lang ruled out every page named.");

console.log(`${urls.length} URL${urls.length === 1 ? "" : "s"}:\n${urls.map((u) => `  ${u}`).join("\n")}`);
if (dryRun) process.exit(0);

// --- Send ----------------------------------------------------------------------
// The host must match the URLs being sent (the sitemap's), and so must the key file's.
const host = sitemapHost;
const submit = await request(
  "https://api.indexnow.org/indexnow",
  {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host, key: KEY, keyLocation: `https://${host}/${KEY}.txt`, urlList: urls }),
  },
  "IndexNow",
);
// 200: received. 202: received, the key is still being checked.
if (submit.status === 200 || submit.status === 202) {
  console.log(`Sent (${submit.status}).`);
} else {
  fail(`IndexNow answered ${submit.status}: ${(await submit.text()) || submit.statusText}`);
}

// fetch, with a one-line message instead of a stack trace when the network fails.
async function request(url, init, what) {
  try {
    return await fetch(url, init);
  } catch (error) {
    fail(`Couldn't reach ${what} (${url}): ${error.cause?.message ?? error.message}`);
  }
}

function valueAfter(i, pattern, what) {
  const value = argv[i + 1];
  if (value === undefined || !pattern.test(value)) fail(`${argv[i]} needs ${what}, got "${value ?? ""}"`);
  return value;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
