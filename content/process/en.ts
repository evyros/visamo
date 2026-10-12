import { only, type Answers, type ProcessTexts } from "./types";

const married = (a: Answers) => a.relationship === "married";

const relationshipName = (a: Answers) => (married(a) ? "married couples" : "common-law couples");
const locationName = (a: Answers) =>
  ({ bothInIsrael: "living in Israel", partnerAbroad: "with the foreign partner abroad", bothAbroad: "living abroad" })[
    a.location
  ];

/** What the visas give: in the track when a stage is opened, and in the steps that celebrate them. */
const b1Gives = [
  "**Live together in Israel,** legally.",
  "**Work in any field,** as an employee or self-employed.",
  "**Travel abroad and come back,** with the inter-visa.",
];
const a5Gives = [
  "**An Israeli ID number,** and a Teudat Zehut (the Israeli ID card).",
  "**Public health insurance,** as a resident for National Insurance.",
  "**The social rights of a resident.**",
];

export const processEn: ProcessTexts = {
  labels: {
    guides: "Guides",
    process: "Partner visa, step by step",
    updated: "Last updated",
    step: "Step {n}",
    stepsNav: "The steps",
    jumpToStep: "Jump to a step",
    quickQuestions: "Quick questions",
    newTab: "(opens in a new tab)",
    milestone: "Milestone",
    tones: { important: "Important", tip: "Tip", info: "Good to know" },
    yourSituation: "Your situation",
    change: "Change",
    shortVersion: "The short version",
    related: "Related guides",
  },

  answers: {
    relationship: {
      married: {
        label: "Married",
        hint: "Including same-sex couples, and marriages abroad or online",
        chip: "Married",
      },
      commonLaw: {
        label: "Common-law",
        hint: "Living together without marriage, same-sex couples included",
        chip: "Common-law",
      },
    },
    location: {
      bothInIsrael: { label: "Both in Israel", hint: "The foreign partner is already here", chip: "Both in Israel" },
      partnerAbroad: {
        label: "One in Israel, one abroad",
        hint: "The Israeli partner in Israel, the foreign partner abroad",
        chip: "Partner abroad",
      },
      bothAbroad: { label: "Both abroad", hint: "We live outside Israel and plan to move", chip: "Both abroad" },
    },
    lived: {
      yes: { label: "Yes", hint: "We live together, or did before", chip: "Lived together" },
      no: { label: "Not yet", hint: "We haven't shared a home", chip: "Haven't lived together" },
    },
  },

  landing: {
    metaTitle: "Israel Partner Visa Process for Your Situation",
    description:
      "Answer 3 quick questions and see the Israel partner and spouse visa process for your situation: every step to A/5, and the documents to gather.",
    eyebrow: "Free interactive guide",
    title: "Your Israel partner visa process,",
    titleAccent: "step by step.",
    intro:
      "Answer three quick questions, and get the whole gradual process for your situation: every step in order, what to watch for, and the documents to start gathering.",
    promises: ["Every step, in order", "What to watch for at each one", "The documents to gather"],
    glance: {
      title: "The process at a glance",
      intro: "Every couple goes through the same big stages. The order, and who goes where, depends on your situation.",
      stages: [
        { title: "Documents", body: "From abroad first: certified with an apostille, and translated if needed." },
        {
          title: "The application",
          body: "Filed online with Misrad Hapnim. If you both live abroad, you start at the Israeli consulate.",
        },
        { title: "The first appointment", body: "The clerk reviews your originals. A partner abroad gets an entry permit." },
        { title: "B/1 and the interview", body: "A work visa, while the office checks that your relationship is genuine." },
        { title: "A/5 and beyond", body: "Temporary residency, then citizenship or permanent residency." },
      ],
    },
    situations: { title: "Or go straight to your situation", intro: "Each one is the full guide, step by step." },
    faqTitle: "Questions couples ask",
    faq: [
      {
        q: "How long does the partner visa process take?",
        a: "Married couples are on a B/1 visa for up to 6 months, then on A/5 for 4 years, before permanent status. Common-law couples are on B/1 for 3 years, then on A/5 for 4 years. Before that comes the wait for an answer to your application: as of 2026, from 3 weeks to more than 4 months.",
      },
      {
        q: "Can we apply if we've never lived together?",
        a: "Yes. Couples who haven't lived together, married or not, are processed normally. What decides it is whether you can show the relationship is genuine: visits and time spent together, meeting each other's family and friends, and an ongoing connection.",
      },
      {
        q: "Do we have to be married?",
        a: "No. Common-law couples (ידועים בציבור), same-sex couples included, apply through procedure 5.2.0009. It needs more proof that you live together, and proof that you're both free to marry.",
      },
      {
        q: "Can same-sex couples apply?",
        a: "Yes, married or common-law. Common-law same-sex couples follow the same track as any common-law couple. A married same-sex couple is on B/1 for up to 6 months, then on A/5 for 4 years, then gets permanent residency, with the option to apply for citizenship after it.",
      },
      {
        q: "Who can't use this process?",
        a: "A foreign partner who can immigrate under the Law of Return (Jewish, or with a Jewish parent or grandparent) does that instead: a different and faster route. Residents of the Palestinian territories, and citizens of Iran, Iraq, Syria and Lebanon, mostly can't use it. And the Israeli partner has to be a citizen or a permanent resident: a temporary resident (A/5) generally can't sponsor a partner.",
        link: { label: "Who this process isn't for", path: "/guide/partner-visa-israel#not-for" },
      },
      {
        q: "Can my partner come as a tourist and apply from Israel?",
        a: "Not to move here. Coming as a tourist to stay goes against Israel's immigration policy: the foreign partner needs an entry permit first. A real visit before you file is fine.",
      },
      {
        q: "How much does it cost?",
        a: "In 2026, the fee for opening the file is 1,085 NIS, for married and common-law couples alike. The B/1 visa costs 205 NIS, and the inter-visa another 205 NIS. Getting, certifying and translating the documents costs extra.",
      },
    ],
    picker: {
      label: "Find your process",
      progress: "Question {n} of {total}",
      questions: {
        relationship: "Are you married, or a common-law couple?",
        location: "Where do you each live now?",
        lived: "Have you lived together?",
      },
      back: "Back",
      opening: "Opening your guide…",
      footnote: "No sign-up needed.",
    },
  },


  guide: {
    metaTitle: (a) =>
      `Israel Partner Visa: ${married(a) ? "Married" : "Common-Law"}, ${
        { bothInIsrael: "Both in Israel", partnerAbroad: "Partner Abroad", bothAbroad: "Both Abroad" }[a.location]
      }`,
    description: (a) => {
      const visas = married(a) ? "B/1, the interview and A/5" : "the interview, B/1 and A/5";
      const start = {
        bothInIsrael: "filing online, the first appointment",
        partnerAbroad: "filing, the entry permit",
        bothAbroad: "the consulate, the entry permit, filing in Israel",
      }[a.location];
      return `The Israel partner visa for ${relationshipName(a)} ${locationName(a)}: ${start}, ${visas}, step by step.`;
    },
    title: (a) => `The Israel partner visa process for ${relationshipName(a)} ${locationName(a)}`,
    answer: (a) =>
      `${
        {
          bothInIsrael:
            "You file online from Israel, then go to the first appointment at your Misrad Hapnim branch together.",
          partnerAbroad:
            "You file online from Israel, with an entry permit application, and the Israeli partner goes to the first appointment alone. Once the office grants the **entry permit**, the foreign partner flies in.",
          bothAbroad:
            "You start by contacting the Israeli consulate where you live, for the list of documents and an appointment. Once you've gathered them, the consulate asks Misrad Hapnim for your **entry permit**, and when it's granted, you move to Israel together and file with your branch within 30 days.",
        }[a.location]
      } ${
        married(a)
          ? "As a married couple, you get the **B/1 visa** without an interview once your file is complete, and you're interviewed before the **A/5**, within up to 6 months."
          : "As a common-law couple, you're interviewed before the first **B/1 visa**, and you stay on B/1 for 3 years before moving up to **A/5**."
      }`,
  },

  track: {
    title: "Your track, from the first visa",
    b1: "B/1 visa",
    a5: "A/5 visa",
    end: "Permanent status",
    lengths: (a) =>
      married(a)
        ? { b1: "Up to 6 months", a5: "4 years", end: "Citizenship or permanent residency" }
        : { b1: "3 years", a5: "4 years", end: "Permanent residency, then citizenship" },
    details: (a) => ({
      b1: b1Gives,
      a5: [...a5Gives, "**4 years** on it, renewed along the way, before permanent status."],
      end: married(a)
        ? [
            "**Married, a man and a woman:** a choice between citizenship and permanent residency.",
            "**Married, same sex:** permanent residency, and then you can apply for citizenship.",
            "**With a permanent resident as the Israeli partner:** permanent residency.",
          ]
        : [
            "**Permanent residency,** and then you can apply for citizenship.",
            "**Same-sex couples** follow the same track.",
            "**With a permanent resident as the Israeli partner:** permanent residency, not citizenship.",
          ],
    }),
  },


  steps: {
    prepare: (a) => ({
      title: a.location === "bothAbroad" ? "Gather the documents on the consulate's list" : "Gather your documents",
      short: "Gather documents",
      meta: [
        { icon: "people", text: "Both of you" },
        { icon: "clock", text: a.location === "bothAbroad" ? "Takes the longest" : "Takes the longest: start first" },
      ],
      body: [
        a.location === "bothAbroad"
          ? "Gather what's on the consulate's list, starting with the documents from abroad: they take the longest. You'll need many of them again for [the file you open with Misrad Hapnim](#documents) after you move."
          : "Start with the documents from abroad: they take the longest, and some branches reject an application that's missing them instead of giving you time to complete it. File once your file is complete: [the list of documents](#documents) is in the filing step.",
        {
          list: [
            "**Certified.** A document from abroad needs an apostille, or consular legalization, from the country that issued it. It can't be done in Israel. [Apostille and translation](guide:apostille-and-translation)",
            "**Translated, if needed.** By law, only Hebrew and Arabic are accepted without a notarized translation. In practice, most clerks accept English. When you do translate, translate into Hebrew.",
            "**Recent.** The foreign partner's civil-status document and police certificate have to be issued in the last 6 months before you file.",
            "**A valid passport.** The foreign partner's passport has to be valid for at least 2 more years.",
          ],
        },
      ],
      checklist:
        a.location === "bothAbroad"
          ? {
              title: "What the consulate asks for",
              items: [
                "The foreign partner's birth certificate",
                married(a)
                  ? "A civil-status certificate"
                  : "A civil-status certificate, showing they're free to marry",
                "A police certificate",
                "Proof of your life together",
                "Where you'll live in Israel",
                "Insurance for the whole stay",
                "Proof of income",
                "Two passport photos",
                "Bank statements for at least 3 months",
              ],
            }
          : undefined,
      bubbles: [
        {
          tone: "important",
          title: "Ask for the paper original, \"for use abroad\"",
          text: "Many offices reject a document printed at home or downloaded from an online service, and many countries won't put an apostille on one. Ask for the printed original, with a handwritten signature or an official stamp.",
        },
        ...only(a.livedTogether && a.location === "bothAbroad", {
          tone: "tip" as const,
          title: "Make your proof of life together strong",
          text: "Since you live abroad, it has to be: the lease of your home, joint bank accounts, bills, your message history, and photos that show a real, ongoing life together.",
        }),
        ...only(a.livedTogether && a.location !== "bothAbroad", {
          tone: "info" as const,
          title: "Proof of your home together",
          text:
            a.location === "bothInIsrael"
              ? "Living together in Israel, you prove it with the documents of your home (the lease or purchase contract, its bills and the rest), covering at least the last 12 months."
              : "Bring the documents of the home you share or shared abroad: the lease or purchase contract, its bills and the rest. If you can't, bring what supports it instead, such as receipts and flight bookings.",
        }),
        {
          tone: "tip",
          title: "Keep everything in one binder",
          text: "Organize all the documents and their copies in one binder. You'll need to stay organized for the whole process.",
        },
      ],
      faq: [
        {
          q: "Do documents in English need a translation?",
          a: "By law, yes: only Hebrew and Arabic are accepted without one. In practice, most clerks accept an English document, especially a short one; if yours doesn't, they'll give you time to translate it. When you translate, translate into Hebrew.",
        },
        {
          q: "Can we translate the documents abroad?",
          a: "You can, but translating in Israel is simpler. A notarized translation made abroad needs an apostille of its own, and is sometimes not accepted. A translation made in Israel needs no apostille: only the original document does.",
        },
      ],
    }),

    consulate: () => ({
      title: "Contact the Israeli consulate",
      short: "The consulate",
      meta: [
        { icon: "people", text: "Both of you" },
        { icon: "globe", text: "The Israeli consulate or embassy where you live" },
      ],
      body: [
        "You're moving to Israel to start the process, so the foreign partner needs an entry permit first. When you both live abroad, it comes through the Israeli consulate or embassy in your country, before anything is filed in Israel.",
        "**Start by contacting the consulate,** before you gather anything: ask for the list of documents, and set the date of your appointment.",
      ],
      bubbles: [
        {
          tone: "important",
          title: "Don't fly in as tourists instead",
          text: "Coming as a tourist to stay goes against Israel's immigration policy. In practice, a foreign partner who arrives with the Israeli partner without the permit is likely to be suspected of coming to stay, stopped at border control, and flown back.",
        },
      ],
      faq: [
        {
          q: "Can the consulate give us the partner visa?",
          a: "No. It can't grant it itself: it reviews your documents, and passes your request for an entry permit to Misrad Hapnim in Israel, which decides.",
        },
      ],
    }),

    entryPermit: () => ({
      title: "Get the entry permit through the consulate",
      short: "Entry permit",
      meta: [
        { icon: "people", text: "Both of you, in person" },
        { icon: "globe", text: "The Israeli consulate or embassy" },
      ],
      body: [
        {
          steps: [
            "**Go to the appointment together,** with the original documents, certified and translated into Hebrew or English.",
            "**Ask for an entry permit,** saying plainly that it's to move to Israel and start the gradual process (ההליך המדורג).",
            "**The consulate passes it on.** It reviews your documents, and sends the request to Misrad Hapnim in Israel, which decides.",
            "**Once it's approved,** the consulate contacts you, and puts an entry visa in the foreign partner's passport: usually a B/2 visa, valid for a set period. With it, you move to Israel and start the process with your Misrad Hapnim branch.",
          ],
        },
      ],
      bubbles: [
        {
          tone: "important",
          title: "Missing documents mean a refusal",
          text: "The consulate turns down a request with missing or incomplete documents. Make sure everything on the list is there, certified and translated, before the appointment.",
        },
      ],
      faq: [
        {
          q: "Does the interview at the consulate count in Israel?",
          a: "No. An interview at the consulate is only for the entry permit. You'll still have the interview in Israel, after you arrive.",
        },
        {
          q: "Do we both need to go?",
          a: "Usually, yes. The appointment is in person, and both of you usually need to come.",
        },
      ],
    }),

    travel: (a) =>
      a.location === "bothAbroad"
        ? {
            title: "Move to Israel together",
            short: "The move",
            meta: [
              { icon: "people", text: "Both of you" },
              { icon: "clock", text: "Then file within 30 days" },
            ],
            body: [
              "Once the visa is in the foreign partner's passport, you can travel to Israel together.",
              "The entry permit alone doesn't start the process. You file the full application online in the next step, **within 30 days of the foreign partner's entry**.",
            ],
            bubbles: [],
            faq: [
              {
                q: "What happens after we land?",
                a: "You file the full application online, with your local Misrad Hapnim branch, within 30 days of the foreign partner's entry. From there, the process is the same as for a partner who's already in Israel.",
              },
            ],
          }
        : {
            title: "The foreign partner comes to Israel",
            short: "Arrival",
            meta: [
              { icon: "user", text: "The foreign partner" },
              { icon: "clock", text: "Usually within 3 months of the permit" },
            ],
            body: [
              {
                list: [
                  "**From a visa-exempt country:** fly as soon as you have the permit, with an ETA-IL. In its application, choose \"Visit (tourism)\" as the purpose and \"up to 90 days\" as the stay: the Population and Immigration Authority confirmed this for partners with an entry permit.",
                  "**From a country that needs a visa to Israel:** first get a B/2 visa at the Israeli consulate where you live.",
                ],
              },
              `The foreign partner enters on a B/2 visa, as a status in between. **Tell your branch as soon as they arrive,** by email or in person. ${
                married(a)
                  ? "The office then calls you in to get the B/1 visa."
                  : "The office then sets a date for your interview: it's usually set only once the foreign partner is in Israel."
              }`,
            ],
            bubbles: [
              {
                tone: "tip",
                title: "Tell your clerk when you're coming",
                text: "The procedures set no deadline, but offices usually expect the foreign partner within 3 months of the permit. Tell your clerk the date you plan to arrive, and ask them to confirm it.",
              },
            ],
            faq: [
              {
                q: "Do we need to show the entry permit at the border?",
                a: "In practice, no. No written proof of the permit is needed at the border.",
              },
            ],
          },

    file: (a) => ({
      title: a.location === "bothAbroad" ? "File the application online, within 30 days" : "File the application online",
      short: "Filing",
      meta: [
        { icon: "user", text: "The Israeli partner logs in" },
        { icon: "globe", text: "Online, on gov.il" },
        { icon: "receipt", text: "1,085 NIS fee" },
      ],
      body: [
        ...only(
          a.location === "bothAbroad",
          "File with your local Misrad Hapnim branch within 30 days of the foreign partner's entry. From here, the process is the same as for a partner who's already in Israel.",
        ),
        `The Israeli partner opens [the online application on gov.il](https://www.gov.il/en/service/requesting-status-for-foreign-life-partner) and logs in with the government's identification system, and the form fills in their details and their branch. ${
          married(a)
            ? "Choose **married** as the type, then the kind of marriage: a same-sex marriage has its own option."
            : "Choose **shared life** (חיים משותפים) as the type: it's the one for common-law couples."
        } Upload each document in its field, and pay the fee for opening the file: **1,085 NIS** in 2026.`,
        {
          list: [
            "**Files:** PDF or JPEG, one file per field. To put several documents in one field, merge them into one PDF. Keep everything under about 40 MB in all.",
            ...only(
              a.location === "partnerAbroad",
              "**With it:** the entry permit application (form AS/1), so the foreign partner can come to Israel.",
            ),
            ...only(
              a.location === "bothInIsrael",
              "**With it:** the foreign partner's application to change their visa category (form AS/3).",
            ),
            "**After you pay,** you get an email with a reference number. Use it, with your ID or passport number, whenever you contact the office.",
          ],
        },
      ],
      bubbles: [
        ...only(married(a), {
          tone: "important" as const,
          title: "Married? Register the marriage first",
          text: "You must be registered as married with Misrad Hapnim before you start the process and file the application online.",
        }),
        {
          tone: "important",
          title: "Update the Israeli partner's address first",
          text: "The application goes automatically to the branch of the address in their Teudat Zehut, and that address has to be where you really live: it's checked throughout the process. If you moved, update it before you file.",
        },
        ...only(a.location === "bothInIsrael", {
          tone: "important" as const,
          title: "File before the foreign partner's visa runs out",
          text: "If they're here on another visa (student, work, volunteer, tourist), file while it's still valid, then go to the branch to settle their status until the decision. If it can't be extended, ask for a B/2 visa in between, so they're never without one.",
        }),
        ...only(a.location === "partnerAbroad", {
          tone: "important" as const,
          title: "From now on, the foreign partner waits abroad",
          text: "Once you file, they're likely to be refused entry if they try to visit as a tourist, even from a visa-exempt country: they're marked as waiting for an entry permit.",
        }),
        ...only(a.location === "partnerAbroad" && a.livedTogether, {
          tone: "tip" as const,
          title: "Lived together abroad? You can try to speed it up",
          text: "Instead of filing online first, the Israeli partner can go to the branch without an appointment, early in the morning before it opens, with all the proof of your life together, and ask for the entry permit, or even a B/1 visa. The branch may refuse, and tell you to file online.",
        }),
      ],
      faq: [
        {
          q: "What if we can't afford the fee?",
          a: "In extreme cases you can ask for an exemption under procedure 5.1.0003, in person at the branch, with full proof of your financial situation.",
        },
        {
          bothInIsrael: {
            q: "What if the foreign partner's visa has already expired?",
            a: "In practice, an overstay doesn't affect eligibility for the partner visa. The best way is for them to leave, start properly from abroad through the entry permit, and not try to come back before it's granted. If you apply from Israel instead, the office interviews you first and looks at the file more closely.",
          },
          partnerAbroad: {
            q: "Can the Israeli partner be abroad while we wait?",
            a: "Not for long: the office is unlikely to move the file forward while the Israeli partner is abroad for long.",
          },
          bothAbroad: {
            q: "Which branch do we file with?",
            a: "The branch of the Israeli partner's registered address. Update it to your new home in Israel before you file.",
          },
        }[a.location],
      ],
    }),

    wait: () => ({
      title: "Wait for Misrad Hapnim's answer",
      short: "The answer",
      meta: [{ icon: "clock", text: "3 weeks to 4+ months" }],
      body: [
        "Misrad Hapnim (PIBA) has no deadline for answering. As of 2026, the first answer takes from 3 weeks to more than 4 months, depending on the branch, and the appointment it gives may be months later.",
        "The answer is one of two things: a **request for more documents**, usually by email, or a **first appointment**, sometimes with a list of documents to bring.",
      ],
      bubbles: [
        {
          tone: "important",
          title: "Mistakes cost time",
          text: "Every time the office sends something back because of a problem with the documents you sent, or something missing from them, you lose time: after you reply, with the missing documents or to a rejection, it usually takes another couple of weeks to a couple of months for the office to review it and move your file forward.",
        },
        {
          tone: "important",
          title: "Missing documents: 45 days",
          text: "If a document, a translation or a certification is missing, the office tells you which, and gives you 45 calendar days to bring it. Until then the file doesn't move, and if it doesn't come, the office can close the file.",
        },
        {
          tone: "info",
          title: "Don't rely on *3450",
          text: "The call center doesn't book visa appointments, and its staff aren't trained on visas.",
        },
      ],
      faq: [
        {
          q: "What if the office closes our file?",
          a: "It sends a letter saying why. You have 21 days to object in writing, for example when it says a document is missing that you already sent. Keep the confirmation of every document you send.",
        },
        { q: "Can we get more than 45 days?", a: "Yes. You can ask the office for more time." },
      ],
    }),

    appointment: (a) => {
      const faq = {
        q: "Can someone else go to the appointment for us?",
        a: "No. No one can go to a Misrad Hapnim branch in your place, to an appointment or to the walk-in hours.",
      };
      if (a.location === "partnerAbroad") {
        return {
          title: "The first appointment: the entry permit",
          short: "First appointment",
          meta: [
            { icon: "user", text: "The Israeli partner, alone" },
            { icon: "building", text: "Your Misrad Hapnim branch" },
          ],
          body: [
            "The clerk reviews your documents with the entry permit application. Bring the original documents from abroad, certified and translated, with photocopies, your Teudat Zehut with a copy, and a copy of the foreign partner's passport.",
            "**If everything is in order, the office grants the entry permit** (היתר כניסה, often called the \"hazmana\"), at the appointment, or by phone or email a couple of weeks later. [The entry permit](guide:entry-permit)",
            "If it needs more, you get 45 days to bring the missing documents, or the office asks for a **simultaneous interview** (ראיון סימולטני): the Israeli partner at the branch, and the foreign partner at the Israeli consulate where they live, at the same time.",
          ],
          bubbles: [
            {
              tone: "important",
              title: "The originals have to be in Israel",
              text: "Even with the foreign partner abroad, the original documents are needed at the appointment, and for the translation. Send them to the Israeli partner by courier, in time.",
            },
            {
              tone: "info",
              title: "How long the entry permit takes",
              text: "From filing, in practice, the faster branches grant it within 3 to 4 weeks, and busy branches take 2 to 5 months. It can't be predicted: plan for a few months.",
            },
          ],
          faq: [
            faq,
            {
              q: "When is a simultaneous interview asked for?",
              a: "In practice, often when the foreign partner comes from a non-Western country: Eastern Europe, East Asia, South America or Africa, among others.",
            },
          ],
        };
      }
      return {
        title: "The first appointment, together",
        short: "First appointment",
        meta: [
          { icon: "people", text: "Both of you" },
          { icon: "building", text: "Your Misrad Hapnim branch" },
        ],
        body: [
          "You go together, to this appointment and to every one after it. Bring the original documents from abroad, certified and translated, with photocopies; the Israeli partner's Teudat Zehut and the foreign partner's passport, with copies; and anything the office asked for.",
          married(a)
            ? "**If all the documents are there, the B/1 visa is issued at this appointment, without an interview.** By procedure 5.2.0008, a married couple's first interview comes before the A/5, not before the B/1."
            : "**If the documents are in order, the next step is an interview with you both,** and after it, the B/1 visa. By procedure 5.2.0009 (clause 10), the interview is held, whenever possible, at this same appointment.",
        ],
        bubbles: [
          ...only(!married(a), {
            tone: "important" as const,
            title: "Ask for the interview at this appointment",
            text: "Point the clerk to procedure 5.2.0009, clause 10. Otherwise the office sets a date, and at the busiest branches, the wait for a first visa's interview can reach a year.",
          }),
          {
            tone: "info",
            title: "A Teudat Zehut, not a driver's license",
            text: "The Israeli partner brings their ID card, with a copy. A driver's license isn't enough.",
          },
        ],
        faq: [
          faq,
          {
            q: "What do we bring if the office didn't say?",
            a: "Copies of everything you sent with the online application, along with the originals from abroad.",
          },
        ],
      };
    },

    b1: (a) => ({
      title: "Get the B/1 visa",
      short: "B/1 visa",
      milestone: { title: "You've got the B/1 visa", lead: "What you can do now:", items: b1Gives },
      meta: [
        { icon: "building", text: "Your Misrad Hapnim branch" },
        { icon: "receipt", text: "205 NIS" },
      ],
      body: [
        "B/1 (ב/1 כללי, often written B1) is an unrestricted work visa marked \"partner\". It's a sticker in the passport, issued by your branch: 205 NIS in 2026, by credit card only. [The B/1 visa](guide:b1-visa)",
        married(a)
          ? "Married couples usually get it for 6 months: the time the office has to interview you and decide on the A/5."
          : "Common-law couples usually get it for a year, and stay on B/1 for 3 years in all, renewing it with updated documents.",
      ],
      bubbles: [
        {
          tone: "important",
          title: "Ask for the inter-visa too",
          text: "The inter-visa (אינטר ויזה) is a second sticker that keeps the B/1 valid when the foreign partner travels abroad: without it, leaving Israel ends the visa. It's another 205 NIS. Get it with the visa, even if you don't plan to travel.",
        },
        {
          tone: "info",
          title: "No public health insurance yet",
          text: "A B/1 holder isn't a resident for National Insurance. The foreign partner needs private health insurance until A/5.",
        },
      ],
      faq: [
        {
          q: "Is it the same B/1 that foreign workers get?",
          a: "No. Foreign workers get a restricted B/1, for one employer or field. Partners get B/1 general, with no limit on the work they do.",
        },
      ],
    }),

    interview: (a) => ({
      title: married(a) ? "The interview, before the A/5" : "The interview, before the first B/1",
      short: "The interview",
      meta: [
        { icon: "people", text: "Both of you, one at a time" },
        { icon: "building", text: "Your Misrad Hapnim branch" },
      ],
      body: [
        `The interview is the office's main way to check that your relationship is genuine. ${
          married(a)
            ? "For married couples, it comes during the up to 6 months on B/1."
            : "For common-law couples, it comes before the first B/1 visa, once you're both in Israel."
        }`,
        "You're usually questioned one at a time, while the other waits outside, about your daily life: how you met, your families and friends, your work and money, your home, your last holiday together, and your plans. Then the answers are compared.",
        {
          list: [
            "**The language:** usually English for the foreign partner, and Hebrew for the Israeli partner. Not fluent in these? Tell the office as early as you can: it arranges a translator. You can't bring your own.",
            "**The record** is typed in Hebrew, and you're asked to sign it. If you don't read Hebrew, ask the clerk to translate it for you first.",
            "**Bring** the center-of-life documents and the evidence of your relationship you've gathered since you last sent documents.",
          ],
        },
      ],
      bubbles: [
        {
          tone: "tip",
          title: "Tell the truth, and it's fine not to remember",
          text: "A wrong answer stated firmly does more harm than \"I don't remember\". And give enough detail: \"a green dress with flowers\" matches your partner's \"a floral dress\" better than \"a green dress\" does.",
        },
        {
          tone: "info",
          title: "From a former Soviet country?",
          text: `Citizens of the former USSR, and people born there, are referred to Nativ: an online questionnaire, then a short interview at its offices in Jerusalem. ${
            married(a) ? "You complete it before moving up to A/5." : "It comes before the B/1 visa."
          } The waits are long: if you haven't heard back within a month, contact them.`,
        },
      ],
      faq: [
        {
          q: "Can someone come with us?",
          a: "Yes. The procedure lets you bring a person to accompany you, a lawyer for example.",
        },
        {
          q: "When do we hear back?",
          a: "Some offices decide on the spot, others take weeks or months. Ask the clerk when to expect it, and write to the office if you've heard nothing after 3 weeks.",
        },
      ],
    }),

    a5: (a) => ({
      title: "A/5, and then permanent status",
      short: "A/5 and beyond",
      milestone: { title: "You've got the A/5 visa", lead: "What you get now:", items: a5Gives },
      meta: [{ icon: "clock", text: married(a) ? "After up to 6 months on B/1" : "After 3 years on B/1" }],
      body: [
        "A/5 (א/5, often written A5) is temporary residency: the foreign partner becomes a temporary resident (תושב ארעי). [The A/5 visa](guide:a5-visa)",
        married(a)
          ? "Married couples move up to A/5 after up to 6 months on B/1. It's given first for a year, then extended every 2 years: 4 years in all. Then comes a choice between citizenship and permanent residency."
          : "Common-law couples move up to A/5 after 3 years on B/1, and stay on it for 4 years. Then comes permanent residency, with the option to apply for citizenship after it.",
        "At every renewal, you bring updated documents, and show again that your relationship is genuine and that you live together in Israel.",
      ],
      bubbles: [
        married(a)
          ? {
              tone: "info",
              title: "Married to a partner of the same sex?",
              text: "The track is the same: up to 6 months on B/1, then 4 years on A/5. At the end, you get permanent residency, and can then apply for citizenship.",
            }
          : {
              tone: "tip",
              title: "Getting married along the way?",
              text: "You move to the married track: on B/1, you can move up to A/5 once the file is converted and you're interviewed.",
            },
      ],
      faq: [
        {
          q: "How long is each visa given for?",
          a: "Since July 2026, visas after the first can be given for up to 2 years at a time. The office doesn't have to.",
        },
      ],
    }),
  },

  documents: {
    title: "The documents for your file",
    intro:
      "A general list for your situation, by subject. Your exact list also depends on the foreign partner's country, previous marriages, children and more.",
    groups: {
      forms: "Forms",
      identity: "Identity",
      relationship: "Your relationship",
      civilStatus: "Civil status and police certificate",
      lifeTogether: "Your life together",
    },
    items: {
      statusApplication: {
        name: "Status application",
        note: () => "With the declarations that go with it.",
        form: "Form AS/6",
      },
      jointAffidavit: {
        name: "Joint affidavit",
        note: () => "Signed by both of you, in front of the clerk at the appointment, not before.",
        form: "The affidavit form",
      },
      entryPermitApplication: {
        name: "Entry permit application",
        note: () => "So the foreign partner can enter Israel for the process.",
        form: "Form AS/1",
      },
      visaChangeApplication: {
        name: "Visa change application",
        note: () => "The foreign partner's application to change their visa category.",
        form: "Form AS/3",
      },
      relationshipLetter: {
        name: "Letter about your relationship",
        note: () => "How and when you met, and your life together, signed by both of you.",
      },
      israeliId: {
        name: "Teudat Zehut with its appendix",
        note: () => "The Israeli partner's ID card, with the appendix (ספח) that lists family members.",
      },
      passport: { name: "Passport", note: () => "The foreign partner's, valid for at least 2 more years." },
      photos: { name: "Passport photos", note: () => "Of each of you: recent, all copies of the same photo." },
      birthCertificate: { name: "Birth certificate", note: () => "The foreign partner's original, from the country of birth." },
      marriageCertificate: {
        name: "Marriage certificate",
        note: () => "From the country or authority that married you: certified, unless you married in Israel.",
      },
      photosTogether: { name: "Photos together", note: () => "From different places and times, some with family and friends." },
      messageHistory: {
        name: "Message and call history",
        note: () => "Up to 10 pages, from different times in your relationship.",
      },
      recommendationLetters: {
        name: "Letters of recommendation",
        note: () => "At least 3, in Hebrew, from Israeli family and friends.",
      },
      livingTogetherEvidence: {
        name: "Evidence of living together",
        note: () => "A shared lease or property, bills in both names, a joint bank account.",
      },
      civilStatus: {
        name: "Civil status and children",
        note: (a) =>
          married(a)
            ? "The foreign partner's status now and before your marriage, and their children. Issued in the last 6 months."
            : "The foreign partner's status, showing they're free to marry, and their children. Issued in the last 6 months.",
      },
      policeCertificate: {
        name: "Police certificate",
        note: () =>
          "From each country the foreign partner is a citizen of, or lived in for 6 months in a row. Issued in the last 6 months.",
      },
      lease: { name: "Lease or purchase contract", note: () => "Of the home you share or shared, in both your names." },
      bills: {
        name: "Bills for your home",
        note: (a) =>
          a.location === "bothInIsrael"
            ? "Electricity, water, arnona and the like, from the last 12 months."
            : "Electricity, water and the like, for the home you share or shared.",
      },
      israeliLease: { name: "Lease or purchase contract", note: () => "Of the Israeli partner's home, in their name." },
      israeliBills: {
        name: "Bills for the home",
        note: () => "Of the Israeli partner's home, in their name, from the last 12 months.",
      },
      ishurToshav: {
        name: "Municipality confirmation of your center of life",
        note: () => "Also called Ishur Toshav (אישור תושב).",
      },
      governmentServices: {
        name: "Proof of government services",
        note: () => "Services you receive in Israel: National Insurance, health, education.",
      },
      sharedBankAccount: { name: "Shared bank account", note: () => "A joint bank account confirmation." },
      bankStatements: {
        name: "Bank statements",
        note: () => "Of a shared account, or each of your own, for the last 12 months.",
      },
      salarySlips: {
        name: "Salary slips",
        note: () => "Of each of you. Self-employed: an accountant's confirmation of your income.",
      },
      healthInsurance: {
        name: "Health insurance",
        note: () => "For the foreign partner, who has no public health insurance until A/5.",
      },
    },
    rules: {
      title: "For every document from abroad",
      items: [
        "**The original,** with an apostille or consular legalization from the country that issued it.",
        "**A notarized translation into Hebrew,** if it isn't in Hebrew or Arabic. Clerks often accept English.",
        "**Photocopies** too, and copies of everything you send.",
      ],
    },
    depends: {
      title: "Depends on your case",
      intro: "Some documents depend on what this guide doesn't ask:",
      items: [
        "A name change",
        "Previous marriages, of either of you",
        "Children together, or children moving to Israel",
        "Other countries the foreign partner lived in",
        "The security screening, for Palestinian residents and citizens of Arab countries",
        "Extra evidence of your life together",
        "More proof of income",
      ],
      more: "…and more",
      cta: "Get your exact list, free",
    },
  },

  about: {
    title: "About this guide",
    body: "Written by Visamo from the official procedures of the Population and Immigration Authority, and from what couples went through in practice. Not legal advice.",
    sources: (a) => [
      married(a)
        ? { label: "Procedure 5.2.0008: status for a foreigner married to an Israeli citizen", url: "https://www.gov.il/BlobFolder/policy/status_foreigner_married_to_israeli_procedure/he/5.2.0008.pdf" }
        : { label: "Procedure 5.2.0009: status for common-law couples", url: "https://www.gov.il/BlobFolder/policy/israelis_couples_status_procedure/he/5.2.0009..pdf" },
      { label: "Procedure 5.1.0013: how interviews are conducted", url: "https://www.gov.il/BlobFolder/policy/making_interviews_procedure/he/5.1.0013.pdf" },
      { label: "The online application on gov.il", url: "https://www.gov.il/en/service/requesting-status-for-foreign-life-partner" },
    ],
  },

  share: { subtitle: "Every step, what to watch for, and the documents to gather." },

  cta: {
    eyebrow: "Before you file!",
    title: "One wrong document can cost you months.",
    body: "Every document the office sends back means another wait of weeks or months. Visamo builds the exact document list for your case, and checks each document before you file.",
    features: [
      {
        icon: "file",
        title: "Know what's missing",
        body: "Your exact document list, with each document explained: what it is, which office issues it in your country, how to get it, and how to certify and translate it. Free.",
      },
      {
        icon: "shield",
        title: "Catch what's wrong",
        body: "Full file check checks each document in seconds: dates, apostilles, translations, names. Every issue comes with how to fix it.",
      },
      {
        icon: "chat",
        title: "Ask what's unclear",
        body: "Every case is a bit different, and raises its own questions. Ask Visamo's AI assistant, built on the procedures and on how offices work in practice, in your own words and your language, day or night.",
      },
    ],
    button: "Get my exact list, free",
    microcopy: "No credit card. Independent software, not legal advice.",
  },
};
