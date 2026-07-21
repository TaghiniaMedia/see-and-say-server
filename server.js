// See & Say backend
// Holds the prompt and the Claude API key on the server, not in the browser.
// The phone sends a photo here; this server talks to Claude and sends back only the answer.

const express = require('express');
const cors = require('cors');

const app = express();

// Photos come in as base64 text, which is bigger than plain form data — raise the body size limit.
app.use(cors());
app.use(express.json({ limit: '15mb' }));

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
if (!ANTHROPIC_API_KEY) {
  console.error('Missing ANTHROPIC_API_KEY environment variable. Set it before starting the server.');
}

function buildPrompt(userQuestion) {
  return `You are a description engine for a blind user. Look at this photo and respond ONLY with a JSON object with four keys:
"confident" (what you can clearly see — objects, setting, condition, and any visible text, translated to English if it's in another language),
"hazard" (if you see anything potentially harmful — a spider, scorpion, snake, spill, tripping hazard, an appliance left on, etc — flag it clearly here and say to back away or get it checked; if nothing looks hazardous, say "Nothing hazardous spotted"),
"needs_closer_photo" (anything you are not confident about — be honest, say "Nothing — the photo is clear" if there is nothing uncertain),
"suggestion" (one practical next action for the user — if this looks like a product, price tag, or grocery item, mention it could be ordered through a grocery delivery app or Amazon; if it's a sign or menu in another language, offer to translate more of it).
${userQuestion ? `The user specifically asked: "${userQuestion}". Prioritize answering that in the confident and suggestion fields.` : ''}
Respond with ONLY the JSON object, no markdown fences, no preamble.`;
}

app.post('/describe', async (req, res) => {
  try {
    const { image, mediaType, question } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'No image provided.' });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: mediaType || 'image/jpeg', data: image } },
              { type: 'text', text: buildPrompt(question) }
            ]
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Anthropic API error:', data);
      return res.status(502).json({ error: 'The description service had a problem. Try again.' });
    }

    const textBlock = (data.content || []).find(item => item.type === 'text');
    let parsed;
    try {
      const clean = (textBlock?.text || '').replace(/```json|```/g, '').trim();
      parsed = JSON.parse(clean);
    } catch (e) {
      parsed = { confident: textBlock?.text || 'No description returned.', hazard: '', needs_closer_photo: '', suggestion: '' };
    }

    // Only the finished description leaves the server. The prompt and API key never do.
    res.json(parsed);
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Something went wrong on the server. Try again.' });
  }
});

app.get('/health', (req, res) => res.send('ok'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`See & Say server running on port ${PORT}`));
