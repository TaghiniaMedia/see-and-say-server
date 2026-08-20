// Know N'Go backend

const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json({ limit: '15mb' }));

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

if (!ANTHROPIC_API_KEY) {
  console.error('Missing ANTHROPIC_API_KEY environment variable.');
}

function photoPrompt(question) {
  return `You are Know N'Go, an accessibility-first AI assistant.

Describe this photo clearly and practically for a blind or low-vision user.

Respond ONLY with valid JSON using exactly these four keys:

"confident": Clearly describe what you can see, including objects, people, surroundings, condition, colors when useful, and visible text. Translate visible foreign-language text into English when possible.

"hazard": Clearly identify anything potentially dangerous such as traffic, stairs, obstacles, spills, fire, exposed wires, animals, sharp objects, or other hazards. If no hazard is visible, say "Nothing hazardous spotted."

"needs_closer_photo": State anything important you cannot identify confidently. If everything important is clear, say "Nothing — the photo is clear."

"suggestion": Give one useful next action.

${question ? `The user specifically asked: "${question}". Answer that question directly in the "confident" field.` : ''}

Do not use markdown.
Do not add text before or after the JSON object.`;
}

function questionPrompt(question) {
  return `You are Know N'Go, an accessibility-first personal AI assistant.

Answer the user's question directly, clearly, and concisely.

User question:
"${question}"

Respond ONLY with valid JSON using exactly these four keys:

"confident": Put your complete answer here.
"hazard": ""
"needs_closer_photo": ""
"suggestion": ""

Do not use markdown.
Do not add text before or after the JSON object.`;
}

app.post('/describe', async (req, res) => {
  try {
    const { image, mediaType, question } = req.body || {};

    const cleanQuestion =
      typeof question === 'string' ? question.trim() : '';

    if (!image && !cleanQuestion) {
      return res.status(400).json({
        error: 'Please provide a photo or ask a question.'
      });
    }

    const content = [];

    if (image) {
      content.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: mediaType || 'image/jpeg',
          data: image
        }
      });

      content.push({
        type: 'text',
        text: photoPrompt(cleanQuestion)
      });
    } else {
      content.push({
        type: 'text',
        text: questionPrompt(cleanQuestion)
      });
    }

    const response = await fetch(
      'https://api.anthropic.com/v1/messages',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1200,
          messages: [
            {
              role: 'user',
              content
            }
          ]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('Anthropic API error:', data);

      return res.status(502).json({
        error: 'Know N\'Go AI is temporarily unavailable. Please try again.'
      });
    }

    const textBlock = (data.content || []).find(
      item => item.type === 'text'
    );

    const rawText = textBlock?.text || '';

    let parsed;

    try {
      const clean = rawText
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();

      parsed = JSON.parse(clean);
    } catch (error) {
      parsed = {
        confident: rawText || 'No response returned.',
        hazard: '',
        needs_closer_photo: '',
        suggestion: ''
      };
    }

    return res.json(parsed);
  } catch (error) {
    console.error('Know N\'Go server error:', error);

    return res.status(500).json({
      error: 'Something went wrong. Please try again.'
    });
  }
});

app.get('/health', (req, res) => {
  res.status(200).send('Know N\'Go server is running');
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Know N'Go server running on port ${PORT}`);
});