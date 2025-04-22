export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: "No text provided" });
  }

  const prompt = `
Please analyze the following resume text and return the results in these structured sections:

1. **Candidate Summary**: A brief overview of the candidate's profile and goals.
2. **Skill Analysis**: Highlight and evaluate the candidate's technical and soft skills.
3. **Experience Breakdown**: Analyze work experience and projects. Emphasize quantifiable results and impact.
4. **Language & Tone**: Comment on the professionalism, clarity, and tone of the resume.
5. **Overall Recommendation**: Summarize strengths, areas for improvement, and tips to tailor for job roles.

Be objective and do not talk conversationally. Do not include title of "Resume Analysis".

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
