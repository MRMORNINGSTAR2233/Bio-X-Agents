import { useState, FormEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { SearchIcon, CheckCircle, AlertTriangle } from "lucide-react";
import api, { Article, SearchResult } from "@/lib/api";
import { toast } from "sonner";

interface SpineSearchProps {
  onArticleSelect: (article: Article, nodeId: string) => void;
}

export default function SpineSearch({ onArticleSelect }: SpineSearchProps) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
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
    
    try {
      const searchResults = await api.searchSpineArticles(query);
      if (searchResults) {
        setResults(searchResults);
      } else {
        setConnectionError(true);
        toast.error("Could not connect to the backend. Please ensure the server is running.");
      }
    } catch (error) {
      console.error('Search error:', error);
      setConnectionError(true);
      toast.error("Failed to connect to the backend. Please check the server.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectArticle = async (article: Article) => {
    setSelectedArticle(article);
    setIngestingArticle(article.pmid);
    
    try {
      const response = await api.ingestModern(article);
      if (response?.id) {
        toast.success("Article ingested to graph successfully");
        onArticleSelect(article, response.id);
      } else {
        toast.error("Failed to ingest article");
      }
    } catch (error) {
      console.error('Error ingesting article:', error);
      toast.error("Failed to ingest article to graph");
    } finally {
      setIngestingArticle(null);
    }
  };

  return (
    <div className="w-full space-y-4">
      <form onSubmit={handleSearch} className="flex w-full gap-2">
        <Input
          placeholder="Search medical publications..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1"
          aria-label="Search query"
        />
        <Button type="submit" disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
          {!loading && <SearchIcon className="ml-2 h-4 w-4" />}
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

      {results && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">
            Search Results{results.results.length > 0 && `: ${results.results.length} found`}
          </h2>
          
          {results.results.length === 0 ? (
            <p className="text-muted-foreground">No articles found for this query.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {results.results.map((article) => (
                <Card 
                  key={article.pmid}
                  className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                    selectedArticle?.pmid === article.pmid ? 'border-primary' : ''
                  }`}
                  onClick={() => ingestingArticle ? null : handleSelectArticle(article)}
                >
                  <CardContent className="p-4">
                    <h3 className="font-medium line-clamp-2">{article.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {article.authors?.join(', ')}
                    </p>
                    {article.journal && (
                      <p className="text-sm mt-1">
                        {article.journal} {article.publication_date && `• ${article.publication_date}`}
                      </p>
                    )}
                    {article.abstract && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
                        {article.abstract}
                      </p>
                    )}
                    <div className="mt-2 flex justify-end">
                      <Button 
                        variant="outline" 
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
