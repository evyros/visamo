import "server-only";
import { asc, eq } from "drizzle-orm";
import type { PersonInput, RelationshipInput } from "./case-options";
import { buildDocumentList } from "./documents/build";
import { db } from "./db";
import { caseFile, casePerson, cases, user } from "./db/schema";

// A case's document list and uploaded files, from its rows.

// The rows were checked by parseOnboarding when the case was created, so
// their text columns hold the option values the types name.
type Row<T> = { [K in keyof T]: unknown };

function personOf(p: typeof casePerson.$inferSelect): PersonInput {
  return {
    name: p.name,
    gender: p.gender,
    isIsraeli: p.isIsraeli,
    israeliStatus: p.israeliStatus,
    previousMarriages: p.previousMarriages,
    nationality: p.nationality,
    birthCountry: p.birthCountry,
    countriesLived: p.countriesLived,
    location: p.location,
    nameChanged: p.nameChanged,
    hasChildren: p.hasChildren,
    childrenMoving: p.childrenMoving,
    otherParents: p.otherParents,
    livedAbroad: p.livedAbroad,
  } satisfies Row<PersonInput> as PersonInput;
}

function relationshipOf(c: typeof cases.$inferSelect): RelationshipInput {
  return {
    relationship: c.relationship,
    marriagePlace: c.marriagePlace,
    marriageCountry: c.marriageCountry,
    livingTogether: c.livingTogether,
    togetherSince: c.togetherSince,
    childrenTogether: c.childrenTogether,
  } satisfies Row<RelationshipInput> as RelationshipInput;
}

/** The case's people and its document list. */
export async function caseDocuments(caseId: string) {
  const [[row], people] = await Promise.all([
    db.select().from(cases).where(eq(cases.id, caseId)).limit(1),
    db.select().from(casePerson).where(eq(casePerson.caseId, caseId)).orderBy(asc(casePerson.createdAt)),
  ]);
  if (!row || people.length !== 2) throw new Error(`Case ${caseId} is incomplete`);
  const [a, b] = people.map(personOf);
  return {
    people: people.map((p) => ({ name: p.name, isIsraeli: p.isIsraeli, userId: p.userId })),
    list: buildDocumentList({ relationship: relationshipOf(row), people: [a, b] }),
  };
}

/** The case's uploaded files, oldest first, with the uploader's name. */
export async function caseFiles(caseId: string) {
  const rows = await db
    .select({ file: caseFile, userName: user.name, personName: casePerson.name })
    .from(caseFile)
    .leftJoin(user, eq(user.id, caseFile.uploadedBy))
    .leftJoin(casePerson, eq(casePerson.userId, caseFile.uploadedBy))
    .where(eq(caseFile.caseId, caseId))
    .orderBy(asc(caseFile.createdAt));
  return rows.map(({ file, userName, personName }) => ({ ...file, uploaderName: personName ?? userName }));
}
