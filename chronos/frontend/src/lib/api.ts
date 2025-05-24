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
  relationship_id?: string;
}

export interface HealthResponse {
  status: string;
  services: {
    redis: string;
    neo4j: string;
    environment: string;
  };
  missing_env_vars: string[];
  timestamp: number;
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
  console.error('API Error:', error);
  let errorMessage = message;
  
  if (error instanceof Error) {
    errorMessage = error.message || message;
  } else if (typeof error === 'object' && error !== null) {
    if ('response' in error && error.response && typeof error.response === 'object') {
      const response = error.response as ApiErrorResponse;
      errorMessage = response.data?.detail || message;
    } else if ('message' in error) {
      errorMessage = (error as { message: string }).message;
    }
  }
  
  toast.error(errorMessage);
  return null;
};

// API methods
const api = {
  // Health check endpoint
  healthCheck: async (): Promise<HealthResponse | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Health check error:', error);
      return null;
    }
  },

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
        const errorData = await response.text();
        console.error('Search API error:', {
          status: response.status,
          statusText: response.statusText,
          data: errorData
        });
        throw new Error(
          `Search failed: ${response.status} ${response.statusText}\n${errorData}`
        );
      }

      const data = await response.json();
      if (!data || !Array.isArray(data.results)) {
        throw new Error('Invalid response format from search API');
      }

      return data;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        return handleApiError(error, "Failed to connect to search API. Please check if the backend is running.");
      }
      return handleApiError(error, "Failed to search articles. Please try again.");
    }
  },

  // Search historical articles (pre-2000)
  searchHistoricalArticles: async (
    query: string,
    page: number = 1,
    perPage: number = 10,
    maxYear: number = 2000
  ): Promise<SearchResult | null> => {
    try {
      const url = new URL(`${API_BASE_URL}/api/v1/historical-articles/search`);
      url.searchParams.append('q', query);
      url.searchParams.append('page', page.toString());
      url.searchParams.append('per_page', perPage.toString());
      url.searchParams.append('max_year', maxYear.toString());

      const response = await fetch(url.toString());
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Historical search API error:', {
          status: response.status,
          statusText: response.statusText,
          data: errorData
        });
        throw new Error(
          `Historical search failed: ${response.status} ${response.statusText}\n${errorData}`
        );
      }

      const data = await response.json();
      if (!data || !Array.isArray(data.results)) {
        throw new Error('Invalid response format from historical search API');
      }

      return data;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        return handleApiError(error, "Failed to connect to historical search API. Please check if the backend is running.");
      }
      return handleApiError(error, "Failed to search historical articles. Please try again.");
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

