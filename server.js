const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json({ limit: "15mb" }));

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

async function callClaude(messages, maxTokens = 1000) {
  if (!ANTHROPIC_API_KEY) {
    throw new Error("Missing ANTHROPIC_API_KEY");
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: maxTokens,
      messages
    })
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("Anthropic API error:", data);
    throw new Error("Anthropic request failed");
  }

  const textBlock = (data.content || []).find(
    item => item.type === "text"
  );

  return textBlock?.text || "";
}

app.get("/", (req, res) => {
  res.send("Know N'Go server is running.");
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/ask", async (req, res) => {
  try {
    const question =
      req.body.question ||
      req.body.message ||
      req.body.prompt;

    if (!question || !question.trim()) {
      return res.status(400).json({
        error: "Please enter a question."
      });
    }

    const answer = await callClaude([
      {
        role: "user",
        content:
          "You are the Know N'Go Personal concierge. " +
          "Give helpful, practical, clear answers. " +
          "Keep answers concise unless the user asks for more detail. " +
          "The service is designed to be highly accessible, including for people using screen readers. " +
          "User question: " +
          question.trim()
      }
    ]);

    res.json({
      answer,
      response: answer,
      message: answer
    });
  } catch (error) {
    console.error("Ask error:", error);

    res.status(500).json({
      error: "I couldn't answer that right now. Please try again."
    });
  }
});

function buildVisionPrompt(question) {
  return `You are the Know N'Go vision assistant for a blind user.

Look
