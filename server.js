const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON
app.use(express.json());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Route for the root path
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Proxy route for the chat API to avoid CORS issues
app.post('/chat', async (req, res) => {
  try {
    const response = await fetch('https://malva-assistant-api.vercel.app/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prompt: req.body.prompt })
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('API response not ok, but data:', data);
      return res.status(response.status).json(data);
    }

    res.json(data);
  } catch (error) {
    console.error('Error proxying to API:', error);
    res.status(500).json({ error: 'Unable to get response from AI.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
