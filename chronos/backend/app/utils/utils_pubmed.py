import aiohttp
import json
import time
import os
import asyncio
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

async def get_redis_with_retry(max_retries: int = 3, retry_delay: float = 1.0):
    """
    Get Redis client with retry logic for better connection handling
    """
    global redis
    
    for attempt in range(max_retries):
        try:
            if redis is None:
                redis = Redis.from_url(REDIS_URL, encoding="utf-8", decode_responses=True)
                
            # Test the connection
            await redis.ping()
            logger.info(f"Redis connection established successfully on attempt {attempt + 1}")
            return redis
            
        except Exception as e:
            logger.warning(f"Redis connection attempt {attempt + 1} failed: {str(e)}")
            
            # Close the failed connection
            if redis is not None:
                try:
                    await redis.close()
                except:
                    pass
                redis = None
            
            if attempt < max_retries - 1:
                await asyncio.sleep(retry_delay * (attempt + 1))  # Exponential backoff
            else:
                logger.error(f"Failed to connect to Redis after {max_retries} attempts")
                raise e
    
    return redis

async def get_redis():
    """
    Backward compatibility wrapper for get_redis_with_retry
    """
    return await get_redis_with_retry()

async def cache_set(key: str, value: Any, ttl: int = 3600, max_retries: int = 3):
    """Set a value in Redis cache with TTL and retry logic"""
    for attempt in range(max_retries):
        try:
            r = await get_redis_with_retry()
            await r.set(key, json.dumps(value), ex=ttl)
            return
        except Exception as e:
            logger.warning(f"Cache set attempt {attempt + 1} failed: {str(e)}")
            if attempt < max_retries - 1:
                global redis
                if redis is not None:
                    try:
                        await redis.close()
                    except:
                        pass
                    redis = None
                await asyncio.sleep(0.5 * (attempt + 1))
            else:
                logger.error(f"Cache set failed after {max_retries} attempts")
                # Don't raise - cache failures shouldn't break the application
                return

async def cache_get(key: str, max_retries: int = 3) -> Optional[Any]:
    """Get a value from Redis cache with retry logic"""
    for attempt in range(max_retries):
        try:
            r = await get_redis_with_retry()
            result = await r.get(key)
            if result:
                return json.loads(result)
            return None
        except Exception as e:
            logger.warning(f"Cache get attempt {attempt + 1} failed: {str(e)}")
            if attempt < max_retries - 1:
                global redis
                if redis is not None:
                    try:
                        await redis.close()
                    except:
                        pass
                    redis = None
                await asyncio.sleep(0.5 * (attempt + 1))
            else:
                logger.error(f"Cache get failed after {max_retries} attempts")
                # Don't raise - cache failures shouldn't break the application
                return None

async def search_pubmed_articles(query: str, page: int = 1, per_page: int = 10) -> List[Dict[str, Any]]:
    """
    Search PubMed articles using E-utilities API with Redis caching
    """
    # Validate inputs
    if not query.strip():
        raise ValueError("Search query cannot be empty")
    
    if per_page > 100:  # PubMed API limit
        per_page = 100
        logger.warning("Limiting per_page to 100 (PubMed API maximum)")
    
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
        "tool": "chronos",  # Identify our tool
        "email": "research@chronos.ai"  # Required for API etiquette
    }
    
    if PUBMED_API_KEY:
        search_params["api_key"] = PUBMED_API_KEY
    
    # Perform the search to get IDs
    async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=30)) as session:
        try:
            # Add delay for rate limiting (PubMed recommends max 3 requests/second)
            await asyncio.sleep(0.34)  # ~3 requests per second
            
            async with session.get(ESEARCH_URL, params=search_params) as response:
                if response.status != 200:
                    error_text = await response.text()
                    logger.error(f"Error from PubMed E-utilities: {error_text}")
                    raise Exception(f"PubMed API error: {response.status} - {error_text}")
                
                search_result = await response.json()
                
                if "esearchresult" not in search_result:
                    logger.error(f"Unexpected response format: {search_result}")
                    raise Exception("Unexpected response format from PubMed")
                
                ids = search_result["esearchresult"].get("idlist", [])
                
                if not ids:
                    # No results found
                    empty_result = []
                    await cache_set(cache_key, empty_result, ttl=3600)  # Cache empty results for 1 hour
                    return empty_result
                
                # Now fetch the full article data for these IDs
                fetch_params = {
                    "db": "pubmed",
                    "id": ",".join(ids),
                    "retmode": "xml",
                    "rettype": "abstract",
                    "tool": "chronos",
                    "email": "research@chronos.ai"
                }
                
                if PUBMED_API_KEY:
                    fetch_params["api_key"] = PUBMED_API_KEY
                
                # Add another delay for rate limiting
                await asyncio.sleep(0.34)
                    
                async with session.get(EFETCH_URL, params=fetch_params) as fetch_response:
                    if fetch_response.status != 200:
                        error_text = await fetch_response.text()
                        logger.error(f"Error fetching PubMed articles: {error_text}")
                        raise Exception(f"PubMed fetch error: {fetch_response.status} - {error_text}")
                    
                    xml_content = await fetch_response.text()
                    
                    # Parse the XML to extract relevant article information
                    articles = parse_pubmed_xml(xml_content, ids)
                    
                    # Cache the results
                    await cache_set(cache_key, articles, ttl=3600)  # Cache for 1 hour
                    
                    logger.info(f"Successfully retrieved {len(articles)} articles for query: {query}")
                    return articles
                    
        except asyncio.TimeoutError:
            logger.error("PubMed API request timed out")
            raise Exception("PubMed API request timed out. Please try again.")
        except aiohttp.ClientError as e:
            logger.error(f"Network error connecting to PubMed: {str(e)}")
            raise Exception(f"Network error connecting to PubMed: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error in PubMed search: {str(e)}")
            raise

def parse_pubmed_xml(xml_content: str, ids: List[str]) -> List[Dict[str, Any]]:
    """
    Parse PubMed XML response to extract real article information.
    """
    import xml.etree.ElementTree as ET
    from datetime import datetime
    
    articles = []
    
    try:
        # Parse the XML
        root = ET.fromstring(xml_content)
        
        # Find all PubmedArticle elements
        for article_elem in root.findall('.//PubmedArticle'):
            try:
                # Extract PMID
                pmid_elem = article_elem.find('.//PMID')
                pmid = pmid_elem.text if pmid_elem is not None else "Unknown"
                
                # Extract title
                title_elem = article_elem.find('.//ArticleTitle')
                title = title_elem.text if title_elem is not None else "No title available"
                
                # Extract abstract
                abstract_elem = article_elem.find('.//Abstract/AbstractText')
                abstract = abstract_elem.text if abstract_elem is not None else "No abstract available"
                
                # Extract authors
                authors = []
                for author_elem in article_elem.findall('.//Author'):
                    lastname_elem = author_elem.find('LastName')
                    firstname_elem = author_elem.find('ForeName')
                    if lastname_elem is not None and firstname_elem is not None:
                        authors.append(f"{lastname_elem.text}, {firstname_elem.text}")
                    elif lastname_elem is not None:
                        authors.append(lastname_elem.text)
                
                # Extract journal
                journal_elem = article_elem.find('.//Journal/Title')
                journal = journal_elem.text if journal_elem is not None else "Unknown journal"
                
                # Extract publication date
                pub_date = "Unknown date"
                year_elem = article_elem.find('.//PubDate/Year')
                month_elem = article_elem.find('.//PubDate/Month')
                day_elem = article_elem.find('.//PubDate/Day')
                
                if year_elem is not None:
                    year = year_elem.text
                    month = month_elem.text if month_elem is not None else "01"
                    day = day_elem.text if day_elem is not None else "01"
                    
                    # Convert month name to number if needed
                    month_map = {
                        "Jan": "01", "Feb": "02", "Mar": "03", "Apr": "04",
                        "May": "05", "Jun": "06", "Jul": "07", "Aug": "08",
                        "Sep": "09", "Oct": "10", "Nov": "11", "Dec": "12"
                    }
                    if month in month_map:
                        month = month_map[month]
                    elif not month.isdigit():
                        month = "01"
                    
                    try:
                        pub_date = f"{year}-{month.zfill(2)}-{day.zfill(2)}"
                    except:
                        pub_date = year
                
                # Extract DOI
                doi = None
                for elocation_elem in article_elem.findall('.//ELocationID'):
                    if elocation_elem.get('EIdType') == 'doi':
                        doi = elocation_elem.text
                        break
                
                # Extract keywords
                keywords = []
                for keyword_elem in article_elem.findall('.//Keyword'):
                    if keyword_elem.text:
                        keywords.append(keyword_elem.text)
                
                article = {
                    "pmid": pmid,
                    "title": title,
                    "authors": authors if authors else ["Unknown authors"],
                    "abstract": abstract,
                    "publication_date": pub_date,
                    "journal": journal,
                    "doi": doi,
                    "keywords": keywords
                }
                articles.append(article)
                
            except Exception as e:
                logger.error(f"Error parsing individual article: {str(e)}")
                # If parsing fails for individual article, create a minimal entry
                articles.append({
                    "pmid": pmid if 'pmid' in locals() else "Unknown",
                    "title": "Error parsing article",
                    "authors": ["Unknown"],
                    "abstract": "Failed to parse article data",
                    "publication_date": "Unknown",
                    "journal": "Unknown",
                    "doi": None,
                    "keywords": []
                })
        
        logger.info(f"Successfully parsed {len(articles)} articles from XML")
        return articles
        
    except ET.ParseError as e:
        logger.error(f"XML parsing error: {str(e)}")
        # Return minimal data for the requested IDs
        return [{
            "pmid": pmid,
            "title": "XML parsing error",
            "authors": ["Unknown"],
            "abstract": "Failed to parse PubMed XML response",
            "publication_date": "Unknown",
            "journal": "Unknown",
            "doi": None,
            "keywords": []
        } for pmid in ids]
    except Exception as e:
        logger.error(f"Unexpected error parsing XML: {str(e)}")
        # Return minimal data for the requested IDs
        return [{
            "pmid": pmid,
            "title": "Parsing error",
            "authors": ["Unknown"],
            "abstract": "Failed to parse article data",
            "publication_date": "Unknown",
            "journal": "Unknown",
            "doi": None,
            "keywords": []
        } for pmid in ids]
