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

// Static faili no /public
app.use(express.static(path.join(__dirname, "public")));

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Vienkārša autentifikācija ar shared token
// Ja APP_AUTH_TOKEN NAV uzstādīts, autentifikācija ir izslēgta.
const AUTH_TOKEN = process.env.APP_AUTH_TOKEN || "";

function authMiddleware(req, res, next) {
  if (!AUTH_TOKEN) {
    return next(); // auth disabled
  }
  const token = req.headers["x-auth-token"];
  if (!token || token !== AUTH_TOKEN) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

// Sesiju atmiņa (bez sistēmas ziņas)
const sessions = new Map();
const MAX_HISTORY_MESSAGES = 20; // max vēstures garums (user+assistant ziņas)

function getHistory(id) {
  if (!sessions.has(id)) {
    sessions.set(id, []);
  }
  return sessions.get(id);
}

function setHistory(id, history) {
  sessions.set(id, history);
}

function trimHistory(history) {
  if (history.length > MAX_HISTORY_MESSAGES) {
    return history.slice(-MAX_HISTORY_MESSAGES);
  }
  return history;
}

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Env check (lai pārbaudītu, vai Railway ir API key)
app.get("/env-check", (req, res) => {
  const v = process.env.OPENAI_API_KEY || "";
  res.json({ hasKey: !!v, length: v.length });
});

// Vienkāršā /chat versija (bez streaming) – paliek kā fallback/diagnostikai
app.post("/chat", authMiddleware, async (req, res) => {
  try {
    const {
      sessionId = "default",
      userMessage,
      model = "gpt-4o-mini",
      systemPrompt = "You are a helpful assistant.",
    } = req.body || {};

    if (!userMessage || typeof userMessage !== "string") {
      return res.status(400).json({ error: "userMessage is required" });
    }

    const history = getHistory(sessionId);
    history.push({ role: "user", content: userMessage });

    const trimmed = trimHistory(history);
    setHistory(sessionId, trimmed);

    // Rekonstruējam messages ar system ziņu kā pirmo
    const messages = [
      { role: "system", content: systemPrompt },
      ...trimmed,
    ];

    const response = await client.chat.completions.create({
      model,
      messages,
    });

    const reply = response.choices?.[0]?.message?.content || "";
    trimmed.push({ role: "assistant", content: reply });
    setHistory(sessionId, trimmed);

    console.log(
      `[chat] session=${sessionId} model=${model} messages=${trimmed.length}`
    );

    res.json({ reply });
  } catch (e) {
    console.error("[/chat error]", e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 🔥 Streaming versija – teksta daļas nāk pa chunk’iem
app.post("/chat-stream", authMiddleware, async (req, res) => {
  try {
    const {
      sessionId = "default",
      userMessage,
      model = "gpt-4o-mini",
      systemPrompt = "You are a helpful assistant.",
    } = req.body || {};

    if (!userMessage || typeof userMessage !== "string") {
      return res.status(400).json({ error: "userMessage is required" });
    }

    const history = getHistory(sessionId);
    history.push({ role: "user", content: userMessage });

    const trimmed = trimHistory(history);
    setHistory(sessionId, trimmed);

    const messages = [
      { role: "system", content: systemPrompt },
      ...trimmed,
    ];

    // Streaming atbilde no OpenAI
    const stream = await client.chat.completions.create({
      model,
      messages,
      stream: true,
    });

    // Streaming HTTP atbilde
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");

    let fullReply = "";

    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta?.content || "";
      if (delta) {
        fullReply += delta;
        res.write(delta);
      }
    }

    trimmed.push({ role: "assistant", content: fullReply });
    setHistory(sessionId, trimmed);

    console.log(
      `[chat-stream] session=${sessionId} model=${model} replyLength=${fullReply.length}`
    );

    res.end();
  } catch (e) {
    console.error("[/chat-stream error]", e);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error" });
    } else {
      res.end();
    }
  }
});

// Clear chat – noņem konkrēto sesiju vai visas
app.post("/reset", authMiddleware, (req, res) => {
  const { sessionId } = req.body || {};
  if (sessionId) {
    sessions.delete(sessionId);
    return res.json({ ok: true, cleared: sessionId });
  } else {
    sessions.clear();
    return res.json({ ok: true, cleared: "all" });
  }
});

// Root maršruts – čata UI
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "chat.html"));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
