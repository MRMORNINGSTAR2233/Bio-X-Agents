# End-to-End Testing Workflow

## Current System Status
✅ **Backend**: Running on `http://localhost:8000`
✅ **Frontend**: Running on `http://localhost:3000`
✅ **Database**: Neo4j and Redis connections healthy
✅ **APIs**: All endpoints responding correctly

## Step-by-Step Test Workflow

### 1. Test Unified Search Interface
1. **Open Browser**: Navigate to `http://localhost:3000`
2. **Search Query**: Enter "tuberculosis" in the unified search bar
3. **Verify Results**: Should see both historical and modern articles in two columns
4. **Visual Check**: Historical articles should have clock icon (amber), modern should have microscope icon (blue)

### 2. Test Article Selection
1. **Select Historical**: Click "Select" on any pre-2000 tuberculosis study
2. **Select Modern**: Click "Select" on any recent tuberculosis-related study
3. **Verify Ingestion**: Both articles should show "Selected" status
4. **Check Status Panel**: Right sidebar should show selected articles with proper styling

### 3. Test Knowledge Graph Visualization
1. **View Graph**: Scroll to the "Knowledge Graph Visualization" section
2. **Verify Nodes**: Should see historical (amber), modern (blue), and hypothesis (purple) nodes
3. **Check Connections**: Animated lines should connect the nodes
4. **Inspect Details**: Each node should show article titles and metadata

### 4. Test Hypothesis Generation
1. **Automatic Generation**: Should happen automatically when both articles are selected
2. **View Hypothesis**: Check the purple hypothesis node for generated content
3. **Confidence Score**: Should display a confidence percentage with visual bar
4. **Relationship Mapping**: Should show clear connections between historical evidence and modern validation

## Test Data Examples

### Historical Search Results (Pre-2000)
- **Video-Assisted Thoracoscopy** (1998)
- **Respiratory Cryptococcosis in HIV** (1999)  
- **Rifalazil for TB Treatment** (1998)

### Modern Search Results (Recent)
- **Deep Vein Thrombosis in HIV Patients** (2025)
- **Rheumatologic Manifestations in Immunodeficiency** (2025)
- **Lumbar Spine Infections** (2025)

### Generated Hypothesis Example
**Connection**: Historical TB intermittent therapy ↔ Modern DVT in HIV patients

**Hypothesis**: "Intermittent tuberculosis therapy increases the risk of deep vein thrombosis (DVT) in HIV-positive individuals, leading to a higher incidence of undiagnosed DVT and potentially contributing to hospital mortality."

**Scientific Rationale**:
1. Historical TB treatment patterns may have cardiovascular implications
2. Modern HIV patients show unexplained high DVT incidence  
3. Treatment-related inflammation could be the connecting mechanism
4. Testable through prospective cohort studies

## API Testing Commands

### Test Historical Search
```bash
curl -s "http://localhost:8000/api/v1/historical-articles/search?q=tuberculosis&max_year=2000"
```

### Test Modern Search  
```bash
curl -s "http://localhost:8000/api/v1/spine-articles/search?q=tuberculosis"
```

### Test Historical Ingestion
```bash
curl -X POST "http://localhost:8000/api/v1/graph/ingest-historical" \
  -H "Content-Type: application/json" \
  -d '{"text": "Historical TB study content", "source_id": "test:tb_1985"}'
```

### Test Modern Ingestion
```bash
curl -X POST "http://localhost:8000/api/v1/graph/ingest-modern" \
  -H "Content-Type: application/json" \
  -d '{"pmid": "40410833", "title": "Modern DVT study", ...}'
```

### Test Hypothesis Generation
```bash
curl -X POST "http://localhost:8000/api/v1/hypothesis" \
  -H "Content-Type: application/json" \
  -d '{"hist_id": "hist-xxx", "modern_id": "mod-yyy"}'
```

## Expected Frontend Features

### ✅ Unified Search Interface
- Single search bar for both historical and modern literature
- Dual-column results with clear visual distinction
- Real-time search with parallel API calls
- Error handling and connection status

### ✅ Enhanced Knowledge Graph
- Interactive visualization with zoom controls
- Color-coded nodes (amber/blue/purple)
- Animated connection lines
- Article metadata display
- Confidence scoring visualization

### ✅ Responsive Design
- Works on desktop and mobile
- Collapsible panels and scrollable result areas
- Proper error states and loading indicators
- Toast notifications for user feedback

### ✅ Complete Workflow
- Search → Select → Ingest → Visualize → Generate Hypothesis
- OCR upload for additional historical documents
- Real-time updates and state management
- Backend health monitoring

## Success Criteria

1. **Search Functionality**: Both historical and modern searches return relevant results
2. **Article Selection**: Articles can be selected and ingested successfully
3. **Graph Visualization**: Knowledge graph displays correctly with proper styling
4. **Hypothesis Generation**: AI generates meaningful cross-temporal hypotheses
5. **User Experience**: Interface is intuitive and responsive
6. **Error Handling**: Graceful degradation when services are unavailable

## Next Steps for Further Testing

1. **Load Testing**: Test with large result sets
2. **Edge Cases**: Test with articles that have missing metadata
3. **Multiple Hypotheses**: Test generating multiple hypotheses from different article pairs
4. **OCR Integration**: Test historical document upload and processing
5. **Export Functionality**: Test saving and sharing generated hypotheses

---

**Current Status**: All core functionality is working end-to-end. The unified search interface successfully combines historical and modern literature search with AI-powered hypothesis generation.
