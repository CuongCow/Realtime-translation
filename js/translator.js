class Translator {
    constructor() {
        this.translateTimeout = null;
        this.lastTranslation = '';
        this.pendingTranslation = null;
        this.translatedWords = []; // Mảng lưu các từ đã dịch
        this.DEBOUNCE_DELAY = 100;
        this.MAX_LINES = 5; // Số hàng tối đa
        this.currentLineCount = 0;
        this.currentSentence = ''; // Lưu câu đang nói
        console.log('🌐 Khởi tạo Translator thành công');
    }

    async translateText(text, isInterim = false) {
        if (!text.trim()) return;

        // Cập nhật câu hiện tại
        this.currentSentence = text;

        // Kiểm tra kết thúc câu
        if (this.isEndOfSentence(text)) {
            console.log('🔚 Phát hiện kết thúc câu');
            await this.translateFullSentence(text);
            this.currentSentence = '';
            this.translatedWords = [];
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

    isEndOfSentence(text) {
        // Kiểm tra các dấu kết thúc câu
        const endMarks = /[.!?។៕។់៘\u3002]$/;
        const hasEndMark = endMarks.test(text.trim());
        
        // Kiểm tra khoảng lặng dài (ngừng nói)
        const silenceDuration = Date.now() - (this.lastWordTime || 0);
        const isSilent = silenceDuration > 1500; // 1.5 giây không có từ mới
        
        return hasEndMark || isSilent;
    }

    async translateSingleWord(word) {
        try {
            this.lastWordTime = Date.now(); // Cập nhật thời gian từ cuối cùng
            const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=vi&tl=en&dt=t&q=${encodeURIComponent(word)}`;
            const response = await fetch(url);
            const data = await response.json();

            if (data && data[0]) {
                const translatedWord = data[0][0][0].trim();
                console.log(`🔤 ${word} → ${translatedWord}`);
                
                this.translatedWords.push({
                    original: word,
                    translated: translatedWord,
                    timestamp: Date.now()
                });

                this.displayAllTranslatedWords();
            }
        } catch (error) {
            console.error('❌ Lỗi dịch từ đơn:', error);
        }
    }

    async translateFullSentence(text) {
        try {
            const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=vi&tl=en&dt=t&q=${encodeURIComponent(text)}`;
            const response = await fetch(url);
            const data = await response.json();

            if (data && data[0]) {
                const translatedText = data[0][0][0].trim();
                console.log('✨ Bản dịch hoàn chỉnh:', translatedText);
                this.displayFinalTranslation(translatedText);
            }
        } catch (error) {
            console.error('❌ Lỗi dịch câu:', error);
        }
    }

    displayAllTranslatedWords() {
        const element = document.getElementById('englishText');
        
        let displayLines = [];
        let currentLine = [];
        
        this.translatedWords.forEach((item, index) => {
            currentLine.push(item.translated);
            if (currentLine.length === 3 || index === this.translatedWords.length - 1) {
                displayLines.push(currentLine.join(' '));
                currentLine = [];
            }
        });

        if (displayLines.length > this.MAX_LINES) {
            const wordsToKeep = displayLines.slice(-this.MAX_LINES).join(' ').split(' ').length;
            this.translatedWords = this.translatedWords.slice(-wordsToKeep);
            displayLines = displayLines.slice(-this.MAX_LINES);
        }

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
        element.style.whiteSpace = 'pre-line';
        element.textContent = text;
        element.style.opacity = '1';
        
        if (!element.querySelector('.cursor')) {
            const cursor = document.createElement('span');
            cursor.className = 'cursor';
            element.appendChild(cursor);
        }
    }
}

const translator = new Translator(); 