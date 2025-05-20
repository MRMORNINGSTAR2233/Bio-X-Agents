'use client';

import { useState } from 'react';
import SpineSearch from '@/components/SpineSearch';
import OCRUpload from '@/components/OCRUpload';
import HypothesisPanel from '@/components/HypothesisPanel';
import GraphView from '@/components/GraphView';
import { Article } from '@/lib/api';
import { BrainCircuit } from 'lucide-react';

export default function Home() {
  const [histId, setHistId] = useState<string>();
  const [modernId, setModernId] = useState<string>();
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');

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
          <div className="flex items-center gap-2">
            <BrainCircuit className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">Chronos</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Connecting historical observations with modern studies
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto py-8 px-4 sm:px-6">
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
