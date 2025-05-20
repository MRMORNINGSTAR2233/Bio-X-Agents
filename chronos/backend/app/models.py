from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class Article(BaseModel):
    pmid: str
    title: str
    authors: List[str]
    abstract: Optional[str] = None
    publication_date: Optional[str] = None
    journal: Optional[str] = None
    doi: Optional[str] = None
    keywords: Optional[List[str]] = None
    
    class Config:
        schema_extra = {
            "example": {
                "pmid": "12345678",
                "title": "Example study of biomedical research",
                "authors": ["Smith, J", "Doe, A"],
                "abstract": "This is an example abstract for a modern study.",
                "publication_date": "2022-01-01",
                "journal": "Journal of Biomedical Science",
                "doi": "10.1234/example.doi",
                "keywords": ["research", "biomedical", "example"]
            }
        }

class HypothesisRequest(BaseModel):
    hist_id: str = Field(..., description="ID of the historical observation node")
    modern_id: str = Field(..., description="ID of the modern study node")
    
    class Config:
        schema_extra = {
            "example": {
                "hist_id": "hist-123",
                "modern_id": "mod-456"
            }
        }

class DKGStub(BaseModel):
    """Model for the OriginTrail DKG integration stub"""
    node_id: str = Field(..., description="ID of the node to be published to DKG")
    metadata: Dict[str, Any] = Field(..., description="Metadata for the DKG node")
    
    class Config:
        schema_extra = {
            "example": {
                "node_id": "node-123",
                "metadata": {
                    "type": "hypothesis",
                    "timestamp": "2025-05-20T12:34:56Z",
                    "author": "Chronos System"
                }
            }
        }
