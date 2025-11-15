class SpeechAI {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.isSpeaking = false;
        this.audio = null;

        this.voiceModeContainer = document.getElementById('voice-mode-container');
        this.robotIcon = document.querySelector('.robot-icon');
        this.voiceStatus = document.querySelector('.voice-status');
        this.backButton = document.getElementById('back-button');
        this.stopButton = document.getElementById('stop-button');

        this.initializeSpeechRecognition();
        this.initializeEventListeners();
    }

    initializeSpeechRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.lang = 'id-ID'; // Indonesian
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.maxAlternatives = 1;

            this.recognition.onstart = () => {
                this.isListening = true;
                this.updateStatus('Mendengarkan...');
                this.robotIcon.style.animation = 'pulse 1s infinite';
            };

            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                this.handleSpeechResult(transcript);
            };

            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.updateStatus('Error: ' + event.error);
                this.resetListening();
            };

            this.recognition.onend = () => {
                this.resetListening();
            };
        } else {
            this.updateStatus('Speech recognition tidak didukung');
        }
    }

    initializeEventListeners() {
        // Tap robot to start listening
        this.robotIcon.addEventListener('click', () => {
            if (!this.isListening && !this.isSpeaking) {
                this.startListening();
            }
        });

        // Back button
        this.backButton.addEventListener('click', () => {
            window.location.href = 'index.html';
        });

        // Stop button
        this.stopButton.addEventListener('click', () => {
            this.stopSpeaking();
        });
    }

    startListening() {
        if (this.recognition && !this.isListening) {
            this.recognition.start();
        }
    }

    async handleSpeechResult(transcript) {
        console.log('Speech result:', transcript);
        this.updateStatus('Memproses...');

        try {
            // Send to chat API
            const response = await fetch('/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: transcript })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const aiResponse = data.response;

            // Generate TTS
            await this.generateAndPlaySpeech(aiResponse);

        } catch (error) {
            console.error('Error:', error);
            this.updateStatus('Error memproses');
            setTimeout(() => this.updateStatus('Tap to speak...'), 2000);
        }
    }

    async generateAndPlaySpeech(text) {
        try {
            this.updateStatus('Membuat suara...');

            const response = await fetch('/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });

            if (!response.ok) {
                throw new Error(`TTS error! status: ${response.status}`);
            }

            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);

            this.audio = new Audio(audioUrl);
            this.isSpeaking = true;

            this.audio.onloadedmetadata = () => {
                this.updateStatus('Sedang berbicara...');
                this.audio.play();
            };

            this.audio.onended = () => {
                this.stopSpeaking();
                this.updateStatus('Tap to speak...');
            };

            this.audio.onerror = () => {
                console.error('Audio playback error');
                this.stopSpeaking();
                this.updateStatus('Error audio');
                setTimeout(() => this.updateStatus('Tap to speak...'), 2000);
            };

        } catch (error) {
            console.error('TTS error:', error);
            this.updateStatus('Error TTS');
            setTimeout(() => this.updateStatus('Tap to speak...'), 2000);
        }
    }

    stopSpeaking() {
        if (this.audio) {
            this.audio.pause();
            this.audio.currentTime = 0;
            URL.revokeObjectURL(this.audio.src);
            this.audio = null;
        }
        this.isSpeaking = false;
        this.robotIcon.style.animation = '';
    }

    updateStatus(status) {
        this.voiceStatus.textContent = status;
    }

    resetListening() {
        this.isListening = false;
        this.robotIcon.style.animation = '';
        if (!this.isSpeaking) {
            this.updateStatus('Tap to speak...');
        }
    }
}

// Initialize when DOM loaded
document.addEventListener('DOMContentLoaded', () => {
    new SpeechAI();
});
