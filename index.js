// index.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import path from "path";
import { fileURLToPath } from "url";

// Resolve __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Env
dotenv.config();

// App
const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Serve static files (so / loads chat.html, and CSS/JS next to it)
app.use(express.static(__dirname));
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "chat.html"));
});

// Simple env check
app.get("/env-check", (req, res) => {
  const v = process.env.OPENAI_API_KEY || "";
  res.json({ hasKey: !!v, length: v.length });
});

// OpenAI + session memory
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const sessions = new Map();
function getHistory(id) {
  if (!sessions.has(id)) {
    sessions.set(id, [{ role: "system", content: "You are a helpful assistant." }]);
  }
  return sessions.get(id);
}

// Chat endpoint
app.post("/chat", async (req, res) => {
  try {
    const { sessionId = "default", userMessage } = req.body || {};
    if (!userMessage) return res.status(400).json({ error: "userMessage required" });

    const history = getHistory(sessionId);
    history.push({ role: "user", content: userMessage });

    const resp = await openai.chat.completions.create({
      model: "gpt-5",
      messages: history,
    });

    const answer = resp.choices[0].message;
    history.push(answer);
    res.json({ reply: answer.content });
  } catch (err) {
    const status = err?.status ?? 500;
    const msg = err?.error?.message || err?.message || "Unknown error";
    console.error("OpenAI error:", status, msg);
    res.status(status).json({ error: msg });
  }
});

// Railway will inject PORT
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on :${PORT}`));
