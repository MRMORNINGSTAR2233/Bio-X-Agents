'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import SpineSearch from '@/components/SpineSearch';
import OCRUpload from '@/components/OCRUpload';
import HypothesisPanel from '@/components/HypothesisPanel';
import GraphView from '@/components/GraphView';
import { Article } from '@/lib/api';
import { BrainCircuit, Wifi, WifiOff } from 'lucide-react';
import { toast } from "sonner";

export default function Home() {
  const [histId, setHistId] = useState<string>();
  const [modernId, setModernId] = useState<string>();
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [backendConnected, setBackendConnected] = useState<boolean | null>(null);
  
  // Check backend connection on load
  useEffect(() => {
    const checkBackendConnection = async () => {
      try {
        const response = await fetch(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000');
        if (response.ok) {
          setBackendConnected(true);
        } else {
          setBackendConnected(false);
        }
      } catch (error) {
        console.error('Backend connection error:', error);
        setBackendConnected(false);
      }
    };
    
    checkBackendConnection();
  }, []);

  // Retry connection
  const retryConnection = () => {
    setBackendConnected(null); // Set to loading state
    toast.info("Checking backend connection...");
    
    fetch(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')
      .then(response => {
        if (response.ok) {
          setBackendConnected(true);
          toast.success("Backend connected successfully");
        } else {
          setBackendConnected(false);
          toast.error("Backend connection failed");
        }
      })
      .catch(error => {
        console.error('Backend connection error:', error);
        setBackendConnected(false);
        toast.error("Backend connection failed");
      });
  };

  const handleArticleSelect = (article: Article, nodeId: string) => {
    setSelectedArticle(article);
    setModernId(nodeId);
  };

  const handleTextExtracted = (text: string, nodeId: string) => {
    setExtractedText(text);
    setHistId(nodeId);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto py-4 px-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BrainCircuit className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold">Chronos</h1>
            </div>
            
            {/* Backend Connection Status */}
            <div className="flex items-center gap-2">
              {backendConnected === null ? (
                <span className="text-sm text-muted-foreground">Checking connection...</span>
              ) : backendConnected ? (
                <div className="flex items-center gap-1 text-sm text-green-600">
                  <Wifi className="h-4 w-4" />
                  <span>Backend connected</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-sm text-destructive">
                    <WifiOff className="h-4 w-4" />
                    <span>Backend disconnected</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={retryConnection}>
                    Retry
                  </Button>
                </div>
              )}
            </div>
          </div>
          <p className="text-muted-foreground mt-1">
            Connecting historical observations with modern studies
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto py-8 px-4 sm:px-6">
        {backendConnected === false && (
          <div className="mb-6 p-4 border border-destructive rounded-lg bg-destructive/10">
            <h2 className="text-lg font-semibold text-destructive mb-2">Backend Connection Failed</h2>
            <p className="text-sm text-destructive mb-3">
              Cannot connect to the Chronos backend. Please ensure the backend server is running at{" "}
              <code className="bg-destructive/20 px-1 py-0.5 rounded font-mono">
                {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}
              </code>
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={retryConnection}>
                Retry Connection
              </Button>
              <Button variant="outline" onClick={() => window.open('/api-docs', '_blank')}>
                Check API Docs
              </Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="md:col-span-2 space-y-6">
            <SpineSearch onArticleSelect={handleArticleSelect} />

            {/* Selected Article Info */}
            {selectedArticle && (
              <div className="p-4 border rounded-lg bg-muted/30">
                <h3 className="font-medium">Selected Modern Study:</h3>
                <p className="text-sm mt-1">
                  <span className="font-semibold">{selectedArticle.title}</span>
                  <br />
                  <span className="text-muted-foreground">
                    {selectedArticle.authors?.join(', ')}
                  </span>
                </p>
                {modernId && (
                  <p className="text-xs font-mono mt-2">ID: {modernId}</p>
                )}
              </div>
            )}

            {/* Historical Text Info */}
            {extractedText && (
              <div className="p-4 border rounded-lg bg-muted/30">
                <h3 className="font-medium">Historical Observation:</h3>
                <p className="text-sm mt-1 line-clamp-3">{extractedText}</p>
                {histId && (
                  <p className="text-xs font-mono mt-2">ID: {histId}</p>
                )}
              </div>
            )}

            {/* Graph Visualization (Optional) */}
            <GraphView />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <HypothesisPanel histId={histId} modernId={modernId} />
            <OCRUpload onTextExtracted={handleTextExtracted} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-12">
        <div className="container mx-auto py-6 px-4 sm:px-6 text-center text-sm text-muted-foreground">
          <p>Chronos Prototype &copy; {new Date().getFullYear()}</p>
          <p className="mt-1">Connecting historical observations with modern studies to generate scientific hypotheses</p>
        </div>
      </footer>
    </div>
  );
}
