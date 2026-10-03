import path from "node:path";
import {
  documents,
  judged,
  pct,
  totals,
  shortModel,
  usd,
  type CaseChange,
  type CaseRecord,
  type FindingRecord,
  type FindingStatus,
  type LineRef,
  type RunChanges,
  type RunRecord,
  type RunResults,
} from "./results";

// The run's report as one HTML page, made from its results by this template
// (no model writes it): open it in a browser. Every section starts folded;
// its heading says what needs attention. The files a case checked open in a viewer on the
// page, or in a new tab.

const esc = (text: string) =>
  text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const statusLabel: Record<FindingStatus, string> = {
  expected: "Expected",
  optional: "Allowed either way",
  wrongList: "Wrong list",
  allowed: "Approved",
  review: "To review",
  wrong: "Wrong",
  unreadable: "Unreadable",
};
const statusTone: Record<FindingStatus, "ok" | "warn" | "bad" | "muted"> = {
  expected: "ok",
  optional: "ok",
  allowed: "ok",
  review: "warn",
  wrongList: "bad",
  wrong: "bad",
  unreadable: "muted",
};

const ratingLabel: Record<string, string> = {
  looksGood: "Looks good",
  canImprove: "Can improve",
  needsFixing: "Needs fixing",
  unreadable: "Unreadable",
};

const chip = (text: string, tone: string) => `<span class="chip ${tone}">${esc(text)}</span>`;
/** Marks a case or a run the judge reviewed findings in. */
const JUDGE_ICON = `<span class="judge-icon" title="The judge reviewed findings the case didn't expect">⚖️</span>`;
const lineId = (line: LineRef | null) =>
  line ? `<span class="line" title="${esc(line.text)}">${esc(line.id)}${line.part ? ` · ${esc(line.part)}` : ""}</span>` : `<span class="line none">no check</span>`;

function finding(f: FindingRecord) {
  return `<li class="finding ${statusTone[f.status]}">
    <div class="finding-head">${chip(statusLabel[f.status], statusTone[f.status])} ${lineId(f.line)} <span class="kind">${f.kind}</span></div>
    <div class="text en"><b>${esc(f.en.title)}</b> ${esc(f.en.detail)}</div>
    <div class="text he" dir="rtl"><b>${esc(f.he.title)}</b> ${esc(f.he.detail)}</div>
    ${f.reason ? `<div class="judge">Judge: ${esc(f.reason)}${f.allowed ? ` <span class="muted">(matches “${esc(f.allowed)}”)</span>` : ""}</div>` : ""}
    ${f.status === "review" ? `<div class="paste">To approve, add to <code>allowedExtra</code>: <code>${esc(JSON.stringify(f.en.title))}</code></div>` : ""}
  </li>`;
}

function run(r: RunRecord) {
  const head = `<div class="run-head">
    <b>Run ${r.run + 1}</b>${r.judgeCalls ? ` ${JUDGE_ICON}` : ""}
    ${r.passed ? chip("Passed", "ok") : chip("Failed", "bad")}
    ${r.rating ? chip(ratingLabel[r.rating] ?? r.rating, r.ratingOk ? "muted" : "bad") : ""}
    <span class="muted">${r.judgeCalls ? `checker ${usd(r.checkCost)} + judge ${usd(r.judgeCost)} = ` : ""}${usd(r.cost)}${!r.calls ? "" : r.fresh === 0 ? ", cached" : r.fresh < r.calls ? `, ${r.calls - r.fresh} of ${r.calls} calls cached` : ""}</span>
  </div>`;
  if (r.error) return `<div class="run">${head}<div class="error">${esc(r.error)}</div></div>`;
  const missed = r.missed.map(
    (l) => `<li class="finding bad"><div class="finding-head">${chip("Missed", "bad")} ${lineId(l)}</div><div class="text">${esc(l.text)}</div></li>`,
  );
  const items = [...missed, ...r.findings.map(finding)];
  return `<div class="run">${head}${items.length ? `<ul class="findings">${items.join("")}</ul>` : `<p class="muted">No findings.</p>`}</div>`;
}

function caseCard(c: CaseRecord, href: (repoPath: string) => string) {
  const files = c.files
    .map(
      (f) =>
        `<button class="file" data-src="${esc(href(f.path))}" data-type="${esc(f.contentType)}" data-name="${esc(f.name)}">${esc(f.name)}</button>`,
    )
    .join("");
  const meta = (files: string) => `<div class="case-meta">
    <div>Couple <code>${esc(c.scenario)}</code> · today <code>${esc(c.today)}</code></div>
    <div>Files ${files}</div>
  </div>`;

  if (c.passing === null) {
    return `<details class="case"><summary>${chip("Skipped", "muted")} <span class="case-name">${esc(c.name)}</span>
      <span class="muted">add ${esc(c.missing.join(", "))}</span></summary>${meta(esc(c.files.map((f) => f.name).join(", ")))}</details>`;
  }

  const expectLine = (l: LineRef) => `<li>${lineId(l)} ${esc(l.text)}</li>`;
  const expected = `<div class="expect">
    <div><span class="label">Rating</span> ${c.expect.ratings ? c.expect.ratings.map((r) => esc(ratingLabel[r] ?? r)).join(" or ") : "any readable"}</div>
    ${c.expect.flagged.length ? `<div><span class="label">Must report</span><ul>${c.expect.flagged.map(expectLine).join("")}</ul></div>` : ""}
    ${c.expect.mayFlag.length ? `<div><span class="label">May report</span><ul>${c.expect.mayFlag.map(expectLine).join("")}</ul></div>` : ""}
    ${c.expect.allowedExtra.length ? `<div><span class="label">Approved findings</span><ul>${c.expect.allowedExtra.map((a) => `<li>${esc(a)}</li>`).join("")}</ul></div>` : ""}
  </div>`;

  const review = c.runs.some((r) => r.findings.some((f) => f.status === "review"));
  const passed = c.runs.filter((r) => r.passed).length;
  return `<details class="case" id="${esc(c.id)}">
    <summary>
      ${c.passing ? chip("Passing", "ok") : chip("Failing", "bad")}
      <span class="case-name">${esc(c.name)}</span>${judged(c) ? ` ${JUDGE_ICON}` : ""}
      <span class="muted">${passed}/${c.runs.length} runs passed</span>
      ${review ? chip("To review", "warn") : ""}
    </summary>
    ${meta(files)}
    ${expected}
    <div class="runs">${c.runs.map(run).join("")}</div>
  </details>`;
}

/** Per check of a document: how often it was caught where expected, and its wrong findings. */
function checkTable(cases: CaseRecord[]) {
  const stats = new Map<string, { line: LineRef; caught: number; expected: number; wrong: number; reported: number }>();
  const stat = (line: LineRef) =>
    stats.get(line.id) ?? stats.set(line.id, { line, caught: 0, expected: 0, wrong: 0, reported: 0 }).get(line.id)!;
  for (const c of cases) {
    for (const line of c.lines) stat(line);
    for (const r of c.runs) {
      if (r.error) continue;
      for (const line of c.expect.flagged) {
        const s = stat(line);
        s.expected++;
        if (!r.missed.some((m) => m.id === line.id)) s.caught++;
      }
      for (const f of r.findings) {
        if (!f.line) continue;
        stat(f.line).reported++;
        if (f.status === "wrong" || f.status === "wrongList") stat(f.line).wrong++;
      }
    }
  }
  if (!stats.size) return "";
  const rows = [...stats.values()]
    .sort((a, b) => a.line.id.localeCompare(b.line.id, undefined, { numeric: true }))
    .map(
      (s) => `<tr><td>${lineId(s.line)}</td><td>${esc(s.line.text)}</td>
        <td class="num">${s.expected ? `${s.caught}/${s.expected}` : "<span class='muted'>untested</span>"}</td>
        <td class="num">${s.reported}</td><td class="num ${s.wrong ? "bad-text" : ""}">${s.wrong || ""}</td></tr>`,
    );
  return `<details class="lines"><summary>Checks</summary><table>
    <thead><tr><th>Check</th><th>Text</th><th class="num">Caught</th><th class="num">Reported</th><th class="num">Wrong</th></tr></thead>
    <tbody>${rows.join("")}</tbody></table></details>`;
}

function change(c: CaseChange) {
  const state = (s: NonNullable<CaseChange["before"]>) =>
    s.passing === null ? "skipped" : `${s.passing ? "passing" : "failing"} ${pct(s.passRate)}`;
  const label = !c.before ? `New, ${state(c.after!)}` : !c.after ? "Gone" : `${state(c.before)} → ${state(c.after)}`;
  const tone = c.before?.passing === false && c.after?.passing ? "ok" : c.before?.passing && c.after?.passing === false ? "bad" : "";
  const reports = [
    ...c.added.map((r) => `<span class="added">+ ${esc(r)}</span>`),
    ...c.removed.map((r) => `<span class="removed">− ${esc(r)}</span>`),
  ].join(" ");
  return `<tr class="${tone}"><td><a href="#${esc(c.id)}">${esc(c.id)}</a></td><td>${esc(label)}</td><td>${reports}</td></tr>`;
}

export function reportHtml(results: RunResults, changed: RunChanges | null, outDir: string) {
  const href = (repoPath: string) =>
    path
      .relative(outDir, path.join(process.cwd(), repoPath))
      .split(path.sep)
      .map(encodeURIComponent)
      .join("/");
  const { meta } = results;
  const t = totals(results);
  const docs = documents(results);

  const tiles = [
    ["Cases passing", t.ran ? `${t.passing}/${t.ran}` : "–", t.failing ? "bad" : "ok"],
    ["Runs passed", pct(t.passRate), ""],
    ["To review", String(t.toReview), t.toReview ? "warn" : ""],
    ["Cost without cache", usd(t.cost), "", `checker ${usd(t.checker)} + judge ${usd(t.judge)}`],
    ["Actual cost", usd(t.spent), "ok", `${t.fresh} of ${t.calls} calls made; the rest came from the cache`],
  ]
    .map(
      ([label, value, tone, note]) =>
        `<div class="tile ${tone}"><div class="tile-label">${label}</div><div class="tile-value">${value}</div>${note ? `<div class="tile-note">${esc(note)}</div>` : ""}</div>`,
    )
    .join("");

  const docRows = docs
    .map((d) => {
      const before = changed?.costBefore[d.folder];
      const delta = before != null && d.cost !== null && Math.abs(d.cost - before) >= 0.005 ? ` <span class="muted">(was ${usd(before)})</span>` : "";
      return `<tr><td><a href="#doc-${esc(d.folder)}">${esc(d.title)}</a> <span class="muted">(${esc(d.folder)})</span></td>
        <td><code>${esc(shortModel(d.model))}</code></td>
        <td class="num">${d.ran}${d.skipped ? ` <span class="muted">+${d.skipped} skipped</span>` : ""}</td>
        <td class="num">${pct(d.passRate)}</td>
        <td class="num ${d.failing ? "bad-text" : ""}">${d.failing}</td>
        <td class="num ${d.toReview ? "warn-text" : ""}">${d.toReview}</td>
        <td class="num">${d.ran ? usd(d.checker) : "–"}</td>
        <td class="num">${d.ran ? usd(d.judge) : "–"}${d.judged ? ` ${JUDGE_ICON}<span class="muted">${d.judged}</span>` : ""}</td>
        <td class="num">${d.ran ? usd(d.cost) + delta : "–"}</td>
        <td class="num">${d.ran ? usd(d.perRun) : "–"}</td></tr>`;
    })
    .join("");

  const sections = docs
    .map((d) => {
      // The cases that ran, then the skipped ones.
      const cases = results.cases
        .filter((c) => c.folder === d.folder)
        .sort((a, b) => Number(a.passing === null) - Number(b.passing === null));
      return `<details class="doc" id="doc-${esc(d.folder)}">
        <summary><span class="doc-name">${esc(d.title)}</span> <span class="muted">(${esc(d.folder)})</span>
          ${d.ran ? (d.failing ? chip(`${d.failing} failing`, "bad") : chip("All passing", "ok")) : chip("Skipped", "muted")}
          ${d.toReview ? chip(`${d.toReview} to review`, "warn") : ""}
          ${d.judged ? `${JUDGE_ICON} <span class="muted">${d.judged} judged</span>` : ""}
          <span class="muted">${shortModel(d.model)}${d.ran ? ` · ${usd(d.cost)} · ${usd(d.perRun)} a run` : ""}</span></summary>
        ${cases.map((c) => caseCard(c, href)).join("")}
        ${checkTable(cases)}
      </details>`;
    })
    .join("");

  const since = changed
    ? `<section><h2>Changed since each case's last run</h2>
        ${changed.cases.length ? `<table class="changes"><tbody>${changed.cases.map(change).join("")}</tbody></table>` : `<p class="muted">Nothing changed.</p>`}</section>`
    : `<section><p class="muted">No earlier run to compare with.</p></section>`;

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Check evals ${esc(meta.folder.replace("/", " "))}</title>
<style>
:root { --bg: #fafaf9; --panel: #ffffff; --text: #1c1917; --muted: #78716c; --border: #e7e5e4;
  --ok: #15803d; --ok-bg: #dcfce7; --warn: #a16207; --warn-bg: #fef3c7; --bad: #b91c1c; --bad-bg: #fee2e2; --code: #f5f5f4; }
@media (prefers-color-scheme: dark) { :root { --bg: #1c1917; --panel: #292524; --text: #f5f5f4; --muted: #a8a29e; --border: #44403c;
  --ok: #4ade80; --ok-bg: #14532d; --warn: #fbbf24; --warn-bg: #713f12; --bad: #f87171; --bad-bg: #7f1d1d; --code: #44403c; } }
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--text); font: 14px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif; }
main { max-width: 1100px; margin: 0 auto; padding: 24px 16px 80px; }
h1 { font-size: 22px; margin: 0 0 4px; } h2 { font-size: 16px; margin: 0 0 10px; }
section { margin: 20px 0; }
.muted { color: var(--muted); } code { background: var(--code); padding: 1px 5px; border-radius: 4px; font-size: 12px; }
a { color: inherit; }
.tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; }
.tile { background: var(--panel); border: 1px solid var(--border); border-radius: 10px; padding: 12px 14px; }
.tile-label { color: var(--muted); font-size: 12px; } .tile-value { font-size: 22px; font-weight: 600; } .tile-note { color: var(--muted); font-size: 11px; }
.tile.bad .tile-value { color: var(--bad); } .tile.warn .tile-value { color: var(--warn); } .tile.ok .tile-value { color: var(--ok); }
table { width: 100%; border-collapse: collapse; background: var(--panel); border: 1px solid var(--border); border-radius: 10px; overflow: hidden; }
th, td { text-align: left; padding: 7px 10px; border-bottom: 1px solid var(--border); vertical-align: top; }
th { font-size: 12px; color: var(--muted); font-weight: 500; } tr:last-child td { border-bottom: 0; }
.num { text-align: right; white-space: nowrap; }
.bad-text { color: var(--bad); font-weight: 600; } .warn-text { color: var(--warn); font-weight: 600; }
.table-wrap { overflow-x: auto; }
details > summary { cursor: pointer; list-style: none; display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
details > summary::-webkit-details-marker { display: none; }
details > summary::before { content: "▸"; color: var(--muted); width: 12px; }
details[open] > summary::before { content: "▾"; }
.doc { background: var(--panel); border: 1px solid var(--border); border-radius: 12px; padding: 12px 16px; margin: 12px 0; }
.doc-name { font-weight: 600; font-size: 15px; }
.case { border-top: 1px solid var(--border); padding: 10px 0 10px 12px; }
.case:first-of-type { margin-top: 10px; } .case-name { font-weight: 500; }
.case-meta, .expect { margin: 8px 0 0 20px; font-size: 13px; }
.expect { display: grid; gap: 4px; } .expect ul { margin: 2px 0 0; padding-left: 18px; }
.label { color: var(--muted); font-size: 12px; margin-right: 6px; }
.chip { display: inline-block; font-size: 11px; font-weight: 600; padding: 1px 8px; border-radius: 999px; background: var(--code); color: var(--muted); }
.chip.ok { background: var(--ok-bg); color: var(--ok); } .chip.warn { background: var(--warn-bg); color: var(--warn); } .chip.bad { background: var(--bad-bg); color: var(--bad); }
.file { font: inherit; font-size: 12px; margin: 2px 4px 2px 0; padding: 2px 10px; border-radius: 6px; border: 1px solid var(--border); background: var(--bg); color: var(--text); cursor: pointer; }
.file:hover { border-color: var(--muted); }
.runs { margin: 10px 0 0 20px; display: grid; gap: 10px; }
.run { border-left: 3px solid var(--border); padding-left: 10px; }
.run-head { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.findings { list-style: none; margin: 6px 0 0; padding: 0; display: grid; gap: 6px; }
.finding { background: var(--bg); border: 1px solid var(--border); border-radius: 8px; padding: 6px 10px; }
.finding.bad { border-color: var(--bad); } .finding.warn { border-color: var(--warn); }
.finding-head { display: flex; gap: 6px; align-items: center; margin-bottom: 2px; }
.line { font-family: ui-monospace, Menlo, monospace; font-size: 12px; border-bottom: 1px dotted var(--muted); cursor: help; } .line.none { border: 0; cursor: default; color: var(--muted); }
.kind { color: var(--muted); font-size: 12px; }
.judge-icon { cursor: help; font-size: 13px; }
.judge, .paste { font-size: 12px; margin-top: 4px; color: var(--muted); } .judge { font-style: italic; }
.error { color: var(--bad); font-family: ui-monospace, Menlo, monospace; font-size: 12px; white-space: pre-wrap; }
body:not(.show-he) .he { display: none; } body.show-he .en { display: none; }
.toolbar { display: flex; gap: 8px; align-items: center; justify-content: space-between; flex-wrap: wrap; }
.toggle { font: inherit; font-size: 12px; padding: 4px 10px; border-radius: 6px; border: 1px solid var(--border); background: var(--panel); color: var(--text); cursor: pointer; }
.changes .added { color: var(--ok); margin-right: 8px; font-family: ui-monospace, Menlo, monospace; font-size: 12px; }
.changes .removed { color: var(--bad); margin-right: 8px; font-family: ui-monospace, Menlo, monospace; font-size: 12px; }
.changes tr.bad td:first-child { border-left: 3px solid var(--bad); } .changes tr.ok td:first-child { border-left: 3px solid var(--ok); }
.lines { margin-top: 12px; } .lines table { margin-top: 8px; font-size: 13px; }
dialog { width: min(1000px, 96vw); height: 92vh; padding: 0; border: 1px solid var(--border); border-radius: 12px; background: var(--panel); color: var(--text); }
dialog::backdrop { background: rgb(0 0 0 / 0.5); }
.viewer { display: flex; flex-direction: column; height: 100%; }
.viewer-bar { display: flex; gap: 12px; align-items: center; padding: 8px 12px; border-bottom: 1px solid var(--border); }
.viewer-bar b { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.viewer-body { flex: 1; overflow: auto; display: flex; justify-content: center; align-items: flex-start; background: var(--bg); }
.viewer-body iframe { width: 100%; height: 100%; border: 0; } .viewer-body img { max-width: 100%; height: auto; margin: 12px; }
</style></head>
<body><main>
<div class="toolbar">
  <div><h1>Document check evals</h1>
  <div class="muted">${esc(new Date(meta.startedAt).toLocaleString("en-GB"))} · commit <code>${esc(meta.commit ?? "unknown")}${meta.dirty ? "+changes" : ""}</code>
    · checker <code>${esc(meta.checkModels.standard)}</code>, strong <code>${esc(meta.checkModels.strong)}</code> · judge <code>${esc(meta.judgeModel)}</code> · ${meta.runs} runs a case
    · rules v${meta.rulesVersion} · knowledge v${meta.knowledgeVersion}${meta.filter ? ` · only <code>${esc(meta.filter)}</code>` : ""}</div></div>
  <button class="toggle" id="lang">Findings in עברית</button>
</div>
<section class="tiles">${tiles}</section>
${since}
<section><h2>Documents</h2><div class="table-wrap"><table>
  <thead><tr><th>Document</th><th>Model</th><th class="num">Cases</th><th class="num">Runs passed</th><th class="num">Failing</th><th class="num">To review</th>
  <th class="num" title="The document checker's calls">Checker</th><th class="num" title="The judge's calls, and how many cases it reviewed findings in">Judge</th>
  <th class="num" title="What all its calls cost without the cache">Cost without cache</th><th class="num" title="One check of the document, on average, without the judge">Per run</th></tr></thead>
  <tbody>${docRows}</tbody>
  <tfoot><tr><th>Total</th><th></th><th class="num">${t.ran}</th><th class="num">${pct(t.passRate)}</th><th class="num">${t.failing}</th><th class="num">${t.toReview}</th>
  <th class="num">${usd(t.checker)}</th><th class="num">${usd(t.judge)}</th><th class="num">${usd(t.cost)}</th><th></th></tr></tfoot>
</table></div>
</section>
<section>${sections}</section>
</main>
<dialog id="viewer"><div class="viewer">
  <div class="viewer-bar"><b id="viewer-name"></b><a id="viewer-open" target="_blank" rel="noopener">Open in new tab</a><button class="toggle" id="viewer-close">Close</button></div>
  <div class="viewer-body" id="viewer-body"></div>
</div></dialog>
<script>
const dialog = document.getElementById("viewer");
const body = document.getElementById("viewer-body");
document.addEventListener("click", (event) => {
  const button = event.target.closest(".file");
  if (!button) return;
  const { src, type, name } = button.dataset;
  document.getElementById("viewer-name").textContent = name;
  document.getElementById("viewer-open").href = src;
  body.replaceChildren();
  const view = document.createElement(type.startsWith("image/") ? "img" : "iframe");
  view.src = src;
  view.alt = name;
  body.append(view);
  dialog.showModal();
});
document.getElementById("viewer-close").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });
dialog.addEventListener("close", () => body.replaceChildren());
const lang = document.getElementById("lang");
lang.addEventListener("click", () => {
  const he = document.body.classList.toggle("show-he");
  lang.textContent = he ? "Findings in English" : "Findings in עברית";
});
</script>
</body></html>
`;
}
