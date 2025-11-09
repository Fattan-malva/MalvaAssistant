document.addEventListener('DOMContentLoaded', () => {
  const promptInput = document.getElementById('prompt-input');
  const sendButton = document.getElementById('send-button');
  const chatMessages = document.getElementById('chat-messages');

  const addMessage = (message, className) => {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${className}`;

    // Create avatar
    const avatar = document.createElement('img');
    avatar.className = 'message-avatar';
    avatar.src = className === 'user-message' ? document.getElementById('user-avatar').src : document.getElementById('ai-avatar').src;
    avatar.alt = className === 'user-message' ? 'User' : 'AI';

    // Create content container
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';

    // Process markdown-like formatting
    let processedMessage = message
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code>$1</code>');

    // Special styling for specific text
    processedMessage = processedMessage.replace(/### Mengapa saham‑saham ini muncul di hasil pencarian\?/g, '<span class="special-text">$&</span>');

    // Handle code blocks with copy and run buttons
    processedMessage = processedMessage.replace(/```([\s\S]*?)```/g, (match, code) => {
      const isHtml = /<[^>]*>/.test(code.trim());
      const codeBlock = document.createElement('div');
      codeBlock.className = 'code-block';

      const pre = document.createElement('pre');
      const codeEl = document.createElement('code');
      codeEl.textContent = code.trim();
      pre.appendChild(codeEl);

      const buttons = document.createElement('div');
      buttons.className = 'code-buttons';

      const copyBtn = document.createElement('button');
      copyBtn.className = 'copy-btn';
      copyBtn.textContent = 'Copy';
      copyBtn.onclick = () => {
        navigator.clipboard.writeText(code.trim()).then(() => {
          copyBtn.textContent = 'Copied!';
          setTimeout(() => copyBtn.textContent = 'Copy', 2000);
        });
      };

      buttons.appendChild(copyBtn);

      if (isHtml) {
        const runBtn = document.createElement('button');
        runBtn.className = 'run-btn';
        runBtn.textContent = 'Run HTML';
        runBtn.onclick = () => {
          const newWindow = window.open('', '_blank');
          newWindow.document.write(code.trim());
          newWindow.document.close();
        };
        buttons.appendChild(runBtn);
      }

      codeBlock.appendChild(buttons);
      codeBlock.appendChild(pre);

      return codeBlock.outerHTML;
    });

    contentDiv.innerHTML = processedMessage;

    // Add timestamp
    const timestamp = document.createElement('div');
    timestamp.className = 'message-timestamp';
    timestamp.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    contentDiv.appendChild(timestamp);

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(contentDiv);

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  };

  const showLoading = () => {
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message ai-message typing-indicator';
    loadingDiv.innerHTML = '<img class="message-avatar" src="' + document.getElementById('ai-avatar').src + '" alt="AI"> <div class="message-content">AI is typing...</div>';
    chatMessages.appendChild(loadingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return loadingDiv;
  };

  const hideLoading = (loadingDiv) => {
    if (loadingDiv && loadingDiv.parentNode) {
      loadingDiv.parentNode.removeChild(loadingDiv);
    }
  };

  const sendMessage = async () => {
    const prompt = promptInput.value.trim();
    if (!prompt) return;

    addMessage(prompt, 'user-message');
    promptInput.value = '';

    const loadingDiv = showLoading();

    try {
      const response = await fetch('/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt })
      });

      const data = await response.json();
      hideLoading(loadingDiv);

      if (!response.ok) {
        addMessage(`Error: ${data.error || 'Unable to get response from AI.'}`, 'ai-message');
        return;
      }

      addMessage(data.response, 'ai-message');
    } catch (error) {
      hideLoading(loadingDiv);
      addMessage('Error: Unable to get response from AI.', 'ai-message');
      console.error('Error:', error);
    }
  };

  sendButton.addEventListener('click', sendMessage);
  promptInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
});
