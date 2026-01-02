"use server";

import { polishContent } from "@/lib/gemini";

export async function polishResumeItemAction(description: string) {
  if (!description) return [];

  try {
    const polished = await polishContent(description);
    return polished;
  } catch (error) {
    console.error("Server Action Error:", error);
    // Return the original description as a single bullet point if AI fails
    return [description];
  }
}
