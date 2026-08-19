const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json({ limit: '15mb' }));

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

function buildPhotoPrompt(question) {
  return `You are the AI assistant for Know N'Go.

Help the user understand what is in the photo clearly, accurately, and concisely.

The user may be blind or visually impaired, so describe important visual information directly.

Pay special attention to:
- objects and surroundings
- visible text
- safety hazards
- product information
- signs, labels, menus, documents, or instructions
- anything unusual or important

If you are uncertain, say so rather than guessing.

${question ? `The user specifically asked: "${question}"` : ''}

Respond naturally and directly to the user.`;
}

function buildTextPrompt(question) {
  return `You are the AI assistant for Know N'Go.

Answer the user's question clearly, accurately, practically, and concisely.

User question:
"${question}"

Do not claim to see a photo unless a photo was actually provided.`;
}

app.post('/describe', async (req, res) => {
  try {
    const { image, mediaType, question } = req.body || {};

    if (!image && !question) {
      return res.status(400).json({
        error: 'Please provide a question or photo.'
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
        text: buildPhotoPrompt(question)
      });
    } else {
      content.push({
        type: 'text',
        text: buildTextPrompt(question)
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
        error: 'The AI service had a problem. Please try again.'
      });
    }

    const text =
      (data.content || []).find(
        item => item.type === 'text'
      )?.text || 'No answer was returned.';

    res.json({
      answer: text,
      confident: text,
      hazard: '',
      needs_closer_photo: '',
      suggestion: ''
    });

  } catch (error) {
    console.error('Server error:', error);

    res.status(500).json({
      error: 'Something went wrong. Please try again.'
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