// Saves every page of aic.org.il as the logged-in browser sees it.
//
//   node aic/capture.mjs [--only <url>,<url>] [--max 1500]
//
// Logs in with the test account, starts from the sitemap and the home page, and
// follows every link that stays on the site, except the events calendar and the lawyers index. Each page's HTML goes to
// data/aic/raw/<run>/<seq>-<slug>.html, listed in that run's index.jsonl.
// Documents linked from the pages (PDF, Word…) are downloaded to data/aic/files/.
// parse.mjs turns the latest capture of each page into Markdown.
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import {
  DOCUMENT,
  FILES_DIR,
  PASSWORD,
  PROFILE_DIR,
  RAW_DIR,
  SITE,
  USERNAME,
  between,
  parseArgs,
  sleep,
  slugOf,
} from "./lib.mjs";

const args = parseArgs(process.argv.slice(2));
const max = Number(args.max ?? 1500);
const runId = new Date().toISOString().replace(/[:.]/g, "-");
const runDir = path.join(RAW_DIR, runId);
fs.mkdirSync(runDir, { recursive: true });
const indexFile = path.join(runDir, "index.jsonl");

// Links that aren't wanted: admin, login/logout, feeds, tag and author pages, the events calendar
// (events, their venues and organizers) and the lawyers index with its filter pages.
const SKIP = [
  /^\/(wp-admin|wp-login\.php|wp-json|xmlrpc\.php|cdn-cgi|feed)\b/,
  /\/feed\/?$/,
  /^\/(tag|author)\//,
  /^\/(events|locations|organizers?)\//,
  /^\/(lawyers|lawyer-location|lawyers-languages|lawyers-office-size|lawyers-pv-exp-special-cases|areas-expertise)\//,
  /\/wp-content\//,
];

// Same-site page URL without query or hash, or null when it isn't one to crawl.
function pageUrl(href) {
  let u;
  try {
    u = new URL(href, SITE);
  } catch {
    return null;
  }
  if (u.origin !== SITE || u.search) return null;
  if (SKIP.some((re) => re.test(u.pathname))) return null;
  if (/\.[a-z0-9]{2,4}$/i.test(u.pathname)) return null; // files, images, xml
  return u.origin + u.pathname.replace(/\/?$/, "/");
}

function documentUrl(href) {
  try {
    const u = new URL(href, SITE);
    return u.origin === SITE && DOCUMENT.test(u.pathname) ? u.origin + u.pathname : null;
  } catch {
    return null;
  }
}

const context = await chromium.launchPersistentContext(PROFILE_DIR, {
  channel: "chrome",
  headless: false,
  viewport: null,
});
const page = context.pages()[0] ?? (await context.newPage());

// Cloudflare sometimes shows "Just a moment..." first; it clears by itself in a real browser.
async function open(url) {
  const res = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90_000 });
  for (let i = 0; i < 30 && /just a moment|attention required/i.test(await page.title()); i++) await sleep(2000);
  await page.waitForLoadState("load", { timeout: 30_000 }).catch(() => {});
  return res;
}

const loggedIn = async () => (await context.cookies(SITE)).some((c) => c.name.startsWith("wordpress_logged_in_"));

if (!(await loggedIn())) {
  await open(`${SITE}/user-registration/`);
  await page.waitForSelector("#swpm_user_name", { timeout: 90_000 });
  await page.fill("#swpm_user_name", USERNAME);
  await page.fill("#swpm_password", PASSWORD);
  await page.check("#swpm-rememberme").catch(() => {});
  await Promise.all([page.waitForNavigation({ timeout: 60_000 }).catch(() => {}), page.click("[name=swpm-login]")]);
  await sleep(2000);
  if (!(await loggedIn())) {
    console.error("login failed: check the credentials in aic/lib.mjs");
    await context.close();
    process.exit(1);
  }
  console.log("logged in");
}

// Fetched from inside the page, so Cloudflare sees the browser's own request.
const fetchText = (url) => page.evaluate(async (u) => (await fetch(u, { credentials: "include" })).text(), url);

const queue = [];
const seen = new Set();
const enqueue = (url) => {
  if (url && !seen.has(url)) {
    seen.add(url);
    queue.push(url);
  }
};

if (args.only) {
  for (const u of String(args.only).split(",")) enqueue(pageUrl(u.trim()));
} else {
  await open(`${SITE}/`);
  const index = await fetchText(`${SITE}/sitemap_index.xml`);
  const locs = (xml) => [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1].replaceAll("&amp;", "&"));
  enqueue(`${SITE}/`);
  for (const loc of locs(index)) {
    if (loc.endsWith(".xml")) for (const u of locs(await fetchText(loc))) enqueue(pageUrl(u));
    else enqueue(pageUrl(loc));
  }
  console.log(`sitemap: ${queue.length} pages`);
}

const documents = new Set();
let seq = 0;
let failed = 0;

while (queue.length && seq < max) {
  const url = queue.shift();
  let res;
  try {
    res = await open(url);
  } catch (err) {
    failed++;
    console.log(`  failed ${url}: ${err.message.split("\n")[0]}`);
    continue;
  }
  seq++;
  const html = await page.content();
  const file = `${String(seq).padStart(4, "0")}-${slugOf(page.url()).slice(0, 120)}.html`;
  fs.writeFileSync(path.join(runDir, file), html);
  const entry = { url, final_url: page.url(), status: res?.status() ?? null, title: await page.title(), fetched_at: new Date().toISOString(), file };
  fs.appendFileSync(indexFile, JSON.stringify(entry) + "\n");

  const hrefs = await page.$$eval("a[href]", (as) => as.map((a) => a.getAttribute("href")));
  for (const href of hrefs) {
    enqueue(pageUrl(href));
    const doc = documentUrl(href);
    if (doc) documents.add(doc);
  }
  console.log(`${seq} [${entry.status}] ${url}  (${queue.length} left)`);
  await sleep(between(1200, 2500));
}

// Documents are named after their upload path: wp-content/uploads/2022/09/x.pdf → 2022__09__x.pdf.
let downloaded = 0;
for (const url of documents) {
  const name = decodeURIComponent(new URL(url).pathname).replace(/^\/wp-content\/uploads\//, "").replace(/^\//, "").replaceAll("/", "__");
  const target = path.join(FILES_DIR, name);
  if (fs.existsSync(target)) continue;
  try {
    const bytes = await page.evaluate(async (u) => {
      const r = await fetch(u, { credentials: "include" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return [...new Uint8Array(await r.arrayBuffer())];
    }, url);
    fs.writeFileSync(target, Buffer.from(bytes));
    downloaded++;
  } catch (err) {
    console.log(`  file failed ${url}: ${err.message.split("\n")[0]}`);
  }
  await sleep(between(500, 1200));
}

console.log(`\n${seq} pages saved to ${path.relative(process.cwd(), runDir)}, ${failed} failed, ${queue.length} not visited (--max)`);
console.log(`${documents.size} documents linked, ${downloaded} new downloaded to ${path.relative(process.cwd(), FILES_DIR)}`);
await context.close();
