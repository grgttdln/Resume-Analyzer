export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: "No text provided" });
  }

  const prompt = `
  Analyze the following resume text and provide a structured, objective evaluation using the format below:
  
  1. **Candidate Summary** — Summarize the candidate’s background, career goals, and overall profile.
  2. **Skill Analysis** — Identify and evaluate technical and soft skills. Highlight strengths, notable gaps, or missing core competencies.
  3. **Experience Breakdown** — Review work experience and projects. Emphasize measurable achievements, impact, and relevance to target roles.
  4. **Language & Tone** — Assess clarity, professionalism, consistency, and effectiveness of communication.
  5. **Overall Recommendation** — Offer a summary of the candidate’s strengths and weaknesses. Include actionable tips for refinement and job targeting.
  
  **Formatting Requirements**:
  - Each section must begin with a Markdown H1-style strong title: \`**Section Title**\`.
  - Do not include any introductory or closing remarks.
  - Do not include a section titled "Resume Analysis".
  - Maintain a professional, neutral, and non-conversational tone.
  - At the end of **each section**, include an insights paragraph beginning with a Markdown H2-style strong title.
    Example: \`Insight: Candidate demonstrates strong fundamentals in front-end development but lacks experience with modern frameworks like React or Vue.\`
  
  Resume text:
  ${text}
  `;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
      }
    );

    const result = await response.json();

    console.log("Gemini analysis result:", result);

    if (response.ok) {
      // Extract relevant parts of the result
      const analysis = result?.candidates?.map((candidate) => ({
        content: candidate?.content,
        finishReason: candidate?.finishReason,
        avgLogprobs: candidate?.avgLogprobs,
      }));

      // Return all the relevant data
      const usageMetadata = result?.usageMetadata;
      const modelVersion = result?.modelVersion;

      res.status(200).json({
        analysis: analysis || "No analysis found.",
        usageMetadata,
        modelVersion,
      });
    } else {
      res
        .status(500)
        .json({ error: "Gemini analysis failed", details: result });
    }
  } catch (err) {
    console.error("Gemini analysis error:", err);
    res
      .status(500)
      .json({ error: "Gemini analysis failed", details: err.message });
  }
}
