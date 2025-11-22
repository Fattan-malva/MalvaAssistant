# Stock Analysis AI Overhaul TODO

- [x] Fix resources/data.json: Convert plain text list to proper JSON array of stock codes
- [x] Update app.js: Remove TTS endpoint and speech imports
- [x] Update app.js: Change /chat endpoint to /analyze for stock analysis (load codes, fetch data from API, AI analysis)
- [x] Update app.js: Remove rules loading if not needed
- [x] Update public/index.html: Change UI from chat to stock analysis (dropdown for stocks, display data and AI response)
- [x] Update public/script.js: Modify to call /analyze endpoint, handle stock data display
- [x] Remove speech/ folder entirely
- [x] Remove public/speech.html
- [x] Remove public/speech.js
- [x] Test API endpoint manually to confirm data structure
- [x] Run server and test stock analysis functionality
- [ ] Verify AI responses for accuracy
