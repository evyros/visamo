// Downloads every image in images.jsonl that isn't on disk yet, into its post's images/ folder.
// Facebook's image URLs are signed and expire within days, so run this right after parse.mjs.
//
//   node facebook/images.mjs
import fs from "node:fs";
import path from "node:path";
import { DATA_DIR, postDir, readJsonl, sleep } from "./lib.mjs";

const images = readJsonl(path.join(DATA_DIR, "images.jsonl"));
const fileFor = (img) =>
  path.join(postDir(img.post_id), "images", `${img.id}${path.extname(new URL(img.url).pathname) || ".jpg"}`);
const todo = images.filter((img) => !fs.existsSync(fileFor(img)));
console.log(`${images.length} images, ${todo.length} to download`);

let saved = 0;
let expired = 0;
let failed = 0;

async function download(img) {
  try {
    const res = await fetch(img.url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (res.status === 403 || res.status === 410) {
      expired++;
      return;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    fs.mkdirSync(path.dirname(fileFor(img)), { recursive: true });
    fs.writeFileSync(fileFor(img), Buffer.from(await res.arrayBuffer()));
    saved++;
  } catch (err) {
    failed++;
    console.error(`\n${img.id}: ${err.message}`);
  }
}

const queue = [...todo];
await Promise.all(
  Array.from({ length: 4 }, async () => {
    for (let img; (img = queue.shift()); ) {
      await download(img);
      process.stdout.write(`\r${saved} saved · ${expired} expired · ${failed} failed`);
      await sleep(250);
    }
  }),
);
process.stdout.write("\n");
if (expired) console.log("Expired URLs: capture those posts again (capture.mjs), re-run parse.mjs, then this.");
