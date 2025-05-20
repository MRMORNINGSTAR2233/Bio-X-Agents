import { useState, FormEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { SearchIcon } from "lucide-react";
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

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      toast.error("Please enter a search query");
      return;
    }

    setLoading(true);
    try {
      const searchResults = await api.searchSpineArticles(query);
      setResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectArticle = async (article: Article) => {
    setSelectedArticle(article);
    try {
      const response = await api.ingestModern(article);
      if (response?.id) {
        toast.success("Article ingested to graph successfully");
        onArticleSelect(article, response.id);
      }
    } catch (error) {
      console.error('Error ingesting article:', error);
      toast.error("Failed to ingest article to graph");
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
        />
        <Button type="submit" disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
          {!loading && <SearchIcon className="ml-2 h-4 w-4" />}
        </Button>
      </form>

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
                  onClick={() => handleSelectArticle(article)}
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
                          handleSelectArticle(article);
                        }}
                        size="sm"
                      >
                        Select
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
