import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SearchIcon, CheckCircle, AlertTriangle, Clock, Microscope, Loader2, Brain, ArrowRight } from "lucide-react";
import api, { Article, SearchResult } from "@/lib/api";
import { toast } from "sonner";

interface UnifiedSearchProps {
  onHistoricalSelect: (article: Article, nodeId: string) => void;
  onModernSelect: (article: Article, nodeId: string) => void;
}

export default function UnifiedSearch({ onHistoricalSelect, onModernSelect }: UnifiedSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [historicalResults, setHistoricalResults] = useState<SearchResult | null>(null);
  const [modernResults, setModernResults] = useState<SearchResult | null>(null);
  const [selectedHistorical, setSelectedHistorical] = useState<Article | null>(null);
  const [selectedModern, setSelectedModern] = useState<Article | null>(null);
  const [historicalNodeId, setHistoricalNodeId] = useState<string | null>(null);
  const [modernNodeId, setModernNodeId] = useState<string | null>(null);
  const [ingestingArticle, setIngestingArticle] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState(false);

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      toast.error("Please enter a search query");
      return;
    }

    setLoading(true);
    setConnectionError(false);
    setHistoricalResults(null);
    setModernResults(null);
    
    try {
      // Search both historical and modern articles in parallel
      const [historicalData, modernData] = await Promise.all([
        api.searchHistoricalArticles(query, 1, 10, 2000),
        api.searchSpineArticles(query, 1, 10)
      ]);

      if (historicalData && modernData) {
        setHistoricalResults(historicalData);
        setModernResults(modernData);
        
        const totalResults = historicalData.results.length + modernData.results.length;
        if (totalResults === 0) {
          toast.info(`No articles found for "${query}". Try different keywords.`);
        } else {
          toast.success(`Found ${totalResults} articles: ${historicalData.results.length} historical, ${modernData.results.length} modern`);
        }
      } else {
        setConnectionError(true);
        toast.error("Could not connect to the backend. Please ensure the server is running.");
      }
    } catch (error) {
      console.error('Search error:', error);
      setConnectionError(true);
      toast.error("Failed to search articles. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectHistorical = async (article: Article) => {
    setSelectedHistorical(article);
    setIngestingArticle(article.pmid);
    
    try {
      const response = await api.ingestHistorical(
        `Historical Study: ${article.title}\n\nAuthors: ${article.authors?.join(', ')}\n\nAbstract: ${article.abstract || 'No abstract available'}\n\nPublished in ${article.journal} (${article.publication_date})`,
        `pmid:${article.pmid}`
      );
      if (response?.id) {
        setHistoricalNodeId(response.id);
        // Store article data for the hypothesis page
        sessionStorage.setItem('selectedHistoricalArticle', JSON.stringify(article));
        toast.success("Historical article selected and ingested");
        onHistoricalSelect(article, response.id);
      } else {
        toast.error("Failed to ingest historical article");
      }
    } catch (error) {
      console.error('Error ingesting historical article:', error);
      toast.error("Failed to ingest historical article");
    } finally {
      setIngestingArticle(null);
    }
  };

  const handleSelectModern = async (article: Article) => {
    setSelectedModern(article);
    setIngestingArticle(article.pmid);
    
    try {
      const response = await api.ingestModern(article);
      if (response?.id) {
        setModernNodeId(response.id);
        // Store article data for the hypothesis page
        sessionStorage.setItem('selectedModernArticle', JSON.stringify(article));
        toast.success("Modern article selected and ingested");
        onModernSelect(article, response.id);
      } else {
        toast.error("Failed to ingest modern article");
      }
    } catch (error) {
      console.error('Error ingesting modern article:', error);
      toast.error("Failed to ingest modern article");
    } finally {
      setIngestingArticle(null);
    }
  };

  const navigateToHypothesis = () => {
    if (historicalNodeId && modernNodeId) {
      router.push(`/hypothesis?histId=${historicalNodeId}&modernId=${modernNodeId}`);
    }
  };

  const ArticleCard = ({ article, isHistorical, isSelected, onSelect }: {
    article: Article;
    isHistorical: boolean;
    isSelected: boolean;
    onSelect: () => void;
  }) => (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'border-primary bg-primary/5 shadow-md' : 'hover:bg-muted/50'
      } ${isHistorical ? 'border-amber-200' : 'border-blue-200'}`}
      onClick={() => ingestingArticle ? null : onSelect()}
    >
      <CardContent className="p-4">
        <div className="space-y-2">
          <h4 className="font-medium line-clamp-2 text-sm leading-tight">{article.title}</h4>
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-mono">PMID: {article.pmid}</span>
            {article.publication_date && article.publication_date !== 'Unknown date' && (
              <span className="px-2 py-1 bg-muted rounded text-xs">
                {article.publication_date}
              </span>
            )}
          </div>
          
          <p className="text-xs text-muted-foreground">
            <strong>Authors:</strong> {article.authors?.length > 0 ? article.authors.slice(0, 2).join(', ') : 'Unknown'}
            {article.authors?.length > 2 && ' et al.'}
          </p>
          
          {article.journal && (
            <p className="text-xs text-muted-foreground">
              <strong>Journal:</strong> {article.journal}
            </p>
          )}
          
          {article.abstract && article.abstract !== 'No abstract available' && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-2">
              {article.abstract}
            </p>
          )}
          
          <div className="flex justify-end pt-2">
            <Button 
              variant={isSelected ? "default" : "outline"}
              size="sm"
              disabled={ingestingArticle === article.pmid}
              className="text-xs h-7"
              onClick={(e) => {
                e.stopPropagation();
                if (!ingestingArticle) onSelect();
              }}
            >
              {ingestingArticle === article.pmid ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  Processing...
                </>
              ) : isSelected ? (
                <>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Selected
                </>
              ) : (
                'Select'
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="w-full space-y-6">
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex w-full gap-2">
        <Input
          placeholder="Search medical literature (e.g., tuberculosis, diabetes, cancer treatment)..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1"
          aria-label="Medical literature search"
        />
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Searching...
            </>
          ) : (
            <>
              Search
              <SearchIcon className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </form>

      {connectionError && (
        <div className="p-4 border border-destructive rounded-lg bg-destructive/10 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <p className="text-sm text-destructive">
            Could not connect to the backend. Please ensure the server is running.
          </p>
        </div>
      )}

      {/* Generate Hypothesis Button */}
      {selectedHistorical && selectedModern && historicalNodeId && modernNodeId && (
        <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200 border-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Brain className="h-8 w-8 text-purple-600" />
                <div>
                  <h3 className="text-lg font-semibold text-purple-800">Ready to Generate Hypothesis</h3>
                  <p className="text-sm text-purple-600">
                    Both historical and modern articles are selected. Generate cross-temporal research hypothesis.
                  </p>
                </div>
              </div>
              <Button 
                onClick={navigateToHypothesis}
                className="bg-purple-600 hover:bg-purple-700 text-white"
                size="lg"
              >
                <Brain className="h-5 w-5 mr-2" />
                Generate Hypothesis
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results in Two Columns */}
      {(historicalResults || modernResults) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Historical Articles Column */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5 text-amber-600" />
                Historical Articles
                <span className="text-sm font-normal text-muted-foreground">
                  (Pre-2000)
                </span>
                {historicalResults && (
                  <span className="ml-auto text-sm font-normal text-muted-foreground">
                    {historicalResults.results.length} found
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {historicalResults?.results.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No historical articles found</p>
                  <p className="text-xs">Try broader medical terms</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {historicalResults?.results.map((article) => (
                    <ArticleCard
                      key={article.pmid}
                      article={article}
                      isHistorical={true}
                      isSelected={selectedHistorical?.pmid === article.pmid}
                      onSelect={() => handleSelectHistorical(article)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Modern Articles Column */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Microscope className="h-5 w-5 text-blue-600" />
                Modern Articles
                <span className="text-sm font-normal text-muted-foreground">
                  (Recent Studies)
                </span>
                {modernResults && (
                  <span className="ml-auto text-sm font-normal text-muted-foreground">
                    {modernResults.results.length} found
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {modernResults?.results.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Microscope className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No modern articles found</p>
                  <p className="text-xs">Try different keywords</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {modernResults?.results.map((article) => (
                    <ArticleCard
                      key={article.pmid}
                      article={article}
                      isHistorical={false}
                      isSelected={selectedModern?.pmid === article.pmid}
                      onSelect={() => handleSelectModern(article)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
