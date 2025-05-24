import aiohttp
import os
import json
import asyncio
import re
from typing import Dict, Any
import logging
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Groq AI API settings
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_API_URL = os.getenv("GROQ_API_URL")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3-8b-8192")

def clean_hypothesis_text(hypothesis: str) -> str:
    """
    Clean and format hypothesis text to remove unwanted symbols and formatting
    """
    # Remove markdown formatting
    hypothesis = re.sub(r'\*\*([^*]+)\*\*', r'\1', hypothesis)  # Remove bold
    hypothesis = re.sub(r'\*([^*]+)\*', r'\1', hypothesis)      # Remove italic
    hypothesis = re.sub(r'`([^`]+)`', r'\1', hypothesis)        # Remove code formatting
    hypothesis = re.sub(r'#{1,6}\s*', '', hypothesis)          # Remove headers
    
    # Remove extra symbols and special characters
    hypothesis = re.sub(r'[•·‒–—―‐]', '-', hypothesis)         # Normalize dashes
    hypothesis = re.sub(r'[""''`´]', '"', hypothesis)          # Normalize quotes
    hypothesis = re.sub(r'[^\w\s\.\,\!\?\;\:\(\)\-\"\']', '', hypothesis)  # Remove special chars
    
    # Clean up whitespace
    hypothesis = re.sub(r'\s+', ' ', hypothesis)               # Multiple spaces to single
    hypothesis = re.sub(r'\n\s*\n', '\n\n', hypothesis)       # Multiple newlines to double
    
    # Remove leading/trailing whitespace and ensure proper sentence structure
    hypothesis = hypothesis.strip()
    
    # Ensure it ends with a period if it doesn't already
    if hypothesis and not hypothesis.endswith(('.', '!', '?')):
        hypothesis += '.'
    
    return hypothesis

async def generate_hypothesis(historical_node: Dict[str, Any], modern_node: Dict[str, Any], max_retries: int = 3) -> str:
    """
    Generate a hypothesis by connecting historical observation with modern study
    using the Groq AI API with retry logic
    """
    if not GROQ_API_KEY or not GROQ_API_URL:
        raise ValueError("Groq AI API key and URL must be configured")
    
    # Construct the prompt for the AI
    prompt = f"""
    Based on the following historical observation and modern study, generate a concise, testable scientific hypothesis:
    
    Historical Observation:
    {historical_node.get('text', 'No text available')}
    Source: {historical_node.get('source_id', 'Unknown source')}
    
    Modern Study:
    Title: {modern_node.get('title', 'No title available')}
    Abstract: {modern_node.get('abstract', 'No abstract available')}
    Authors: {', '.join(modern_node.get('authors', ['Unknown authors']))}
    Journal: {modern_node.get('journal', 'Unknown journal')}
    DOI: {modern_node.get('doi', 'No DOI available')}
    
    Generate a clear, concise hypothesis that connects these two pieces of information in a scientifically rigorous way.
    The hypothesis should be testable and backed by the evidence provided.
    
    IMPORTANT: Provide only the hypothesis statement in plain text without any formatting symbols, markdown, or special characters.
    """
    
    for attempt in range(max_retries):
        try:
            # Prepare the API request
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {GROQ_API_KEY}"
            }
            
            payload = {
                "model": GROQ_MODEL,
                "messages": [
                    {"role": "system", "content": "You are a scientific hypothesis generator. Generate clear, testable hypotheses that connect historical observations with modern research. Always provide responses in plain text without markdown, symbols, or special formatting."},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.7,
                "max_tokens": 500
            }
            
            # Make the API request with timeout
            timeout = aiohttp.ClientTimeout(total=30)
            async with aiohttp.ClientSession(timeout=timeout) as session:
                async with session.post(GROQ_API_URL, json=payload, headers=headers) as response:
                    if response.status != 200:
                        error_text = await response.text()
                        logger.warning(f"Groq AI API error on attempt {attempt + 1}: {error_text}")
                        if attempt < max_retries - 1:
                            await asyncio.sleep(1.0 * (attempt + 1))  # Exponential backoff
                            continue
                        else:
                            raise Exception(f"Groq AI API error: {response.status}")
                    
                    result = await response.json()
                    
                    # Extract the generated hypothesis from the response
                    hypothesis = result.get("choices", [{}])[0].get("message", {}).get("content", "")
                    
                    if not hypothesis:
                        logger.warning(f"Empty hypothesis response on attempt {attempt + 1}")
                        if attempt < max_retries - 1:
                            await asyncio.sleep(1.0 * (attempt + 1))
                            continue
                        else:
                            raise Exception("Failed to generate hypothesis - empty response")
                    
                    # Clean up the hypothesis text - remove markdown, extra symbols, and format nicely
                    cleaned_hypothesis = clean_hypothesis_text(hypothesis)
                    
                    logger.info(f"Successfully generated hypothesis on attempt {attempt + 1}")
                    return cleaned_hypothesis
                    
        except Exception as e:
            logger.warning(f"Error generating hypothesis on attempt {attempt + 1}: {str(e)}")
            
            if attempt < max_retries - 1:
                await asyncio.sleep(1.0 * (attempt + 1))  # Exponential backoff
            else:
                logger.error(f"Failed to generate hypothesis after {max_retries} attempts")
                raise
