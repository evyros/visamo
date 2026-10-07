import type { Guides } from "./types";

export const guidesEn: Guides = {
  labels: {
    guides: "Guides",
    updated: "Last updated",
    shortAnswer: "The short answer",
    onThisPage: "On this page",
    faq: "Questions couples ask",
    related: "Related guides",
    readingTime: "{minutes} min read",
  },
  index: {
    metaTitle: "Guides to the Israel Partner Visa",
    description:
      "Clear, up-to-date guides to the Israel partner visa: the graduated procedure, the B/1 and A/5 visas, and what to expect at each step.",
    title: "Guides to the Israel partner visa",
    intro:
      "Everything about getting status in Israel for the foreign partner of an Israeli, explained step by step, from what couples went through and the official procedures.",
  },
  docs: {
    "partner-visa-israel": {
      metaTitle: "Israel Partner Visa: The Complete Guide (2026)",
      description:
        "How the foreign partner of an Israeli gets status: the gradual process, B/1 to A/5, how long it takes for married and common-law couples, and who can apply.",
      facts: ["B/1 → A/5 → permanent status", "Married & common-law"],
      title: "The Israel partner visa: how it works, step by step",
      answer:
        "The foreign partner of an Israeli gets status in Israel through the **gradual process** (ההליך המדורג): a few years on temporary visas before permanent status. The foreign partner usually starts on a **B/1** visa, which lets them live and work in Israel, moves up to **A/5** temporary residency, and at the end gets citizenship or permanent residency. Married and common-law couples, same-sex couples included, can all apply.",
      updated: "2026-10-05",
      sections: [
        {
          id: "how-long",
          heading: "How long it takes",
          body: [
            "By the procedures, the process is measured in time, not in the number of visas. For a partner of an Israeli citizen:",
            {
              table: {
                head: ["Your track", "On B/1", "On A/5", "Then"],
                rows: [
                  ["Married, a man and a woman", "Up to 6 months", "4 years", "A choice between citizenship and permanent residency"],
                  ["Married, same sex", "Up to 6 months", "4 years", "Permanent residency, then you can apply for citizenship"],
                  ["Common-law", "3 years", "4 years", "Permanent residency, then you can apply for citizenship"],
                ],
              },
            },
            "Before any of this comes the wait for an answer to your application. It takes between a few weeks and a few months, depending on the Misrad Hapnim branch, and the appointment it gives may be months later. [How long each stage takes](guide:partner-visa-timeline)",
            "If you marry during the process, you move to the married track.",
          ],
        },
        {
          id: "tracks",
          heading: "Married or common-law: which track you're on",
          body: [
            {
              list: [
                "**Married couples** follow procedure 5.2.0008. Same-sex married couples go through it too.",
                "**Common-law couples** (ידועים בציבור), same-sex couples included, follow procedure 5.2.0009. It needs more proof that you live together, and proof that you're both free to marry. [The guide for common-law couples](guide:common-law-couples)",
              ],
            },
            "A partnership registered abroad, a Spanish pareja de hecho for example, goes through the common-law procedure: in Israel, you're a common-law couple.",
          ],
        },
        {
          id: "marriage",
          heading: "Marriages that count",
          body: [
            "Israel has no civil marriage: a marriage in Israel goes through a religious court, which usually needs you to share a religion. Couples who can't marry here marry abroad (in Cyprus, for example) or online (through Utah), and Israel registers the marriage.",
            "The civil union register in Israel, Brit Hazugiot (ברית הזוגיות), doesn't count for the gradual process.",
          ],
        },
        {
          id: "visas",
          heading: "The two visas",
          body: [
            "**B/1** (ב/1 כללי) is an unrestricted work visa marked \"partner\". The foreign partner can live with you in Israel and work in any field, as an employee or self-employed. It doesn't come with public health insurance. [More about the B/1 visa](guide:b1-visa)",
            "**A/5** (א/5) is temporary residency: an Israeli ID number, and the social rights of a resident, including public health insurance. [More about the A/5 visa](guide:a5-visa)",
          ],
        },
        {
          id: "steps",
          heading: "The steps, in order",
          body: [
            {
              steps: [
                "**Gather the documents,** starting with the ones from abroad: they take the longest. A document from abroad needs an apostille or consular legalization from the country that issued it, and often a translation. [Apostille and translation](guide:apostille-and-translation)",
                "**File the application online.** The Israeli partner logs in with the government's identification system, you upload the documents, and pay the fee for opening the file: 1,085 NIS in 2026.",
                "**Wait for an answer:** a request for more documents, or a first appointment at your Misrad Hapnim branch.",
                "**The first appointment.** The clerk goes over your original documents. If the foreign partner is abroad and everything is in order, the office grants the entry permit, at the appointment or a couple of weeks later, and the foreign partner comes to Israel. [The entry permit](guide:entry-permit)",
                "**The B/1 visa.** Married couples with a complete file get it without an interview. Common-law couples are interviewed first.",
                "**The interview.** Each of you answers questions about your daily life and your relationship, separately, and the answers are compared. For married couples, it comes before the A/5.",
                "**The A/5 visa,** and after it, permanent status.",
              ],
            },
            {
              note: "If the foreign partner is abroad, don't move to Israel as a tourist before the entry permit: coming as a tourist to stay goes against Israel's immigration policy. If you both live abroad, you start at the Israeli consulate in your country instead, and file after you arrive. [When you both live abroad](guide:both-partners-abroad)",
            },
          ],
        },
        {
          id: "sponsor",
          heading: "Who can sponsor",
          body: [
            {
              list: [
                "**An Israeli citizen.** A married partner of a different sex ends the process with a choice of citizenship or permanent residency. A common-law partner, or a married partner of the same sex, gets permanent residency first, and can then apply for citizenship.",
                "**A permanent resident** (תושב קבע). The foreign partner ends with permanent residency, not citizenship, and the check that your life is centered in Israel is usually stricter.",
                "**A temporary resident (A/5)** generally can't sponsor a partner.",
              ],
            },
          ],
        },
        {
          id: "not-for",
          heading: "Who this process isn't for",
          body: [
            {
              list: [
                "**A foreign partner who can immigrate under the Law of Return** (Jewish, or with a Jewish parent or grandparent) does that instead: a different and faster route.",
                "**Residents of the Palestinian territories, and citizens of Iran, Iraq, Syria and Lebanon,** fall under the Citizenship and Entry into Israel Law. Most can't use the gradual process.",
                "**Someone who has publicly called for a boycott of Israel,** denied the Holocaust or the October 7, 2023 massacre, or supported prosecuting Israeli soldiers or security personnel abroad or in an international court for their service: the Entry into Israel Law bars them from status in Israel.",
              ],
            },
          ],
        },
        {
          id: "closer-look",
          heading: "What the office looks at closely",
          body: [
            "The clerks have wide discretion in deciding whether a relationship is genuine. They look more closely at:",
            {
              list: [
                "A big age gap, or a short relationship.",
                "A couple who met only online, or one partner who depends on the other.",
                "An Israeli partner who sponsored a foreign partner before. It doesn't change the documents you need.",
              ],
            },
            "A couple who has never met in person is very unlikely to be approved: apply after you've met and spent time together. And the address in the Israeli partner's Teudat Zehut has to be where you really live: it's checked throughout the process.",
          ],
        },
      ],
      faq: [
        {
          q: "How long does the entry permit take?",
          a: "If the Israeli partner lives in Israel, it depends on your branch's backlog, how complete your file is, and the foreign partner's country. The faster branches usually grant it within a few weeks, and busy branches take a few months. It can't be predicted: plan for a few months.",
        },
        {
          q: "How long until we get an interview?",
          a: "It depends on your track. Common-law couples are interviewed before the first B/1 visa, once you're both in Israel: ask for the interview at the appointment where you show the original documents (procedure 5.2.0009, clause 10), or the office sets a date, which at busy branches can be up to a year away. Married couples aren't interviewed before the B/1: the first interview comes before the A/5, during the up to 6 months on B/1.",
        },
        {
          q: "Do we have to be married?",
          a: "No. Common-law couples (ידועים בציבור) apply through procedure 5.2.0009. You need more proof that you live together, and proof that you're both free to marry.",
        },
        {
          q: "Can same-sex couples apply?",
          a: "Yes, married or common-law. A married same-sex couple is on B/1 for up to 6 months, then A/5 for 4 years, then gets permanent residency, with the option to apply for citizenship after it.",
        },
        {
          q: "Can my partner work in Israel?",
          a: "Yes, from the B/1 visa: it's an unrestricted work visa, so they can work in any field, as an employee or self-employed.",
        },
        {
          q: "How much does it cost?",
          a: "In 2026, the fee for opening the file is 1,085 NIS, for married and common-law couples alike. The B/1 visa costs 205 NIS, and the inter-visa another 205 NIS. Getting, certifying and translating the documents costs extra.",
        },
        {
          q: "Can my partner come to Israel before we start the process?",
          a: "No, not to move here: the foreign partner needs an entry permit first. Coming as a tourist to stay and live together in Israel goes against Israel's immigration policy. A real visit before you file is fine.",
        },
      ],
      related: ["b1-visa", "a5-visa"],
      cta: {
        title: "Start with your personal document list",
        body: "Answer a few questions about the two of you, and see exactly which documents your file needs. Free.",
      },
    },

    "a5-visa": {
      metaTitle: "A/5 Visa in Israel for Partners: Rights and Timeline",
      description:
        "A/5 (A5, א/5) is temporary residency in Israel. When partners of Israelis get it on each track, what it gives you, how you move up from B/1, and what comes after.",
      facts: ["4 years", "Israeli ID", "Public health insurance"],
      title: "The A/5 visa: temporary residency for partners of Israelis",
      answer:
        "**A/5** (א/5, often written A5) is temporary residency in Israel. For the foreign partner of an Israeli, it's the second stage of the graduated procedure, after B/1: an Israeli ID number, and the social rights of a resident, including public health insurance. Married couples get it after up to 6 months on B/1, common-law couples after 3 years, and it lasts 4 years before permanent status.",
      updated: "2026-10-05",
      sections: [
        {
          id: "what-it-gives",
          heading: "What A/5 gives you",
          body: [
            "A/5 makes the foreign partner a temporary resident (תושב ארעי). Compared with the B/1 before it:",
            {
              table: {
                head: ["", "B/1 (ב/1 כללי)", "A/5 (א/5)"],
                rows: [
                  ["Status", "A work visa, marked \"partner\"", "Temporary resident"],
                  ["Israeli ID number", "No", "Yes"],
                  ["Resident for National Insurance", "No", "Yes"],
                  ["Public health insurance", "No: private insurance is needed", "Yes"],
                ],
              },
            },
          ],
        },
        {
          id: "when",
          heading: "When you get it",
          body: [
            {
              list: [
                "**Married, a man and a woman:** after up to 6 months on B/1, the time the office has to interview you and decide on the A/5.",
                "**Married, same sex:** after up to 6 months on B/1.",
                "**Common-law:** after 3 years on B/1.",
              ],
            },
            "If you marry while on B/1, you move to the married track: you can move up to A/5 once your file is converted and you're interviewed.",
          ],
        },
        {
          id: "interview",
          heading: "The interview before A/5",
          body: [
            "For married couples, the first interview comes before the A/5. It's the office's main way to check that your relationship is genuine.",
            {
              list: [
                "**Separately.** Even when it's called a shared interview, you're usually questioned one at a time, while the other waits outside.",
                "**The questions** are about your daily life: how you met, your families, your friends, your work and money, your home, your last holiday together, and your plans. Your answers are compared.",
                "**The language** is usually English for the foreign partner and Hebrew for the Israeli partner. If either of you isn't fluent, tell the office as early as you can: it arranges a translator. You can't bring your own.",
                "**The record** is typed in Hebrew, and you're asked to sign it. If you don't read Hebrew, ask the clerk to translate it before you sign.",
              ],
            },
            "Tell the truth, and if you don't remember something, say so rather than guess. Bring the documents about your life together and the evidence of your relationship you've gathered since you last sent documents.",
            "Some offices decide on the spot, others take weeks or months. Ask the clerk when to expect the decision, and write to the office if you've heard nothing after 3 weeks.",
          ],
        },
        {
          id: "health",
          heading: "Health insurance starts with A/5",
          body: [
            "With A/5, the foreign partner becomes a resident for National Insurance, and gets public health insurance. Until then, on B/1, they need private health insurance: [how couples arrange it](guide:b1-visa).",
          ],
        },
        {
          id: "after",
          heading: "After A/5",
          body: [
            "After 4 years on A/5:",
            {
              list: [
                "**Married to an Israeli citizen of a different sex:** a choice between citizenship and permanent residency.",
                "**Common-law, or married to an Israeli citizen of the same sex:** permanent residency, and then you can apply for citizenship.",
                "**Sponsored by a permanent resident:** permanent residency, not citizenship.",
              ],
            },
          ],
        },
        {
          id: "good-to-know",
          heading: "Good to know",
          body: [
            {
              list: [
                "**An A/5 holder generally can't sponsor a partner** of their own.",
                "**Your address is checked throughout the process.** The address in the Israeli partner's Teudat Zehut has to be where you really live.",
              ],
            },
          ],
        },
      ],
      faq: [
        {
          q: "What is the A/5 visa in Israel?",
          a: "A/5 (א/5) is temporary residency. In the partner process, it comes after the B/1 visa, and gives the foreign partner an Israeli ID number and the social rights of a resident, including public health insurance.",
        },
        {
          q: "Is A5 the same as A/5?",
          a: "Yes. It's the same visa, written either way. In Hebrew it's א/5, said \"alef chamesh\".",
        },
        {
          q: "How long does A/5 last?",
          a: "4 years on every track, before permanent status.",
        },
        {
          q: "When do married couples get A/5?",
          a: "After up to 6 months on B/1. That's the time the office has to interview you and decide on the A/5.",
        },
        {
          q: "When do common-law couples get A/5?",
          a: "After 3 years on B/1.",
        },
        {
          q: "Does A/5 include health insurance?",
          a: "Yes. With A/5, the foreign partner is a resident for National Insurance, and gets public health insurance. On B/1 they need private insurance.",
        },
      ],
      related: ["partner-visa-israel", "b1-visa"],
      cta: {
        title: "Getting ready for the A/5?",
        body: "Check every document in your file before your appointment, so a small mistake doesn't cost you months.",
      },
    },

    "b1-visa": {
      metaTitle: "B/1 Visa in Israel for Partners of Israelis",
      description:
        "Partners of Israelis get B/1 general, the unrestricted form of Israel's work visa. What it allows, how long it lasts for married and common-law couples, and how you move to A/5.",
      facts: ["Work in any field", "Up to 6 months or 3 years"],
      title: "The B/1 visa for partners of Israelis",
      answer:
        "B/1 is Israel's work visa. **Partners of Israelis get it in its general form, B/1 general** (ב/1 כללי), marked \"partner\": the foreign partner can live in Israel with you and work in any field, as an employee or self-employed. Foreign workers get a restricted B/1, for one employer or field. Married couples are on B/1 for up to 6 months, common-law couples for 3 years, before moving up to A/5.",
      updated: "2026-10-05",
      sections: [
        {
          id: "two-b1",
          heading: "The partner B/1 and the worker B/1",
          body: [
            {
              table: {
                head: ["", "Partner B/1 (ב/1 כללי)", "Worker B/1"],
                rows: [
                  ["Who gets it", "The foreign partner of an Israeli, in the graduated procedure", "A foreign worker"],
                  ["Work", "Any field, as an employee or self-employed", "One employer or field"],
                ],
              },
            },
            "**Already in Israel on a worker's B/1, with an Israeli partner?** File the partner application before your visa expires. Your current visa should be extended until the decision, as long as you keep to its terms. A caregiver who's still employed brings a letter from the employer saying they know about the application and agree to keep employing them; without an employer, the visa becomes a B/2 until the decision.",
          ],
        },
        {
          id: "what-it-allows",
          heading: "What B/1 lets you do, and what it doesn't",
          body: [
            {
              list: [
                "**Live in Israel** with your partner.",
                "**Work in any field,** as an employee or self-employed.",
                "**No public health insurance.** A B/1 holder isn't a resident for National Insurance. Public health insurance starts with A/5.",
              ],
            },
          ],
        },
        {
          id: "health",
          heading: "Health insurance on B/1",
          body: [
            "Until A/5, the foreign partner needs private health insurance, and the office may ask to see it. The usual ways:",
            {
              list: [
                "**A health fund's plan for non-residents,** for example Maccabi's plan for non-residents, or Meuhedet's plan for external members.",
                "**A partner's plan:** Clalit and Meuhedet offer a cheaper plan to the partner of an Israeli who's a member of that fund, married or not. You join together at the Israeli partner's branch, with a health declaration and proof of your relationship in Hebrew.",
                "**An insurance company in Israel:** health plans for foreigners and tourists.",
                "**A policy from abroad** that covers Israel. It's usually less convenient: you often pay for treatment yourself and claim it back.",
                "**Through work:** an employer may have to insure a worker on a B/1. Not every employer applies it to partners of Israelis, but it's worth asking.",
              ],
            },
            "The policy should name the foreign partner as the insured person, show the coverage period, and cover Israel.",
          ],
        },
        {
          id: "how-long",
          heading: "How long you're on B/1",
          body: [
            {
              table: {
                head: ["Your track", "On B/1", "Each B/1 visa, usually"],
                rows: [
                  ["Married", "Up to 6 months", "6 months"],
                  ["Common-law", "3 years", "A year"],
                ],
              },
            },
            "A common-law couple offered only 6 months can point the clerk to procedure 5.2.0009.",
          ],
        },
        {
          id: "getting-it",
          heading: "Getting the B/1",
          body: [
            "**If the foreign partner is in Israel,** you both come to the first appointment with the original documents, and the foreign partner files [form AS/3](https://www.gov.il/BlobFolder/generalpage/visas_forms/he/AS3.pdf) to change their visa.",
            {
              list: [
                "**Married couples:** if all the documents are there, the B/1 is issued at that appointment, without an interview. An office that asks a married couple with a complete file for an interview first is going against procedure 5.2.0008.",
                "**Common-law couples:** you're interviewed first. By procedure 5.2.0009 (clause 10, page 16), the interview is held, whenever possible, at the appointment where you show the original documents: ask for it. At the busiest branches, the wait for an interview can otherwise reach a year.",
              ],
            },
            "**If the foreign partner is abroad,** they come to Israel with [the entry permit](guide:entry-permit) and enter on a B/2 visa. Tell your branch as soon as they arrive: the office then calls you in to get the B/1, or sets a date for an interview.",
            "The B/1 is a sticker in the passport, issued and signed by your branch. In 2026 it costs 205 NIS, by credit card only.",
          ],
        },
        {
          id: "inter-visa",
          heading: "Ask for the inter-visa too",
          body: [
            "Without the inter-visa (אינטר ויזה), leaving Israel ends the B/1. It's a second sticker that keeps the main visa valid when the foreign partner travels abroad. Partners in the graduated procedure get it without trouble, with the same validity as the main visa, for another 205 NIS (2026).",
            { note: "Get the inter-visa with the B/1, even if you don't plan to travel." },
          ],
        },
        {
          id: "to-a5",
          heading: "Moving up to A/5",
          body: [
            "Married couples move up to A/5 after up to 6 months on B/1, once they're interviewed. Common-law couples move up after 3 years. If you marry while on B/1, you move to the married track. [All about the A/5 visa](guide:a5-visa)",
          ],
        },
      ],
      faq: [
        {
          q: "Can I work on a B/1 partner visa?",
          a: "Yes. The partner B/1 (ב/1 כללי) is an unrestricted work visa: any field, as an employee or self-employed.",
        },
        {
          q: "Does B/1 include health insurance?",
          a: "No. A B/1 holder isn't a resident for National Insurance, so they need private health insurance until A/5.",
        },
        {
          q: "How much does the B/1 visa cost?",
          a: "205 NIS in 2026, paid at the branch by credit card only. The inter-visa costs another 205 NIS.",
        },
        {
          q: "How long is a B/1 visa valid?",
          a: "Married couples usually get 6 months, the time the office has to interview them and decide on the A/5. Common-law couples usually get a year, and are on B/1 for 3 years.",
        },
        {
          q: "What is the inter-visa?",
          a: "A second sticker that keeps the main visa valid when the foreign partner travels abroad. Without it, leaving Israel ends the B/1. Get it with the visa.",
        },
        {
          q: "I'm on a worker's B/1 and have an Israeli partner. Can I switch?",
          a: "You can apply as a partner from Israel. File before your current visa expires: it should be extended until the decision, as long as you keep to its terms.",
        },
      ],
      related: ["partner-visa-israel", "a5-visa"],
      cta: {
        title: "Getting ready for your first appointment?",
        body: "Check every document in your file before you go, so a small mistake doesn't cost you months.",
      },
    },

    "partner-visa-timeline": {
      metaTitle: "How Long Does the Israel Partner Visa Take? (2026)",
      description:
        "Every stage of the Israel partner visa, from filing to permanent status: how long each wait usually is, for married and common-law couples, and what keeps a file from moving.",
      facts: ["Each stage, in order", "Married & common-law", "What causes delays"],
      title: "How long the Israel partner visa takes, stage by stage",
      answer:
        "For a married couple, the foreign partner is on a **B/1** visa for up to 6 months, then on **A/5** for 4 years, and then gets permanent status. For a common-law couple, it's 3 years on B/1, then 4 years on A/5. Before all this, getting the first answer to your application and the first appointment usually takes a few weeks to a few months, depending on your Misrad Hapnim branch.",
      updated: "2026-10-07",
      sections: [
        {
          id: "before",
          heading: "Before you file: the documents",
          body: [
            "Documents from abroad take the longest: each needs an apostille or consular legalization from the country that issued it, and often a translation. Some branches reject an application that's missing them instead of giving you time to complete it, so apply when the file is complete. [Apostille and translation](guide:apostille-and-translation)",
          ],
        },
        {
          id: "first-answer",
          heading: "From filing to the first appointment",
          body: [
            "Misrad Hapnim has no deadline for answering. The first answer usually takes a few weeks to a few months, depending on the branch, and the appointment it gives may be months later.",
            "The answer is either a request for more documents, or a first appointment at your branch.",
            {
              note: "No answer after a month? Don't email: go to your branch in person, at the walk-in hours, with both your names, your ID and passport numbers, and the reference number.",
            },
          ],
        },
        {
          id: "missing",
          heading: "If a document is missing: 45 days",
          body: [
            "If a document, a translation or a certification is missing, the office tells you which, and gives you **45 calendar days** to bring it. You can ask for more time. Until it's in, the file doesn't move. If it doesn't come, the office can close the file.",
          ],
        },
        {
          id: "entry-permit",
          heading: "The entry permit, if the foreign partner is abroad",
          body: [
            "The permit is granted at the first appointment, or by phone or email a couple of weeks later. How long the whole wait takes depends on your branch's backlog, how complete your file is, and the foreign partner's country: from a few weeks at the faster branches to a few months at busy ones. Plan for a few months. [All about the entry permit](guide:entry-permit)",
          ],
        },
        {
          id: "b1",
          heading: "Getting the B/1",
          body: [
            {
              list: [
                "**Married couples** with a complete file get the B/1 at the first appointment where you're both in Israel, without an interview.",
                "**Common-law couples** are interviewed first. Ask for the interview at the appointment where you show the original documents (procedure 5.2.0009, clause 10). Otherwise the office sets a date, and at the busiest branches the wait can reach a year.",
              ],
            },
            "If the foreign partner came from abroad with the entry permit, tell your branch as soon as they arrive: the office then calls you in to get the B/1, or sets a date for an interview. [All about the B/1](guide:b1-visa)",
          ],
        },
        {
          id: "interview",
          heading: "The interview and the decision",
          body: [
            "For married couples, the first interview comes before the A/5, within the up to 6 months on B/1. After the interview, some offices decide on the spot, others take weeks or months. Ask the clerk when to expect the decision, and write to the office if you've heard nothing after 3 weeks. [All about the A/5](guide:a5-visa)",
          ],
        },
        {
          id: "delays",
          heading: "What slows a file down",
          body: [
            "Most delays come from the **rejection loop**: the office rejects a document and asks for it again, you fix it and send it, and the file waits in line again. Every round adds weeks, sometimes months.",
            "Take the police certificate. It's rejected when:",
            {
              list: [
                "It was issued more than 6 months before you filed.",
                "It's a digital certificate printed at home, not the paper original.",
                "It's missing the apostille, or a translation the clerk asks for.",
                "It doesn't cover every name the foreign partner has had.",
                "The foreign partner traveled abroad after it was issued, before getting the B/1. Misrad Hapnim knows every exit and entry, and the certificate doesn't cover the time abroad: they need a new one from their country of origin, and the loop starts again.",
              ],
            },
            "The same goes for every document in the file. Other things that hold a file up:",
            {
              list: [
                "**The wrong branch.** The application goes to the branch of the address in the Israeli partner's Teudat Zehut. If you moved, update the address before you file.",
                "**The Israeli partner being abroad.** The office is unlikely to move the file forward while they're abroad for long.",
                "**Waiting quietly.** If you've heard nothing after a month, go to the branch in person, at the walk-in hours.",
              ],
            },
          ],
        },
      ],
      faq: [
        {
          q: "How long until we get a first answer?",
          a: "Usually a few weeks to a few months, depending on the branch. The appointment it gives may be months later.",
        },
        {
          q: "How long does the entry permit take?",
          a: "From a few weeks at the faster branches to a few months at busy ones. It can't be predicted: plan for a few months.",
        },
        {
          q: "How long until we get an interview?",
          a: "Common-law couples are interviewed before the first B/1: ask for it at the appointment where you show the original documents, or the wait can reach a year at busy branches. Married couples are interviewed before the A/5, during the up to 6 months on B/1.",
        },
        {
          q: "Can we speed it up?",
          a: "File only when the file is complete, make sure the Israeli partner's address is up to date, don't travel abroad between the police certificate and the B/1, and after a month of silence go to the branch in person. A common-law couple can ask for the interview at the appointment where they show the original documents.",
        },
      ],
      related: ["partner-visa-israel", "entry-permit"],
      cta: {
        title: "Don't lose months to a missing document",
        body: "Get your personal document list, and check every document before you file. Start free.",
      },
    },

    "common-law-couples": {
      metaTitle: "Israel Partner Visa for Common-Law Couples (Not Married)",
      description:
        "Not married? Common-law couples (ידועים בציבור), same-sex couples included, apply through procedure 5.2.0009. What you need to prove, the joint affidavit, the interview and the timeline.",
      facts: ["Procedure 5.2.0009", "3 years on B/1", "Same-sex couples too"],
      title: "The partner visa for common-law couples (ידועים בציבור)",
      answer:
        "You don't have to be married. **Common-law couples** (ידועים בציבור), same-sex couples included, get status through procedure 5.2.0009. You need more proof that you live together, and proof that you're both free to marry. The foreign partner is on a **B/1** visa for 3 years, then on **A/5** for 4 years, and then gets permanent residency, with the option to apply for citizenship after it.",
      updated: "2026-10-07",
      sections: [
        {
          id: "who",
          heading: "Who it's for",
          body: [
            {
              list: [
                "**Couples who live together without marrying,** of different sexes or the same sex.",
                "**Couples with a partnership registered abroad,** a Spanish pareja de hecho for example: in Israel, you're a common-law couple.",
              ],
            },
            "Registering in Brit Hazugiot (ברית הזוגיות), Israel's civil union register, doesn't count for the gradual process.",
            "If you marry during the process, you move to the married track. [How marriage changes the process](guide:partner-visa-israel)",
          ],
        },
        {
          id: "proof",
          heading: "What you need to prove",
          body: [
            "**That you live together.** Documents that put you both at the same address: a lease or property in both your names, bills in both your names, statements of a joint bank account, and official mail addressed to each of you there.",
            {
              list: [
                "**You live together in Israel:** covering at least the last 12 months.",
                "**You lived together abroad:** the same kinds of documents, from the home you shared there.",
                "**You haven't lived together:** a stronger case that your relationship is genuine: receipts for things you bought together, letters from people who saw you together, flight and hotel bookings for the two of you, and your message and call history.",
              ],
            },
            "**That you're both free to marry.** For the foreign partner, an official document of their civil status, issued in the last 6 months. [Apostille and translation](guide:apostille-and-translation)",
            {
              note: "The procedures ask for a shared life of at least the last year, but it isn't a condition for applying. A shorter relationship is processed normally: what decides it is whether you can show the relationship is genuine.",
            },
          ],
        },
        {
          id: "affidavit",
          heading: "The joint affidavit",
          body: [
            "Instead of the affidavits in form AS/6, which are for married couples, you both sign one declaration: [the common-law affidavit](https://www.gov.il/BlobFolder/generalpage/visas_forms/he/5.2.0009_a.pdf) (form 5.2.0009_a). It's in Hebrew, so it needs no translation.",
            {
              steps: [
                "Print it, and fill in your full names, the Israeli partner's ID number and the foreign partner's passport number.",
                "**Don't sign it, and don't send it with the online application.** Bring it to your appointment.",
                "At the appointment, you both sign it in front of the clerk, who confirms your signatures.",
              ],
            },
          ],
        },
        {
          id: "applying",
          heading: "Applying",
          body: [
            "In the online application, choose **shared life** (חיים משותפים). The fee for opening the file is the same as for married couples: 1,085 NIS in 2026.",
          ],
        },
        {
          id: "interview",
          heading: "The interview comes first",
          body: [
            "Unlike married couples, common-law couples are interviewed **before the first B/1 visa**, once you're both in Israel. By procedure 5.2.0009 (clause 10, page 16), the interview is held, whenever possible, at the appointment where you show the original documents: ask the clerk for it, and point them to that clause. Otherwise the office sets a date, and at the busiest branches the wait can reach a year.",
          ],
        },
        {
          id: "timeline",
          heading: "The timeline",
          body: [
            {
              list: [
                "**B/1 for 3 years.** Each B/1 visa is usually given for a year. If you're offered only 6 months, point the clerk to procedure 5.2.0009.",
                "**A/5 for 4 years.**",
                "**Then permanent residency,** and you can apply for citizenship after it.",
              ],
            },
            "[How long each stage takes](guide:partner-visa-timeline)",
          ],
        },
      ],
      faq: [
        {
          q: "Can we get a partner visa without being married?",
          a: "Yes. Common-law couples (ידועים בציבור) apply through procedure 5.2.0009, with more proof that they live together and proof that they're both free to marry.",
        },
        {
          q: "Do we have to have lived together for a year?",
          a: "No. The procedures ask for a shared life of at least the last year, but it isn't a condition for applying. A shorter relationship is processed normally, as long as you can show it's genuine.",
        },
        {
          q: "Does a registered partnership from abroad count as a marriage?",
          a: "No. A partnership registered abroad, like a Spanish pareja de hecho, goes through the common-law procedure.",
        },
        {
          q: "Does Brit Hazugiot count?",
          a: "No. The civil union register in Israel doesn't count for the gradual process.",
        },
        {
          q: "Can same-sex couples apply as common-law partners?",
          a: "Yes. Procedure 5.2.0009 covers common-law couples, same-sex couples included.",
        },
        {
          q: "What happens if we marry during the process?",
          a: "You move to the married track. On B/1, you can move up to A/5 once the file is converted and you're interviewed.",
        },
      ],
      related: ["partner-visa-israel", "partner-visa-timeline"],
      cta: {
        title: "Build a strong common-law file",
        body: "Get the document list for your exact situation, and check every document before you file. Start free.",
      },
    },

    "entry-permit": {
      metaTitle: "Israel Entry Permit for a Foreign Partner (Hazmana)",
      description:
        "Before the foreign partner moves to Israel, they need an entry permit (היתר כניסה, the hazmana). The two ways to get it, how long it takes, how to travel with it, and visiting before you file.",
      facts: ["Before moving to Israel", "Form AS/1", "Plan for a few months"],
      title: "The entry permit: how the foreign partner moves to Israel",
      answer:
        "Before the foreign partner moves to Israel, they need an **entry permit** (היתר כניסה): Misrad Hapnim's approval to come to Israel and continue the process here. People also call it the **hazmana** (הזמנה, the invitation) or the asmachta (אסמכתא). If the Israeli partner lives in Israel, you file online and the branch grants it. If you both live abroad, you ask for it at the Israeli consulate.",
      updated: "2026-10-07",
      sections: [
        {
          id: "two-ways",
          heading: "Two ways to get it",
          body: [
            {
              list: [
                "**The Israeli partner lives in Israel:** you file the application online, with the [entry permit application, form AS/1](https://www.gov.il/BlobFolder/generalpage/visas_forms/he/AS1.pdf). The Israeli partner goes to the first appointment alone, and the branch grants the permit at the appointment, or by phone or email a couple of weeks later.",
                "**You both live abroad:** you ask for it at the Israeli consulate in your country, before anything is filed in Israel, and file online within 30 days of the foreign partner's entry. [When you both live abroad](guide:both-partners-abroad)",
              ],
            },
            "At the first appointment, the office may instead ask for missing documents (you get 45 days to bring them), or for a **simultaneous interview**: the Israeli partner at the branch and the foreign partner at the Israeli consulate where they live, at the same time.",
          ],
        },
        {
          id: "not-as-tourist",
          heading: "Don't come as a tourist instead",
          body: [
            "The foreign partner can come to Israel as a tourist when the purpose is a visit. If the purpose is to stay and live together in Israel, they need the entry permit first: coming as a tourist with that intention goes against Israel's immigration policy.",
            {
              list: [
                "**If you both live abroad,** don't fly in together as tourists. A foreign partner who arrives with the Israeli partner without the permit is likely to be suspected of coming to stay, stopped at border control, and flown back.",
                "**Once you've filed,** the foreign partner is likely to be refused entry if they try to visit as a tourist, even from a visa-exempt country: they're marked as someone waiting for an entry permit. They wait abroad until it's granted.",
              ],
            },
            {
              note: "Once you've started the process, it's best for the foreign partner not to come to Israel until the entry permit is granted. As hard as that is, it makes the process smoother.",
            },
          ],
        },
        {
          id: "how-long",
          heading: "How long it takes",
          body: [
            "It depends on your branch's backlog, how complete your file is, and the foreign partner's country: from a few weeks at the faster branches to a few months at busy ones. It can't be predicted: plan for a few months.",
            "**Trying to speed it up.** If your relationship rests on strong ground, with proof that you've lived together abroad, the Israeli partner can go to the branch without an appointment, early in the morning before it opens, explain your situation with all the proof, and ask for the entry permit, or even a B/1 visa. The branch may refuse and tell you to file online.",
          ],
        },
        {
          id: "traveling",
          heading: "Traveling with the permit",
          body: [
            {
              list: [
                "**Citizens of a visa-exempt country** can fly as soon as they have the permit, with an ETA-IL. In the ETA-IL application, choose \"Visit (tourism)\" as the purpose and \"up to 90 days\" as the length of stay. In practice, no written proof of the permit is needed at the border.",
                "**Citizens of a country that needs a visa to Israel** go to the Israeli consulate where they live, to get a B/2 visa in their passport.",
                "**When to come:** offices usually expect the foreign partner to enter within 3 months of the permit. Tell your clerk the date you plan to arrive, and ask them to confirm it.",
              ],
            },
            "Some airlines won't fly a foreigner to Israel without a return ticket: check before you book a one-way ticket.",
          ],
        },
        {
          id: "after",
          heading: "After the foreign partner arrives",
          body: [
            "They enter on a B/2 visa, as a status in between. Tell your branch as soon as they arrive, by email or in person: the office then calls you in to get the B/1 visa, or sets a date for an interview. [All about the B/1](guide:b1-visa)",
          ],
        },
        {
          id: "visiting",
          heading: "Visiting before you file",
          body: [
            "No foreigner has an automatic right to enter Israel, and an approved ETA-IL doesn't guarantee entry. Having an Israeli partner isn't a reason to refuse entry, but border control may suspect the visitor means to stay. The risk is higher for a citizen of a non-Western country, on a first visit, after frequent or long visits, for a young visitor, and with weak ties at home.",
            "If several of these apply, or the foreign partner was refused entry before, the Israeli partner can ask Misrad Hapnim to **approve the visit in advance** (a tourist invitation):",
            {
              list: [
                "Apply at the visa department of your branch, at least 21 working days before the visit.",
                "The office may ask for a deposit, to guarantee the visitor leaves on time. It's returned once they leave.",
                "It's a separate request from the entry permit, though both are called an \"invitation\" (הזמנה).",
              ],
            },
            "**If entry is refused at the border,** the foreign partner has 30 days to appeal to the Appeals Tribunal, even without the paper with the decision. In practice, hire an immigration lawyer. After a refusal, every later entry needs approval in advance, but you can still start the partner process.",
          ],
        },
      ],
      faq: [
        {
          q: "What is the hazmana?",
          a: "It's what people call the entry permit (היתר כניסה): Misrad Hapnim's approval for the foreign partner to come to Israel and continue the process here.",
        },
        {
          q: "How long does the entry permit take?",
          a: "From a few weeks at the faster branches to a few months at busy ones. Plan for a few months.",
        },
        {
          q: "Can my partner visit while we wait for the permit?",
          a: "Once you've filed, they're likely to be refused entry if they try to visit as a tourist: they wait abroad until the permit is granted.",
        },
        {
          q: "Does my partner need a visa to fly to Israel with the permit?",
          a: "From a visa-exempt country, no: they fly with an ETA-IL. From a country that needs a visa to Israel, they get a B/2 visa at the Israeli consulate where they live.",
        },
        {
          q: "How soon after the permit does my partner have to come?",
          a: "There's no deadline in the procedures, but offices usually expect them within 3 months. Tell your clerk the date you plan to arrive.",
        },
        {
          q: "Does the Israeli partner have to go to the first appointment?",
          a: "Yes. If the foreign partner is abroad, the Israeli partner goes alone.",
        },
      ],
      related: ["both-partners-abroad", "partner-visa-timeline"],
      cta: {
        title: "Get the entry permit on the first try",
        body: "Check every document in your file before you file, so a missing paper doesn't add months apart. Start free.",
      },
    },

    "both-partners-abroad": {
      metaTitle: "Moving to Israel Together: When Both Partners Live Abroad",
      description:
        "If you both live abroad, the partner visa starts at the Israeli consulate in your country, not in Israel. How the consulate step works, what to bring, and what happens after you arrive.",
      facts: ["Start at the consulate", "Entry permit first", "File after you arrive"],
      title: "When you both live abroad: starting at the Israeli consulate",
      answer:
        "If you both live abroad and want to move to Israel, you start at the **Israeli consulate or embassy** in your country, not at a Misrad Hapnim branch. You ask there for an **entry permit** for the foreign partner. Once it's approved, the consulate puts an entry visa in their passport, you travel to Israel together, and you file the full application online after you arrive.",
      updated: "2026-10-07",
      sections: [
        {
          id: "permit-first",
          heading: "The entry permit comes first",
          body: [
            "You're coming to stay and start the process, so the foreign partner needs an entry permit before you move. Don't fly in together as tourists instead: a foreign partner who arrives with the Israeli partner without the permit is likely to be stopped at border control and flown back. [All about the entry permit](guide:entry-permit)",
          ],
        },
        {
          id: "consulate",
          heading: "At the consulate",
          body: [
            {
              steps: [
                "**Book an appointment** at the Israeli consulate or embassy. It's in person, and both of you usually need to come. Contact it before you have every document: it gives you its list of documents and sets the dates.",
                "**Ask for an entry permit,** saying plainly that it's to move to Israel and start the gradual process (ההליך המדורג).",
                "**The consulate passes it on.** It can't grant the partner visa itself: it reviews your documents, does a first check, and sends the request to the Population and Immigration Authority in Israel.",
                "**The Authority decides.** Once it approves the entry, it tells the consulate, which gives the foreign partner an entry visa, usually a B/2 visa, valid for a set period.",
              ],
            },
          ],
        },
        {
          id: "documents",
          heading: "What to bring",
          body: [
            "The consulate turns down a request with missing or incomplete documents. Bring the originals, with an apostille or consular legalization, translated into Hebrew or English:",
            {
              list: [
                "**Personal status:** the foreign partner's birth certificate, and a civil-status certificate issued in the last 6 months. If you aren't married, it should show they're free to marry.",
                "**A police certificate** from the foreign partner's country.",
                "**Proof of your life together.** Since you live abroad, it has to be strong: leases, joint bank accounts, bills, your history of text messages, and photos that show a real, ongoing life together.",
                "**Where you'll live in Israel** during the stay.",
                "**Insurance** covering the whole stay in Israel.",
                "**A confirmation of employment** from the Israeli partner's employer.",
                "**Two recent passport photos,** the same photo twice: in color, on a white background, full face from the front.",
                "**A bank statement** covering at least 3 months.",
              ],
            },
            { note: "It's best to contact your consulate first, even before you start collecting documents, to get its up-to-date list." },
          ],
        },
        {
          id: "after",
          heading: "After you arrive",
          body: [
            "Once the visa is in the foreign partner's passport, you can travel to Israel together. After you arrive, file the full status application online with your local Misrad Hapnim branch, **within 30 days of the foreign partner's entry**. The entry permit alone doesn't start the process. From there, the process is the same as for a partner who's already in Israel: the first appointment, then the B/1 visa. [All about the B/1](guide:b1-visa)",
            "An interview at the consulate is only for the entry permit: it doesn't replace the interview in Israel.",
          ],
        },
      ],
      faq: [
        {
          q: "We both live abroad. Where do we start?",
          a: "At the Israeli consulate or embassy in your country of residence, not at a Misrad Hapnim branch in Israel.",
        },
        {
          q: "Can we just fly to Israel together and apply there?",
          a: "No. Coming to stay without the entry permit goes against Israel's immigration policy, and the foreign partner is likely to be stopped at the border and flown back.",
        },
        {
          q: "Does the consulate grant the partner visa?",
          a: "No. It reviews your documents and sends the request to the Population and Immigration Authority in Israel, which decides on the entry permit.",
        },
        {
          q: "Do our documents need a Hebrew translation for the consulate?",
          a: "They need to be translated into Hebrew or English, with an apostille or consular legalization on the originals.",
        },
        {
          q: "How soon after we arrive do we have to file?",
          a: "Within 30 days of the foreign partner's entry into Israel, online, with your local Misrad Hapnim branch.",
        },
        {
          q: "Does the consulate interview replace the one in Israel?",
          a: "No. It's only for the entry permit. You go through the interview in Israel after you arrive.",
        },
      ],
      related: ["entry-permit", "partner-visa-israel"],
      cta: {
        title: "Planning the move together?",
        body: "Get the document list for your situation, and check every document before the consulate sees it. Start free.",
      },
    },

    "apostille-and-translation": {
      metaTitle: "Apostille and Translation for the Israel Partner Visa",
      description:
        "Documents from abroad need an apostille or consular legalization, and often a notarized translation. Which documents, who translates them, when English is accepted, and how to avoid a rejected document.",
      facts: ["Apostille or legalization", "Notarized translation", "Originals only"],
      title: "Apostille and translation for the Israel partner visa",
      answer:
        "A document from abroad needs an **apostille** (or, from countries outside the Hague Convention, **consular legalization**) from the country that issued it: it can't be done in Israel. Misrad Hapnim accepts only Hebrew and Arabic without a translation, so other documents need a **notarized translation**, though in practice English is often accepted. Bring the originals: copies aren't accepted.",
      updated: "2026-10-07",
      sections: [
        {
          id: "apostille",
          heading: "Apostille or consular legalization",
          body: [
            {
              list: [
                "**From a Hague Apostille Convention country** (the US, most of Europe and many others): an **apostille** from that country.",
                "**From any other country:** **consular legalization**, a longer chain of signatures (שרשרת חתימות): the authority that issued the document, then usually the country's ministry of justice and its foreign ministry, and last the Israeli consulate there.",
              ],
            },
            "Only the country that issued a document can certify it.",
          ],
        },
        {
          id: "originals",
          heading: "Originals, and how to order them",
          body: [
            {
              list: [
                "**Bring the originals.** Misrad Hapnim accepts only the originals with their certification. A copy is accepted only when the original can't be had, like an old birth certificate.",
                "**The originals have to be in Israel for the first appointment,** even if the foreign partner is still abroad: send them by courier to the Israeli partner in time.",
                "**Ask for a paper document \"for use abroad\".** Many offices reject a document printed at home or downloaded online, and many countries won't put an apostille on one. Ask for the printed original, with a handwritten signature or official stamp.",
                "**Don't separate the apostille from the document.** It's usually attached to it, and separating them voids it.",
                "**Order a few copies of each document.** You may need another one later.",
              ],
            },
          ],
        },
        {
          id: "translation",
          heading: "Translation",
          body: [
            "By law, Misrad Hapnim accepts only **Hebrew and Arabic** without a translation. A document in any other language needs a **notarized translation** (תרגום נוטריוני).",
            "**English, in practice:** most clerks read English well enough to accept an English document without a translation, especially a short one. It depends on the clerk. If they don't accept it, they'll ask you to translate it and give you time. The checklist of form AS/6 itself says public documents need a notarized translation into Hebrew \"except from Arabic and English\", which you can point a clerk to.",
            {
              list: [
                "**What's translated:** the document, and the apostille or legalization on it too. An apostille in English, or that includes English, usually needs no translation.",
                "**Who translates:** a notary who knows both languages and translates it themselves. A translation someone else made, which a notary only approved, isn't accepted. Translate from the document's own language straight into Hebrew.",
                "**Translate into Hebrew, not English.** A translation into English is a risk: the clerk handling your file may not read English well enough to accept it. Hebrew is the safest choice, and makes for a smoother process.",
                "**If no notary in Israel knows the language,** a double translation is allowed: first into a third language abroad (English, say), then into Hebrew in Israel.",
                "**Your own evidence** (chats, emails, letters from friends) doesn't need a notary. If it isn't in Hebrew or English, translate it yourselves, or mark the important parts and explain them.",
              ],
            },
          ],
        },
        {
          id: "in-israel",
          heading: "Translate in Israel",
          body: [
            "A translation done in Israel needs no apostille: only the original document does. A notarized translation done abroad needs an apostille of its own, from the country where it was made, and is sometimes not accepted for other reasons. So a document translated abroad ends up with two apostilles.",
          ],
        },
        {
          id: "marriage",
          heading: "Your marriage certificate",
          body: [
            "A marriage in Israel, through the rabbinate or another religious court, is already registered: its certificate needs no certification or translation. A certificate from another country, or from an online marriage, is certified and, if needed, translated, like any other document from abroad.",
          ],
        },
        {
          id: "affidavits",
          heading: "Affidavits",
          body: [
            "An affidavit (תצהיר) is a written statement you sign in front of someone the law authorizes to confirm it. It's how you prove a fact no official document shows, for example when a country doesn't issue a civil-status certificate.",
            {
              list: [
                "**In Israel,** any Israeli lawyer can confirm one. So can the magistrate's court, at its secretariat or through its duty lawyer, without an appointment, for a small fixed fee.",
                "**A notarial affidavit** is made only in front of a notary. If you're asked for one, a lawyer's isn't enough.",
                "**Made abroad in front of a local notary:** accepted, with that country's apostille or legalization.",
                "**Sign it only in front of whoever confirms it,** never before, and only once you understand what it says.",
              ],
            },
          ],
        },
      ],
      faq: [
        {
          q: "Can I get an apostille in Israel for a foreign document?",
          a: "No. Only the country that issued the document can certify it, with an apostille or consular legalization.",
        },
        {
          q: "Do English documents need a translation?",
          a: "By law, yes: only Hebrew and Arabic are accepted without one. In practice, most clerks accept English documents, especially short ones. If yours doesn't, they'll give you time to translate.",
        },
        {
          q: "Does the apostille need to be translated too?",
          a: "Yes, with the document. An apostille in English, or that includes English, usually doesn't.",
        },
        {
          q: "Can I translate the documents myself?",
          a: "Official documents, no: they need a notarized translation by a notary who translates them personally. Your own evidence, like chats or letters from friends, you can translate yourselves.",
        },
        {
          q: "Should we translate in Israel or abroad?",
          a: "In Israel. A translation done in Israel needs no apostille of its own. One done abroad does, and is sometimes not accepted.",
        },
        {
          q: "Are copies accepted?",
          a: "No, only the originals with their certification. A copy is accepted only when the original can't be had.",
        },
      ],
      related: ["partner-visa-israel", "partner-visa-timeline"],
      cta: {
        title: "Is every document certified right?",
        body: "Check each document, its apostille and its translation before you file. Start free.",
      },
    },
  },
};
