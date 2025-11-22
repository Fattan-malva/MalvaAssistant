import express from 'express';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware to parse JSON
app.use(express.json());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve static files from the resources directory
app.use('/resources', express.static(path.join(__dirname, 'resources')));

// Load rules from public/rules.json
let rules = null;
async function loadRules() {
  try {
    const rulesPath = path.join(__dirname, 'public', 'rules.json');
    const rulesData = await fs.readFile(rulesPath, 'utf8');
    rules = JSON.parse(rulesData);
    console.log('Rules loaded successfully');
  } catch (error) {
    console.error('Failed to load rules.json:', error);
  }
}

// Initialize rules on startup
loadRules();

// Proxy API requests to the external API with rules enforcement
app.post('/chat', async (req, res) => {
  try {
    const userPrompt = req.body.prompt || '';

    // Reload rules if not loaded
    if (!rules) {
      await loadRules();
    }

    // Check if it's an identity question using rules
    if (rules && rules.identity_response && rules.identity_response.identity_keywords) {
      const identityKeywords = rules.identity_response.identity_keywords;
      const isIdentityQuestion = identityKeywords.some(keyword => userPrompt.toLowerCase().includes(keyword));

      if (isIdentityQuestion) {
        // Return the identity response from rules
        return res.json({
          response: rules.identity_response.response,
          model: "malva-assistant",
          prompt: userPrompt,
          timestamp: new Date().toISOString(),
          usage: { total_tokens: 0, total_time: 0 }
        });
      }
    }

    // For other questions, proxy to the external API with style enforcement
    let enhancedPrompt = userPrompt;
    if (rules && rules.speaking_style) {
      const style = rules.speaking_style;
      enhancedPrompt += `\n\nIMPORTANT: ${style.description}. Examples: ${style.examples.join(', ')}. ${rules.general_rules.join(', ')}.`;
    }

    const response = await fetch('https://malva-assistant-api.vercel.app/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt: enhancedPrompt }),
    });

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error proxying to API:', error);
    res.status(500).json({ error: 'Failed to communicate with API' });
  }
});

// TTS endpoint using ggs.js
app.post('/tts', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    // Import ggs.js dynamically
    const { textToSpeech } = await import('./speech/ggs.js');

    // Generate audio file in /tmp (Vercel serverless compatible)
    const outputPath = `/tmp/temp_${Date.now()}.mp3`;
    await textToSpeech(text, outputPath);

    // Read the file as buffer
    const audioBuffer = await fs.readFile(outputPath);

    // Set headers for MP3
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', 'inline; filename="speech.mp3"');

    // Send the buffer
    res.send(audioBuffer);

    // Clean up temp file
    fs.unlink(outputPath, (unlinkErr) => {
      if (unlinkErr) console.error('Error deleting temp file:', unlinkErr);
    });
  } catch (error) {
    console.error('TTS error:', error);
    res.status(500).json({ error: 'Failed to generate speech' });
  }
});

// Handle all other routes by serving index.html (for SPA routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
