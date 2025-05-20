import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Share2Icon, ZoomIn, ZoomOut, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface GraphViewProps {
  histId?: string;
  modernId?: string;
}

export default function GraphView({ histId, modernId }: GraphViewProps) {
  const [zoom, setZoom] = useState(100);
  const [refreshing, setRefreshing] = useState(false);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 10, 150));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 10, 50));
  };

  const handleRefresh = () => {
    setRefreshing(true);
    // Simulate a refresh operation
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
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
        <div className="h-[300px] border rounded-lg bg-muted/20 overflow-hidden">
          <div 
            className={cn(
              "flex items-center justify-center w-full h-full transition-transform duration-200 origin-center",
              getZoomClass(zoom)
            )}
          >
            {histId && modernId ? (
              <div className="text-center">
                <div className="flex flex-col items-center gap-6 relative">
                  <div className="p-3 border rounded-lg bg-background shadow-sm">
                    <p className="font-medium">Historical Observation</p>
                    <p className="text-xs font-mono">{histId}</p>
                  </div>
                  
                  {/* Connection line */}
                  <div className="w-1 h-12 bg-primary"></div>
                  
                  <div className="p-3 border rounded-lg bg-background shadow-sm">
                    <p className="font-medium">Modern Study</p>
                    <p className="text-xs font-mono">{modernId}</p>
                  </div>
                  
                  {/* Hypothesis node */}
                  <div className="absolute left-full ml-6 top-1/2 -translate-y-1/2">
                    <div className="p-3 border border-dashed rounded-lg bg-primary/10">
                      <p className="font-medium text-sm">Hypothesis</p>
                      <p className="text-xs">Connection formed</p>
                    </div>
                    <div className="absolute top-1/2 right-full w-6 h-1 bg-primary -translate-y-1/2"></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                <p>No connected nodes to visualize</p>
                <p className="text-sm mt-2">Select both a historical observation and a modern study to see their relationship</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
