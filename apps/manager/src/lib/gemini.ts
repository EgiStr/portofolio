import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

export const gemini = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export const POLISH_PROMPT = `
You are a professional Resume Writer. usage of strong action verbs and quantitative results are crucial.
I will provide you with a raw description of a professional experience or project.
Your task is to rewrite it into 3-4 concise, impactful bullet points suitable for a high-quality tech resume.
Do not include any introductory text, just the bullet points.
Start each bullet point with a strong action verb.
`;

export async function polishContent(text: string): Promise<string[]> {
  if (!gemini) {
    throw new Error("Gemini API Key is not configured");
  }

  try {
    const model = gemini.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent([
      POLISH_PROMPT,
      `Input: ${text}`,
    ]);
    const response = await result.response;
    const textOutput = response.text();

    // Parse bullet points
    return textOutput
      .split("\n")
      .map((line: string) => line.trim())
      .filter(
        (line: string) =>
          line.startsWith("-") || line.startsWith("•") || line.startsWith("*"),
      )
      .map((line: string) => line.replace(/^[-•*]\s*/, ""));
  } catch (error) {
    console.error("Error polishing content:", error);
    return [text]; // Return original text on failure
  }
}
