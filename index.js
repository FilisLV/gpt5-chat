import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1️⃣ Must come FIRST
const app = express();

app.use(cors({ origin: true }));
app.use(express.json());

//labots lai piekļūst public 2️⃣ Serve static files (like chat.html)
app.use(express.static(path.join(__dirname, "public")));



const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Simple conversation memory
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
    const { sessionId = "default", userMessage } = req.body;

    const history = getHistory(sessionId);
    history.push({ role: "user", content: userMessage });

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: history,
    });

    const reply = response.choices[0].message.content;
    history.push({ role: "assistant", content: reply });

    res.json({ reply });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// labots lai piekļūst public Default route – open chat.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "chat.html"));
});


const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
