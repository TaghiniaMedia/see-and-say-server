const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json({ limit: '15mb' }));

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

if (!ANTHROPIC_API_KEY) {
  console.error('Missing ANTHROPIC_API_KEY environment variable.');
}

function buildPrompt(userQuestion) {
  return `You are the Know N'Go AI concierge.

Answer the user's question clearly, directly, and helpfully.

User question:
"${userQuestion}"

Keep the answer concise and practical.`;
}

app.post('/ask', async (req, res) => {
  try {
    const { question } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({
        error: 'Please enter a question.'
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
          max_tokens: 1000,
          messages: [
            {
              role: 'user',
              content: buildPrompt(question)
            }
          ]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('Anthropic API error:', data);

      return res.status(502).json({
        error: 'The AI service had a problem. Please try again.'
      });
    }

    const textBlock = (data.content || []).find(
      item => item.type === 'text'
    );

    const answer =
      textBlock?.text ||
      'I was unable to generate an answer.';

    res.json({
      answer
    });

  } catch (err) {
    console.error('Server error:', err);

    res.status(500).json({
      error: 'Something went wrong on the server. Please try again.'
    });
  }
});

app.get('/health', (req, res) => {
  res.send('ok');
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Know N'Go server running on port ${PORT}`);
});
