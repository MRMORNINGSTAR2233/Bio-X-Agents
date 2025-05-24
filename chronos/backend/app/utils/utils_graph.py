from neo4j import AsyncGraphDatabase
import os
import uuid
import asyncio
from dotenv import load_dotenv
import logging
from typing import Dict, Any, Optional
from ..models import Article

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Neo4j connection details
NEO4J_URI = os.getenv("NEO4J_URI", "bolt://neo4j:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "chronos")

# Neo4j driver instance
driver = None

async def get_driver_with_retry(max_retries: int = 3, retry_delay: float = 1.0):
    """
    Get Neo4j driver with retry logic for better connection handling
    """
    global driver
    
    for attempt in range(max_retries):
        try:
            if driver is None:
                driver = AsyncGraphDatabase.driver(
                    NEO4J_URI, 
                    auth=(NEO4J_USER, NEO4J_PASSWORD)
                )
                
            # Test the connection
            async with driver.session() as session:
                await session.run("RETURN 1")
                
            logger.info(f"Neo4j connection established successfully on attempt {attempt + 1}")
            return driver
            
        except Exception as e:
            logger.warning(f"Neo4j connection attempt {attempt + 1} failed: {str(e)}")
            
            # Close the failed driver
            if driver is not None:
                try:
                    await driver.close()
                except:
                    pass
                driver = None
            
            if attempt < max_retries - 1:
                await asyncio.sleep(retry_delay * (attempt + 1))  # Exponential backoff
            else:
                logger.error(f"Failed to connect to Neo4j after {max_retries} attempts")
                raise e
    
    return driver

async def get_driver():
    """
    Backward compatibility wrapper for get_driver_with_retry
    """
    return await get_driver_with_retry()

async def close_driver():
    global driver
    if driver is not None:
        await driver.close()
        driver = None

async def execute_query_with_retry(query: str, parameters: Dict[str, Any] = None, max_retries: int = 3):
    """
    Execute a Neo4j query with retry logic for better reliability
    """
    global driver
    for attempt in range(max_retries):
        try:
            driver = await get_driver_with_retry()
            async with driver.session() as session:
                result = await session.run(query, parameters or {})
                return result
                
        except Exception as e:
            logger.warning(f"Query execution attempt {attempt + 1} failed: {str(e)}")
            
            if attempt < max_retries - 1:
                # Reset driver on failure to force reconnection
                if driver is not None:
                    try:
                        await driver.close()
                    except:
                        pass
                    driver = None
                await asyncio.sleep(0.5 * (attempt + 1))
            else:
                logger.error(f"Query failed after {max_retries} attempts")
                raise e

async def create_historical_observation(text: str, source_id: str) -> str:
    """
    Create a historical observation node in Neo4j
    """
    node_id = f"hist-{uuid.uuid4()}"
    
    query = """
    CREATE (h:HistoricalObservation {
        id: $id,
        text: $text,
        source_id: $source_id,
        created_at: datetime()
    })
    RETURN h.id as id
    """
    
    try:
        driver = await get_driver_with_retry()
        async with driver.session() as session:
            result = await session.run(
                query,
                {
                    "id": node_id,
                    "text": text,
                    "source_id": source_id
                }
            )
            record = await result.single()
            logger.info(f"Created historical observation node: {node_id}")
            return record["id"]
    except Exception as e:
        logger.error(f"Error creating historical observation: {str(e)}")
        raise

async def create_modern_study(article: Article) -> str:
    """
    Create a modern study node in Neo4j from an Article model
    """
    node_id = f"mod-{uuid.uuid4()}"
    
    query = """
    CREATE (m:ModernStudy {
        id: $id,
        pmid: $pmid,
        title: $title,
        authors: $authors,
        abstract: $abstract,
        publication_date: $publication_date,
        journal: $journal,
        doi: $doi,
        keywords: $keywords,
        created_at: datetime()
    })
    RETURN m.id as id
    """
    
    try:
        driver = await get_driver_with_retry()
        async with driver.session() as session:
            result = await session.run(
                query,
                {
                    "id": node_id,
                    "pmid": article.pmid,
                    "title": article.title,
                    "authors": article.authors,
                    "abstract": article.abstract,
                    "publication_date": article.publication_date,
                    "journal": article.journal,
                    "doi": article.doi,
                    "keywords": article.keywords
                }
            )
            record = await result.single()
            logger.info(f"Created modern study node: {node_id}")
            return record["id"]
    except Exception as e:
        logger.error(f"Error creating modern study: {str(e)}")
        raise

async def get_node_by_id(node_id: str) -> Optional[Dict[str, Any]]:
    """
    Retrieve a node from Neo4j by its ID
    """
    query = """
    MATCH (n)
    WHERE n.id = $id
    RETURN n
    """
    
    try:
        driver = await get_driver_with_retry()
        async with driver.session() as session:
            result = await session.run(query, {"id": node_id})
            record = await result.single()
            
            if not record:
                logger.warning(f"Node not found: {node_id}")
                return None
                
            node = record["n"]
            return dict(node.items())
    except Exception as e:
        logger.error(f"Error retrieving node: {str(e)}")
        raise

async def create_hypothesis_connection(hist_id: str, mod_id: str, hypothesis: str) -> str:
    """
    Create a relationship between historical observation and modern study
    with the hypothesis as a property
    """
    rel_id = f"hyp-{uuid.uuid4()}"
    
    query = """
    MATCH (h:HistoricalObservation), (m:ModernStudy)
    WHERE h.id = $hist_id AND m.id = $mod_id
    CREATE (h)-[r:SUGGESTS_HYPOTHESIS {
        id: $rel_id,
        hypothesis: $hypothesis,
        created_at: datetime()
    }]->(m)
    RETURN r.id as id
    """
    
    try:
        driver = await get_driver_with_retry()
        async with driver.session() as session:
            result = await session.run(
                query,
                {
                    "hist_id": hist_id,
                    "mod_id": mod_id,
                    "rel_id": rel_id,
                    "hypothesis": hypothesis
                }
            )
            record = await result.single()
            logger.info(f"Created hypothesis connection: {rel_id}")
            return record["id"]
    except Exception as e:
        logger.error(f"Error creating hypothesis connection: {str(e)}")
        raise
