const express = require("express");
const cors = require("cors");
const Anthropic = require("@anthropic-ai/sdk");

const app = express();

app.use(cors());
app.use(express.json({ limit: "25mb" }));

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

app.get("/", (req, res) => {
  res.send("Know N'Go server is running.");
});

app.post("/describe", async (req, res) => {
  try {
    const { question, image, mediaType } = req.body;

    const cleanQuestion =
      typeof question === "string" ? question.trim() : "";

    if (!cleanQuestion && !image) {
      return res.status(400).json({
        error: "Please type a question or choose a photo."
      });
    }

    const content = [];

    if (image) {
      content.push({
        type: "image",
        source: {
          type: "base64",
          media_type: mediaType || "image/jpeg",
          data: image
        }
      });
    }

    content.push({
      type: "text",
      text:
        cleanQuestion ||
        "Describe this image clearly and tell me the most useful information about it."
    });

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1200,
      system:
        "You are Know N'Go Personal. Answer clearly, directly, and helpfully. If an image is included, analyze it carefully and answer the user's question about it. Never invent details that are not visible.",
      messages: [
        {
          role: "user",
          content
        }
      ]
    });

    const answer = message.content
      .filter(item => item.type === "text")
      .map(item => item.text)
      .join("\n")
      .trim();

    return res.json({
      answer: answer || "I could not generate a response."
    });
  } catch (error) {
    console.error("Know N'Go error:", error);

    return res.status(500).json({
      error: "The assistant could not process that request."
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Know N'Go server running on port ${PORT}`);
});