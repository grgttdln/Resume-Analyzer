import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(["Say hi!"]);
    const response = await result.response;
    const text = await response.text();

    res.status(200).json({ success: true, response: text });
  } catch (err) {
    console.error("Gemini test error:", err);
    res.status(500).json({ error: "Gemini test failed", details: err.message });
  }
}
