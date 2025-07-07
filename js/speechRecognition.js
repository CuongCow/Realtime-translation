class SpeechRecognitionHandler {
    constructor() {
        // Note: Azure Speech API can be used for server-side speech recognition
        // with better accuracy for Vietnamese. Currently using Web Speech API
        // for client-side recognition.
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
        this.pauseDetectionTimeout = null;
        this.previousText = '';
        this.clearDisplayTimeout = null;
        this.continuousSpeechTimeout = null;
        this.lastResultTime = Date.now();
        this.continuousSpeechDuration = 0;
        this.isContinuousSpeech = false;
        
        this.setupRecognition();
        this.startRecording(); // Tự động bật micro khi khởi tạo
    }

    setupRecognition() {
        this.recognition.onstart = () => {
            this.updateStatus('Đang nghe.................');
            this.setRecordingState(true);
            this.startNoSpeechTimer();
        };

        this.recognition.onresult = (event) => {
            this.resetNoSpeechTimer();
            
            // Cập nhật thời gian nhận kết quả
            const currentTime = Date.now();
            const timeSinceLastResult = currentTime - this.lastResultTime;
            this.lastResultTime = currentTime;
            
            // Kiểm tra xem đang nói liên tục hay không
            if (timeSinceLastResult < 300) { // Nếu các kết quả đến liên tục (khoảng cách < 300ms)
                this.continuousSpeechDuration += timeSinceLastResult;
                if (this.continuousSpeechDuration > 5000 && !this.isContinuousSpeech) { // Nếu nói liên tục > 5 giây
                    console.log('🔄 Phát hiện nói liên tục');
                    this.isContinuousSpeech = true;
                    this.updateStatus('Đang nói liên tục...');
                }
            } else {
                // Đã có khoảng dừng
                this.continuousSpeechDuration = 0;
                if (this.isContinuousSpeech) {
                    this.isContinuousSpeech = false;
                    this.updateStatus('Đang nghe.......');
                }
            }
            
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
                    this.detectVoicePause(true);
                } else {
                    interimTranscript = this.improveVietnameseText(transcript);
                    console.log('🔄 Đang nhận diện:', interimTranscript);
                    
                    // Kiểm tra nếu có thay đổi lớn giữa text trước và text hiện tại
                    // Chỉ xóa khi không phải đang nói liên tục
                    if (!this.isContinuousSpeech && this.isNewSentenceStarting(this.previousText, interimTranscript)) {
                        // Nếu có text mới hoàn toàn khác, có thể là câu mới bắt đầu
                        console.log('🆕 Phát hiện câu mới bắt đầu');
                        translator.clearDisplay(); // Xóa text cũ
                    }
                    
                    this.previousText = interimTranscript;
                    translator.translateText(interimTranscript, true);
                    this.detectVoicePause();
                }
            }
        };

        this.recognition.onerror = (event) => {
            console.error('❌ Lỗi nhận dạng giọng nói:', event.error);
            this.handleError(event.error);
        };

        this.recognition.onend = () => {
            console.log('🛑 Kết thúc phiên ghi âm 1.5 giây');
            clearTimeout(this.noSpeechTimeout);
            clearTimeout(this.pauseDetectionTimeout);
            clearTimeout(this.continuousSpeechTimeout);
            
            if (this.isRecording) {
                console.log('🔄 Tự động khởi động lại...');
                this.restartTimeout = setTimeout(() => {
                    this.recognition.start();
                }, 300);
            }
        };
    }

    isNewSentenceStarting(prevText, currentText) {
        // Nếu không có text trước đó, không phải câu mới
        if (!prevText) return false;
        
        // Nếu độ dài text hiện tại ngắn hơn nhiều so với text trước đó
        // hoặc bắt đầu bằng chữ cái viết hoa và khác hoàn toàn, có thể là câu mới
        if (currentText.length < prevText.length * 0.7) {
            return true;
        }
        
        // Kiểm tra xem có dấu hiệu của câu mới không (chữ cái đầu viết hoa và cấu trúc khác)
        const firstWord = currentText.split(' ')[0];
        const prevFirstWord = prevText.split(' ')[0];
        
        if (firstWord !== prevFirstWord && 
            firstWord.charAt(0) === firstWord.charAt(0).toUpperCase() &&
            firstWord.length > 1) {
            return true;
        }
        
        return false;
    }

    detectVoicePause(isFinal = false) {
        // Hủy timeout trước đó nếu có
        clearTimeout(this.pauseDetectionTimeout);
        
        // Nếu là kết quả cuối cùng, không cần thiết lập timeout mới
        if (isFinal) return;
        
        // Thiết lập timeout mới để phát hiện tạm dừng giọng nói
        // Trong trường hợp nói liên tục, sử dụng ngưỡng cao hơn
        const pauseThreshold = this.isContinuousSpeech ? 1000 : 800; // 1s cho nói liên tục, 0.8s cho nói thường
        
        this.pauseDetectionTimeout = setTimeout(() => {
            console.log('⏸️ Phát hiện tạm dừng giọng nói');
            this.setupClearDisplayTimeout();
        }, pauseThreshold);
    }
    
    setupClearDisplayTimeout() {
        // Hủy timeout trước đó nếu có
        clearTimeout(this.clearDisplayTimeout);
        
        // Thiết lập timeout mới để xóa màn hình sau 5 giây không có hoạt động giọng nói
        // Không xóa trong trường hợp nói liên tục
        if (!this.isContinuousSpeech) {
            this.clearDisplayTimeout = setTimeout(() => {
                console.log('🧹 Xóa màn hình sau khoảng thời gian im lặng');
                translator.clearDisplay();
            }, 5000); // 5 giây
        }
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
                this.updateStatus('Không nghe, đang thử lại...');
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
            this.updateStatus('Đang nghe.......');
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
            this.updateStatus('Không nghe, thử lại...');
            this.restartRecording();
        }, 1000); // Thay đổi từ 10000ms xuống 1500ms (1.5 giây)
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