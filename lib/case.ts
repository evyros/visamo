import "server-only";
import { and, eq, isNull, ne } from "drizzle-orm";
import { db } from "./db";
import { caseInvite, caseMember, casePerson, user } from "./db/schema";

// Reads about who's in a case, for the settings pages and their actions.

/** The case's other members (users who joined it), with the name from their row in the case. */
export async function otherMembers(caseId: string, userId: string) {
  return db
    .select({ email: user.email, name: casePerson.name })
    .from(caseMember)
    .innerJoin(user, eq(user.id, caseMember.userId))
    .leftJoin(casePerson, eq(casePerson.userId, caseMember.userId))
    .where(and(eq(caseMember.caseId, caseId), ne(caseMember.userId, userId)));
}

/** The person in the case with no login yet: the partner an invite is for. */
export async function unlinkedPerson(caseId: string) {
  const [person] = await db
    .select({ name: casePerson.name, isIsraeli: casePerson.isIsraeli })
    .from(casePerson)
    .where(and(eq(casePerson.caseId, caseId), isNull(casePerson.userId)))
    .limit(1);
  return person ?? null;
}

/** The user's own name in the case, as entered in onboarding. */
export async function ownName(userId: string) {
  const [person] = await db
    .select({ name: casePerson.name })
    .from(casePerson)
    .where(eq(casePerson.userId, userId))
    .limit(1);
  return person?.name ?? null;
}

export async function pendingInvite(caseId: string) {
  const [invite] = await db
    .select({ email: caseInvite.email, locale: caseInvite.locale, sentAt: caseInvite.sentAt })
    .from(caseInvite)
    .where(eq(caseInvite.caseId, caseId))
    .limit(1);
  return invite ?? null;
}
