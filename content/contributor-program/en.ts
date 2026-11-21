import type { ContributorTexts } from "./types";

export const contributorEn: ContributorTexts = {
  metaTitle: "Contributor program: Full file check for {price}",
  description:
    "Visamo's team never looks at your documents. In the Contributor program, you give us your consent to, and get Full file check for {price} instead of {regular}.",
  hero: {
    eyebrow: "Contributor program",
    title: "Help us improve Visamo.",
    titleAccent: "Get Full file check for {price}.",
    subtitle:
      "Your files are kept encrypted, and no one at Visamo opens them. In the Contributor program, you give us your consent to look at them, and Full file check is {price} instead of {regular}.",
    cta: "Contact us to join",
    terms: "Read the terms",
  },
  consent: {
    title: "One thing changes: your consent.",
    without: {
      label: "Without the program",
      title: "Your documents stay closed",
      body: "They're kept encrypted, and every access is audited, so no one on Visamo's team can open them.",
      price: "Full file check: {regular}",
    },
    with: {
      label: "In the Contributor program",
      title: "You let us look",
      body: "You give us your consent to look at your documents, so we can add the offices that issue each document, in every country, to our list, and make Visamo's document checks sharper.",
      price: "Full file check: {price}",
    },
    note: "You're not in the Contributor program unless you ask to join it. Signing up to Visamo, or buying Full file check, doesn't add you to it.",
  },
  why: {
    title: "Why we need your documents",
    items: [
      {
        icon: "building",
        title: "Who issues each document",
        body: "Every country issues documents from different offices: civil registries, courts, police. Your documents show us which office issues what, in each country.",
      },
      {
        icon: "people",
        title: "Who certifies and translates them",
        body: "Clerks and notaries abroad, translators, and the stamps each one uses. Knowing them helps us recognize a valid certification or translation, and grow our list of translators and officials in each country.",
      },
      {
        icon: "checkCircle",
        title: "Better checks for every couple",
        body: "What we learn goes into the document check for everyone, including you, for the rest of your process.",
      },
    ],
  },
  steps: {
    title: "How to join",
    formLink: "contact form",
    items: [
      {
        title: "Send us a message",
        body: "Fill in the {form} with the email address you registered with on Visamo.",
      },
      {
        title: "We guide you through it",
        body: "Our team replies and asks each of you to agree.",
      },
      {
        title: "Get Full file check for {price}",
        body: "You get Full file check at the program price: every document, checked, for your whole process. To keep the price, upload at least 2 documents issued abroad within 3 months.",
      },
    ],
  },
  promises: {
    eyebrow: "Your documents stay yours",
    title: "What we promise",
    items: [
      { icon: "eye", title: "Looked at once", body: "Each document is looked at one time, by our team only." },
      { icon: "folder", title: "Never copied", body: "Your documents stay in your file. We don't save them anywhere else." },
      { icon: "shield", title: "Never used to train AI", body: "Your documents are never used to train AI models." },
      { icon: "pen", title: "We note the document, not you", body: "Who issued it and how it looks. Never your names or ID numbers." },
    ],
    link: "Read the full terms",
  },
  final: {
    title: "Help us improve Visamo, and save {saving}.",
    optional: "Joining is optional. Without it, Full file check is {regular}.",
  },
};
