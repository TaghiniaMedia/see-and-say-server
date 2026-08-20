const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json({ limit: '15mb' }));

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

app.get('/', (req, res) => {
  res.json({
    status: 'Know N\'Go server is running'
  });
});

app.get('/health', (req, res) => {
  res.json({
    ok: true
  });
});

app.post('/api/ask', async (req, res) => {
  try {
    if (!ANTHROPIC_API_KEY) {
      return res.status(500).json({
        error: 'ANTHROPIC_API_KEY is not configured.'
      });
    }

    const question =
      req.body.question ||
      req.body.message ||
      req.body.prompt ||
      '';

    const image =
      req.body.image ||
      req.body.imageBase64 ||
      null;

    if (!question.trim() && !image) {
      return res.status(400).json({
        error: 'Please enter a question or provide an image.'
      });
    }

    const content = [];

    if (image) {
      let mediaType = 'image/jpeg';
      let imageData = image;

      if (image.startsWith('data:')) {
        const match = image.match(
          /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/
        );

        if (match) {
          mediaType = match[1];
          imageData = match[2];
        }
      }

      content.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: mediaType,
          data: imageData
        }
      });
    }

    content.push({
      type: 'text',
      text:
        question.trim() ||
        'Describe this image clearly and practically. Pay special attention to text, objects, people, hazards, navigation details, controls, labels, and anything important for a blind user.'
    });

    const response = await fetch(
      'https://api.anthropic.com/v1/messages',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1200,
          system:
            'You are the Know N\'Go personal AI concierge. Give clear, direct, practical answers. When analyzing images for blind users, describe the most useful information first, including text, objects, location, hazards, navigation information, controls, and actionable next steps.',
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
      console.error('Anthropic error:', data);

      return res.status(response.status).json({
        error:
          data?.error?.message ||
          'The AI service returned an error.'
      });
    }

    const answer = Array.isArray(data.content)
      ? data.content
          .filter(item => item.type === 'text')
          .map(item => item.text)
          .join('\n')
          .trim()
      : '';

    res.json({
      answer: answer || 'No response was returned.'
    });
  } catch (error) {
    console.error('Server error:', error);

    res.status(500).json({
      error: 'Unable to reach the AI service.'
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Know N'Go server running on port ${PORT}`);
});      return res.status(400).json({
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
