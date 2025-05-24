# Chronos Unified Search Interface

## Overview
The Chronos system now features a **unified search interface** that allows researchers to search for both historical (pre-2000) and modern medical literature simultaneously, then generate cross-temporal hypotheses.

## Key Features

### 🔍 **Unified Search**
- **Single search bar** searches both historical and modern literature simultaneously
- **Dual-column results** with clear visual distinction:
  - **Historical Articles** (Clock icon, amber theme) - Pre-2000 studies
  - **Modern Articles** (Microscope icon, blue theme) - Recent studies

### 📊 **Enhanced Knowledge Graph Visualization**
- **Interactive graph view** showing connections between selected articles
- **Real-time hypothesis generation** with confidence scoring
- **Visual relationship mapping** between historical observations and modern validations

### 🔄 **Improved Workflow**
1. **Search**: Enter medical terms in the unified search bar
2. **Select**: Choose one historical and one modern article
3. **Analyze**: View the knowledge graph and generated hypotheses
4. **Explore**: Upload OCR documents for additional historical context

## Usage Examples

### Example 1: Tuberculosis Research
**Search Query**: `tuberculosis`

**Expected Results**:
- **Historical**: Studies from the 1980s-1990s on TB treatment protocols
- **Modern**: Recent studies on drug-resistant TB, HIV co-infection, etc.
- **Generated Hypothesis**: Cross-temporal insights connecting historical treatment patterns with modern resistance patterns

### Example 2: Cardiovascular Disease
**Search Query**: `heart disease prevention`

**Expected Results**:
- **Historical**: Early studies on diet and exercise
- **Modern**: Recent genetic and molecular studies
- **Generated Hypothesis**: Evolution of preventive strategies from lifestyle to precision medicine

## Technical Implementation

### Backend Enhancements
- **Retry Logic**: Robust database connections with exponential backoff
- **Separate Endpoints**: 
  - `/api/v1/historical-articles/search` (pre-2000 studies)
  - `/api/v1/spine-articles/search` (modern studies)
- **Enhanced Error Handling**: Connection recovery and health monitoring

### Frontend Architecture
- **UnifiedSearch Component**: Single interface for dual searches
- **Enhanced GraphView**: Rich visualization with article details
- **Responsive Design**: Works on desktop and mobile devices
- **Real-time Updates**: Live search results and hypothesis generation

## API Endpoints

### Historical Search
```
GET /api/v1/historical-articles/search?q={query}&max_year=2000&page=1&per_page=10
```

### Modern Search
```
GET /api/v1/spine-articles/search?q={query}&page=1&per_page=10
```

### Hypothesis Generation
```
POST /api/v1/hypothesis/generate
{
  "historical_id": "node_id_1",
  "modern_id": "node_id_2"
}
```

## System Status

### ✅ **Completed Features**
- [x] Unified search interface with dual-column results
- [x] Enhanced knowledge graph visualization
- [x] Database retry logic and connection recovery
- [x] Separate historical vs modern search APIs
- [x] Real-time hypothesis generation
- [x] Responsive design and error handling
- [x] Article selection and ingestion workflow

### 🔬 **Testing Verified**
- [x] Backend health checks and API connectivity
- [x] PubMed integration for both historical and modern searches
- [x] Neo4j graph database ingestion and querying
- [x] LLM hypothesis generation between cross-temporal studies
- [x] Frontend-backend integration with real data

## Quick Start

1. **Start Backend**:
   ```bash
   cd backend && ./start-backend.sh
   ```

2. **Start Frontend**:
   ```bash
   cd frontend && npm run dev
   ```

3. **Open Browser**: Navigate to `http://localhost:3000`

4. **Test Search**: Try searching for "tuberculosis" or "diabetes"

5. **Select Articles**: Choose one from each column (historical and modern)

6. **View Results**: Check the knowledge graph visualization and generated hypotheses

## Architecture Benefits

### 🎯 **User Experience**
- **Single search interface** reduces cognitive load
- **Visual distinction** between historical and modern studies
- **Real-time feedback** on search progress and results
- **Intuitive workflow** from search to hypothesis generation

### ⚡ **Performance**
- **Parallel searches** for faster results
- **Retry mechanisms** for reliable database connections
- **Efficient state management** for responsive UI
- **Optimized API calls** with proper error handling

### 🔧 **Maintainability**
- **Modular components** for easy updates
- **TypeScript** for type safety
- **Consistent error handling** across the system
- **Clear separation** between historical and modern data flows

## Future Enhancements

### 🔮 **Planned Features**
- [ ] Advanced filtering (date ranges, journals, authors)
- [ ] Saved search history and bookmarking
- [ ] Export functionality for hypotheses and graphs
- [ ] Collaborative features for research teams
- [ ] Integration with external medical databases

### 📈 **Performance Optimizations**
- [ ] Search result caching for faster repeated queries
- [ ] Progressive loading for large result sets
- [ ] Optimized graph rendering for complex networks
- [ ] Background hypothesis generation

---

**Note**: This unified interface represents a significant improvement in usability and functionality, making it easier for researchers to discover cross-temporal insights in medical literature.
