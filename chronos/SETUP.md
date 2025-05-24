# 🚀 Bio-X-Agents Chronos - Quick Setup Guide

## Prerequisites

- Docker and Docker Compose
- Node.js 18+ and npm
- Git

## 🔧 Initial Setup

### 1. Clone and Navigate
```bash
git clone <repository-url>
cd Bio-X-Agents/chronos
```

### 2. Backend Environment Setup
```bash
cd backend
cp .env.example .env
# Edit .env with your actual API keys and passwords
```

**Required Environment Variables:**
- `GROQ_API_KEY` or `OPENAI_API_KEY` - For LLM functionality
- `NEO4J_PASSWORD` - Change from default for security
- `PUBMED_API_KEY` - Optional but recommended for higher rate limits

### 3. Frontend Environment Setup
```bash
cd ../frontend
cp .env.example .env.local
# Edit .env.local if needed (defaults should work for local development)
```

### 4. Start the Application
```bash
# From the root chronos directory
chmod +x start-app.sh
./start-app.sh
```

**Or start services individually:**
```bash
# Backend (Docker services)
cd backend && docker-compose up -d

# Frontend (Development server)
cd frontend && npm install && npm run dev
```

## 📍 Service URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Neo4j Browser**: http://localhost:7474
- **Health Check**: http://localhost:8000/health

## 🧪 Testing

```bash
# Test backend health
curl http://localhost:8000/health

# Run security verification
./verify-security.sh
```

## 🔒 Security Notes

- ✅ All sensitive files are in .gitignore
- ✅ Use .env.example files as templates
- ✅ Never commit real API keys or passwords
- ✅ Run `./verify-security.sh` before commits

## 🐛 Troubleshooting

**Services not starting:**
```bash
docker-compose down && docker-compose up -d
```

**Frontend build issues:**
```bash
cd frontend && rm -rf .next node_modules && npm install
```

**OCR not working:**
- Ensure Tesseract is available in Docker container
- Check file size limits (max 10MB)

**Database connection issues:**
- Verify Neo4j password in .env matches docker-compose.yml
- Check if ports 7687 and 6379 are available

## 📚 Documentation

- [Security Guide](./SECURITY.md)
- [Component Migration](./COMPONENT_MIGRATION.md) 
- [Enhanced Knowledge Graph](./ENHANCED_KNOWLEDGE_GRAPH_IMPLEMENTATION.md)
- [Unified Search Guide](./UNIFIED_SEARCH_GUIDE.md)
- [E2E Testing Workflow](./E2E_TESTING_WORKFLOW.md)

## 🎯 Features

- 📄 **OCR Processing** - Extract text from medical images
- 🧠 **LLM Hypothesis Generation** - AI-powered medical insights
- 🕸️ **Knowledge Graph** - Interactive relationship visualization
- 🔍 **Historical Search** - PubMed integration for research
- 📊 **Real-time Analytics** - Performance monitoring

---

For detailed setup instructions, see individual README files in `/backend` and `/frontend` directories.
