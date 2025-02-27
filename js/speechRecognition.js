class SpeechRecognitionHandler {
    constructor() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            this.showError('Trình duyệt không hỗ trợ nhận dạng giọng nói');
            return;
        }

        this.recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        this.recognition.lang = 'vi-VN';
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.maxAlternatives = 3;
        
        this.isRecording = false;
        this.restartTimeout = null;
        this.noSpeechTimeout = null;
        
        this.setupRecognition();
        this.startRecording(); // Tự động bật micro khi khởi tạo
    }

    setupRecognition() {
        this.recognition.onstart = () => {
            this.updateStatus('Đang nghe...');
            this.setRecordingState(true);
            this.startNoSpeechTimer();
        };

        this.recognition.onresult = (event) => {
            this.resetNoSpeechTimer();
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                const transcript = result[0].transcript;
                const confidence = result[0].confidence;
                
                if (confidence < 0.5) {
                    console.log('⚠️ Bỏ qua kết quả độ tin cậy thấp:', transcript);
                    continue;
                }

                if (result.isFinal) {
                    finalTranscript = this.improveVietnameseText(transcript);
                    console.log('✅ Kết quả cuối cùng:', finalTranscript);
                    console.log('📊 Độ chính xác:', Math.round(confidence * 100) + '%');
                    translator.translateText(finalTranscript);
                } else {
                    interimTranscript = this.improveVietnameseText(transcript);
                    console.log('🔄 Đang nhận diện:', interimTranscript);
                    translator.translateText(interimTranscript, true);
                }
            }
        };

        this.recognition.onerror = (event) => {
            console.error('❌ Lỗi nhận dạng giọng nói:', event.error);
            this.handleError(event.error);
        };

        this.recognition.onend = () => {
            console.log('🛑 Kết thúc phiên ghi âm');
            clearTimeout(this.noSpeechTimeout);
            
            if (this.isRecording) {
                console.log('🔄 Tự động khởi động lại...');
                this.restartTimeout = setTimeout(() => {
                    this.recognition.start();
                }, 300);
            }
        };
    }

    handleError(error) {
        switch (error) {
            case 'not-allowed':
                this.showError('Vui lòng cấp quyền truy cập microphone');
                break;
            case 'audio-capture':
                this.showError('Không tìm thấy microphone');
                break;
            case 'no-speech':
                this.updateStatus('Không nghe thấy giọng nói, đang thử lại...');
                this.restartRecording();
                break;
            default:
                this.showError('Đã xảy ra lỗi, đang thử lại...');
                this.restartRecording();
        }
    }

    showError(message) {
        const statusIndicator = document.querySelector('.status-indicator');
        const statusText = document.getElementById('statusText');
        
        statusIndicator.classList.add('error');
        statusText.textContent = message;
        
        setTimeout(() => {
            statusIndicator.classList.remove('error');
            this.updateStatus('Đang nghe...');
        }, 3000);
    }

    updateStatus(message) {
        const statusText = document.getElementById('statusText');
        statusText.textContent = message;
    }

    setRecordingState(isRecording) {
        const statusIndicator = document.querySelector('.status-indicator');
        if (isRecording) {
            statusIndicator.classList.add('recording');
        } else {
            statusIndicator.classList.remove('recording');
        }
    }

    improveVietnameseText(text) {
        return text.trim()
            .replace(/\s+/g, ' ')
            .replace(/\.+/g, '.')
            .replace(/\?+/g, '?')
            .replace(/\!+/g, '!')
            .replace(/(^|[.!?]\s+)([a-zàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ])/g, 
                (match, p1, p2) => p1 + p2.toUpperCase()
            );
    }

    startNoSpeechTimer() {
        clearTimeout(this.noSpeechTimeout);
        this.noSpeechTimeout = setTimeout(() => {
            this.updateStatus('Không nghe thấy giọng nói, đang thử lại...');
            this.restartRecording();
        }, 10000);
    }

    resetNoSpeechTimer() {
        clearTimeout(this.noSpeechTimeout);
        this.startNoSpeechTimer();
    }

    restartRecording() {
        if (this.isRecording) {
            this.recognition.stop();
            setTimeout(() => {
                this.recognition.start();
            }, 500);
        }
    }

    startRecording() {
        try {
            this.isRecording = true;
            this.recognition.start();
            console.log('▶️ Bắt đầu ghi âm');
        } catch (error) {
            console.error('❌ Lỗi khi bắt đầu ghi âm:', error);
            this.handleStartError();
        }
    }

    handleStartError() {
        this.showError('Không thể bắt đầu ghi âm, đang thử lại...');
        setTimeout(() => {
            this.startRecording();
        }, 1000);
    }
}

// Khởi tạo ngay khi trang web load xong
document.addEventListener('DOMContentLoaded', () => {
    const speechRecognition = new SpeechRecognitionHandler();
}); 