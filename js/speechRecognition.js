const speechRecognition = {
    recognition: null,
    isRecording: false,
    fullTranscript: '',
    lastTranscript: '',
    currentSession: '',
    lastSpeechTime: Date.now(),
    lastProcessedLength: 0,
    PAUSE_THRESHOLD: 800,
    
    initSpeechRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        
        // Cấu hình nhận diện
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.maxAlternatives = 1;
        this.recognition.lang = document.getElementById('sourceLanguage').value === 'vi' ? 'vi-VN' : 'en-US';
        
        this.recognition.onresult = (event) => {
            const currentTime = Date.now();
            
            // Lấy văn bản mới nhất với độ tin cậy cao
            const results = Array.from(event.results)
                .filter(result => result[0].confidence >= 0.7)
                .map(result => result[0].transcript);
            
            const fullText = results.join(' ');
            
            // Chỉ xử lý phần văn bản mới và có ý nghĩa
            if (fullText.length > this.lastProcessedLength && fullText.trim()) {
                const newText = fullText.slice(this.lastProcessedLength).trim();
                
                // Loại bỏ các từ không có nghĩa hoặc lỗi nhận diện
                if (newText.length > 1) {
                    // Kiểm tra khoảng thời gian dừng
                    if (currentTime - this.lastSpeechTime > this.PAUSE_THRESHOLD) {
                        if (this.currentSession.trim()) {
                            this.fullTranscript += this.currentSession + '\n';
                        }
                        this.currentSession = newText;
                    } else {
                        this.currentSession = (this.currentSession + ' ' + newText).trim();
                    }
                    
                    // Kiểm tra dấu câu và độ dài câu hợp lý
                    if (/[.!?]$/.test(this.currentSession) || this.currentSession.length > 100) {
                        this.fullTranscript += this.currentSession + '\n';
                        this.currentSession = '';
                    }
                    
                    this.lastProcessedLength = fullText.length;
                    
                    // Hiển thị văn bản
                    const displayText = this.fullTranscript + this.currentSession;
                    const vietnameseTextArea = document.getElementById('vietnameseText');
                    vietnameseTextArea.value = displayText;
                    vietnameseTextArea.scrollTop = vietnameseTextArea.scrollHeight;
                    
                    // Dịch nếu có thay đổi đáng kể
                    if (displayText !== this.lastTranscript) {
                        translator.translate(displayText);
                        this.lastTranscript = displayText;
                    }
                }
            }
            
            this.lastSpeechTime = currentTime;
        };

        this.recognition.onend = () => {
            if (this.currentSession) {
                this.fullTranscript += this.currentSession + '\n';
                this.currentSession = '';
                this.lastProcessedLength = 0;
                
                const vietnameseTextArea = document.getElementById('vietnameseText');
                vietnameseTextArea.value = this.fullTranscript;
                vietnameseTextArea.scrollTop = vietnameseTextArea.scrollHeight;
                translator.translate(this.fullTranscript);
            }

            if (this.isRecording) {
                this.recognition.start();
            }
        };

        this.recognition.onerror = (event) => {
            console.error('Lỗi nhận diện giọng nói:', event.error);
            if (event.error === 'no-speech') {
                if (this.isRecording) {
                    this.recognition.start();
                }
            } else {
                this.stopRecording();
            }
        };
    },

    toggleRecording() {
        if (!this.recognition) {
            this.initSpeechRecognition();
        }

        const micButton = document.getElementById('micButton');
        
        if (!this.isRecording) {
            // Bắt đầu ghi âm mới
            document.getElementById('vietnameseText').value = '';
            document.getElementById('englishText').value = '';
            this.fullTranscript = '';
            this.currentSession = '';
            this.lastProcessedLength = 0;
            this.recognition.lang = document.getElementById('sourceLanguage').value === 'vi' ? 'vi-VN' : 'en-US';
            this.recognition.start();
            this.isRecording = true;
            micButton.classList.add('recording');
            micButton.innerHTML = '<i class="fas fa-microphone"></i> Dừng ghi âm';
        } else {
            this.stopRecording();
        }
    },

    stopRecording() {
        if (this.recognition) {
            this.recognition.stop();
        }
        this.isRecording = false;
        const micButton = document.getElementById('micButton');
        micButton.classList.remove('recording');
        micButton.innerHTML = '<i class="fas fa-microphone"></i> Bắt đầu ghi âm';
    }
}; 