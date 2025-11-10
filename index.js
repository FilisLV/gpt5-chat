import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();
const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

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
  const { sessionId = "default", userMessage } = req.body;
  const history = getHistory(sessionId);
  history.push({ role: "user", content: userMessage });

  const response = await openai.chat.completions.create({
    model: "gpt-5",
    messages: history,
    temperature: 1
  });

  const answer = response.choices[0].message;
  history.push(answer);
  res.json({ reply: answer.content });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on :${PORT}`));
