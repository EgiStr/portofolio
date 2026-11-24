"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { polishContent } from "@/lib/gemini";

export async function polishResumeItemAction(description: string) {
  if (!description) return [];
  // Server actions are public endpoints: without this check anyone could spend the Gemini quota.
  if (!(await getServerSession(authOptions))) throw new Error("Unauthorized");

  try {
    const polished = await polishContent(description);
    return polished;
  } catch (error) {
    console.error("Server Action Error:", error);
    // Return the original description as a single bullet point if AI fails
    return [description];
  }
}
