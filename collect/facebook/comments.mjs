// Loads a post's comments the way Facebook's own post page does, by sending the
// same GraphQL requests from inside the logged-in page: no opening posts, no clicking.
//
//   CommentListComponentsRootQuery          first 10 comments of a post
//   CommentsListComponentsPaginationQuery   the next 10, by cursor
//   Depth1CommentsListPaginationQuery       replies to a comment
//   Depth2CommentsListPaginationQuery       replies to a reply
//
// The responses are saved to raw/ by capture.mjs like any other response.
import fs from "node:fs";
import path from "node:path";
import { DATA_DIR, between, parseBodies, sleep } from "./lib.mjs";

const ROOT = "CommentListComponentsRootQuery";
const PAGE = "CommentsListComponentsPaginationQuery";
const DEPTH1 = "Depth1CommentsListPaginationQuery";
const DEPTH2 = "Depth2CommentsListPaginationQuery";

const RELAY = {
  __relay_internal__pv__CometUFICommentAutoTranslationTyperelayprovider: "AUTO_TRANSLATE",
  __relay_internal__pv__CometUFICommentAvatarStickerAnimatedImagerelayprovider: false,
  __relay_internal__pv__CometUFICommentActionLinksRewriteEnabledrelayprovider: true,
  __relay_internal__pv__IsWorkUserrelayprovider: false,
};

// As recorded from facebook.com on 2026-10-01. Facebook changes doc_id when it
// deploys; whenever the browser makes one of these requests itself, its current
// doc_id and variables replace these (kept in data/facebook/queries.json).
const SEED = {
  [ROOT]: {
    doc_id: "27801386342868096",
    variables: {
      commentsIntentToken: "REVERSE_CHRONOLOGICAL_UNFILTERED_INTENT_V1", // "All comments", newest first
      feedLocation: "POST_PERMALINK_DIALOG",
      feedbackSource: 2,
      focusCommentID: null,
      scale: 2,
      useDefaultActor: false,
      ...RELAY,
    },
  },
  [PAGE]: {
    doc_id: "38580553541588665",
    variables: {
      commentsAfterCount: -1,
      commentsBeforeCount: null,
      commentsBeforeCursor: null,
      commentsIntentToken: "REVERSE_CHRONOLOGICAL_UNFILTERED_INTENT_V1",
      feedLocation: "POST_PERMALINK_DIALOG",
      focusCommentID: null,
      scale: 2,
      targetDialect: null,
      useDefaultActor: false,
      ...RELAY,
    },
  },
  [DEPTH1]: {
    doc_id: "39246134745000506",
    variables: {
      clientKey: null,
      feedLocation: "POST_PERMALINK_DIALOG",
      focusCommentID: null,
      repliesAfterCount: null,
      repliesBeforeCount: null,
      repliesBeforeCursor: null,
      scale: 2,
      useDefaultActor: false,
      ...RELAY,
    },
  },
  [DEPTH2]: {
    doc_id: "28907335732287199",
    variables: {
      clientKey: null,
      feedLocation: "POST_PERMALINK_DIALOG",
      scale: 2,
      subRepliesAfterCount: null,
      subRepliesBeforeCount: null,
      subRepliesBeforeCursor: null,
      useDefaultActor: false,
      ...RELAY,
    },
  },
};

const QUERIES_FILE = path.join(DATA_DIR, "queries.json");
const b64 = (s) => Buffer.from(s).toString("base64");

export function createCommentLoader(page) {
  const queries = { ...SEED, ...(fs.existsSync(QUERIES_FILE) ? JSON.parse(fs.readFileSync(QUERIES_FILE, "utf8")) : {}) };
  let base = null; // Session fields (fb_dtsg, lsd, …) from a real request the page made.

  // Called for every GraphQL request the page makes.
  function observe(request, name) {
    const form = new URLSearchParams(request.postData() ?? "");
    if (!base && form.get("fb_dtsg") && form.get("doc_id")) {
      base = { url: request.url(), form: form.toString(), asbd: request.headers()["x-asbd-id"] };
    }
    if (name in SEED && form.get("doc_id") && form.get("doc_id") !== queries[name].doc_id) {
      queries[name] = { doc_id: form.get("doc_id"), variables: JSON.parse(form.get("variables") ?? "{}") };
      fs.writeFileSync(QUERIES_FILE, JSON.stringify(queries, null, 2));
    }
  }

  async function ready() {
    for (let i = 0; i < 20 && !base; i++) await sleep(1000);
    if (!base) throw new Error("The page made no GraphQL request to borrow session fields from.");
  }

  async function call(name, variables) {
    const form = new URLSearchParams(base.form);
    form.set("fb_api_req_friendly_name", name);
    form.set("doc_id", queries[name].doc_id);
    form.set("variables", JSON.stringify({ ...queries[name].variables, ...variables }));
    const headers = {
      "content-type": "application/x-www-form-urlencoded",
      "x-fb-friendly-name": name,
      "x-fb-lsd": form.get("lsd") ?? "",
      ...(base.asbd ? { "x-asbd-id": base.asbd } : {}),
    };
    const text = await page.evaluate(
      async ({ url, headers, body }) => (await fetch(url, { method: "POST", headers, body, credentials: "include" })).text(),
      { url: base.url, headers, body: form.toString() },
    );
    const docs = parseBodies(text);
    const error = docs[0]?.errors?.[0]?.message ?? (docs[0]?.error ? (docs[0].errorSummary ?? `error ${docs[0].error}`) : null);
    if (!docs.length || error || !docs[0].data) {
      throw new Error(`${name} failed: ${error ?? text.slice(0, 200)}`);
    }
    await sleep(between(1500, 4000));
    return docs;
  }

  // Replies to one comment, and (for depth-1 replies) their replies. Adds every id to `seen`.
  async function loadReplies(comment, depth, seen) {
    const feedback = comment.feedback;
    if (!feedback?.id || !feedback.expansion_info?.expansion_token || !feedback.replies_fields?.total_count) return;
    const [query, afterKey] = depth === 1 ? [DEPTH1, "repliesAfterCursor"] : [DEPTH2, "subRepliesAfterCursor"];
    let cursor = null;
    do {
      const docs = await call(query, { id: feedback.id, expansionToken: feedback.expansion_info.expansion_token, [afterKey]: cursor });
      const replies = docs[0].data.node?.replies_connection;
      for (const edge of replies?.edges ?? []) {
        seen.add(edge.node.legacy_fbid ?? edge.node.id);
        if (depth === 1) await loadReplies(edge.node, 2, seen);
      }
      cursor = replies?.page_info?.has_next_page ? replies.page_info.end_cursor : null;
    } while (cursor);
  }

  // All comments and replies of a post. Returns how many were loaded and how many
  // Facebook says there are (its count includes replies).
  async function load(postId) {
    const id = b64(`feedback:${postId}`);
    const seen = new Set();
    const top = [];
    let list = (await call(ROOT, { id }))[0].data.node?.comment_rendering_instance_for_feed_location?.comments;
    const total = list?.total_count ?? null;
    while (list) {
      for (const edge of list.edges ?? []) {
        seen.add(edge.node.legacy_fbid ?? edge.node.id);
        top.push(edge.node);
      }
      if (!list.page_info?.has_next_page) break;
      const docs = await call(PAGE, { id, commentsAfterCursor: list.page_info.end_cursor });
      list = docs[0].data.node?.comment_rendering_instance_for_feed_location?.comments;
    }
    for (const comment of top) await loadReplies(comment, 1, seen);
    return { loaded: seen.size, total };
  }

  return { observe, ready, load };
}
