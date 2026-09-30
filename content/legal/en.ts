import type { LegalContent } from "./types";

// Items in [brackets] must be filled in before publishing. Have an Israeli
// lawyer review these texts before launch.

export const legalEn: LegalContent = {
  updated: "2026-09-27",
  updatedLabel: "Last updated",
  docs: {
    privacy: {
      title: "Privacy policy",
      intro: [
        "Visamo helps couples organize, prepare and check the documents for Israel's gradual process. To do that, you trust us with personal and sometimes sensitive information: passports, certificates, bank statements and private photos. This policy explains what we collect, why, who we share it with, and the control you have over it.",
        "Visamo (\"we\") is the owner of the database that holds your information.",
      ],
      sections: [
        {
          heading: "1. Who we are, and who we are not",
          body: [
            "Visamo is independent organization and document-preparation software. We are not a law firm, we do not give legal advice, and we do not represent you or act on your behalf before any authority.",
            "Visamo is not affiliated with, endorsed by, or connected to the Ministry of Interior, the Population and Immigration Authority, or any other government body. We never send information to any authority on your behalf. You submit your application yourself, through the official channels.",
          ],
        },
        {
          heading: "2. Information we collect",
          body: [
            {
              list: [
                "Account details: your name, email address, password (stored hashed) and preferred language.",
                "Onboarding details: the countries you and your partner come from, your relationship status and your stage in the process, which we use to build your document list.",
                "Your file: the documents you upload (for example passports, certificates, affidavits, bank statements, photos and other relationship evidence) and the information in them.",
                "Assistant conversations: the messages you send the information assistant and its answers.",
                "Payment details: handled by our payment provider, [payment provider]. We never see or store your full card number; we keep only a payment token, what you bought and the receipt.",
                "Messages you send us: the content of contact-form messages and emails, including any attachments.",
                "Technical information: IP address, browser and device type, pages visited, and logs needed to keep the service secure and working.",
              ],
            },
            "Some of the documents you upload may contain information of special sensitivity under Israeli law, such as details about your family life, personal status, or a police certificate. We process it only to provide the service you asked for, at your direction.",
          ],
        },
        {
          heading: "3. How we use your information",
          body: [
            {
              list: [
                "To provide the service: build your personal document list, store and organize your file, check your documents against published requirements, and answer your questions.",
                "To let you and your partner share one file.",
                "To process payments and refunds.",
                "To answer your messages and give support.",
                "To keep the service secure, prevent fraud and abuse, and fix problems.",
                "To meet our legal obligations.",
              ],
            },
            "We do not sell your information, we do not use it for advertising, and we never use your documents to train AI models.",
          ],
        },
        {
          heading: "4. Legal bases (for users in the EU and UK)",
          body: [
            "Where the GDPR applies, we process your information to perform our contract with you (providing the service), on the basis of your consent (for example when you upload optional documents), to comply with legal obligations, and for our legitimate interests in keeping the service secure and improving it.",
          ],
        },
        {
          heading: "5. Who we share information with",
          body: [
            "We share information only with service providers that help us run Visamo, and only as much as they need:",
            {
              list: [
                "Hosting: Vercel, with data centers in Frankfurt, Germany.",
                "Document processing and the information assistant: AI and document-processing providers, bound by contractual terms that prohibit keeping your data or using it to train their models.",
                "Payments: [payment provider].",
                "Contact form: Cloudflare Turnstile, which checks that the form is sent by a person and not a bot. Messages and attachments sent through the form are emailed to our support inbox (Google Workspace) and are not stored in our systems.",
                "Email delivery: [email provider].",
              ],
            },
            "We may also disclose information when the law requires it, for example under a court order, and in that case we will share only what is required.",
            "Our team can access the documents in your file only if you ask for support and grant access, for a limited time, and every access is logged.",
          ],
        },
        {
          heading: "6. International transfers",
          body: [
            "Your information is stored in the European Union. Some service providers may process information in other countries. When that happens, we rely on appropriate safeguards, such as an adequacy decision or standard contractual clauses.",
          ],
        },
        {
          heading: "7. How long we keep information",
          body: [
            {
              list: [
                "Your file and account: for as long as your account is active. You can delete any document or your whole account at any time.",
                "After deletion: removed from our systems immediately and from backups within 30 days.",
                "Contact-form messages: kept in our support inbox only as long as needed to handle your request.",
                "Payment and tax records: for the period required by law.",
              ],
            },
          ],
        },
        {
          heading: "8. How we protect your information",
          body: [
            "Documents are encrypted at rest with AES-256 and in transit with TLS. Access is limited to what each person needs, staff use multi-factor authentication, and access to your file is logged. We follow the Privacy Protection (Data Security) Regulations, 2017. No system is perfectly secure, but if a security incident affects your information, we will notify you and the Privacy Protection Authority as the law requires.",
          ],
        },
        {
          heading: "9. Your rights",
          body: [
            "Under the Privacy Protection Law, 1981, and, where it applies, the GDPR, you can:",
            {
              list: [
                "Access the information we hold about you.",
                "Ask us to correct information that is wrong, incomplete or out of date.",
                "Delete your documents or your whole account, directly in Visamo or by asking us.",
                "Download your file.",
                "Object to or restrict certain processing, and withdraw consent at any time.",
              ],
            },
            "To use any of these rights, contact us through the contact form or at support@visamo.co.il. You can also complain to the Privacy Protection Authority in Israel or, if you live in the EU or UK, to your local data protection authority.",
          ],
        },
        {
          heading: "10. Cookies",
          body: [
            "We use only the cookies needed for the site to work: for example, one that remembers your language and those that keep you signed in. We do not use advertising cookies. [If analytics are added, describe them here.]",
          ],
        },
        {
          heading: "11. Children",
          body: ["Visamo is intended for adults aged 18 and over. We do not knowingly collect information from children."],
        },
        {
          heading: "12. Changes to this policy",
          body: [
            "We may update this policy from time to time. If we make significant changes, we will let you know by email or in Visamo before they take effect.",
          ],
        },
        {
          heading: "13. Contact",
          body: ["For any question about your privacy, contact us through the contact form or at support@visamo.co.il."],
        },
      ],
    },

    terms: {
      title: "Terms of use",
      intro: [
        "These terms govern your use of the Visamo website and service. By creating an account or using Visamo, you agree to them. Please read them carefully, especially the sections on what Visamo is not and on limits of liability.",
      ],
      sections: [
        {
          heading: "1. What Visamo is",
          body: [
            "Visamo is independent software that helps couples organize, prepare and check documents for Israel's gradual process, and gives general information about the process through an information assistant.",
          ],
        },
        {
          heading: "2. What Visamo is not",
          body: [
            {
              list: [
                "Not a law firm. Visamo does not provide legal advice or legal services, and using Visamo does not create a lawyer–client relationship.",
                "Not your representative. We do not act on your behalf, submit anything for you, or communicate with any authority in your name. You are solely responsible for your application and for what you submit.",
                "Not a government service. Visamo is not affiliated with, endorsed by, or an official portal of the Ministry of Interior, the Population and Immigration Authority, or any other government body.",
              ],
            },
            "For advice about your specific situation, consult a licensed Israeli lawyer.",
          ],
        },
        {
          heading: "3. No guarantee of results",
          body: [
            "All decisions on your application are made solely by the authorities. We do not promise or guarantee any result: not approval of a visa or status, not that your file won't be sent back, and not any timeline.",
            "Document checks compare your documents with published requirements and common issues. They reduce the risk of missing something, but they cannot catch every problem, and requirements can change without notice. The assistant's answers are general information based on published sources; they may be incomplete or out of date and are not legal advice. Always check important details against official sources.",
          ],
        },
        {
          heading: "4. Your account",
          body: [
            "You must be at least 18 to use Visamo. Keep your login details secure and tell us if you suspect unauthorized access. If you invite your partner to a shared file, both of you can see and manage its contents, and you confirm you have the right to share the information you add.",
          ],
        },
        {
          heading: "5. Your responsibilities",
          body: [
            {
              list: [
                "Provide accurate information and upload only genuine documents.",
                "Upload only information you are entitled to share.",
                "Review your file yourself before submitting it to any authority.",
                "Use Visamo only for lawful purposes, and don't try to access other users' data, disrupt the service, or copy it.",
              ],
            },
          ],
        },
        {
          heading: "6. Purchases and payments",
          body: [
            "Visamo is free to start, and offers one-time purchases as described on the pricing page: message packs and Full file check. Prices are in Israeli shekels and include VAT. Assistant messages don't expire. Full file check covers every stage of the gradual process. We may change prices for future purchases; changes never affect something you already bought.",
          ],
        },
        {
          heading: "7. Refunds and cancellation",
          body: [
            "If Visamo didn't give you value, you can ask for a full refund within 14 days of purchase. Send a request through the contact form with the email you signed up with and the reason, and you'll get the refund within 10 business days. This doesn't limit any right you have under the Consumer Protection Law, 1981.",
          ],
        },
        {
          heading: "8. Your content",
          body: [
            "You keep all rights to the documents and information you upload. You give us permission to store and process them only as needed to provide the service to you. When you delete them, that permission ends, subject to our backup and legal retention periods described in the privacy policy.",
          ],
        },
        {
          heading: "9. Our content",
          body: [
            "The Visamo software, design, text and brand belong to us. You may use them only to use the service, and may not copy, resell or reverse-engineer them.",
          ],
        },
        {
          heading: "10. Availability",
          body: [
            "We work to keep Visamo available and accurate, but the service is provided \"as is\" and \"as available\". We may change, suspend or stop features, and we'll give reasonable notice of significant changes where we can.",
          ],
        },
        {
          heading: "11. Limitation of liability",
          body: [
            "To the extent the law allows, Visamo is not liable for the outcome of your application, for decisions of any authority, for delays or rejections, or for indirect or consequential damages. In any case, our total liability to you is limited to the amount you paid Visamo in the 12 months before the claim. Nothing in these terms limits liability that cannot be limited by law.",
          ],
        },
        {
          heading: "12. Ending your use",
          body: [
            "You can stop using Visamo and delete your account at any time. We may suspend or close accounts that break these terms, and will tell you why unless the law prevents it.",
          ],
        },
        {
          heading: "13. Governing law",
          body: [
            "These terms are governed by the laws of the State of Israel. The competent courts in Tel Aviv have exclusive jurisdiction. These terms are available in Hebrew and English; if they differ, the Hebrew version prevails.",
          ],
        },
        {
          heading: "14. Changes to these terms",
          body: [
            "We may update these terms. If we make significant changes, we'll let you know by email or in Visamo before they take effect. Continuing to use Visamo after that means you accept the updated terms.",
          ],
        },
        {
          heading: "15. Contact",
          body: ["Questions about these terms? Contact us through the contact form or at support@visamo.co.il."],
        },
      ],
    },

    accessibility: {
      title: "Accessibility statement",
      intro: [
        "We want every couple to be able to use Visamo, including people with disabilities. We work to make the site accessible in line with the Equal Rights for Persons with Disabilities (Accessibility Adjustments for Service) Regulations, 2013, and Israeli Standard 5568, which is based on WCAG 2.0 at level AA. We design to the newer WCAG 2.2 AA guidelines where we can.",
        "Accessibility level: the site meets Israeli Standard 5568 at level AA, except for the limitations listed below.",
      ],
      sections: [
        {
          heading: "What we've done",
          body: [
            {
              list: [
                "The whole site works with a keyboard, with a visible focus outline and a \"skip to content\" link. When the mobile menu is open, focus stays inside it and the Esc key closes it.",
                "Pages use proper headings, landmarks and labels so screen readers can navigate them, and each page has its own descriptive title.",
                "Images have text alternatives; decorative graphics are hidden from screen readers.",
                "Text and controls meet contrast guidelines (at least 4.5:1 for regular text), and text can be enlarged up to 200% without losing content.",
                "Every form field has a label. Errors are explained in text, not by color alone, are read out together with the field they belong to, and focus moves to the first field that needs fixing.",
                "Tables have header cells, and a table that scrolls sideways on small screens can be scrolled with the keyboard.",
                "The site is fully available in Hebrew and English, with right-to-left layout for Hebrew and the page language marked for screen readers.",
                "Animations are short, never loop, and are reduced when your device asks for reduced motion.",
                "The layout adapts to phones, tablets and desktops.",
                "We do not use an accessibility overlay or plug-in; accessibility is built into the site itself.",
              ],
            },
          ],
        },
        {
          heading: "Browsers and assistive technology",
          body: [
            "The site is designed to work with current versions of Chrome, Safari, Firefox and Edge, on desktop and mobile. [List the screen readers and browsers the site was tested with, for example NVDA with Chrome on Windows, VoiceOver with Safari on iPhone and TalkBack with Chrome on Android.]",
          ],
        },
        {
          heading: "Known limitations",
          body: [
            "Some content may not yet be fully accessible, such as documents you upload yourself or content from third-party services (for example Cloudflare's bot check on the contact form). The technical details on the \"How we handle data\" page are currently available in English only. We are working to improve these, and we're happy to help another way in the meantime.",
          ],
        },
        {
          heading: "Other ways to get help",
          body: [
            "If any part of the site is hard for you to use, we can help you by email during our support hours, and we can send information in another format on request.",
          ],
        },
        {
          heading: "Accessibility contact",
          body: [
            "If something on the site isn't accessible to you, or you have a suggestion, please tell us and we'll help and fix it as quickly as we can.",
            {
              list: [
                "Accessibility coordinator: [full name]",
                "Phone: [phone number]",
                "Email: support@visamo.co.il (please write \"Accessibility\" in the subject)",
                "Or through the contact form on the site.",
              ],
            },
            "Please include the page address and a short description of the problem. We aim to reply within [number] business days.",
          ],
        },
        {
          heading: "Physical accessibility",
          body: [
            "Visamo provides its service online only and does not have offices or service points open to the public. [Confirm before publishing; if that changes, describe the accessibility arrangements there.]",
          ],
        },
        {
          heading: "About this statement",
          body: [
            "This statement was last updated on the date shown above. The site's accessibility was last reviewed on [date] by [name of reviewer or company].",
          ],
        },
      ],
    },
  },
};
