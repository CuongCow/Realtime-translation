# Realtime Speech Translation

A real-time speech translation application that converts Vietnamese speech to English text using Azure AI services.

## Features

- Real-time speech recognition for Vietnamese using Web Speech API
- Text translation using Azure Translator service
- Immediate word-by-word translation as you speak
- Sentence-level translation for better accuracy
- Clean, modern UI with microphone status indicator

## Technologies Used

- Frontend: HTML, CSS, JavaScript
- Backend: Python with FastAPI
- Azure AI Services:
  - Azure Speech Service
  - Azure Translator

## Setup Instructions

1. Clone the repository
2. Install the required Python packages:
   ```
   pip install -r requirements.txt
   ```
3. Run the application:
   ```
   python app.py
   ```
4. Open your browser and navigate to: `http://localhost:8000`

## Azure Credentials

The application uses Azure AI services for translation. The credentials are stored in the application code for demonstration purposes, but in a production environment, they should be moved to environment variables or a secure configuration file.

## Browser Compatibility

This application works best in Chrome and Edge browsers that support the Web Speech API.

## License

This project is open source and available for personal and educational use. 