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
            "Before any of this comes the wait for an answer to your application. It takes between a few weeks and a few months, depending on the Misrad Hapnim branch, and the appointment it gives may be months later.",
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
                "**Common-law couples** (ידועים בציבור), same-sex couples included, follow procedure 5.2.0009. It needs more proof that you live together, and proof that you're both free to marry.",
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
                "**Gather the documents,** starting with the ones from abroad: they take the longest. A document from abroad needs an apostille or consular legalization from the country that issued it, and often a translation.",
                "**File the application online.** The Israeli partner logs in with the government's identification system, you upload the documents, and pay the fee for opening the file: 1,085 NIS in 2026.",
                "**Wait for an answer:** a request for more documents, or a first appointment at your Misrad Hapnim branch.",
                "**The first appointment.** The clerk goes over your original documents. If the foreign partner is abroad and everything is in order, the office grants the entry permit, at the appointment or a couple of weeks later, and the foreign partner comes to Israel.",
                "**The B/1 visa.** Married couples with a complete file get it without an interview. Common-law couples are interviewed first.",
                "**The interview.** Each of you answers questions about your daily life and your relationship, separately, and the answers are compared. For married couples, it comes before the A/5.",
                "**The A/5 visa,** and after it, permanent status.",
              ],
            },
            {
              note: "If the foreign partner is abroad, don't move to Israel as a tourist before the entry permit: coming as a tourist to stay goes against Israel's immigration policy. If you both live abroad, you start at the Israeli consulate in your country instead, and file after you arrive.",
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
            "**If the foreign partner is abroad,** they come to Israel with the entry permit and enter on a B/2 visa. Tell your branch as soon as they arrive: the office then calls you in to get the B/1, or sets a date for an interview.",
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
  },
};
