const translator = {
    async translate(directText) {
        const sourceText = directText || document.getElementById('vietnameseText').value;
        this.debouncedTranslate(sourceText);
    },

    debouncedTranslate: utils.debounce(async (text) => {
        const sourceLanguage = document.getElementById('sourceLanguage').value;
        const targetLanguage = sourceLanguage === 'vi' ? 'en' : 'vi';
        const targetTextArea = document.getElementById('englishText');
        
        if (!text) return;

        try {
            const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLanguage}&tl=${targetLanguage}&dt=t&q=${encodeURIComponent(text)}`;
            
            const response = await fetch(url);
            const data = await response.json();
            
            const translatedText = data[0]
                .map(item => item[0])
                .join('');
            
            targetTextArea.value = translatedText;
            targetTextArea.scrollTop = targetTextArea.scrollHeight;
        } catch (error) {
            console.error('Lỗi dịch:', error);
        }
    }, 300)
}; 