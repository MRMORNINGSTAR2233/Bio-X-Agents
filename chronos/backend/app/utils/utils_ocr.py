import pytesseract
from PIL import Image
import io
from fastapi import UploadFile, HTTPException
import logging
import os
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Check if Tesseract path is specified in environment
TESSERACT_CMD = os.getenv("TESSERACT_CMD")
if TESSERACT_CMD:
    pytesseract.pytesseract.tesseract_cmd = TESSERACT_CMD

async def process_ocr_image(file: UploadFile) -> str:
    """
    Process an uploaded image file with Tesseract OCR
    """
    # Validate file type
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        # Read the file
        contents = await file.read()
        
        # Open the image with PIL
        img = Image.open(io.BytesIO(contents))
        
        # Perform OCR
        extracted_text = pytesseract.image_to_string(img)
        
        # Log success
        logger.info(f"Successfully processed OCR for {file.filename}")
        
        return extracted_text.strip()
        
    except Exception as e:
        logger.error(f"OCR processing error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"OCR processing error: {str(e)}")
    finally:
        # Reset file pointer
        await file.seek(0)
