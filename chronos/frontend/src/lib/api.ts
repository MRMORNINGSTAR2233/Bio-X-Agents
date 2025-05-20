// API service for Chronos
import { toast } from "sonner";

// API base URL - configurable for different environments
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Types
export interface Article {
  pmid: string;
  title: string;
  authors: string[];
  abstract?: string;
  publication_date?: string;
  journal?: string;
  doi?: string;
  keywords?: string[];
}

export interface DKGMetadata {
  title: string;
  description?: string;
  authors?: string[];
  date?: string;
  keywords?: string[];
  [key: string]: string | string[] | number | boolean | undefined; // For any additional metadata fields
}

export interface SearchResult {
  results: Article[];
  page: number;
  per_page: number;
  query: string;
}

export interface HypothesisRequest {
  hist_id: string;
  modern_id: string;
}

export interface HypothesisResponse {
  hypothesis: string;
  evidence: string[];
}

export interface OCRResponse {
  text: string;
}

// API error handling
interface ApiErrorResponse {
  data?: {
    detail?: string;
  };
}

const handleApiError = (error: Error | unknown, message: string = "An error occurred") => {
  console.error(error);
  const errorMessage = typeof error === 'object' && error !== null && 'response' in error && 
    error.response && typeof error.response === 'object' && 'data' in error.response ? 
    ((error.response as ApiErrorResponse).data?.detail) || message : message;
  toast.error(errorMessage);
  return null;
};

// API methods
const api = {
  // Search PubMed articles
  searchSpineArticles: async (
    query: string,
    page: number = 1,
    perPage: number = 10
  ): Promise<SearchResult | null> => {
    try {
      const url = new URL(`${API_BASE_URL}/api/v1/spine-articles/search`);
      url.searchParams.append('q', query);
      url.searchParams.append('page', page.toString());
      url.searchParams.append('per_page', perPage.toString());

      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      return handleApiError(error, "Failed to search articles");
    }
  },

  // OCR endpoint
  processOCR: async (file: File): Promise<OCRResponse | null> => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE_URL}/api/v1/ocr`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      return handleApiError(error, "OCR processing failed");
    }
  },

  // Ingest historical observation
  ingestHistorical: async (text: string, sourceId: string): Promise<{ id: string } | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/graph/ingest-historical`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, source_id: sourceId }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      return handleApiError(error, "Failed to ingest historical observation");
    }
  },

  // Ingest modern study
  ingestModern: async (article: Article): Promise<{ id: string } | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/graph/ingest-modern`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(article),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      return handleApiError(error, "Failed to ingest modern study");
    }
  },

  // Generate hypothesis
  generateHypothesis: async (
    histId: string,
    modernId: string
  ): Promise<HypothesisResponse | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/hypothesis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ hist_id: histId, modern_id: modernId }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      return handleApiError(error, "Failed to generate hypothesis");
    }
  },
  
  // Define metadata interface
  
  // Write DKG stub
  writeDKGStub: async (nodeId: string, metadata: DKGMetadata): Promise<{success: boolean; id?: string} | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/dkg/write-stub`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ node_id: nodeId, metadata }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      return handleApiError(error, "Failed to write DKG stub");
    }
  },
};

export default api;

