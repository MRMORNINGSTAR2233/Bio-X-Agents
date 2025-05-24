import { useState, FormEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { SearchIcon, CheckCircle, AlertTriangle, Clock } from "lucide-react";
import api, { Article, SearchResult } from "@/lib/api";
import { toast } from "sonner";

interface HistoricalSearchProps {
  onArticleSelect: (article: Article, nodeId: string) => void;
}

export default function HistoricalSearch({ onArticleSelect }: HistoricalSearchProps) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [ingestingArticle, setIngestingArticle] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState(false);
  const [maxYear, setMaxYear] = useState(2000);

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      toast.error("Please enter a search query");
      return;
    }

    setLoading(true);
    setConnectionError(false);
    setResults(null); // Clear previous results
    
    try {
      const searchResults = await api.searchHistoricalArticles(query, 1, 10, maxYear);
      if (searchResults) {
        setResults(searchResults);
        if (searchResults.results.length === 0) {
          toast.info(`No historical articles found for "${query}". Try different keywords or adjust the year filter.`);
        } else {
          toast.success(`Found ${searchResults.results.length} historical articles for "${query}"`);
        }
      } else {
        setConnectionError(true);
        toast.error("Could not connect to the backend. Please ensure the server is running.");
      }
    } catch (error) {
      console.error('Historical search error:', error);
      setConnectionError(true);
      toast.error("Failed to search historical articles. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectArticle = async (article: Article) => {
    setSelectedArticle(article);
    setIngestingArticle(article.pmid);
    
    try {
      // Ingest as historical observation
      const response = await api.ingestHistorical(
        `Historical Study: ${article.title}\n\nAuthors: ${article.authors?.join(', ')}\n\nAbstract: ${article.abstract || 'No abstract available'}\n\nPublished in ${article.journal} (${article.publication_date})`,
        `pmid:${article.pmid}`
      );
      if (response?.id) {
        toast.success("Historical article ingested to graph successfully");
        onArticleSelect(article, response.id);
      } else {
        toast.error("Failed to ingest historical article");
      }
    } catch (error) {
      console.error('Error ingesting historical article:', error);
      toast.error("Failed to ingest historical article to graph");
    } finally {
      setIngestingArticle(null);
    }
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Historical Articles</h2>
        <span className="text-sm text-muted-foreground">(Pre-{maxYear})</span>
      </div>
      
      <form onSubmit={handleSearch} className="space-y-3">
        <div className="flex w-full gap-2">
          <Input
            placeholder="Search historical medical literature..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1"
            aria-label="Historical search query"
          />
          <Input
            type="number"
            placeholder="Max year"
            value={maxYear}
            onChange={(e) => setMaxYear(parseInt(e.target.value) || 2000)}
            className="w-24"
            min="1800"
            max="2010"
          />
          <Button type="submit" disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
            {!loading && <SearchIcon className="ml-2 h-4 w-4" />}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Search for articles published before {maxYear}. Common historical medical terms work best.
        </p>
      </form>

      {connectionError && (
        <div className="p-4 border border-destructive rounded-lg bg-destructive/10 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <p className="text-sm text-destructive">
            Could not connect to the backend. Please ensure the server is running.
          </p>
        </div>
      )}

      {results && (
        <div className="space-y-4">
          <h3 className="text-md font-medium">
            Historical Search Results{results.results.length > 0 && `: ${results.results.length} found`}
          </h3>
          
          {results.results.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No historical articles found for this query.</p>
              <p className="text-sm">Try broader medical terms or adjust the year filter.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {results.results.map((article) => (
                <Card 
                  key={article.pmid}
                  className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                    selectedArticle?.pmid === article.pmid ? 'border-primary bg-primary/5' : ''
                  }`}
                  onClick={() => ingestingArticle ? null : handleSelectArticle(article)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium line-clamp-2 mb-2">{article.title}</h4>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <p>
                            <strong>PMID:</strong> {article.pmid}
                            {article.publication_date && article.publication_date !== 'Unknown date' && (
                              <span className="ml-3">
                                <strong>Year:</strong> {article.publication_date}
                              </span>
                            )}
                          </p>
                          <p>
                            <strong>Authors:</strong> {article.authors?.length > 0 ? article.authors.slice(0, 2).join(', ') : 'Unknown authors'}
                            {article.authors?.length > 2 && ' et al.'}
                          </p>
                          {article.journal && (
                            <p><strong>Journal:</strong> {article.journal}</p>
                          )}
                        </div>
                        {article.abstract && article.abstract !== 'No abstract available' && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            {article.abstract}
                          </p>
                        )}
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <Button 
                          variant={selectedArticle?.pmid === article.pmid ? "default" : "outline"}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!ingestingArticle) handleSelectArticle(article);
                          }}
                          size="sm"
                          disabled={ingestingArticle === article.pmid}
                          className="flex items-center gap-1"
                        >
                          {ingestingArticle === article.pmid ? (
                            <>Processing... <span className="ml-1 animate-spin">⏳</span></>
                          ) : selectedArticle?.pmid === article.pmid ? (
                            <>Selected <CheckCircle className="ml-1 h-3 w-3" /></>
                          ) : (
                            'Select'
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
