import type { GlossaryGroupId, GlossaryTerm } from "./types";

/** The terms, by group, in the order of lib/knowledge/glossary.md. */
export const glossaryGroups: { id: GlossaryGroupId; terms: GlossaryTerm[] }[] = [
  {
    id: "offices",
    terms: [
      { id: "misrad-hapnim", english: "Ministry of Interior", said: "Misrad Hapnim", hebrew: "משרד הפנים" },
      {
        id: "rashut-haochlusin",
        english: "Population and Immigration Authority",
        said: "Rashut Haochlusin Vehahagira",
        hebrew: "רשות האוכלוסין וההגירה",
      },
      { id: "piba", english: "PIBA", said: "PIBA", hebrew: "רשות האוכלוסין וההגירה" },
      { id: "lishka", english: "Local office (branch)", said: "lishka", hebrew: "לשכה" },
      { id: "pakid", english: "Clerk", said: "pakid, pkida", hebrew: "פקיד, פקידה" },
      { id: "iriya", english: "Municipality", said: "iriya", hebrew: "עירייה" },
      { id: "moatza-mekomit", english: "Local council", said: "moatza mekomit", hebrew: "מועצה מקומית" },
      { id: "bituach-leumi", english: "National Insurance Institute", said: "Bituach Leumi", hebrew: "ביטוח לאומי" },
      { id: "kupat-holim", english: "Health fund (HMO)", said: "Kupat Holim", hebrew: "קופת חולים" },
      { id: "mas-hachnasa", english: "Tax Authority", said: "Mas Hachnasa", hebrew: "מס הכנסה" },
      { id: "misrad-hachinuch", english: "Ministry of Education", said: "Misrad Hachinuch", hebrew: "משרד החינוך" },
      { id: "harabanut", english: "The rabbinate", said: "Harabanut", hebrew: "הרבנות" },
      { id: "beit-din", english: "Religious court", said: "beit din", hebrew: "בית דין" },
      { id: "hakonsulia", english: "Israeli consulate abroad", said: "hakonsulia", hebrew: "הקונסוליה" },
      { id: "nativ", english: "Nativ", said: "Nativ", hebrew: "לשכת הקשר נתיב" },
      { id: "hasochnut", english: "The Jewish Agency", said: "Hasochnut", hebrew: "הסוכנות היהודית" },
    ],
  },
  {
    id: "process",
    terms: [
      {
        id: "hahalich-hamedorag",
        english: "The gradual process",
        said: "hahalich hamedorag",
        hebrew: "ההליך המדורג",
        guide: "partner-visa-israel",
      },
      { id: "nohal", english: "Procedure", said: "nohal", hebrew: "נוהל" },
      { id: "maamad", english: "Status", said: "maamad", hebrew: "מעמד" },
      { id: "habakasha", english: "The application", said: "habakasha", hebrew: "הבקשה" },
      { id: "hatik", english: "Your file", said: "hatik", hebrew: "התיק" },
      { id: "reayon", english: "Interview", said: "reayon", hebrew: "ראיון" },
      { id: "reayon-simultani", english: "Simultaneous interview", said: "reayon simultani", hebrew: "ראיון סימולטני" },
      { id: "heter-knisa", english: "Entry permit", said: "heter knisa", hebrew: "היתר כניסה", guide: "entry-permit" },
      { id: "hazmana", english: "Invitation", said: "hazmana", hebrew: "הזמנה" },
      { id: "asmachta", english: "Reference", said: "asmachta", hebrew: "אסמכתא" },
      { id: "hamazmin", english: "The inviter", said: "hamazmin", hebrew: "המזמין" },
      { id: "hamuzman", english: "The invitee", said: "hamuzman", hebrew: "המוזמן" },
      { id: "merkaz-chaim", english: "Center of life", said: "merkaz chaim", hebrew: "מרכז חיים" },
      { id: "agra", english: "The fee", said: "agra", hebrew: "אגרה" },
    ],
  },
  {
    id: "visas",
    terms: [
      { id: "bet-achat", english: "B/1 visa", said: "bet achat", hebrew: "ב/1", guide: "b1-visa" },
      { id: "bet-achat-klali", english: "B/1 general", said: "bet achat klali", hebrew: "ב/1 כללי" },
      { id: "bet-shtayim", english: "B/2 visa", said: "bet shtayim", hebrew: "ב/2" },
      { id: "alef-chamesh", english: "A/5 visa", said: "alef chamesh", hebrew: "א/5", guide: "a5-visa" },
      { id: "toshav-arai", english: "Temporary resident", said: "toshav arai", hebrew: "תושב ארעי" },
      { id: "toshav-keva", english: "Permanent resident", said: "toshav keva", hebrew: "תושב קבע" },
      { id: "ezrachut", english: "Citizenship", said: "ezrachut", hebrew: "אזרחות" },
      { id: "eta-il", english: "ETA-IL", said: "ETA", hebrew: "אישור נסיעה אלקטרוני" },
      { id: "inter-viza", english: "Inter-visa", said: "inter viza", hebrew: "אינטר ויזה" },
    ],
  },
  {
    id: "couple",
    terms: [
      { id: "ben-zug", english: "Spouse, partner", said: "ben zug, bat zug", hebrew: "בן זוג, בת זוג" },
      { id: "nesuim", english: "Married", said: "nesuim", hebrew: "נשואים" },
      {
        id: "yeduim-batzibur",
        english: "Common-law partners",
        said: "yeduim batzibur",
        hebrew: "ידועים בציבור",
        guide: "common-law-couples",
      },
      { id: "matzav-ishi", english: "Civil status", said: "matzav ishi", hebrew: "מצב אישי" },
      { id: "katin-nilve", english: "Accompanying minor", said: "katin nilve", hebrew: "קטין נלווה" },
      { id: "mishmoret", english: "Custody", said: "mishmoret", hebrew: "משמורת" },
      { id: "apotropsut", english: "Guardianship", said: "apotropsut", hebrew: "אפוטרופסות" },
    ],
  },
  {
    id: "work",
    terms: [
      { id: "sachir", english: "Employee", said: "sachir", hebrew: "שכיר" },
      { id: "atzmai", english: "Self-employed", said: "atzmai", hebrew: "עצמאי" },
      { id: "roe-cheshbon", english: "Accountant", said: "roe cheshbon", hebrew: "רואה חשבון" },
    ],
  },
  {
    id: "certification",
    terms: [
      { id: "apostil", english: "Apostille", said: "apostil", hebrew: "אפוסטיל", guide: "apostille-and-translation" },
      { id: "imut-konsulari", english: "Consular legalization", said: "imut konsulari", hebrew: "אימות קונסולרי" },
      { id: "notaryon", english: "Notary", said: "notaryon", hebrew: "נוטריון" },
      { id: "hatzhara-notaryonit", english: "Notarized statement", said: "hatzhara notaryonit", hebrew: "הצהרה נוטריונית" },
      {
        id: "tirgum-notaryoni",
        english: "Certified translation",
        said: "tirgum notaryoni",
        hebrew: "תרגום נוטריוני",
        guide: "apostille-and-translation",
      },
      { id: "orech-din", english: "Lawyer", said: "orech din", hebrew: "עורך דין" },
      { id: "tatzhir", english: "Affidavit", said: "tatzhir", hebrew: "תצהיר" },
    ],
  },
  {
    id: "laws",
    terms: [
      { id: "chok-hashvut", english: "The Law of Return", said: "Chok Hashvut", hebrew: "חוק השבות" },
      {
        id: "chok-haezrachut",
        english: "The Citizenship and Entry into Israel Law",
        said: "Chok Haezrachut Vehaknisa Leisrael",
        hebrew: "חוק האזרחות והכניסה לישראל",
      },
    ],
  },
];

export const glossaryTerms = glossaryGroups.flatMap((group) => group.terms);
