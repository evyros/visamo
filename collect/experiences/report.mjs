// Writes collect/data/experiences/report.html from summary.json (run aggregate.mjs first):
// satisfaction and busyness per branch, for looking at the data, not for publishing. Clicking a branch shows the
// posts and comments its numbers come from.
//
//   node experiences/report.mjs
import fs from "node:fs";
import path from "node:path";

const OUT_DIR = path.resolve(import.meta.dirname, "..", "data", "experiences");
const POSTS_DIR = path.resolve(import.meta.dirname, "..", "..", "data", "facebook", "posts");
const summary = JSON.parse(fs.readFileSync(path.join(OUT_DIR, "summary.json"), "utf8"));
const records = fs.readFileSync(path.join(OUT_DIR, "records.jsonl"), "utf8").trim().split("\n").map((l) => JSON.parse(l));

// The posts and comments a record was taken from, as written, for clicking through from a branch.
function quotes(r) {
  const dir = path.join(POSTS_DIR, r.thread);
  const post = JSON.parse(fs.readFileSync(path.join(dir, "post.json"), "utf8"));
  return r.source_ids.map((id) => {
    const file = path.join(dir, "comments", `${id}.json`);
    const item = id === post.id ? post : fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : null;
    if (!item) return null;
    return {
      author: item.author_name,
      date: item.posted_at?.slice(0, 10) ?? null,
      text: (item.text ?? "").trim(),
      url: id === post.id ? post.url : `${post.url}?comment_id=${id}`,
    };
  }).filter(Boolean);
}

// The same selections aggregate.mjs scores: firsthand experiences that say how it went; and, leaving out what the
// war caused, overload reports and waits at the stages that show the branch's load.
const busySignals = new Set(summary.busy_signals);
const evidence = {};
for (const r of records) {
  if (!r.branch) continue;
  const e = (evidence[r.branch] ??= { sat: [], busy: [] });
  const signals = r.war_related ? [] : r.busy_signals.filter((s) => busySignals.has(s));
  const waits = r.war_related ? [] : r.waits.filter((w) => summary.wait_stages.includes(`${w.from}>${w.to}`));
  const item = () => ({
    experience: r.experience, firsthand: r.firsthand, signals, waits, service: r.service,
    when: r.when, summary: r.summary, quotes: quotes(r),
  });
  if (r.firsthand === "firsthand" && ["positive", "mixed", "negative"].includes(r.experience)) e.sat.push(item());
  if (signals.length || waits.length) e.busy.push(item());
}
const order = { positive: 0, mixed: 1, negative: 2 };
for (const e of Object.values(evidence)) {
  e.sat.sort((a, b) => order[a.experience] - order[b.experience] || (b.when ?? "").localeCompare(a.when ?? ""));
  e.busy.sort((a, b) => (b.when ?? "").localeCompare(a.when ?? ""));
}
const names = Object.fromEntries(summary.branches.map((b) => [b.id, b.name]));
const ranked = summary.branches.filter((b) => b.ranked);
const others = summary.branches.filter((b) => !b.ranked && b.couples);
const { national } = summary;

const pct = (x) => (x == null ? "–" : `${Math.round(x * 100)}%`);
const times = (x) => (x == null ? "–" : `${x.toFixed(1)}×`);
const stageName = { "applied>first-response": "applying to a first answer", "appointment-set>appointment": "being given an appointment to the appointment" };
const medians = summary.wait_stages.map((s) => `${stageName[s]}: ${Math.round(national.wait_medians[s].median_days)} days`).join("; ");
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const short = (name) => name.replace(" (Center)", "").replace("Tel Aviv (South) – ", "").replace(" – Givatayim", "");

function tip(b) {
  const e = b.satisfaction.experiences;
  return esc(
    `${b.name}\n${b.couples} couples, ${b.records} records\n` +
      `Satisfaction ${pct(b.satisfaction.score)} (raw ${pct(b.satisfaction.raw)} from ${b.satisfaction.rated} couples)\n` +
      `  ${e.positive ?? 0} positive · ${e.mixed ?? 0} mixed · ${e.negative ?? 0} negative · ${e.neutral ?? 0} neutral\n` +
      `Busy ${times(b.busy.index)} the national level\n` +
      `  overload reports ${times(b.busy.reports_ratio)} (${b.busy.couples} of ${b.couples} couples)\n` +
      `  waits ${b.busy.waits.n ? `${times(b.busy.waits.ratio)} (${b.busy.waits.n} waits)` : "none reported"}`,
  );
}

// Satisfaction (up is better) against busy (left is better). The national averages split it into quadrants.
function scatter() {
  const W = 720, H = 460, m = { t: 24, r: 24, b: 48, l: 56 };
  const xMax = Math.ceil(Math.max(...ranked.map((b) => b.busy.index)) * 2 + 0.5) / 2, yMin = 0.1, yMax = 0.8;
  const x = (v) => m.l + (v / xMax) * (W - m.l - m.r);
  const y = (v) => H - m.b - ((v - yMin) / (yMax - yMin)) * (H - m.t - m.b);
  const r = (n) => 4 + Math.sqrt(n) * 1.1;
  const grid = [];
  for (let v = 0; v <= xMax + 1e-9; v += 0.5)
    grid.push(`<line class="grid" x1="${x(v)}" x2="${x(v)}" y1="${m.t}" y2="${H - m.b}"/><text class="tick" x="${x(v)}" y="${H - m.b + 18}" text-anchor="middle">${times(v)}</text>`);
  for (let v = 0.1; v <= yMax + 1e-9; v += 0.1)
    grid.push(`<line class="grid" x1="${m.l}" x2="${W - m.r}" y1="${y(v)}" y2="${y(v)}"/><text class="tick" x="${m.l - 8}" y="${y(v) + 4}" text-anchor="end">${pct(v)}</text>`);
  const ref = `
    <line class="ref" x1="${x(1)}" x2="${x(1)}" y1="${m.t}" y2="${H - m.b}"/>
    <line class="ref" x1="${m.l}" x2="${W - m.r}" y1="${y(national.satisfaction)}" y2="${y(national.satisfaction)}"/>
    <text class="quad" x="${m.l + 8}" y="${m.t + 14}">Satisfied, not busy</text>
    <text class="quad" x="${W - m.r - 8}" y="${H - m.b - 8}" text-anchor="end">Busy, unsatisfied</text>
    <text class="refl" x="${x(1) + 4}" y="${H - m.b - 8}">national 1×</text>
    <text class="refl" x="${W - m.r - 4}" y="${y(national.satisfaction) - 6}" text-anchor="end">national ${pct(national.satisfaction)}</text>`;
  // Each label takes the first spot (right, left, then nudged up or down) that doesn't cover a dot or another label.
  const pts = ranked.map((b) => ({ b, cx: x(b.busy.index), cy: y(b.satisfaction.score), rr: r(b.couples) }));
  const boxes = pts.map((p) => ({ x0: p.cx - p.rr, x1: p.cx + p.rr, y0: p.cy - p.rr, y1: p.cy + p.rr }));
  const hits = (a) => boxes.some((o) => a.x0 < o.x1 && a.x1 > o.x0 && a.y0 < o.y1 && a.y1 > o.y0);
  const dots = [...pts]
    .sort((a, b) => b.b.couples - a.b.couples)
    .map(({ b, cx, cy, rr }) => {
      const name = short(b.name), w = name.length * 7.2;
      const spots = [0, -16, 16, -30, 30].flatMap((dy) => [
        { anchor: "start", lx: cx + rr + 4, ly: cy + 4 + dy },
        { anchor: "end", lx: cx - rr - 4, ly: cy + 4 + dy },
      ]);
      const box = (s) => ({ x0: s.anchor === "start" ? s.lx : s.lx - w, x1: s.anchor === "start" ? s.lx + w : s.lx, y0: s.ly - 12, y1: s.ly + 3 });
      const spot = spots.find((s) => box(s).x1 < W && box(s).x0 > m.l && !hits(box(s))) ?? spots[0];
      boxes.push(box(spot));
      return `<g class="pt" data-tip="${tip(b)}" data-branch="${b.id}" data-view="both"><circle class="hit" cx="${cx}" cy="${cy}" r="${rr + 8}"/><circle class="dot" cx="${cx}" cy="${cy}" r="${rr}"/>` +
        `<text class="lbl" x="${spot.lx}" y="${spot.ly}" text-anchor="${spot.anchor}">${esc(name)}</text></g>`;
    })
    .join("");
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Satisfaction against busyness per branch">
    ${grid.join("")}${ref}${dots}
    <text class="axis" x="${(m.l + W - m.r) / 2}" y="${H - 8}" text-anchor="middle">Busy, against the national level →</text>
    <text class="axis" transform="translate(16 ${(m.t + H - m.b) / 2}) rotate(-90)" text-anchor="middle">Satisfaction →</text>
  </svg>`;
}

// One ranked bar list: best first, with the national figure marked.
function bars(list, value, nat, cls, note, fmt = pct) {
  const W = 520, row = 26, m = { l: 150, r: 64 }, max = Math.max(...list.map(value), nat) * 1.1;
  const H = list.length * row + 28;
  const x = (v) => m.l + (v / max) * (W - m.l - m.r);
  const rows = list
    .map((b, i) => {
      const yy = 8 + i * row, v = value(b), w = Math.max(2, x(v) - m.l);
      return `<g class="pt" data-tip="${tip(b)}" data-branch="${b.id}" data-view="${cls}"><rect class="hit" x="0" y="${yy - 3}" width="${W}" height="${row}"/>` +
        `<text class="lbl" x="${m.l - 10}" y="${yy + 14}" text-anchor="end">${esc(short(b.name))}</text>` +
        `<path class="${cls}" d="M${m.l},${yy + 2} h${w - 4} a4,4 0 0 1 4,4 v8 a4,4 0 0 1 -4,4 h${-(w - 4)} z"/>` +
        `<text class="val" x="${m.l + w + 6}" y="${yy + 14}">${fmt(v)} <tspan class="n">${note(b)}</tspan></text></g>`;
    })
    .join("");
  return `<svg viewBox="0 0 ${W} ${H}" role="img">
    <line class="ref" x1="${x(nat)}" x2="${x(nat)}" y1="2" y2="${H - 22}"/>
    <text class="refl" x="${x(nat)}" y="${H - 8}" text-anchor="middle">national ${fmt(nat)}</text>${rows}</svg>`;
}

const bySat = [...ranked].sort((a, b) => b.satisfaction.score - a.satisfaction.score);
const byBusy = [...ranked].sort((a, b) => a.busy.index - b.busy.index);

const table = [...ranked, ...others]
  .map((b) => {
    const e = b.satisfaction.experiences;
    return `<tr class="row${b.ranked ? "" : " small"}" data-branch="${b.id}" data-view="both"><td>${esc(b.name)}</td><td>${b.couples}</td><td>${b.records}</td>` +
      `<td>${b.ranked ? pct(b.satisfaction.score) : "–"}</td><td>${pct(b.satisfaction.raw)}</td><td>${e.positive ?? 0} / ${e.mixed ?? 0} / ${e.negative ?? 0} / ${e.neutral ?? 0}</td>` +
      `<td>${b.ranked ? times(b.busy.index) : "–"}</td><td>${b.busy.couples}</td><td>${b.busy.waits.n ? `${times(b.busy.waits.ratio)} (${b.busy.waits.n})` : "–"}</td></tr>`;
  })
  .join("");

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Branch satisfaction and busyness</title>
<style>
:root { color-scheme: light; --bg:#fcfcfb; --text:#0b0b0b; --text2:#52514e; --muted:#8a8984; --grid:#e8e7e3; --line:#d6d5d0;
  --sat:#2a78d6; --busy:#eb6834; --dot:#2a78d6; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { color-scheme: dark; --bg:#1a1a19; --text:#f0efec; --text2:#c3c2b7;
  --muted:#8f8e88; --grid:#2c2c2a; --line:#3d3d3a; --sat:#3987e5; --busy:#d95926; --dot:#3987e5; } }
:root[data-theme="dark"] { color-scheme: dark; --bg:#1a1a19; --text:#f0efec; --text2:#c3c2b7; --muted:#8f8e88; --grid:#2c2c2a;
  --line:#3d3d3a; --sat:#3987e5; --busy:#d95926; --dot:#3987e5; }
body { margin:0; background:var(--bg); color:var(--text); font:15px/1.5 system-ui, -apple-system, sans-serif; }
main { max-width:1120px; margin:0 auto; padding:32px 16px 64px; }
h1 { font-size:26px; margin:0 0 4px; } h2 { font-size:18px; margin:40px 0 4px; }
p { color:var(--text2); margin:4px 0 12px; max-width:760px; }
.meta { color:var(--muted); font-size:13px; }
.pair { display:grid; grid-template-columns:1fr 1fr; gap:32px; }
@media (max-width:820px) { .pair { grid-template-columns:1fr; } }
svg { width:100%; height:auto; display:block; overflow:visible; }
.grid { stroke:var(--grid); stroke-width:1; } .ref { stroke:var(--muted); stroke-width:1; stroke-dasharray:4 4; }
.tick, .refl, .n { fill:var(--muted); font-size:12px; } .axis { fill:var(--text2); font-size:13px; }
.quad { fill:var(--muted); font-size:12px; font-style:italic; }
.lbl { fill:var(--text); font-size:13px; } .val { fill:var(--text2); font-size:13px; }
.lbl, .val { paint-order:stroke; stroke:var(--bg); stroke-width:4px; stroke-linejoin:round; }
.dot { fill:var(--dot); fill-opacity:.75; stroke:var(--bg); stroke-width:2; }
.sat { fill:var(--sat); } .busy { fill:var(--busy); }
.hit { fill:transparent; } .pt:hover .dot { fill-opacity:1; } .pt:hover .lbl { font-weight:600; }
.pt:hover rect.hit { fill:var(--grid); }
#tip { position:fixed; pointer-events:none; background:var(--bg); color:var(--text); border:1px solid var(--line); border-radius:8px;
  padding:8px 10px; font-size:13px; white-space:pre; box-shadow:0 4px 16px rgb(0 0 0 / .12); display:none; z-index:1; }
table { border-collapse:collapse; width:100%; font-size:14px; margin-top:8px; }
th, td { text-align:left; padding:6px 10px; border-bottom:1px solid var(--grid); } th { color:var(--text2); font-weight:600; }
td:not(:first-child), th:not(:first-child) { text-align:right; font-variant-numeric:tabular-nums; }
tr.small td { color:var(--muted); }
.wrap { overflow-x:auto; }
.pt, tr.row { cursor:pointer; } tr.row:hover td { background:var(--grid); }
#panel { position:fixed; top:0; right:0; bottom:0; width:min(600px, 100%); background:var(--bg); border-left:1px solid var(--line);
  box-shadow:-8px 0 32px rgb(0 0 0 / .15); overflow-y:auto; transform:translateX(100%); transition:transform .2s; z-index:2; }
#panel.open { transform:none; }
#panel header { position:sticky; top:0; background:var(--bg); padding:20px 20px 12px; border-bottom:1px solid var(--grid);
  display:flex; justify-content:space-between; align-items:start; gap:12px; }
#panel h3 { margin:0; font-size:20px; } #panel .sub { color:var(--muted); font-size:13px; margin-top:2px; }
#panel .close { background:none; border:1px solid var(--line); color:var(--text); border-radius:6px; font-size:14px; padding:4px 10px; cursor:pointer; }
#panel .body { padding:4px 20px 40px; }
#panel h4 { font-size:15px; margin:24px 0 8px; }
.item { border-top:1px solid var(--grid); padding:14px 0; }
.item .head { display:flex; gap:8px; align-items:center; flex-wrap:wrap; font-size:13px; color:var(--text2); }
.badge { font-size:12px; font-weight:600; padding:1px 8px; border-radius:10px; border:1px solid currentColor; }
.badge.positive { color:#0a8a0a; } .badge.negative { color:#c03030; } .badge.mixed { color:#a86e00; }
.badge.busy { color:var(--busy); }
.item .summary { margin:6px 0; font-size:14px; }
blockquote { margin:8px 0 0; padding:8px 12px; border-left:3px solid var(--line); background:color-mix(in srgb, var(--grid) 40%, transparent);
  border-radius:0 6px 6px 0; font-size:14px; white-space:pre-wrap; overflow-wrap:anywhere; }
blockquote .by { display:block; color:var(--muted); font-size:12px; margin-bottom:4px; white-space:normal; }
blockquote a { color:inherit; }
.empty { color:var(--muted); font-size:14px; }
</style></head><body><main>
<h1>Branches: satisfaction and busyness</h1>
<p class="meta">${summary.records} records from ${summary.couples} couples in the Facebook group${summary.since ? `, since ${summary.since}` : ""}. Generated ${summary.generated_at.slice(0, 10)}.
Ranked: branches with at least ${summary.min_couples} couples.</p>

<h2>Who's leading, who's worst</h2>
<p>Up is more satisfied, left is less busy. The best branches are top left. Dot size is how many couples reported on the branch. Dashed lines are the national figures. Hover a branch for its numbers.</p>
${scatter()}

<div class="pair">
<section><h2>Satisfaction</h2>
<p>Among couples who said how their experience went: positive counts 1, mixed ½, negative 0. Each couple counts once.</p>
${bars(bySat, (b) => b.satisfaction.score, national.satisfaction, "sat", (b) => `· ${b.satisfaction.rated} couples`)}
</section>
<section><h2>Busy</h2>
<p>Against the national level (1×), from two parts. <b>Overload reports</b>: the share of couples, in any kind of post, reporting appointments months away, none available, long queues, or unanswered emails and calls. <b>Waits</b>, where couples gave them, at the two stages that show a branch's own load, each against the national median (${esc(medians)}). War-related reports are left out. Least busy first.</p>
${bars(byBusy, (b) => b.busy.index, 1, "busy", (b) => `· ${b.busy.couples} of ${b.couples} couples${b.busy.waits.n ? `, ${b.busy.waits.n} waits` : ""}`, times)}
</section>
</div>

<h2>All branches</h2>
<p>Scores are pulled toward the national figure in proportion to how few couples reported (as if each branch had ${summary.prior_couples} more average couples), so a branch with a handful of happy reports can't top the list. "Raw" is before that. Grey rows have too few couples to rank.</p>
<div class="wrap"><table>
<thead><tr><th>Branch</th><th>Couples</th><th>Records</th><th>Satisfaction</th><th>Raw</th><th>+ / mixed / − / neutral</th><th>Busy</th><th>Couples reporting overload</th><th>Waits vs national (n)</th></tr></thead>
<tbody>${table}</tbody></table></div>
<p class="meta">People mostly post when something goes wrong, so every figure leans negative. Compare branches with each other, not with 100%.</p>
</main>
<div id="tip"></div>
<aside id="panel" aria-hidden="true"><header><div><h3></h3><div class="sub"></div></div><button class="close" type="button">Close</button></header><div class="body"></div></aside>
<script type="application/json" id="evidence">${JSON.stringify({ evidence, names }).replace(/</g, "\\u003c")}</script>
<script>
const { evidence, names } = JSON.parse(document.getElementById("evidence").textContent);
const panel = document.getElementById("panel");
const h = (tag, cls, text) => { const el = document.createElement(tag); if (cls) el.className = cls; if (text != null) el.textContent = text; return el; };
const LABEL = { positive: "Positive", mixed: "Mixed", negative: "Negative" };
const STAGE = { "applied>first-response": "applied → first answer", "appointment-set>appointment": "given appointment → appointment" };

function item(it, view) {
  const box = h("div", "item"), head = h("div", "head");
  if (view === "sat") head.append(h("span", "badge " + it.experience, LABEL[it.experience]));
  else {
    it.signals.forEach((s) => head.append(h("span", "badge busy", s.replace(/-/g, " "))));
    it.waits.forEach((w) => head.append(h("span", "badge busy", "waited " + Math.round(w.days) + " days: " + STAGE[w.from + ">" + w.to])));
    if (it.firsthand !== "firsthand") head.append(h("span", null, it.firsthand));
  }
  head.append(h("span", null, [it.service.replace(/-/g, " "), it.when].filter(Boolean).join(" · ")));
  box.append(head, h("div", "summary", it.summary));
  for (const q of it.quotes) {
    const bq = h("blockquote"); bq.dir = "auto";
    const by = h("span", "by"), a = h("a", null, q.author + (q.date ? " · " + q.date : ""));
    a.href = q.url; a.target = "_blank"; a.rel = "noopener"; by.append(a);
    bq.append(by, document.createTextNode(q.text)); box.append(bq);
  }
  return box;
}

function section(title, list, view, empty) {
  const frag = document.createDocumentFragment();
  frag.append(h("h4", null, title + " (" + list.length + ")"));
  if (!list.length) frag.append(h("p", "empty", empty));
  list.forEach((it) => frag.append(item(it, view)));
  return frag;
}

function open(branch, view) {
  const e = evidence[branch] ?? { sat: [], busy: [] }, body = panel.querySelector(".body");
  panel.querySelector("h3").textContent = names[branch];
  const count = (k) => e.sat.filter((i) => i.experience === k).length;
  panel.querySelector(".sub").textContent =
    count("positive") + " positive · " + count("mixed") + " mixed · " + count("negative") + " negative · " + e.busy.length + " busy reports";
  body.replaceChildren();
  if (view !== "busy") body.append(section("Satisfaction: what it's based on", e.sat, "sat", "No firsthand experiences that say how it went."));
  if (view !== "sat") body.append(section("Busy: overload reports and waits", e.busy, "busy", "No reports of overload or waits."));
  panel.classList.add("open"); panel.setAttribute("aria-hidden", "false"); panel.scrollTop = 0;
}
const close = () => { panel.classList.remove("open"); panel.setAttribute("aria-hidden", "true"); };
panel.querySelector(".close").addEventListener("click", close);
addEventListener("keydown", (e) => e.key === "Escape" && close());
document.querySelectorAll("[data-branch]").forEach((el) =>
  el.addEventListener("click", () => { tip.style.display = "none"; open(el.dataset.branch, el.dataset.view); }));

const tip = document.getElementById("tip");
document.querySelectorAll(".pt").forEach((el) => {
  el.addEventListener("mousemove", (e) => {
    tip.textContent = el.dataset.tip; tip.style.display = "block";
    const w = tip.offsetWidth;
    tip.style.left = Math.min(e.clientX + 14, innerWidth - w - 8) + "px"; tip.style.top = e.clientY + 14 + "px";
  });
  el.addEventListener("mouseleave", () => (tip.style.display = "none"));
});
</script></body></html>
`;
fs.writeFileSync(path.join(OUT_DIR, "report.html"), html);
console.log(path.join(OUT_DIR, "report.html"));
