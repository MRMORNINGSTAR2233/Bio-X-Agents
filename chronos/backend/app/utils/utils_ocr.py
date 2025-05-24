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
    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image (jpg, png, tiff, etc.)")
    
    # Validate file size (max 10MB)
    max_size = 10 * 1024 * 1024  # 10MB
    if hasattr(file, 'size') and file.size and file.size > max_size:
        raise HTTPException(status_code=400, detail="File size too large. Maximum 10MB allowed.")
    
    try:
        # Read the file
        contents = await file.read()
        
        if len(contents) == 0:
            raise HTTPException(status_code=400, detail="Empty file uploaded")
        
        if len(contents) > max_size:
            raise HTTPException(status_code=400, detail="File size too large. Maximum 10MB allowed.")
        
        # Open the image with PIL
        img = Image.open(io.BytesIO(contents))
        
        # Convert to RGB if necessary (for better OCR results)
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Perform OCR with custom configuration for better results
        # Removed quotes from whitelist to prevent JSON parsing issues
        custom_config = r'--oem 3 --psm 6 -c tessedit_char_whitelist=0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz .,;:!?-()[]{}/'
        extracted_text = pytesseract.image_to_string(img, config=custom_config)
        
        # Clean up the extracted text and escape any problematic characters
        cleaned_text = extracted_text.strip()
        
        # Remove any remaining problematic characters that could cause JSON issues
        cleaned_text = cleaned_text.replace('\x00', '').replace('\r', ' ').replace('\n', ' ')
        
        # Normalize whitespace
        import re
        cleaned_text = re.sub(r'\s+', ' ', cleaned_text).strip()
        
        if not cleaned_text:
            logger.warning(f"No text extracted from {file.filename}")
            return "No text could be extracted from this image. Please ensure the image contains readable text."
        
        # Log success
        logger.info(f"Successfully processed OCR for {file.filename}, extracted {len(cleaned_text)} characters")
        
        return cleaned_text
        
    except Exception as e:
        logger.error(f"OCR processing error for {file.filename}: {str(e)}")
        if "tesseract" in str(e).lower():
            raise HTTPException(status_code=500, detail="OCR service unavailable. Please try again later.")
        raise HTTPException(status_code=500, detail=f"OCR processing error: {str(e)}")
    finally:
        # Reset file pointer if possible
        try:
            await file.seek(0)
        except:
            pass
