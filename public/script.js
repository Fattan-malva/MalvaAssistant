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
        
        // Kirim pesan ketika tekan Enter
        this.userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });
        
        // Auto-focus input
        this.userInput.focus();
    }
    
    async sendMessage() {
        const message = this.userInput.value.trim();
        if (!message) return;

        // Tambah pesan user ke chat
        this.addMessage(message, 'user');
        this.userInput.value = '';

        // Tampilkan loading
        this.showLoading(true);

        try {
            let botReply;

            // Check for identity questions
            if (this.isIdentityQuestion(message)) {
                botReply = this.rules?.identity_response?.response || 'Saya Malva Assistant, dibuat oleh Mas Fattan. Lumayan keren ya? Apa yang bisa saya bantu hari ini?';
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
        contentDiv.textContent = text;

        messageDiv.appendChild(contentDiv);
        this.chatMessages.appendChild(messageDiv);

        this.scrollToBottom();
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
    
    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }
}

// Inisialisasi chat ketika halaman dimuat
document.addEventListener('DOMContentLoaded', () => {
    new AIChat();
});