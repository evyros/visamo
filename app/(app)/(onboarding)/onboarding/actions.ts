"use server";

import { redirect } from "next/navigation";
import { parseOnboarding } from "@/lib/case-options";
import { db } from "@/lib/db";
import { caseMember, casePerson, cases } from "@/lib/db/schema";
import { findCaseId, getCaseId, getSession, hasSignInMethod } from "@/lib/session";

export type CreateCaseResult = { error: "generic" };

/**
 * The last onboarding step: creates the user's case from all the answers at
 * once. Nothing is saved before this, so leaving the wizard midway leaves no
 * trace.
 */
export async function createCase(input: unknown): Promise<CreateCaseResult> {
  const session = await getSession();
  if (!session) redirect("/login");
  const userId = session.user.id;
  if (!(await hasSignInMethod(userId))) redirect("/set-password");
  if (await getCaseId(userId)) redirect("/");

  const answers = parseOnboarding(input);
  if (!answers) return { error: "generic" };

  const caseId = crypto.randomUUID();
  const { self, partner, branch, stage } = answers;
  try {
    // A batch runs as one transaction. The case_member primary key stops a
    // second case for the same user (a double submit, two tabs), and then
    // none of the rows are written. The partner has no user yet; an invite
    // will link one to their row later.
    await db.batch([
      db.insert(cases).values({ id: caseId, branch, stage }),
      db.insert(caseMember).values({ userId, caseId, role: "owner" }),
      db.insert(casePerson).values([
        { id: crypto.randomUUID(), caseId, userId, ...self },
        { id: crypto.randomUUID(), caseId, userId: null, ...partner },
      ]),
    ]);
  } catch (error) {
    // If the user has a case now, another submit won the race: carry on.
    if (!(await findCaseId(userId))) {
      console.error("createCase failed", error);
      return { error: "generic" };
    }
  }
  redirect("/");
}
