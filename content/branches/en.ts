import type { BranchesTexts } from "./types";

export const branchesEn: BranchesTexts = {
  labels: { branches: "Misrad Hapnim branches" },
  metaTitle: "Misrad Hapnim Branches: How Busy, How Long, What Couples Felt",
  description:
    "How busy each Misrad Hapnim branch is for partner visas, how couples felt about dealing with it, and how long each stage took, from couples' reports.",
  title: "Misrad Hapnim branches, in numbers",
  intro:
    "How busy each branch is, how couples felt about dealing with it, and how long the stages of the process took. Everything here is counted from couples' reports: no names or stories.",
  basis: "From {couples} couples' reports, {from} to {to}",
  units: {
    day: { one: "a day", other: "{n} days" },
    week: { one: "a week", other: "{n} weeks" },
    month: { one: "a month", other: "{n} months" },
  },
  about: "about {time}",
  range: "{low} to {high}",
  stages: {
    title: "How long each stage takes",
    intro:
      "Across all branches, for couples whose wait has ended. The typical wait is the one in the middle, and the usual range holds the middle half of couples.",
    typical: "Typical wait",
    usual: "Usual range",
    info: "About this stage",
    reports: { one: "a wait reported", other: "{count} waits reported" },
    axis: "Months",
    items: {
      firstAnswer: {
        title: "Filing → the first answer",
        detail: "From the online application to the branch's first reply: a request for documents, or an appointment.",
      },
      entryPermit: {
        title: "Filing → the entry permit",
        detail: "From the online application to the entry permit, for a partner who's abroad.",
      },
      b1Visa: {
        title: "Filing → the B/1 visa",
        detail: "From the online application to the first B/1 visa.",
      },
    },
  },
  levels: {
    title: "How busy",
    intro: "Three levels, from couples' reports of overload and the waits they gave.",
    items: {
      lessBusy: { label: "Less busy", body: "Waits tend to be toward the short end." },
      typical: { label: "Typical", body: "Waits tend to be around the usual times." },
      busier: { label: "Busier", body: "Waits tend to be toward the long end." },
      unknown: { label: "Unknown", body: "Too few reports so far to tell." },
    },
    count: { one: "a branch", other: "{count} branches" },
  },
  sentiment: {
    title: "How couples felt",
    items: { satisfied: "Satisfied", neutral: "Neutral", unsatisfied: "Unsatisfied" },
    couples: { one: "From a couple", other: "From {count} couples" },
    notEnough: "Not enough reports yet",
  },
  card: {
    busy: "How busy",
    waits: "Waits reported here",
    noWaits: "Not enough waits reported here yet: the times above, across all branches, are the best guide.",
    national: "All branches: {time}",
  },
  list: {
    title: "Branch by branch",
    intro: "The branches with the most reports first. Find yours, or show only one busy level.",
    search: { label: "Find a branch", placeholder: "City or street", empty: "No branch matches “{query}”.", clear: "Clear" },
    all: "All",
  },
  method: {
    title: "How we counted",
    items: [
      {
        title: "Where the numbers come from",
        body: "Interviews we held with couples, Visamo users, couples' reports in online communities of international couples, and votes on our survey.",
      },
      {
        title: "Each couple counts once",
        body: "However many times a couple told us about a branch, they count once there.",
      },
      {
        title: "Small numbers stay hidden",
        body: "A branch shows its numbers only once enough couples reported on it.",
      },
      {
        title: "Read it as a comparison",
        body: "People share more when something goes wrong, so every branch leans toward unsatisfied. Compare branches with each other rather than reading a number on its own.",
      },
    ],
  },
  share: {
    eyebrow: "Been to a branch?",
    title: "Help the next couple know what to expect",
    body: "Every number on this page comes from couples like you. Tell us how it went and how long you waited. It takes a minute.",
    button: "Share your experience",
  },
  cta: {
    title: "Whatever your branch, come prepared",
    body: "Visamo gives you the exact document list for your situation, checks each document before you hand it in, and answers your questions along the way.",
  },
  survey: {
    metaTitle: "Rate your Misrad Hapnim branch: how long you waited, how it went",
    description:
      "Tell other couples how dealing with your Misrad Hapnim branch went and how long each stage took. Votes are anonymous: only totals are shown.",
    title: "How was your experience?",
    intro: "Tell us how long you waited and how it went. Your answers join the numbers other couples see when they look up a branch.",
    anonymous: "Your vote stays anonymous, forever: the page shows only totals, never your email or your words.",
    branch: { label: "Your branch", placeholder: "Choose a branch" },
    filed: { label: "When did you file online?", month: "Month", year: "Year" },
    stages: {
      label: "Which stages can you tell us about?",
      hint: "Choose any you can tell us about, or none. A rough answer is fine.",
      wait: "How long after you submitted the online application?",
      scale: {
        under: "Under a week",
        over: "Over a year",
        week: { one: "1 week", other: "{count} weeks" },
        month: { one: "1 month", other: "{count} months" },
        monthAndHalf: { one: "1½ months", other: "{count}½ months" },
        choose: "Slide to choose",
      },
      items: {
        firstAnswer: { label: "The branch's first answer", waiting: "No answer yet" },
        entryPermit: { label: "The entry permit", note: "If you/your partner were abroad", waiting: "Not issued yet" },
        b1Visa: { label: "The B/1 visa", waiting: "Not yet" },
      },
    },
    satisfaction: {
      label: "Overall, how was dealing with the branch?",
      items: { satisfied: "Satisfied", neutral: "Neutral", unsatisfied: "Unsatisfied" },
    },
    comment: { label: "Anything else? (optional)", hint: "Only our team reads this. It's never published." },
    email: { label: "Your email", hint: "We'll send a code to verify your vote." },
    consent: "Visamo may keep my answers and email to verify and count my vote. Only totals are shown, and my email isn't used for anything else.",
    privacy: "Privacy policy",
    submit: "Send my vote",
    sending: "Sending…",
    errors: {
      branch: "Choose your branch.",
      satisfaction: "Choose how it went.",
      filed: "Choose the month and year you filed online.",
      future: "That month is still ahead.",
      old: "We count experiences from {year} on.",
      wait: "Slide to how long it took, or mark that you're still waiting.",
      long: "That's longer than the time since you filed.",
      email: "Enter a valid email address.",
      consent: "We need your OK to count your vote.",
      verify: "We couldn't confirm you're not a bot. Try again.",
      limit: "This address has had several codes in the last hour. Try again later.",
      daily: "Several votes were already sent from this connection today. Try again tomorrow.",
      branches: "This email has already rated two branches. You can still change your vote for either of them.",
      failed: "Something went wrong. Try again.",
    },
    code: {
      title: "Check your email",
      body: "We sent a 6-digit code to {email}. Enter it here to verify your vote.",
      label: "The code",
      submit: "Verify my vote",
      checking: "Checking…",
      resend: "Send a new code",
      resent: "A new code is on its way.",
      change: "Use a different email",
      errors: {
        wrong: "That code isn't right. Check the email and try again.",
        expired: "This code has expired. Send a new one.",
        attempts: "Too many wrong codes. Send your vote again to get a new one.",
        missing: "We couldn't find this vote. Send it again.",
        branches: "This email has already rated two branches. You can still change your vote for either of them.",
        failed: "Something went wrong. Try again.",
      },
    },
    done: {
      title: "Your vote counts.\nThank you!",
      body: "It's already in the numbers other couples see.",
      back: "See the branches",
      another: "Rate another branch",
    },
  },
};
