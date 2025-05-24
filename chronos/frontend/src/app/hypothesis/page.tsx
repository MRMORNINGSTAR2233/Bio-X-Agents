'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Brain, Clock, Microscope, Network, Share2, BookOpen, Calendar, Users, Building2, Tag, ExternalLink } from "lucide-react";
import api, { Article, HypothesisResponse } from "@/lib/api";
import { toast } from "sonner";
import EnhancedKnowledgeGraph from '@/components/EnhancedKnowledgeGraph';

function HypothesisContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const histId = searchParams.get('histId');
  const modernId = searchParams.get('modernId');
  
  const [historicalArticle, setHistoricalArticle] = useState<Article | null>(null);
  const [modernArticle, setModernArticle] = useState<Article | null>(null);
  const [hypothesis, setHypothesis] = useState<HypothesisResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingHypothesis, setGeneratingHypothesis] = useState(false);
  
  useEffect(() => {
    const generateHypothesis = async () => {
      if (!histId || !modernId) return;
      
      try {
        setGeneratingHypothesis(true);
        const response = await api.generateHypothesis(histId, modernId);
        if (response) {
          setHypothesis(response);
          toast.success("Hypothesis generated successfully!");
        } else {
          toast.error("Failed to generate hypothesis");
        }
      } catch (error) {
        console.error('Error generating hypothesis:', error);
        toast.error("Failed to generate hypothesis");
      } finally {
        setGeneratingHypothesis(false);
      }
    };

    const loadData = async () => {
      try {
        setLoading(true);
        
        // In a real implementation, you'd fetch the actual article data using the node IDs
        // For now, we'll use the stored data from sessionStorage if available
        const storedHistorical = sessionStorage.getItem('selectedHistoricalArticle');
        const storedModern = sessionStorage.getItem('selectedModernArticle');
        
        if (storedHistorical) {
          setHistoricalArticle(JSON.parse(storedHistorical));
        }
        if (storedModern) {
          setModernArticle(JSON.parse(storedModern));
        }
        
        // Generate hypothesis
        if (histId && modernId) {
          await generateHypothesis();
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error("Failed to load article data");
      } finally {
        setLoading(false);
      }
    };

    if (!histId || !modernId) {
      toast.error("Missing article IDs. Please go back and select articles.");
      router.push('/');
      return;
    }
    
    loadData();
  }, [histId, modernId, router]);

  const regenerateHypothesis = async () => {
    if (!histId || !modernId) return;
    
    try {
      setGeneratingHypothesis(true);
      const response = await api.generateHypothesis(histId, modernId);
      if (response) {
        setHypothesis(response);
        toast.success("Hypothesis regenerated successfully!");
      } else {
        toast.error("Failed to generate hypothesis");
      }
    } catch (error) {
      console.error('Error generating hypothesis:', error);
      toast.error("Failed to generate hypothesis");
    } finally {
      setGeneratingHypothesis(false);
    }
  };
  
  const shareHypothesis = () => {
    if (hypothesis) {
      navigator.clipboard.writeText(hypothesis.hypothesis);
      toast.success("Hypothesis copied to clipboard!");
    }
  };
  
  const ArticleDetailsCard = ({ article, type, icon: Icon, theme }: {
    article: Article;
    type: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    theme: string;
  }) => (
    <Card className={`${theme} border-2`}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-6 w-6" />
          {type} Study
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold text-lg leading-tight mb-2">{article.title}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 opacity-70" />
              <span className="font-medium">Authors:</span>
            </div>
            <div className="text-muted-foreground">
              {article.authors?.slice(0, 3).join(', ')}
              {article.authors && article.authors.length > 3 && ' et al.'}
            </div>
            
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 opacity-70" />
              <span className="font-medium">Journal:</span>
            </div>
            <div className="text-muted-foreground">{article.journal || 'Unknown'}</div>
            
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 opacity-70" />
              <span className="font-medium">Published:</span>
            </div>
            <div className="text-muted-foreground">{article.publication_date || 'Unknown'}</div>
            
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 opacity-70" />
              <span className="font-medium">PMID:</span>
            </div>
            <div className="font-mono text-muted-foreground">{article.pmid}</div>
          </div>
        </div>
        
        {article.abstract && (
          <div>
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Abstract
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {article.abstract}
            </p>
          </div>
        )}
        
        {article.keywords && article.keywords.length > 0 && (
          <div>
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Keywords
            </h4>
            <div className="flex flex-wrap gap-1">
              {article.keywords.map((keyword, index) => (
                <span 
                  key={index}
                  className="px-2 py-1 bg-muted rounded-full text-xs text-muted-foreground"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {article.doi && (
          <div className="pt-2 border-t">
            <a 
              href={`https://doi.org/${article.doi}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              View Full Article (DOI: {article.doi})
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8 px-4">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading hypothesis data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto py-4 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={() => router.push('/')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Search
              </Button>
              <div className="flex items-center gap-2">
                <Brain className="h-6 w-6 text-primary" />
                <h1 className="text-xl font-bold">Cross-Temporal Research Hypothesis</h1>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={shareHypothesis} disabled={!hypothesis}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button size="sm" onClick={regenerateHypothesis} disabled={generatingHypothesis}>
                {generatingHypothesis ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    Regenerate
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto py-8 px-4">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left Column - Article Details */}
          <div className="xl:col-span-2 space-y-6">
            {/* Articles Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {historicalArticle && (
                <ArticleDetailsCard
                  article={historicalArticle}
                  type="Historical"
                  icon={Clock}
                  theme="bg-amber-50 border-amber-200"
                />
              )}
              
              {modernArticle && (
                <ArticleDetailsCard
                  article={modernArticle}
                  type="Modern"
                  icon={Microscope}
                  theme="bg-blue-50 border-blue-200"
                />
              )}
            </div>
            
            {/* Knowledge Graph */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Network className="h-5 w-5" />
                  Knowledge Graph Visualization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <EnhancedKnowledgeGraph 
                  historicalArticle={historicalArticle}
                  modernArticle={modernArticle}
                  hypothesis={hypothesis}
                />
              </CardContent>
            </Card>
          </div>
          
          {/* Right Column - Hypothesis */}
          <div className="space-y-6">
            <Card className="bg-purple-50 border-purple-200 border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-800">
                  <Brain className="h-6 w-6" />
                  Generated Hypothesis
                </CardTitle>
              </CardHeader>
              <CardContent>
                {generatingHypothesis ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-purple-700">Analyzing cross-temporal connections...</p>
                  </div>
                ) : hypothesis ? (
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-lg border border-purple-100">
                      <h4 className="font-semibold text-purple-900 mb-3">Hypothesis Statement</h4>
                      <p className="text-gray-800 leading-relaxed text-base">
                        {hypothesis.hypothesis}
                      </p>
                    </div>
                    
                    {hypothesis.evidence && (
                      <div className="pt-4 border-t border-purple-200">
                        <h4 className="font-medium text-purple-800 mb-2">Evidence Sources</h4>
                        <div className="space-y-1">
                          {hypothesis.evidence.map((evidenceId, index) => (
                            <div key={index} className="text-xs font-mono text-purple-600 bg-purple-100 px-2 py-1 rounded">
                              {evidenceId}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Brain className="h-12 w-12 mx-auto mb-4 text-purple-400" />
                    <p className="text-purple-700 mb-4">No hypothesis generated yet</p>
                    <Button onClick={regenerateHypothesis} className="bg-purple-600 hover:bg-purple-700">
                      Generate Hypothesis
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Research Implications */}
            {hypothesis && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Research Implications</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Future Studies</h4>
                    <p className="text-sm text-muted-foreground">
                      This hypothesis suggests potential research directions connecting historical 
                      observations with modern findings.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Clinical Relevance</h4>
                    <p className="text-sm text-muted-foreground">
                      Cross-temporal analysis may reveal patterns that inform current medical practice.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Methodological Insights</h4>
                    <p className="text-sm text-muted-foreground">
                      Comparing historical and modern methodologies can highlight evolving research standards.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function HypothesisPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8 px-4">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading hypothesis page...</p>
            </div>
          </div>
        </div>
      </div>
    }>
      <HypothesisContent />
    </Suspense>
  );
}
