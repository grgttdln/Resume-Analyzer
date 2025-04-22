import Head from "next/head";
import { Jost } from "next/font/google";
import styles from "../styles/Resume.module.css";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import Tesseract from "tesseract.js";

const jost = Jost({
  subsets: ["latin"],
  variable: "--font-jost",
});

export default function Resume() {
  const [file, setFile] = useState(null);
  const [previewURL, setPreviewURL] = useState(null);
  const [extractedText, setExtractedText] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    const fileURL = URL.createObjectURL(uploadedFile);
    setPreviewURL(fileURL);
    setAnalysis(null); // Clear previous
    setExtractedText(""); // Clear previous

    if (uploadedFile.type === "application/pdf") {
      uploadAndExtractPDF(uploadedFile);
    } else if (uploadedFile.type.startsWith("image/")) {
      extractTextFromImage(uploadedFile);
    }
  };

  const uploadAndExtractPDF = async (file) => {
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result.split(",")[1];
      try {
        const res = await fetch("/api/extract-text", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ file: base64 }),
        });
        const data = await res.json();
        const text = data.text || "No text found.";
        setExtractedText(text);
        runGeminiAnalysis(text);
      } catch (err) {
        console.error("Error extracting PDF text:", err);
        setExtractedText("Failed to extract PDF text.");
      }
    };
    reader.readAsDataURL(file);
  };

  const extractTextFromImage = (file) => {
    Tesseract.recognize(file, "eng", {
      logger: (m) => console.log(m),
    })
      .then(({ data: { text } }) => {
        setExtractedText(text || "No text found.");
        runGeminiAnalysis(text || "");
      })
      .catch((err) => {
        console.error("OCR error:", err);
        setExtractedText("Failed to extract image text.");
      });
  };

  const runGeminiAnalysis = async (text) => {
    setLoading(true);
    try {
      const res = await fetch("/api/analyze-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      console.log("Gemini analysis response:", data);

      // Extract the actual analysis text
      const analysisText =
        data.analysis[0]?.content?.parts[0]?.text || "No analysis found.";
      setAnalysis(analysisText);
    } catch (err) {
      console.error("Error running Gemini analysis:", err);
      setAnalysis("Failed to run Gemini analysis.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>AI Resume Analyzer</title>
        <meta name="description" content="Analyze your resume using AI" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className={`${styles.container} ${jost.variable}`}>
        {/* Left Side */}
        <div className={styles.left}>
          <div>
            <h2>Upload Your Resume</h2>
            <input
              type="file"
              accept=".pdf,image/*"
              onChange={handleFileChange}
            />
          </div>

          <h3>Gemini Analysis</h3>
          <div className={styles.textOutput}>
            {loading ? (
              <p>Analyzing resume...</p>
            ) : analysis ? (
              <ReactMarkdown>{analysis}</ReactMarkdown>
            ) : (
              <p>Analysis will appear here after upload.</p>
            )}
          </div>
        </div>

        {/* Right Side */}
        <div className={styles.right}>
          <h2>Preview</h2>
          {previewURL ? (
            file?.type === "application/pdf" ? (
              <iframe src={previewURL} className={styles.preview} />
            ) : (
              <img
                src={previewURL}
                alt="Uploaded Resume"
                className={styles.preview}
              />
            )
          ) : (
            <p>No file uploaded</p>
          )}
        </div>
      </div>
    </>
  );
}
