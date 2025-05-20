import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LightbulbIcon, FlaskConical, Share2 } from "lucide-react";
import api, { HypothesisResponse, DKGMetadata } from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

interface HypothesisPanelProps {
  histId?: string;
  modernId?: string;
}

export default function HypothesisPanel({ histId, modernId }: HypothesisPanelProps) {
  const [loading, setLoading] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);
  const [hypothesis, setHypothesis] = useState<HypothesisResponse | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);

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
        setPublishSuccess(false);
        toast.success("Hypothesis generated successfully");
      }
    } catch (error) {
      console.error('Error generating hypothesis:', error);
      toast.error("Failed to generate hypothesis");
    } finally {
      setLoading(false);
    }
  };

  const publishToDKG = async () => {
    if (!hypothesis) {
      toast.error("Please generate a hypothesis first");
      return;
    }

    setPublishLoading(true);
    try {
      // Create metadata for the DKG
      const metadata: DKGMetadata = {
        title: `Hypothesis connecting ${histId} and ${modernId}`,
        description: hypothesis.hypothesis,
        keywords: ["chronos", "hypothesis", "scientific-connection"],
        date: new Date().toISOString(),
        sources: hypothesis.evidence,
        type: "scientific-hypothesis"
      };

      const response = await api.writeDKGStub(hypothesis.evidence[0], metadata);
      
      if (response) {
        setPublishSuccess(true);
        toast.success("Hypothesis published to DKG successfully");
      }
    } catch (error) {
      console.error('Error publishing to DKG:', error);
      toast.error("Failed to publish to DKG");
    } finally {
      setPublishLoading(false);
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
              
              <div className="flex justify-between items-center">
                <Button
                  variant="outline"
                  onClick={() => publishToDKG()}
                  disabled={publishLoading || publishSuccess}
                  className="flex items-center gap-2"
                >
                  {publishLoading ? 'Publishing...' : publishSuccess ? 'Published to DKG' : 'Publish to DKG'}
                  <Share2 className="h-4 w-4" />
                </Button>
                
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
