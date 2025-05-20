import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Share2Icon } from "lucide-react";

export default function GraphView() {
  return (
    <Card className="w-full h-[300px]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2Icon className="h-5 w-5" />
          Knowledge Graph Visualization
        </CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-center h-full">
        <div className="text-center text-muted-foreground">
          <p>Graph visualization placeholder</p>
          <p className="text-sm mt-2">Future implementation will display connections between historical observations and modern studies</p>
        </div>
      </CardContent>
    </Card>
  );
}
