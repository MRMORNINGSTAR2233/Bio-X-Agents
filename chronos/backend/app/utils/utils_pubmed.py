import aiohttp
import json
import time
import os
from typing import List, Dict, Any, Optional
import logging
from redis.asyncio import Redis
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# PubMed API endpoints
ESEARCH_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
EFETCH_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi"

# PubMed API key (optional)
PUBMED_API_KEY = os.getenv("PUBMED_API_KEY", "")

# Redis connection string
REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379")

# Initialize Redis client
redis = None

async def get_redis():
    global redis
    if redis is None:
        redis = Redis.from_url(REDIS_URL, encoding="utf-8", decode_responses=True)
    return redis

async def cache_set(key: str, value: Any, ttl: int = 3600):
    """Set a value in Redis cache with TTL"""
    r = await get_redis()
    await r.set(key, json.dumps(value), ex=ttl)

async def cache_get(key: str) -> Optional[Any]:
    """Get a value from Redis cache"""
    r = await get_redis()
    result = await r.get(key)
    if result:
        return json.loads(result)
    return None

async def search_pubmed_articles(query: str, page: int = 1, per_page: int = 10) -> List[Dict[str, Any]]:
    """
    Search PubMed articles using E-utilities API with Redis caching
    """
    cache_key = f"pubmed:search:{query}:{page}:{per_page}"
    
    # Check cache first
    cached_results = await cache_get(cache_key)
    if cached_results:
        logger.info(f"Cache hit for query: {query}")
        return cached_results
    
    # Calculate offset for pagination
    retstart = (page - 1) * per_page
    
    # Prepare the search parameters
    search_params = {
        "db": "pubmed",
        "term": query,
        "retmode": "json",
        "retmax": per_page,
        "retstart": retstart,
        "usehistory": "y",
    }
    
    if PUBMED_API_KEY:
        search_params["api_key"] = PUBMED_API_KEY
    
    # Perform the search to get IDs
    async with aiohttp.ClientSession() as session:
        async with session.get(ESEARCH_URL, params=search_params) as response:
            if response.status != 200:
                error_text = await response.text()
                logger.error(f"Error from PubMed E-utilities: {error_text}")
                raise Exception(f"PubMed API error: {response.status}")
            
            search_result = await response.json()
            
            if "esearchresult" not in search_result:
                logger.error(f"Unexpected response format: {search_result}")
                raise Exception("Unexpected response format from PubMed")
            
            ids = search_result["esearchresult"].get("idlist", [])
            
            if not ids:
                # No results found
                await cache_set(cache_key, [], ttl=3600)  # Cache empty results for 1 hour
                return []
            
            # Now fetch the full article data for these IDs
            fetch_params = {
                "db": "pubmed",
                "id": ",".join(ids),
                "retmode": "xml",
                "rettype": "abstract"
            }
            
            if PUBMED_API_KEY:
                fetch_params["api_key"] = PUBMED_API_KEY
                
            async with session.get(EFETCH_URL, params=fetch_params) as fetch_response:
                if fetch_response.status != 200:
                    error_text = await fetch_response.text()
                    logger.error(f"Error fetching PubMed articles: {error_text}")
                    raise Exception(f"PubMed fetch error: {fetch_response.status}")
                
                xml_content = await fetch_response.text()
                
                # Parse the XML to extract relevant article information
                articles = parse_pubmed_xml(xml_content, ids)
                
                # Cache the results
                await cache_set(cache_key, articles, ttl=3600)  # Cache for 1 hour
                
                return articles

def parse_pubmed_xml(xml_content: str, ids: List[str]) -> List[Dict[str, Any]]:
    """
    Parse PubMed XML response to extract article information.
    This is a simplified implementation - in a production environment,
    you would want to use a proper XML parser library like lxml or BeautifulSoup.
    """
    # For simplicity, we're returning dummy data based on IDs
    # In a real implementation, you would parse the XML properly
    articles = []
    
    # NOTE: This is a placeholder. In a real implementation, 
    # you would properly parse the XML to extract all article details.
    for idx, pmid in enumerate(ids):
        article = {
            "pmid": pmid,
            "title": f"Article {pmid} Title",
            "authors": ["Author One", "Author Two"],
            "abstract": f"This is a placeholder abstract for article {pmid}.",
            "publication_date": "2023-01-01",
            "journal": "Journal of Example Studies",
            "doi": f"10.1234/example.{pmid}",
            "keywords": ["keyword1", "keyword2"]
        }
        articles.append(article)
    
    return articles
