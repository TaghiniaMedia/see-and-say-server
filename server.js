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
  return `You are the Know N'Go Personal AI assistant for a blind or low-vision user.

Analyze the photo carefully and answer clearly and naturally.

Include:
1. What you can confidently see.
2. Any important visible text.
3. Any possible hazard or safety concern.
4. Anything you are uncertain about.
5. One useful next action.

${userQuestion ? `The user asked: "${userQuestion}". Answer that question directly and prioritize it.` : ''}

Do not guess. If something is unclear, say so.`;
}

app.post('/describe', async (req, res) => {
  try {
    const { image, mediaType, question } = req.body;

    if (!image) {
      return res.status(400).json({
        error: 'No image provided.'
      });
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
        max_tokens: 1200,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType || 'image/jpeg',
                  data: image
                }
              },
              {
                type: 'text',
                text: buildPrompt(question)
              }
            ]
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Anthropic API error:', data);

      return res.status(502).json({
        error: 'Know N\'Go could not analyze this right now. Please try again.'
      });
    }

    const textBlock = (data.content || []).find(
      item => item.type === 'text'
    );

    const answer =
      textBlock?.text ||
      'I could not get a description from that image.';

    res.json({
      answer
    });

  } catch (error) {
    console.error('Server error:', error);

    res.status(500).json({
      error: 'Something went wrong. Please try again.'
    });
  }
});

app.post('/ask', async (req, res) => {
  try {
    const { question } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({
        error: 'Please enter a question.'
      });
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
        system:
          "You are the Know N'Go Personal AI assistant. Give direct, useful, accessible answers. Keep answers clear and concise unless the user asks for more detail.",
        messages: [
          {
            role: 'user',
            content: question.trim()
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Anthropic API error:', data);

      return res.status(502).json({
        error: 'Know N\'Go could not answer right now. Please try again.'
      });
    }

    const textBlock = (data.content || []).find(
      item => item.type === 'text'
    );

    res.json({
      answer:
        textBlock?.text ||
        'I could not generate an answer.'
    });

  } catch (error) {
    console.error('Server error:', error);

    res.status(500).json({
      error: 'Something went wrong. Please try again.'
    });
  }
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: "Know N'Go"
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Know N'Go server running on port ${PORT}`);
});      'I could not get a description from that image.';

    res.json({
      answer
    });

  } catch (error) {
    console.error('Server error:', error);

    res.status(500).json({
      error: 'Something went wrong. Please try again.'
    });
  }
});

app.post('/ask', async (req, res) => {
  try {
    const { question } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({
        error: 'Please enter a question.'
      });
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
        system:
          "You are the Know N'Go Personal AI assistant. Give direct, useful, accessible answers. Keep answers clear and concise unless the user asks for more detail.",
        messages: [
          {
            role: 'user',
            content: question.trim()
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Anthropic API error:', data);

      return res.status(502).json({
        error: 'Know N\'Go could not answer right now. Please try again.'
      });
    }

    const textBlock = (data.content || []).find(
      item => item.type === 'text'
    );

    res.json({
      answer:
        textBlock?.text ||
        'I could not generate an answer.'
    });

  } catch (error) {
    console.error('Server error:', error);

    res.status(500).json({
      error: 'Something went wrong. Please try again.'
    });
  }
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: "Know N'Go"
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Know N'Go server running on port ${PORT}`);
});
