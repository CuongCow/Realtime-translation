import os
import json
import requests
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI()

# Cấu hình CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Azure credentials from environment variables
AZURE_SPEECH_KEY = os.environ.get("AZURE_SPEECH_KEY", "")
AZURE_SPEECH_REGION = os.environ.get("AZURE_SPEECH_REGION", "eastus")
AZURE_TRANSLATION_KEY = os.environ.get("AZURE_TRANSLATION_KEY", "")
AZURE_TRANSLATION_REGION = os.environ.get("AZURE_TRANSLATION_REGION", "eastus")

# Root path response
@app.get("/")
async def read_root():
    return FileResponse("index.html")

# API endpoint for translation
@app.post("/translate_text")
async def translate_text(text_data: dict):
    try:
        vietnamese_text = text_data.get("text", "")
        if not vietnamese_text:
            raise HTTPException(status_code=400, detail="Text is required")
            
        # Dịch sang tiếng Anh bằng Azure Translator
        endpoint = "https://api.cognitive.microsofttranslator.com/translate"
        
        params = {
            'api-version': '3.0',
            'from': 'vi',
            'to': 'en'
        }
        
        headers = {
            'Ocp-Apim-Subscription-Key': AZURE_TRANSLATION_KEY,
            'Ocp-Apim-Subscription-Region': AZURE_TRANSLATION_REGION,
            'Content-type': 'application/json'
        }
        
        body = [{
            'text': vietnamese_text
        }]
        
        response = requests.post(
            endpoint,
            params=params,
            headers=headers,
            json=body
        )
        
        result = response.json()
        english_translation = result[0]['translations'][0]['text']

        return {
            "success": True,
            "vietnamese_text": vietnamese_text,
            "english_translation": english_translation
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Mount static files after the routes
app.mount("/css", StaticFiles(directory="css"), name="css")
app.mount("/js", StaticFiles(directory="js"), name="js")
app.mount("/static", StaticFiles(directory="."), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3000) 