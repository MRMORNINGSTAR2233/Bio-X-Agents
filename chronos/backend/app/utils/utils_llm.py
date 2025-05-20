import aiohttp
import os
import json
from typing import Dict, Any
import logging
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Grok AI API settings
GROK_API_KEY = os.getenv("GROK_API_KEY")
GROK_API_URL = os.getenv("GROK_API_URL")
GROK_MODEL = os.getenv("GROK_MODEL", "grok-1")

async def generate_hypothesis(historical_node: Dict[str, Any], modern_node: Dict[str, Any]) -> str:
    """
    Generate a hypothesis by connecting historical observation with modern study
    using the Grok AI API
    """
    if not GROK_API_KEY or not GROK_API_URL:
        raise ValueError("Grok AI API key and URL must be configured")
    
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
    
    Generate a hypothesis that connects these two pieces of information in a scientifically rigorous way.
    The hypothesis should be clear, concise, testable, and backed by the evidence provided.
    """
    
    try:
        # Prepare the API request
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {GROK_API_KEY}"
        }
        
        payload = {
            "model": GROK_MODEL,
            "messages": [
                {"role": "system", "content": "You are a scientific hypothesis generator."},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.7,
            "max_tokens": 300
        }
        
        # Make the API request
        async with aiohttp.ClientSession() as session:
            async with session.post(GROK_API_URL, json=payload, headers=headers) as response:
                if response.status != 200:
                    error_text = await response.text()
                    logger.error(f"Error from Grok AI API: {error_text}")
                    raise Exception(f"Grok AI API error: {response.status}")
                
                result = await response.json()
                
                # Extract the generated hypothesis from the response
                # The exact format will depend on the Grok API response structure
                hypothesis = result.get("choices", [{}])[0].get("message", {}).get("content", "")
                
                if not hypothesis:
                    logger.error(f"Failed to extract hypothesis from API response: {result}")
                    raise Exception("Failed to generate hypothesis")
                
                return hypothesis
                
    except Exception as e:
        logger.error(f"Error generating hypothesis: {str(e)}")
        raise
