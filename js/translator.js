class Translator {
    constructor() {
        this.translateTimeout = null;
        this.lastTranslation = '';
        this.pendingTranslation = null;
        this.translatedWords = []; // Mảng lưu các từ đã dịch
        this.DEBOUNCE_DELAY = 100;
        this.MAX_LINES = 2; // Giảm số hàng tối đa xuống 2
        this.currentLineCount = 0;
        this.currentSentence = ''; // Lưu câu đang nói
        this.lastSentenceEndTime = 0; // Thời gian kết thúc câu cuối cùng
        this.sentencePauseThreshold = 800; // Tăng ngưỡng lên 0.8 giây
        this.isSentencePaused = false; // Trạng thái ngắt câu
        this.useServerApi = false; // Whether to use the server API
        this.AZURE_TRANSLATION_KEY = 'yXkgYbvgmfJHLvlOWRKWWUgHEAOPS0K833AlsmNQKgwOwu4kQYDJJQQJ99BGACYeBjFXJ3w3AAAbACOGwYDP';
        this.AZURE_TRANSLATION_REGION = 'eastus';
        this.lastVoiceActivity = Date.now();
        this.maxContinuousSpeechDuration = 10000; // 10 giây nói liên tục
        this.speechStartTime = Date.now(); // Thời điểm bắt đầu nói
        this.autoRefreshTimeout = null; // Timeout để tự động làm mới hiển thị
        this.lastProcessedText = ''; // Lưu văn bản đã xử lý cuối cùng
        console.log('🌐 Khởi tạo Translator thành công');
        
        // Khởi động hẹn giờ làm mới tự động
        this.startAutoRefreshTimer();
    }

    startAutoRefreshTimer() {
        // Hủy timeout cũ nếu có
        if (this.autoRefreshTimeout) {
            clearTimeout(this.autoRefreshTimeout);
        }
        
        // Thiết lập timeout mới để tự động làm mới hiển thị sau mỗi 10 giây
        this.autoRefreshTimeout = setInterval(() => {
            const currentTime = Date.now();
            const speechDuration = currentTime - this.speechStartTime;
            
            // Nếu đang nói liên tục quá 10 giây, làm mới hiển thị
            if (speechDuration > this.maxContinuousSpeechDuration && this.translatedWords.length > 10) {
                console.log('🔄 Đã nói liên tục quá 10 giây, làm mới hiển thị');
                // Giữ lại 5 từ cuối cùng
                this.translatedWords = this.translatedWords.slice(-5);
                this.displayAllTranslatedWords();
                
                // Cập nhật thời điểm bắt đầu nói
                this.speechStartTime = currentTime;
            }
        }, 2000); // Kiểm tra mỗi 2 giây
    }

    async translateText(text, isInterim = false) {
        if (!text.trim()) return;

        const currentTime = Date.now();
        
        // Cập nhật thời gian hoạt động voice
        this.lastVoiceActivity = currentTime;
        
        // Kiểm tra nếu văn bản có thay đổi đáng kể
        const hasSignificantChange = this.hasTextChangedSignificantly(this.lastProcessedText, text);
        
        // Kiểm tra các dấu chấm câu trong văn bản
        const hasPunctuation = this.containsEndPunctuation(text);

        // Nếu có đoạn văn mới và đã qua ngưỡng tạm dừng, xóa câu cũ
        if ((this.isSentencePaused && 
            text.trim() !== this.currentSentence.trim() && 
            currentTime - this.lastSentenceEndTime > this.sentencePauseThreshold) || hasSignificantChange || hasPunctuation) {
            console.log('🧹 Xóa câu cũ, bắt đầu câu mới (Lý do: ' + 
                        (hasSignificantChange ? 'thay đổi đáng kể' : 
                         hasPunctuation ? 'phát hiện dấu chấm câu' : 'khoảng dừng') + ')');
            this.translatedWords = [];
            this.isSentencePaused = false;
            this.clearDisplay();
            
            // Cập nhật thời điểm bắt đầu nói
            this.speechStartTime = currentTime;
        }

        // Cập nhật câu hiện tại và văn bản đã xử lý cuối cùng
        this.currentSentence = text;
        this.lastProcessedText = text;

        // Kiểm tra kết thúc câu
        if (this.isEndOfSentence(text)) {
            console.log('🔚 Phát hiện kết thúc câu');
            await this.translateFullSentence(text);
            this.lastSentenceEndTime = Date.now();
            this.isSentencePaused = true;
            
            // Cập nhật thời điểm bắt đầu nói
            this.speechStartTime = Date.now();
            return;
        }

        // Xử lý từng từ cho interim
        if (isInterim) {
            const words = text.trim().split(/\s+/);
            const latestWord = words[words.length - 1];
            
            // Nếu từ mới chưa được dịch
            if (!this.translatedWords.some(item => item.original === latestWord)) {
                console.log('📝 Từ mới:', latestWord);
                await this.translateSingleWord(latestWord);
            }
        }
    }
    
    hasTextChangedSignificantly(previousText, currentText) {
        // Nếu không có văn bản trước đó, không xem là thay đổi đáng kể
        if (!previousText) return false;
        
        // Nếu văn bản hiện tại ngắn hơn nhiều so với trước đó, có thể là bắt đầu câu mới
        if (currentText.length < previousText.length * 0.7) {
            return true;
        }
        
        // Kiểm tra nếu có dấu câu mới xuất hiện trong văn bản hiện tại nhưng không có trong văn bản trước
        const punctuationRegex = /[.!?។៕។់៘\u3002]/g;
        const prevPunctCount = (previousText.match(punctuationRegex) || []).length;
        const currPunctCount = (currentText.match(punctuationRegex) || []).length;
        
        if (currPunctCount > prevPunctCount) {
            return true;
        }
        
        return false;
    }
    
    containsEndPunctuation(text) {
        // Kiểm tra xem văn bản có chứa các dấu chấm câu không
        const punctuationRegex = /[.!?។៕។់៘\u3002]/;
        return punctuationRegex.test(text);
    }

    clearDisplay() {
        const element = document.getElementById('englishText');
        element.textContent = '';
        if (element.querySelector('.cursor')) {
            element.querySelector('.cursor').remove();
        }
    }

    isEndOfSentence(text) {
        // Kiểm tra các dấu kết thúc câu
        const endMarks = /[.!?។៕។់៘\u3002]$/;
        const hasEndMark = endMarks.test(text.trim());
        
        // Kiểm tra khoảng lặng dài (ngừng nói)
        const silenceDuration = Date.now() - (this.lastWordTime || 0);
        const isSilent = silenceDuration > this.sentencePauseThreshold; // 0.8 giây không có từ mới
        
        // Kiểm tra nếu có dấu chấm câu giữa text
        const hasMidSentencePunctuation = /[.!?។៕។់៘\u3002][^.!?។៕។់៘\u3002]*$/.test(text.trim());
        
        return hasEndMark || isSilent || hasMidSentencePunctuation;
    }

    async translateSingleWord(word) {
        try {
            this.lastWordTime = Date.now(); // Cập nhật thời gian từ cuối cùng
            
            let translatedWord = '';
            
            if (this.useServerApi) {
                // Use server API
                const response = await fetch('/translate_text', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ text: word })
                });
                
                const data = await response.json();
                translatedWord = data.english_translation;
            } else {
                // Use direct Azure API call
                const endpoint = 'https://api.cognitive.microsofttranslator.com/translate';
                const params = new URLSearchParams({
                    'api-version': '3.0',
                    'from': 'vi',
                    'to': 'en'
                });
                
                const response = await fetch(`${endpoint}?${params}`, {
                    method: 'POST',
                    headers: {
                        'Ocp-Apim-Subscription-Key': this.AZURE_TRANSLATION_KEY,
                        'Ocp-Apim-Subscription-Region': this.AZURE_TRANSLATION_REGION,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify([{ 'text': word }])
                });

                const data = await response.json();
                
                if (data && data.length > 0) {
                    translatedWord = data[0].translations[0].text.trim();
                }
            }

            if (translatedWord) {
                console.log(`🔤 ${word} → ${translatedWord}`);
                
                this.translatedWords.push({
                    original: word,
                    translated: translatedWord,
                    timestamp: Date.now()
                });

                // Giới hạn số lượng từ hiển thị cho nói liên tục
                if (this.translatedWords.length > 30) {
                    this.translatedWords = this.translatedWords.slice(-30);
                }

                this.displayAllTranslatedWords();
            }
        } catch (error) {
            console.error('❌ Lỗi dịch từ đơn:', error);
        }
    }

    async translateFullSentence(text) {
        try {
            let translatedText = '';
            
            if (this.useServerApi) {
                // Use server API
                const response = await fetch('/translate_text', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ text: text })
                });
                
                const data = await response.json();
                translatedText = data.english_translation;
            } else {
                // Use direct Azure API call
                const endpoint = 'https://api.cognitive.microsofttranslator.com/translate';
                const params = new URLSearchParams({
                    'api-version': '3.0',
                    'from': 'vi',
                    'to': 'en'
                });
                
                const response = await fetch(`${endpoint}?${params}`, {
                    method: 'POST',
                    headers: {
                        'Ocp-Apim-Subscription-Key': this.AZURE_TRANSLATION_KEY,
                        'Ocp-Apim-Subscription-Region': this.AZURE_TRANSLATION_REGION,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify([{ 'text': text }])
                });

                const data = await response.json();
                
                if (data && data.length > 0) {
                    translatedText = data[0].translations[0].text.trim();
                }
            }

            if (translatedText) {
                console.log('✨ Bản dịch hoàn chỉnh:', translatedText);
                this.displayFinalTranslation(translatedText);
            }
        } catch (error) {
            console.error('❌ Lỗi dịch câu:', error);
        }
    }

    displayAllTranslatedWords() {
        const element = document.getElementById('englishText');
        
        // Kết hợp các từ đã dịch thành một chuỗi (tất cả trên một hàng)
        const translatedText = this.translatedWords.map(item => item.translated).join(' ');
        
        // Giới hạn độ dài text
        let displayText = translatedText;
        if (displayText.length > 200) { // Tăng độ dài hiển thị cho nói liên tục
            displayText = '...' + displayText.slice(-200);
        }
        
        // Giữ số lượng hàng tối đa
        const lines = displayText.split('\n');
        const displayLines = lines.slice(-this.MAX_LINES);

        this.displayWithTypingEffect(element, displayLines.join('\n'));
    }

    displayWithTypingEffect(element, text) {
        element.style.whiteSpace = 'pre-line';
        element.textContent = text;
        element.style.opacity = '1';
        
        if (!element.querySelector('.cursor')) {
            const cursor = document.createElement('span');
            cursor.className = 'cursor';
            element.appendChild(cursor);
        }
    }

    displayFinalTranslation(text) {
        const element = document.getElementById('englishText');
        
        // Giới hạn độ dài text
        let displayText = text;
        if (displayText.length > 200) { // Tăng độ dài hiển thị cho nói liên tục
            displayText = displayText.slice(0, 200) + '...';
        }
        
        element.style.whiteSpace = 'pre-line';
        element.textContent = displayText;
        element.style.opacity = '1';
        
        if (!element.querySelector('.cursor')) {
            const cursor = document.createElement('span');
            cursor.className = 'cursor';
            element.appendChild(cursor);
        }
    }
}

const translator = new Translator(); 