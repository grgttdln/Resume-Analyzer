import pdf from "pdf-parse";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb", // to support large PDFs
    },
  },
};

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { file } = req.body;

    if (!file) return res.status(400).json({ error: "No file provided" });

    const buffer = Buffer.from(file, "base64");

    try {
      const data = await pdf(buffer);
      res.status(200).json({ text: data.text });
    } catch (err) {
      res.status(500).json({ error: "Failed to parse PDF" });
    }
  } else {
    res.status(405).end();
  }
}
