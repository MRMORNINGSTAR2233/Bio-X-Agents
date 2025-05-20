# Chronos

Chronos is an end-to-end prototype that connects historical observations with modern studies to generate scientific hypotheses.

## Project Overview

Chronos consists of two main components:

1. **Backend**: A FastAPI application with Neo4j and Redis, providing endpoints for searching PubMed articles, OCR processing, graph operations, and hypothesis generation.

2. **Frontend**: A Next.js application with TailwindCSS and Shadcn/UI, providing a user interface for interacting with the backend services.

## Setup Instructions

### Prerequisites

- Docker and Docker Compose (for the backend)
- Node.js (v18+) and npm (for the frontend)
- Python 3.10+ (if running the backend without Docker)
- Tesseract OCR (already included in the Docker image)

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd chronos/backend
   ```

2. Copy the environment template and fill in the required variables:
   ```bash
   cp .env.template .env
   ```

3. Edit the `.env` file with your API keys and credentials:
   - PUBMED_API_KEY (optional but recommended)
   - GROK_API_KEY (required for hypothesis generation)
   - NEO4J_PASSWORD (change if needed)

4. Build and start the backend services:
   ```bash
   docker-compose up --build
   ```

   This will start the FastAPI server, Neo4j database, and Redis cache.

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd chronos/frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file:
   ```bash
   echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Access the application at http://localhost:3000

## Testing the Application

1. **Backend API Testing**:
   - The API documentation is available at http://localhost:8000/docs
   - You can use this interactive interface to test all endpoints

2. **Frontend Workflow**:
   - **Search Articles**: Enter a query in the search box to find PubMed articles
   - **OCR**: Upload an image to extract text and ingest it as a historical observation
   - **Generate Hypothesis**: Once you have selected both a historical observation and a modern study, use the hypothesis generator to create a testable hypothesis

## API Endpoints

- `GET /api/v1/spine-articles/search?q=<>&page=<>&per_page=<>`: Search for PubMed articles
- `POST /api/v1/ocr`: Process an image with OCR to extract text
- `POST /api/v1/graph/ingest-historical`: Create a historical observation node
- `POST /api/v1/graph/ingest-modern`: Create a modern study node
- `POST /api/v1/hypothesis`: Generate a hypothesis by connecting historical and modern nodes
- `POST /api/v1/dkg/write-stub`: Echo/log a JSON stub for OriginTrail DKG integration

## Development Notes

### Backend

- The backend uses FastAPI for its performance and ease of use
- Neo4j is used as the graph database to store and query relationships
- Redis is used for caching PubMed API responses to improve performance
- All services are containerized for easy deployment

### Frontend

- The frontend uses Next.js with App Router for modern React features
- TailwindCSS with Shadcn/UI provides a clean and responsive user interface
- The interface is organized into components that match the backend functionality

## Troubleshooting

- If the backend fails to connect to Neo4j, ensure the Neo4j container is running and check the credentials in your `.env` file
- If the frontend cannot connect to the backend, ensure the backend is running and the `NEXT_PUBLIC_API_URL` is correctly set
- For OCR issues, make sure your images are clear and legible for Tesseract to process

## Future Enhancements

- Implement proper XML parsing for PubMed results
- Add user authentication for secure access
- Enhance the graph visualization component
- Implement pagination for search results
- Add more advanced filtering options for articles
