import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors({ origin: true }));
app.use(express.json());

// Serve static files from /public
app.use(express.static(path.join(__dirname, "public")));

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Simple in-memory sessions
const sessions = new Map();
const MAX_HISTORY_MESSAGES = 20; // neliekam augt bezgalīgi

function getHistory(id) {
  if (!sessions.has(id)) {
    sessions.set(id, [
      { role: "system", content: "You are a helpful, friendly assistant." }
    ]);
  }
  return sessions.get(id);
}

function trimHistory(history) {
  if (history.length > MAX_HISTORY_MESSAGES) {
    // saglabājam sistēmas ziņu + pēdējās N-1 ziņas
    const systemMessage = history[0];
    const tail = history.slice(- (MAX_HISTORY_MESSAGES - 1));
    return [systemMessage, ...tail];
  }
  return history;
}

app.get("/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

app.get("/env-check", (req, res) => {
  const v = process.env.OPENAI_API_KEY || "";
  res.json({ hasKey: !!v, length: v.length });
});

app.post("/chat", async (req, res) => {
  try {
    const { sessionId = "default", userMessage } = req.body || {};

    if (!userMessage || typeof userMessage !== "string") {
      return res.status(400).json({ error: "userMessage is required" });
    }

    const history = getHistory(sessionId);
    history.push({ role: "user", content: userMessage });

    const trimmed = trimHistory(history);
    sessions.set(sessionId, trimmed);

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: trimmed
    });

    const reply = response.choices?.[0]?.message?.content || "";

    trimmed.push({ role: "assistant", content: reply });
    sessions.set(sessionId, trimmed);

    console.log(`[chat] session=${sessionId} messages=${trimmed.length}`);

    res.json({ reply });
  } catch (e) {
    console.error("[chat error]", e);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "chat.html"));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
