# Realtime Translation App

Ứng dụng dịch giọng nói tiếng Việt sang văn bản tiếng Anh theo thời gian thực, sử dụng Web Speech API và Azure Translation API.

## Tính năng

- Nhận diện giọng nói tiếng Việt theo thời gian thực
- Dịch sang tiếng Anh tự động
- Giao diện người dùng đơn giản, dễ sử dụng
- Tự động xóa văn bản sau khi dừng nói
- Giới hạn hiển thị văn bản để dễ đọc

## Hướng dẫn triển khai

### 1. Đẩy code lên GitHub

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### 2. Triển khai trên Vercel

1. Đăng nhập vào [Vercel](https://vercel.com)
2. Nhấn "Add New" > "Project"
3. Chọn repository GitHub của bạn
4. Cấu hình như sau:
   - Framework Preset: Other
   - Root Directory: ./
   - Build Command: pip install -r requirements.txt
   - Output Directory: ./
   - Install Command: pip install -r requirements.txt
5. Trong phần "Environment Variables", thêm các biến môi trường:
   - AZURE_SPEECH_KEY: [API key của Azure Speech]
   - AZURE_SPEECH_REGION: eastus
   - AZURE_TRANSLATION_KEY: [API key của Azure Translation]
   - AZURE_TRANSLATION_REGION: eastus
6. Nhấn "Deploy"

### 3. Thêm Subdomain giaolien.com

1. Đăng nhập vào tài khoản quản lý tên miền giaolien.com
2. Vào phần quản lý DNS
3. Thêm bản ghi CNAME mới:
   - Name: [subdomain bạn muốn, ví dụ: translate]
   - Value: cname.vercel-dns.com
   - TTL: 3600
4. Quay lại Vercel, vào phần cài đặt của dự án
5. Chọn "Domains"
6. Thêm domain mới: [subdomain].giaolien.com (ví dụ: translate.giaolien.com)
7. Làm theo hướng dẫn xác minh domain từ Vercel

## Sử dụng

1. Truy cập ứng dụng tại [subdomain].giaolien.com
2. Nhấn vào nút microphone để bắt đầu nói
3. Nói bằng tiếng Việt, văn bản tiếng Anh sẽ hiển thị theo thời gian thực
4. Nhấn lại nút microphone để dừng

## Yêu cầu

- Azure Speech API key
- Azure Translation API key

## Công nghệ sử dụng

- Frontend: HTML, CSS, JavaScript
- Backend: Python với FastAPI
- API: Azure Cognitive Services (Speech, Translation)
- Hosting: Vercel 