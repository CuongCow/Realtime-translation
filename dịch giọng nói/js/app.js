// Khởi tạo ứng dụng
document.addEventListener('DOMContentLoaded', () => {
    // Khởi tạo các thành phần cần thiết
    const sourceLanguage = document.getElementById('sourceLanguage');
    sourceLanguage.addEventListener('change', () => {
        if (speechRecognition.recognition) {
            speechRecognition.recognition.lang = sourceLanguage.value === 'vi' ? 'vi-VN' : 'en-US';
        }
    });
}); 