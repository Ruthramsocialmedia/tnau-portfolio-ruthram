// tts-reader.js - Centralized TTS Audio Manager for Website Content

const TTSManager = {
    currentAudio: null,
    currentBtn: null,
    isPlaying: false,

    // API endpoint
    TTS_API: 'https://ai-powered-tour.onrender.com/api/tts',

    getLanguageVoice: function () {
        let lang = 'en'; // default
        // Check custom language active item
        const activeLangItem = document.querySelector('.custom-lang-item.active');
        if (activeLangItem) {
            const code = activeLangItem.getAttribute('data-lang');
            lang = code;
        } else {
            // Fallback to cookie
            const match = document.cookie.match(/googtrans=\/en\/(\w+)/);
            if (match) lang = match[1];
        }

        // Voice Mapping
        if (lang === 'ta') {
            return { lang: 'ta', voice: 'ta-IN-ValluvarNeural' }; // Edge TTS Tamil Male Voice
        } else if (lang === 'hi') {
            return { lang: 'hi', voice: 'hi-IN-MadhurNeural' };
        } else if (lang === 'te') {
            return { lang: 'te', voice: 'te-IN-MohanNeural' };
        } else if (lang === 'ml') {
            return { lang: 'ml', voice: 'ml-IN-MidhunNeural' };
        } else if (lang === 'kn') {
            return { lang: 'kn', voice: 'kn-IN-GaganNeural' };
        } else if (lang === 'bn') {
            return { lang: 'bn', voice: 'bn-IN-BashkarNeural' };
        }
        
        // Default English
        return { lang: 'en', voice: 'en-US-AriaNeural' };
    },

    stop: function () {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
            this.currentAudio = null;
        }
        this.isPlaying = false;
        
        // Reset button UI
        if (this.currentBtn) {
            this.currentBtn.innerHTML = '<i class="fa-solid fa-volume-high"></i> Listen';
            this.currentBtn.classList.remove('btn-danger', 'playing');
            this.currentBtn.classList.add('btn-outline');
            this.currentBtn = null;
        }
    },

    playSectionAudio: async function (containerId, buttonElement) {
        // If clicking the same button while playing, STOP it.
        if (this.currentBtn === buttonElement && this.isPlaying) {
            this.stop();
            return;
        }

        // Stop any currently playing audio
        this.stop();

        const container = document.getElementById(containerId);
        if (!container) {
            console.error('[TTS] Container not found:', containerId);
            return;
        }

        // Extract text (innerText automatically captures Google Translated text!)
        const textToRead = container.innerText.trim();
        if (!textToRead) return;

        const voiceConfig = this.getLanguageVoice();

        // Update UI to loading state
        this.currentBtn = buttonElement;
        buttonElement.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Loading...';
        buttonElement.classList.remove('btn-outline');
        buttonElement.classList.add('btn-primary');

        try {
            const response = await fetch(this.TTS_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: textToRead,
                    voice: voiceConfig.voice
                })
            });

            if (!response.ok) throw new Error('TTS API failed');

            const blob = await response.blob();
            const audioUrl = URL.createObjectURL(blob);
            
            this.currentAudio = new Audio(audioUrl);
            this.isPlaying = true;

            // Update UI to playing state
            buttonElement.innerHTML = '<i class="fa-solid fa-stop"></i> Stop';
            buttonElement.classList.remove('btn-primary');
            buttonElement.classList.add('btn-danger');

            this.currentAudio.play();

            // When audio finishes naturally
            this.currentAudio.onended = () => {
                this.stop();
            };

        } catch (error) {
            console.error('[TTS] Error fetching audio:', error);
            // Revert UI on error
            buttonElement.innerHTML = '<i class="fa-solid fa-volume-high"></i> Error';
            buttonElement.classList.remove('btn-primary');
            buttonElement.classList.add('btn-danger');
            setTimeout(() => this.stop(), 2000);
        }
    }
};

// Expose to global window object
window.TTSManager = TTSManager;
window.playSectionAudio = function(containerId, buttonElement) {
    TTSManager.playSectionAudio(containerId, buttonElement);
};
