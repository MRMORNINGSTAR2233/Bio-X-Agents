import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LightbulbIcon, FlaskConical } from "lucide-react";
import api, { HypothesisResponse } from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

interface HypothesisPanelProps {
  histId?: string;
  modernId?: string;
}

export default function HypothesisPanel({ histId, modernId }: HypothesisPanelProps) {
  const [loading, setLoading] = useState(false);
  const [hypothesis, setHypothesis] = useState<HypothesisResponse | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const generateHypothesis = async () => {
    if (!histId || !modernId) {
      toast.error("Please select both a historical observation and a modern study");
      return;
    }

    setLoading(true);
    try {
      const response = await api.generateHypothesis(histId, modernId);
      if (response) {
        setHypothesis(response);
        setDialogOpen(true);
        toast.success("Hypothesis generated successfully");
      }
    } catch (error) {
      console.error('Error generating hypothesis:', error);
      toast.error("Failed to generate hypothesis");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="w-full">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LightbulbIcon className="h-5 w-5" />
            Hypothesis Generator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Generate a scientific hypothesis by connecting historical observations with modern studies.
          </p>
          
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 border rounded-md">
                <p className="text-xs text-muted-foreground">Historical Observation ID</p>
                <p className="font-mono text-sm truncate">{histId || "Not selected"}</p>
              </div>
              <div className="p-2 border rounded-md">
                <p className="text-xs text-muted-foreground">Modern Study ID</p>
                <p className="font-mono text-sm truncate">{modernId || "Not selected"}</p>
              </div>
            </div>
            
            <Button 
              className="w-full"
              disabled={!histId || !modernId || loading}
              onClick={generateHypothesis}
            >
              {loading ? 'Generating...' : 'Generate Hypothesis'}
              <FlaskConical className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LightbulbIcon className="h-5 w-5" />
              Generated Hypothesis
            </DialogTitle>
          </DialogHeader>
          
          {hypothesis && (
            <div className="space-y-4">
              <Card className="bg-primary/5">
                <CardContent className="p-4">
                  <p className="text-lg font-medium">{hypothesis.hypothesis}</p>
                </CardContent>
              </Card>
              
              <div className="text-sm">
                <p className="font-semibold">Evidence Sources:</p>
                <ul className="list-disc list-inside mt-1">
                  {hypothesis.evidence.map((id, index) => (
                    <li key={index} className="font-mono">{id}</li>
                  ))}
                </ul>
              </div>
              
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
