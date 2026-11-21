import type { LawyerTexts } from "./types";

export const lawyerEn: LawyerTexts = {
  metaTitle: "Do You Need a Lawyer for the Israel Partner Visa?",
  description:
    "Most couples don't. What a lawyer does and doesn't do in the partner visa process, the work that stays with you, and the few cases where you do need one.",
  eyebrow: "A lawyer or doing it yourselves",
  title: "Do we need a lawyer for the partner visa?",
  answer:
    "Most couples don't. Misrad Hapnim built the partner visa process for couples to go through themselves, and nothing in the procedures requires a lawyer. What you need is to know exactly what to do at each step, because one mistake can hold your file up for months.",
  whenLink: "When you do need a lawyer",
  updated: "Last updated",
  summary: {
    title: "The short answer",
    points: [
      { icon: "home", title: "Built for you to do yourselves", text: "You apply online, and go to the appointments yourselves." },
      { icon: "passport", title: "The work is yours either way", text: "Getting, certifying and translating your documents stays with you." },
      { icon: "shield", title: "A lawyer only in a few cases", text: "Such as an earlier refusal or a criminal record." },
    ],
  },
  sections: [
    {
      id: "built-for-you",
      heading: "The process is built for you to do yourselves",
      body: [
        "You file the application online. The procedures for married and common-law couples are published, and so is the list of documents each one asks for. You meet the clerk at your branch yourselves, and you answer the interview yourselves. Nothing in Misrad Hapnim's procedures requires a lawyer.",
      ],
    },
    {
      id: "the-work",
      heading: "A lawyer doesn't do the work for you",
      body: [
        "Many couples hire a lawyer expecting them to take care of everything. That isn't how it works: most of the work in this process can only be done by the two of you.",
        {
          figure: "split",
          yours: {
            title: "Yours, with a lawyer or without one",
            items: [
              { icon: "passport", title: "Getting the documents", text: "From the authority in your country that issues each one" },
              { icon: "seal", title: "Certifying them", text: "An apostille or legalization, in the country that issued them" },
              { icon: "translation", title: "Translating them", text: "The kind of translation Misrad Hapnim asks for" },
              { icon: "hearts", title: "Proving your life together", text: "The lease, bills, a joint account, photos, trips" },
              { icon: "forms", title: "Signing the affidavits", text: "In person, in front of a lawyer" },
              { icon: "talk", title: "The appointments and the interview", text: "You go, and you answer, each of you separately" },
            ],
          },
          theirs: {
            title: "What a lawyer adds",
            items: [
              { icon: "certificate", title: "Explaining what to do", text: "Which documents to bring, and general directions on where to get them" },
              { icon: "shield", title: "A check of the file", text: "Before you submit it" },
            ],
          },
          caption: "With a lawyer or without one, most of the work is yours.",
        },
        "A lawyer tells you what to bring, and gives you general directions on where to get each document. Getting it, certifying it, translating it and bringing it stays with you. A lawyer can come with you to the interview, but you answer the questions yourselves.",
      ],
    },
    {
      id: "compare",
      heading: "A lawyer or Visamo, side by side",
      compare: {
        head: { task: "The task", lawyer: "With a lawyer", visamo: "With Visamo" },
        rows: [
          { task: "Knowing which documents your case needs", lawyer: "The lawyer gives you a list", visamo: "Your own list, built from your answers" },
          { task: "Getting the documents from abroad", lawyer: "You", visamo: "You, with instructions for your country" },
          { task: "Apostille and translation", lawyer: "You", visamo: "You, with what each document needs" },
          { task: "Proof of your life together", lawyer: "You", visamo: "You, organized in one place" },
          { task: "Checking each document before you submit", lawyer: "The lawyer", visamo: "Visamo checks each document as you upload it" },
          { task: "The appointments and the interview", lawyer: "You (a lawyer can come with you)", visamo: "You, knowing what to expect" },
          { task: "Questions along the way", lawyer: "The lawyer, in office hours", visamo: "The assistant, 24/7" },
          { task: "Cost", lawyer: "Thousands of dollars, at least", visamo: "Free to start, one payment for the whole file. [See prices](/pricing)" },
        ],
      },
    },
    {
      id: "where-couples-get-stuck",
      heading: "Where couples get stuck",
      body: [
        "The process isn't legally complicated. It's easy to get wrong:",
        {
          list: [
            "**What to bring.** The list depends on your situation: married or common-law, previous marriages, children, where each of you lived.",
            "**Where to get it.** Every country issues its documents differently, and some are hard to get.",
            "**How to certify and translate it.** The wrong kind of certification or translation sends the document back.",
            "**The details.** An incorrect translation, a printout instead of the original, or a name missing from a document.",
            "**What to expect at each stage.** The first appointment, the entry permit, the B/1 visa, the interview.",
          ],
        },
        "A mistake doesn't end a file. It delays it, usually by months: the office rejects a document, you fix it, which can take weeks, and send it again, and the file waits in line again.",
        {
          figure: "loop",
          stages: [
            { icon: "rejected", title: "The office rejects a document" },
            { icon: "send", title: "You fix it and send it" },
            { icon: "hourglass", title: "The file waits in line again" },
          ],
          cost: "Every round adds weeks, sometimes months",
          caption: "The rejection loop: where most delays come from.",
        },
        "For many couples, those months are spent apart. Once you've filed, the foreign partner can't come to Israel until the entry permit is granted, not even for a visit. [How long each stage takes](guide:partner-visa-timeline)",
      ],
    },
    {
      id: "visamo",
      heading: "Where Visamo comes in",
      body: [
        "Visamo gives you more than a lawyer would, and the peace of mind that what you're doing is right, at every step.",
        {
          list: [
            "**Exactly where to get each document,** for your country: who issues it, what it must include, how to certify and translate it, and what to do if you can't get it.",
            "**The cheapest and easiest path** for every requirement.",
            "**Every document checked before you submit,** so you fix what needs fixing before you file, not after months of waiting.",
            "**Answers to your questions, 24/7,** in your language, with endless patience.",
            "**Your own track through the process:** what's behind you, what comes next, and what to expect at each appointment and at the interview.",
          ],
        },
        "You still submit the application yourselves, through the official channels. Visamo is independent, and isn't connected to Misrad Hapnim.",
      ],
    },
    {
      id: "when-you-need-a-lawyer",
      heading: "When you do need a lawyer",
      body: [
        "**Even if your case looks complicated, it probably isn't.** Many situations feel unusual and are part of the regular process. A few really do need a lawyer:",
        {
          figure: "triage",
          regular: {
            title: "Part of the regular process",
            items: [
              "You're not married: common-law couples, same-sex couples included",
              "One of you was married before",
              "There are children from a past relationship",
              "You live in different countries",
              "A document is hard to get",
              "The foreign partner was refused entry at the border",
            ],
          },
          lawyer: {
            title: "Speak with a licensed Israeli lawyer",
            items: [
              "You applied in the past and got a refusal",
              "Either of you has a criminal record",
              "You face a hearing or a deportation order",
              "The other parent doesn't agree to the child moving to Israel",
            ],
          },
          caption: "Most situations that feel complicated are part of the regular process.",
        },
        "Even with a lawyer, you can use Visamo alongside them, to organize and check your documents.",
      ],
    },
  ],
  faq: {
    title: "Questions couples ask",
    items: [
      {
        q: "Do we need a lawyer to sign anything?",
        a: "Not to handle your file. Usually only to sign the affidavits: a short appointment with any Israeli lawyer or at the magistrate's court.",
      },
      {
        q: "Can a lawyer get our documents from abroad for us?",
        a: "Mostly not. Each document comes from the authority in your country that issues it, and it's usually you who has to request it. A lawyer can tell you what to get, but getting it stays with you.",
      },
      {
        q: "Can a lawyer come with us to the interview?",
        a: "Yes. The procedure lets you bring someone with you, a lawyer for example. You still answer the questions yourselves.",
      },
      {
        q: "The foreign partner was refused entry at the border. Do we need a lawyer?",
        a: "Not to start the partner process: you can still apply. To appeal the refusal itself, you have 30 days to go to the Appeals Tribunal, and the appeal needs an affidavit signed before a lawyer.",
      },
      {
        q: "Is Visamo a law firm?",
        a: "No. Visamo doesn't give legal advice and doesn't file for you. It shows you what to do at each step and checks your documents, so you can go through the process yourselves, and get it right.",
      },
    ],
  },
  cta: {
    title: "Do it yourselves, and do it right",
    body: "Get your personal document list, and check every document before you submit. Start free.",
  },
  related: "Read next",
  card: {
    title: "Do we need a lawyer?",
    body: "Most couples don't. What a lawyer does and doesn't do, and the few cases where you need one.",
  },
};
