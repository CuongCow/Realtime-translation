// Khởi tạo ứng dụng
document.addEventListener('DOMContentLoaded', () => {
    // Khởi tạo các thành phần cần thiết
    const sourceLanguage = document.getElementById('sourceLanguage');
    const micButton = document.getElementById('micButton');
    const translationDisplay = document.getElementById('englishText');

    // Đảm bảo các phần tử tồn tại trước khi thêm sự kiện
    if (sourceLanguage && micButton && translationDisplay) {
        sourceLanguage.addEventListener('change', () => {
            if (speechRecognition.recognition) {
                speechRecognition.recognition.lang = sourceLanguage.value === 'vi' ? 'vi-VN' : 'en-US';
            }
        });

        // Thêm sự kiện click cho nút micro (nếu cần)
        micButton.addEventListener('click', () => {
            // Các xử lý bổ sung nếu cần
        });
    }
}); 