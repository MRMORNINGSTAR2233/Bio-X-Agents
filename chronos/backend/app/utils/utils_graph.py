from neo4j import AsyncGraphDatabase
import os
import uuid
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

async def get_driver():
    global driver
    if driver is None:
        driver = AsyncGraphDatabase.driver(
            NEO4J_URI, 
            auth=(NEO4J_USER, NEO4J_PASSWORD)
        )
    return driver

async def close_driver():
    global driver
    if driver is not None:
        await driver.close()
        driver = None

async def create_historical_observation(text: str, source_id: str) -> str:
    """
    Create a historical observation node in Neo4j
    """
    driver = await get_driver()
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
        async with driver.session() as session:
            result = await session.run(
                query,
                id=node_id,
                text=text,
                source_id=source_id
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
    driver = await get_driver()
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
        async with driver.session() as session:
            result = await session.run(
                query,
                id=node_id,
                pmid=article.pmid,
                title=article.title,
                authors=article.authors,
                abstract=article.abstract,
                publication_date=article.publication_date,
                journal=article.journal,
                doi=article.doi,
                keywords=article.keywords
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
    driver = await get_driver()
    
    query = """
    MATCH (n)
    WHERE n.id = $id
    RETURN n
    """
    
    try:
        async with driver.session() as session:
            result = await session.run(query, id=node_id)
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
    driver = await get_driver()
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
        async with driver.session() as session:
            result = await session.run(
                query,
                hist_id=hist_id,
                mod_id=mod_id,
                rel_id=rel_id,
                hypothesis=hypothesis
            )
            record = await result.single()
            logger.info(f"Created hypothesis connection: {rel_id}")
            return record["id"]
    except Exception as e:
        logger.error(f"Error creating hypothesis connection: {str(e)}")
        raise
