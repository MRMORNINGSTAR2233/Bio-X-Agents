import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Share2Icon, ZoomIn, ZoomOut, RefreshCw, Clock, Microscope, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { toast } from "sonner";
import { Article } from "@/lib/api";

interface GraphData {
  hypothesis?: string;
  confidence?: number;
}

interface GraphViewProps {
  histId?: string;
  modernId?: string;
  selectedHistoricalArticle?: Article | null;
  selectedModernArticle?: Article | null;
}

export default function GraphView({ histId, modernId, selectedHistoricalArticle, selectedModernArticle }: GraphViewProps) {
  const [zoom, setZoom] = useState(100);
  const [refreshing, setRefreshing] = useState(false);
  const [graphData, setGraphData] = useState<GraphData | null>(null);

  const fetchGraphData = useCallback(async () => {
    if (!histId || !modernId) return;
    
    try {
      setRefreshing(true);
      // Try to fetch actual graph data from backend
      const response = await api.generateHypothesis(histId, modernId);
      setGraphData(response);
    } catch (error) {
      console.error('Error fetching graph data:', error);
      toast.error("Failed to fetch graph data");
    } finally {
      setRefreshing(false);
    }
  }, [histId, modernId]);

  useEffect(() => {
    if (histId && modernId) {
      fetchGraphData();
    }
  }, [histId, modernId, fetchGraphData]);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 10, 150));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 10, 50));
  };

  const handleRefresh = () => {
    if (histId && modernId) {
      fetchGraphData();
    } else {
      setRefreshing(true);
      setTimeout(() => {
        setRefreshing(false);
      }, 1000);
    }
  };

  // Define zoom classes instead of inline styles
  const zoomClasses = {
    50: "scale-50",
    60: "scale-60",
    70: "scale-70",
    80: "scale-80",
    90: "scale-90",
    100: "scale-100",
    110: "scale-110",
    120: "scale-120",
    130: "scale-130",
    140: "scale-140",
    150: "scale-150",
  };

  // Get closest zoom level that exists in our classes
  const getZoomClass = (zoomLevel: number) => {
    const validZooms = Object.keys(zoomClasses).map(Number);
    const closest = validZooms.reduce((prev, curr) => {
      return Math.abs(curr - zoomLevel) < Math.abs(prev - zoomLevel) ? curr : prev;
    });
    return zoomClasses[closest as keyof typeof zoomClasses];
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Share2Icon className="h-5 w-5" />
          Knowledge Graph Visualization
        </CardTitle>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" onClick={handleZoomOut} title="Zoom out">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <div className="w-12 text-center text-sm">{zoom}%</div>
          <Button variant="outline" size="icon" onClick={handleZoomIn} title="Zoom in">
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleRefresh} 
            className={refreshing ? "animate-spin" : ""}
            title="Refresh graph"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] border rounded-lg bg-muted/20 overflow-hidden">
          <div 
            className={cn(
              "flex items-center justify-center w-full h-full transition-transform duration-200 origin-center",
              getZoomClass(zoom)
            )}
          >
            {histId && modernId ? (
              <div className="w-full h-full p-4">
                <div className="flex flex-col items-center justify-center h-full relative">
                  {/* Historical Article Node */}
                  <div className="absolute top-4 left-1/4 transform -translate-x-1/2">
                    <div className="p-4 border-2 border-amber-400 rounded-lg bg-amber-50 shadow-lg max-w-xs">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-5 w-5 text-amber-600" />
                        <span className="font-bold text-sm text-amber-800">Historical Study</span>
                      </div>
                      {selectedHistoricalArticle ? (
                        <div>
                          <p className="font-semibold text-xs line-clamp-2 mb-1">
                            {selectedHistoricalArticle.title}
                          </p>
                          <p className="text-xs text-amber-700">
                            {selectedHistoricalArticle.publication_date || 'Pre-2000'}
                          </p>
                          <p className="text-xs text-amber-600 mt-1">
                            PMID: {selectedHistoricalArticle.pmid}
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-amber-700">Node ID: {histId}</p>
                      )}
                    </div>
                  </div>

                  {/* Modern Article Node */}
                  <div className="absolute top-4 right-1/4 transform translate-x-1/2">
                    <div className="p-4 border-2 border-blue-400 rounded-lg bg-blue-50 shadow-lg max-w-xs">
                      <div className="flex items-center gap-2 mb-2">
                        <Microscope className="h-5 w-5 text-blue-600" />
                        <span className="font-bold text-sm text-blue-800">Modern Study</span>
                      </div>
                      {selectedModernArticle ? (
                        <div>
                          <p className="font-semibold text-xs line-clamp-2 mb-1">
                            {selectedModernArticle.title}
                          </p>
                          <p className="text-xs text-blue-700">
                            {selectedModernArticle.publication_date || 'Recent'}
                          </p>
                          <p className="text-xs text-blue-600 mt-1">
                            PMID: {selectedModernArticle.pmid}
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-blue-700">Node ID: {modernId}</p>
                      )}
                    </div>
                  </div>

                  {/* Connection Lines */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none z-[1]">
                    {/* Line from historical to hypothesis */}
                    <line 
                      x1="25%" y1="120" 
                      x2="50%" y2="200" 
                      stroke="#f59e0b" 
                      strokeWidth={3}
                      strokeDasharray="5,5"
                      className="animate-pulse"
                    />
                    {/* Line from modern to hypothesis */}
                    <line 
                      x1="75%" y1="120" 
                      x2="50%" y2="200" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      strokeDasharray="5,5"
                      className="animate-pulse"
                    />
                  </svg>

                  {/* Central Hypothesis Node */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 mt-8">
                    <div className="p-4 border-2 border-purple-400 rounded-lg bg-purple-50 shadow-lg relative z-[2]">
                      <div className="flex items-center gap-2 mb-2">
                        <Brain className="h-5 w-5 text-purple-600" />
                        <span className="font-bold text-sm text-purple-800">Generated Hypothesis</span>
                      </div>
                      {graphData?.hypothesis ? (
                        <div className="max-w-md">
                          <p className="text-xs text-purple-700 line-clamp-3">
                            {graphData.hypothesis}
                          </p>                          {graphData.confidence && (
                            <div className="mt-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-purple-600">Confidence:</span>
                                <div className="flex-1 bg-purple-200 rounded-full h-2 relative overflow-hidden">
                                  <div 
                                    className={cn(
                                      "bg-purple-500 h-2 rounded-full transition-all duration-500",
                                      graphData.confidence > 0.8 ? "w-full" :
                                      graphData.confidence > 0.6 ? "w-4/5" :
                                      graphData.confidence > 0.4 ? "w-3/5" :
                                      graphData.confidence > 0.2 ? "w-2/5" : "w-1/5"
                                    )}
                                  ></div>
                                </div>
                                <span className="text-xs text-purple-600">
                                  {Math.round((graphData?.confidence || 0) * 100)}%
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="max-w-md">
                          {refreshing ? (
                            <p className="text-xs text-purple-700">Generating hypothesis...</p>
                          ) : (
                            <p className="text-xs text-purple-700">Cross-temporal connection identified</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Relationship Labels */}
                  <div className="absolute top-1/3 left-1/3 transform -translate-x-1/2">
                    <div className="bg-white px-2 py-1 rounded text-xs text-gray-600 shadow-sm border">
                      Historical Evidence
                    </div>
                  </div>
                  <div className="absolute top-1/3 right-1/3 transform translate-x-1/2">
                    <div className="bg-white px-2 py-1 rounded text-xs text-gray-600 shadow-sm border">
                      Modern Validation
                    </div>
                  </div>

                  {/* Network Effect Nodes */}
                  <div className="absolute bottom-4 left-4">
                    <div className="p-2 border rounded bg-gray-50 shadow-sm">
                      <p className="text-xs font-medium text-gray-700">Knowledge Network</p>
                      <p className="text-xs text-gray-600">2 Articles Connected</p>
                      <p className="text-xs text-gray-600">1 Hypothesis Generated</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground p-8">
                <Share2Icon className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium mb-2">Knowledge Graph Visualization</p>
                <p className="text-sm mb-4">
                  Select both a historical observation and a modern study to see their relationship
                </p>
                <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>Historical</span>
                  </div>
                  <span>+</span>
                  <div className="flex items-center gap-1">
                    <Microscope className="h-4 w-4" />
                    <span>Modern</span>
                  </div>
                  <span>=</span>
                  <div className="flex items-center gap-1">
                    <Brain className="h-4 w-4" />
                    <span>Hypothesis</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
