import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// serve all files (including chat.html) directly from your project folder
app.use(express.static(__dirname));

// optional: redirect root URL to chat.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "chat.html"));
});




import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();
const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

app.get("/env-check", (req, res) => {
  const v = process.env.OPENAI_API_KEY || "";
  res.json({ hasKey: !!v, length: v.length });
});

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const sessions = new Map();

function getHistory(id) {
  if (!sessions.has(id)) {
    sessions.set(id, [
      { role: "system", content: "You are a helpful assistant." }
    ]);
  }
  return sessions.get(id);
}

app.post("/chat", async (req, res) => {
  try {
    const { sessionId = "default", userMessage } = req.body || {};
    if (!userMessage) return res.status(400).json({ error: "userMessage required" });

    const history = getHistory(sessionId);
    history.push({ role: "user", content: userMessage });

    const resp = await openai.chat.completions.create({
      model: "gpt-5",
      messages: history
    });

    const answer = resp.choices[0].message;
    history.push(answer);
    return res.json({ reply: answer.content });

  } catch (err) {
    const status = err?.status ?? 500;
    const msg = err?.error?.message || err?.message || "Unknown error";
    console.error("OpenAI error:", status, msg);
    return res.status(status).json({ error: msg });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on :${PORT}`));
