class AIChat {
    constructor() {
        this.apiUrl = 'https://malva-assistant-api.vercel.app/chat';
        this.chatMessages = document.getElementById('chat-messages');
        this.userInput = document.getElementById('user-input');
        this.sendButton = document.getElementById('send-button');
        this.loading = document.getElementById('loading');
        this.rules = null;

        this.loadRules();
        this.initializeEventListeners();
    }

    async loadRules() {
        try {
            const response = await fetch('rules.json');
            this.rules = await response.json();
        } catch (error) {
            console.error('Failed to load rules.json:', error);
        }
    }
    
    initializeEventListeners() {
        // Kirim pesan ketika tombol diklik
        this.sendButton.addEventListener('click', () => this.sendMessage());

        // Kirim pesan ketika tekan Enter (tanpa Shift)
        this.userInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Auto-resize textarea
        this.userInput.addEventListener('input', () => this.autoResizeTextarea());

        // Auto-focus input
        this.userInput.focus();
    }
    
    async sendMessage() {
        const message = this.userInput.value.trim();
        if (!message) return;

        // Tambah pesan user ke chat
        this.addMessage(message, 'user');
        this.userInput.value = '';
        this.autoResizeTextarea(); // Reset height after sending

        // Tampilkan loading
        this.showLoading(true);

        try {
            let botReply;

            // Check for identity questions
            if (this.isIdentityQuestion(message)) {
                botReply = this.rules?.identity_response?.response || 'Saya Malva Assistant, dibuat oleh Fattan Malva. Lumayan keren ya? Apa yang bisa saya bantu hari ini?';
            } else {
                // Kirim request ke API with style instructions
                const response = await this.callAPI(message);

                // Ambil hanya isi respon dari field "response"
                botReply = typeof response === 'object' ? response.response : response;
            }

            // Tambah response AI ke chat
            this.addMessage(botReply, 'bot');

        } catch (error) {
            console.error('Error:', error);
            this.addMessage('Oops, ada error nih. Coba lagi ya!', 'bot');
        } finally {
            this.showLoading(false);
        }
    }

    isIdentityQuestion(message) {
        const identityKeywords = this.rules?.identity_response?.identity_keywords || ['siapa kamu', 'who are you', 'apa kamu', 'kamu siapa', 'who you', 'kamu apa', 'siapa anda', 'who is you', 'what are you', 'apa anda', 'who am i talking to', 'what is your name', 'nama kamu', 'siapa nama kamu'];
        return identityKeywords.some(keyword => message.toLowerCase().includes(keyword));
    }


    
    async callAPI(prompt) {
        const response = await fetch('/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    }
    
    addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        // Parse **bold** as <strong>bold</strong>, *italic* as bold yellow, ### headings as bold light green, and tables
        let html = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.*?)\*/g, '<strong style="color: #90EE90;">$1</strong>');
        html = html.replace(/### (.+)/g, '<strong style="color: #90EE90;">$1</strong>');
        html = html.replace(/## (.+)/g, '<strong style="color: #90EE90;">$1</strong>');
        html = this.parseMarkdownTable(html);
        contentDiv.innerHTML = html;

        // Add action buttons
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'message-actions';

        // Copy button
        const copyButton = document.createElement('button');
        copyButton.className = 'action-btn copy-btn';
        copyButton.title = 'Copy to clipboard';
        copyButton.innerHTML = '<i class="fas fa-copy"></i>';
        copyButton.addEventListener('click', () => this.copyToClipboard(text));

        actionsDiv.appendChild(copyButton);

        // Edit button for user messages
        if (sender === 'user') {
            const editButton = document.createElement('button');
            editButton.className = 'action-btn edit-btn';
            editButton.title = 'Edit message';
            editButton.innerHTML = '<i class="fas fa-edit"></i>';
            editButton.addEventListener('click', () => this.editMessage(messageDiv, contentDiv, text));
            actionsDiv.appendChild(editButton);
        }

        messageDiv.appendChild(contentDiv);
        messageDiv.appendChild(actionsDiv);
        this.chatMessages.appendChild(messageDiv);

        this.scrollToBottom();
    }

    parseMarkdownTable(text) {
        const lines = text.split('\n');
        let inTable = false;
        let tableHtml = '';
        let headers = [];
        let rows = [];

        for (let line of lines) {
            if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
                const cells = line.split('|').slice(1, -1).map(cell => cell.trim());
                if (!inTable) {
                    headers = cells;
                    inTable = true;
                } else if (cells.every(cell => cell.match(/^[-:]+$/))) {
                    // Separator line, skip
                    continue;
                } else {
                    rows.push(cells);
                }
            } else {
                if (inTable) {
                    // End of table
                    tableHtml += this.buildTable(headers, rows);
                    inTable = false;
                    headers = [];
                    rows = [];
                }
                tableHtml += line + '\n';
            }
        }
        if (inTable) {
            tableHtml += this.buildTable(headers, rows);
        }
        return tableHtml.replace(/\n/g, '<br>');
    }

    buildTable(headers, rows) {
        let html = '<table class="message-table"><thead><tr>';
        headers.forEach(header => {
            html += `<th>${header}</th>`;
        });
        html += '</tr></thead><tbody>';
        rows.forEach(row => {
            html += '<tr>';
            row.forEach(cell => {
                html += `<td>${cell}</td>`;
            });
            html += '</tr>';
        });
        html += '</tbody></table>';
        return html;
    }
    
    showLoading(show) {
        if (show) {
            const loadingDiv = document.createElement('div');
            loadingDiv.className = 'message bot-message loading';
            loadingDiv.id = 'loading-message';
            loadingDiv.innerHTML = `
                <div class="loading-dots">
                    <div class="dot"></div>
                    <div class="dot"></div>
                    <div class="dot"></div>
                </div>
            `;
            this.chatMessages.appendChild(loadingDiv);
            this.scrollToBottom();
        } else {
            const loadingMessage = document.getElementById('loading-message');
            if (loadingMessage) {
                loadingMessage.remove();
            }
        }
        this.sendButton.disabled = show;
    }
    
    autoResizeTextarea() {
        this.userInput.style.height = 'auto';
        this.userInput.style.height = Math.min(this.userInput.scrollHeight, 120) + 'px';
    }

    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            // Show temporary feedback
            const notification = document.createElement('div');
            notification.className = 'copy-notification';
            notification.textContent = 'Copied to clipboard!';
            document.body.appendChild(notification);
            setTimeout(() => notification.remove(), 2000);
        }).catch(err => {
            console.error('Failed to copy: ', err);
        });
    }

    editMessage(messageDiv, contentDiv, originalText) {
        // Create edit input
        const editInput = document.createElement('textarea');
        editInput.className = 'edit-input';
        editInput.value = originalText;
        editInput.style.width = '100%';
        editInput.style.minHeight = '40px';
        editInput.style.border = '1px solid #3a3a5e';
        editInput.style.borderRadius = '8px';
        editInput.style.background = '#2a2a4e';
        editInput.style.color = '#e0e0e0';
        editInput.style.padding = '8px';
        editInput.style.resize = 'none';

        // Replace content with input
        contentDiv.innerHTML = '';
        contentDiv.appendChild(editInput);
        editInput.focus();
        editInput.select();

        // Handle save on Enter
        editInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.saveEdit(messageDiv, contentDiv, editInput.value, originalText);
            } else if (e.key === 'Escape') {
                this.cancelEdit(contentDiv, originalText);
            }
        });

        // Handle save on blur
        editInput.addEventListener('blur', () => {
            this.saveEdit(messageDiv, contentDiv, editInput.value, originalText);
        });
    }

    saveEdit(messageDiv, contentDiv, newText, originalText) {
        if (newText.trim() && newText !== originalText) {
            // Update the message content
            let html = newText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            html = html.replace(/\*(.*?)\*/g, '<strong style="color: #90EE90;">$1</strong>');
            html = html.replace(/### (.+)/g, '<strong style="color: #90EE90;">$1</strong>');
            html = html.replace(/## (.+)/g, '<strong style="color: #90EE90;">$1</strong>');
            html = this.parseMarkdownTable(html);
            contentDiv.innerHTML = html;

            // Optionally, you could resend the message to get a new AI response
            // But for now, just update the display
        } else {
            this.cancelEdit(contentDiv, originalText);
        }
    }

    cancelEdit(contentDiv, originalText) {
        let html = originalText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.*?)\*/g, '<strong style="color: #90EE90;">$1</strong>');
        html = html.replace(/### (.+)/g, '<strong style="color: #90EE90;">$1</strong>');
        html = html.replace(/## (.+)/g, '<strong style="color: #90EE90;">$1</strong>');
        html = this.parseMarkdownTable(html);
        contentDiv.innerHTML = html;
    }

    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }
}

// Typing animation for title
class TypingAnimation {
    constructor(element, text, speed = 100, delay = 2000) {
        this.element = element;
        this.fullText = text;
        this.speed = speed;
        this.delay = delay;
        this.index = 0;
        this.isDeleting = false;
        this.type();
    }

    type() {
        const currentText = this.isDeleting
            ? this.fullText.substring(0, this.index--)
            : this.fullText.substring(0, this.index++);

        this.element.textContent = currentText;

        let timeout;
        if (!this.isDeleting && this.index === this.fullText.length) {
            // Pause at end
            timeout = this.delay;
            this.isDeleting = true;
        } else if (this.isDeleting && this.index === 0) {
            // Pause at start
            timeout = this.delay;
            this.isDeleting = false;
        } else {
            timeout = this.speed;
        }

        setTimeout(() => this.type(), timeout);
    }
}

// Inisialisasi chat ketika halaman dimuat
document.addEventListener('DOMContentLoaded', () => {
    new AIChat();

    // Start typing animation for title
    const titleSpan = document.querySelector('.malva-title span');
    if (titleSpan) {
        new TypingAnimation(titleSpan, " Hi, I'm Malva Assistant ");
    }
});
