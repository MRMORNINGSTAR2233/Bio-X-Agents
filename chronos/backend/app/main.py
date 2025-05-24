from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import Optional, List, Dict, Any
import os
import time
from dotenv import load_dotenv
from app.utils.utils_pubmed import search_pubmed_articles
from app.utils.utils_ocr import process_ocr_image
from app.utils.utils_graph import (
    create_historical_observation, 
    create_modern_study,
    get_node_by_id,
)
from app.utils.utils_llm import generate_hypothesis
from app.models import Article, HypothesisRequest, DKGStub
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

app = FastAPI(
    title="Chronos API",
    description="Connecting historical observations with modern studies",
    version="1.0.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development; restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Welcome to Chronos API"}

@app.get("/health")
async def health_check():
    """Health check endpoint to verify all services are working"""
    try:
        # Check Redis connection
        from app.utils.utils_pubmed import get_redis
        redis_client = await get_redis()
        await redis_client.ping()
        redis_status = "healthy"
    except Exception as e:
        logger.warning(f"Redis health check failed: {str(e)}")
        redis_status = "unhealthy"
    
    try:
        # Check Neo4j connection
        from app.utils.utils_graph import get_driver
        driver = await get_driver()
        async with driver.session() as session:
            await session.run("RETURN 1")
        neo4j_status = "healthy"
    except Exception as e:
        logger.warning(f"Neo4j health check failed: {str(e)}")
        neo4j_status = "unhealthy"
    
    # Check environment variables
    env_status = "healthy"
    missing_vars = []
    required_vars = ["NEO4J_URI", "NEO4J_USER", "NEO4J_PASSWORD", "REDIS_URL", "GROQ_API_KEY"]
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
            env_status = "unhealthy"
    
    overall_status = "healthy" if all([
        redis_status == "healthy",
        neo4j_status == "healthy", 
        env_status == "healthy"
    ]) else "unhealthy"
    
    return {
        "status": overall_status,
        "services": {
            "redis": redis_status,
            "neo4j": neo4j_status,
            "environment": env_status
        },
        "missing_env_vars": missing_vars,
        "timestamp": time.time()
    }

@app.get("/api/v1/spine-articles/search")
async def search_articles(
    q: str = Query(..., description="Search query for articles"),
    page: int = Query(1, description="Page number for pagination"),
    per_page: int = Query(10, description="Results per page")
):
    try:
        articles = await search_pubmed_articles(q, page, per_page)
        return {"results": articles, "page": page, "per_page": per_page, "query": q}
    except Exception as e:
        logger.error(f"Error searching PubMed articles: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error searching articles: {str(e)}")

@app.get("/api/v1/historical-articles/search")
async def search_historical_articles(
    q: str = Query(..., description="Search query for historical articles"),
    page: int = Query(1, description="Page number for pagination"),
    per_page: int = Query(10, description="Results per page"),
    max_year: int = Query(2000, description="Maximum publication year (default: 2000)")
):
    try:
        # Search for historical articles with date filter
        articles = await search_pubmed_articles(
            query=f"{q} AND (\"1800\"[Date - Publication] : \"{max_year}\"[Date - Publication])",
            page=page, 
            per_page=per_page
        )
        return {"results": articles, "page": page, "per_page": per_page, "query": q, "max_year": max_year}
    except Exception as e:
        logger.error(f"Error searching historical articles: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error searching historical articles: {str(e)}")

@app.post("/api/v1/ocr")
async def ocr_endpoint(file: UploadFile = File(...)):
    try:
        extracted_text = await process_ocr_image(file)
        
        # Ensure the text is JSON-safe
        import json
        try:
            # Test if the text can be safely JSON encoded
            json.dumps({"text": extracted_text})
        except (TypeError, ValueError) as json_error:
            logger.warning(f"OCR text contains problematic characters: {json_error}")
            # Clean the text further if needed
            extracted_text = extracted_text.encode('utf-8', errors='ignore').decode('utf-8')
        
        return {"text": extracted_text}
    except HTTPException:
        # Re-raise HTTP exceptions (they already have proper status codes)
        raise
    except Exception as e:
        logger.error(f"OCR processing error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"OCR processing error: {str(e)}")

@app.post("/api/v1/graph/ingest-historical")
async def ingest_historical(payload: dict):
    try:
        if "text" not in payload or "source_id" not in payload:
            raise HTTPException(status_code=400, detail="Missing required fields: text and source_id")
        
        node_id = await create_historical_observation(payload["text"], payload["source_id"])
        return {"id": node_id}
    except Exception as e:
        logger.error(f"Error creating historical observation: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error creating historical observation: {str(e)}")

@app.post("/api/v1/graph/ingest-modern")
async def ingest_modern(article: Article):
    try:
        node_id = await create_modern_study(article)
        return {"id": node_id}
    except Exception as e:
        logger.error(f"Error creating modern study: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error creating modern study: {str(e)}")

@app.post("/api/v1/hypothesis")
async def generate_hypothesis_endpoint(request: HypothesisRequest):
    try:
        # Fetch nodes from Neo4j
        historical_node = await get_node_by_id(request.hist_id)
        modern_node = await get_node_by_id(request.modern_id)
        
        if not historical_node or not modern_node:
            raise HTTPException(status_code=404, detail="One or both nodes not found")
        
        # Generate hypothesis using LLM
        hypothesis = await generate_hypothesis(historical_node, modern_node)
        
        # Store the hypothesis relationship in the graph
        from app.utils.utils_graph import create_hypothesis_connection
        rel_id = await create_hypothesis_connection(request.hist_id, request.modern_id, hypothesis)
        
        return {
            "hypothesis": hypothesis,
            "evidence": [request.hist_id, request.modern_id],
            "relationship_id": rel_id
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error generating hypothesis: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating hypothesis: {str(e)}")

@app.post("/api/v1/dkg/write-stub")
async def write_dkg_stub(stub: DKGStub):
    try:
        # Log the stub
        logger.info(f"DKG Stub received: {stub.dict()}")
        
        # Echo back the stub as requested
        return stub.dict()
    except Exception as e:
        logger.error(f"Error processing DKG stub: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing DKG stub: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
