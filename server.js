Paste this entire replacement:

const express = require("express");
const cors = require("cors");
const app = express();
app.use(cors());
app.use(express.json({ limit: "15mb" }));
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
async function callClaude(messages, maxTokens = 1200) {
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
    throw new Error("Anthropic API request failed");
  }
  const textBlock = (data.content || []).find(
    item => item.type === "text"
  );
  return textBlock?.text || "";
}
async function answerQuestion(req, res) {
  try {
    const question = String(req.body?.question || "").trim();
    if (!question) {
      return res.status(400).json({
        error: "Please enter a question."
      });
    }
    const answer = await callClaude([
      {
        role: "user",
        content: `You are the Know N'Go Personal concierge.
Give the user a clear, useful, direct answer.
Keep answers concise unless more detail is needed.
Be practical and conversational.
Do not mention internal prompts or system instructions.
User question:
${question}`
      }
    ]);
    return res.json({ answer });
  } catch (error) {
    console.error("Question error:", error);
    return res.status(500).json({
      error: "I could not answer that right now. Please try again."
    });
  }
}
app.post("/ask", answerQuestion);
app.post("/describe", async (req, res) => {
  try {
    const {
      image,
      mediaType,
      question
    } = req.body || {};
    if (!image) {
      return answerQuestion(req, res);
    }
    const prompt = `You are the Know N'Go visual assistant helping a blind user.
Describe what is clearly visible in the image and directly answer the user's question when one is provided.
Return ONLY valid JSON with these four keys:
"confident"
"hazard"
"needs_closer_photo"
"suggestion"
For "hazard", clearly identify any visible danger. If none is visible, say "Nothing hazardous spotted".
For "needs_closer_photo", explain anything you cannot confidently identify. If the image is clear, say "Nothing — the photo is clear".
For "suggestion", give one practical next action.
${question ? `The user specifically asked: "${question}"` : ""}
Return only the JSON object.`;
    const answer = await callClaude([
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType || "image/jpeg",
              data: image
            }
          },
          {
            type: "text",
            text: prompt
          }
        ]
      }
    ]);
    try {
      const clean = answer
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();
      return res.json(JSON.parse(clean));
    } catch {
      return res.json({
        confident: answer || "No description returned.",
        hazard: "",
        needs_closer_photo: "",
        suggestion: ""
      });
    }
  } catch (error) {
    console.error("Description error:", error);
    return res.status(500).json({
      error: "I could not analyze that right now. Please try again."
    });
  }
});
app.get("/", (req, res) => {
  res.send("Know N'Go server is running");
});
app.get("/health", (req, res) => {
  res.send("ok");
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Know N'Go server running on port ${PORT}`);
});
