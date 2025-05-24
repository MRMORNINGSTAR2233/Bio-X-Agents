'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import UnifiedSearch from '@/components/UnifiedSearch';
import OCRUpload from '@/components/OCRUpload';
import HypothesisPanel from '@/components/HypothesisPanel';
import GraphView from '@/components/GraphView';
import { Article } from '@/lib/api';
import api from '@/lib/api';
import { BrainCircuit, Wifi, WifiOff, Clock, Microscope } from 'lucide-react';
import { toast } from "sonner";

export default function Home() {
  const [histId, setHistId] = useState<string>();
  const [modernId, setModernId] = useState<string>();
  const [selectedModernArticle, setSelectedModernArticle] = useState<Article | null>(null);
  const [selectedHistoricalArticle, setSelectedHistoricalArticle] = useState<Article | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [backendConnected, setBackendConnected] = useState<boolean | null>(null);
  
  // Check backend connection on load
  useEffect(() => {
    const checkBackendConnection = async () => {
      try {
        const health = await api.healthCheck();
        if (health && health.status === 'healthy') {
          setBackendConnected(true);
        } else {
          setBackendConnected(false);
          if (health && health.missing_env_vars.length > 0) {
            console.warn('Backend missing environment variables:', health.missing_env_vars);
            toast.error(`Backend missing environment variables: ${health.missing_env_vars.join(', ')}`);
          }
        }
      } catch (error) {
        console.error('Backend connection error:', error);
        setBackendConnected(false);
      }
    };
    
    checkBackendConnection();
  }, []);

  // Retry connection
  const retryConnection = async () => {
    setBackendConnected(null); // Set to loading state
    toast.info("Checking backend connection...");
    
    try {
      const health = await api.healthCheck();
      if (health && health.status === 'healthy') {
        setBackendConnected(true);
        toast.success("Backend connected successfully");
      } else {
        setBackendConnected(false);
        if (health && health.missing_env_vars.length > 0) {
          toast.error(`Backend missing environment variables: ${health.missing_env_vars.join(', ')}`);
        } else {
          toast.error("Backend services are unhealthy");
        }
      }
    } catch (error) {
      console.error('Backend connection error:', error);
      setBackendConnected(false);
      toast.error("Backend connection failed");
    }
  };

  const handleModernArticleSelect = (article: Article, nodeId: string) => {
    setSelectedModernArticle(article);
    setModernId(nodeId);
  };

  const handleHistoricalArticleSelect = (article: Article, nodeId: string) => {
    setSelectedHistoricalArticle(article);
    setHistId(nodeId);
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

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Column - Unified Search */}
          <div className="xl:col-span-2 space-y-6">
            <UnifiedSearch 
              onHistoricalSelect={handleHistoricalArticleSelect}
              onModernSelect={handleModernArticleSelect}
            />
            
            {/* OCR Upload - Move it below the search for better flow */}
            <OCRUpload onTextExtracted={handleTextExtracted} />
          </div>

          {/* Right Column - Status and Controls */}
          <div className="space-y-6">
            {/* Selection Status */}
            <div className="space-y-4">
              {/* Selected Modern Study */}
              {selectedModernArticle && (
                <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Microscope className="h-4 w-4 text-blue-600" />
                    <h3 className="font-medium text-blue-800">Selected Modern Study</h3>
                  </div>
                  <p className="text-sm mt-1">
                    <span className="font-semibold">{selectedModernArticle.title}</span>
                    <br />
                    <span className="text-blue-700">
                      {selectedModernArticle.authors?.slice(0, 3).join(', ')}
                      {selectedModernArticle.authors?.length > 3 && ' et al.'}
                    </span>
                    <br />
                    <span className="text-xs text-blue-600">
                      {selectedModernArticle.journal} • {selectedModernArticle.publication_date}
                    </span>
                  </p>
                  {modernId && (
                    <p className="text-xs font-mono mt-2 text-blue-600">ID: {modernId}</p>
                  )}
                </div>
              )}

              {/* Selected Historical Study */}
              {selectedHistoricalArticle && (
                <div className="p-4 border rounded-lg bg-amber-50 border-amber-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-amber-600" />
                    <h3 className="font-medium text-amber-800">Selected Historical Study</h3>
                  </div>
                  <p className="text-sm mt-1">
                    <span className="font-semibold">{selectedHistoricalArticle.title}</span>
                    <br />
                    <span className="text-amber-700">
                      {selectedHistoricalArticle.authors?.slice(0, 3).join(', ')}
                      {selectedHistoricalArticle.authors?.length > 3 && ' et al.'}
                    </span>
                    <br />
                    <span className="text-xs text-amber-600">
                      {selectedHistoricalArticle.journal} • {selectedHistoricalArticle.publication_date}
                    </span>
                  </p>
                  {histId && (
                    <p className="text-xs font-mono mt-2 text-amber-600">ID: {histId}</p>
                  )}
                </div>
              )}

              {/* Historical Text Info */}
              {extractedText && (
                <div className="p-4 border rounded-lg bg-muted/30">
                  <h3 className="font-medium">Historical Observation (OCR):</h3>
                  <p className="text-sm mt-1 line-clamp-3">{extractedText}</p>
                  {histId && (
                    <p className="text-xs font-mono mt-2">ID: {histId}</p>
                  )}
                </div>
              )}
            </div>

            <HypothesisPanel histId={histId} modernId={modernId} />
            
            {/* Graph Visualization */}
            <GraphView 
              histId={histId} 
              modernId={modernId}
              selectedHistoricalArticle={selectedHistoricalArticle}
              selectedModernArticle={selectedModernArticle}
            />
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
