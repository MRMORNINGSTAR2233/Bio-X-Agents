'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, RotateCcw, Network, Clock, Microscope, Brain, BookOpen, Users, Calendar, Tag } from "lucide-react";
import { Article, HypothesisResponse } from "@/lib/api";

interface GraphNode {
  id: string;
  label: string;
  type: 'historical' | 'modern' | 'concept' | 'connection';
  x: number;
  y: number;
  data: Article | HypothesisResponse | { concept: string; source: string };
  connections: string[];
}

interface GraphConnection {
  from: string;
  to: string;
  strength: number;
  type: 'temporal' | 'conceptual' | 'methodological' | 'hypothesis';
  label?: string;
}

interface EnhancedKnowledgeGraphProps {
  historicalArticle: Article | null;
  modernArticle: Article | null;
  hypothesis: HypothesisResponse | null;
}

export default function EnhancedKnowledgeGraph({ 
  historicalArticle, 
  modernArticle, 
  hypothesis 
}: EnhancedKnowledgeGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [connections, setConnections] = useState<GraphConnection[]>([]);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Generate graph data from articles and hypothesis
  useEffect(() => {
    if (!historicalArticle && !modernArticle) return;

    const newNodes: GraphNode[] = [];
    const newConnections: GraphConnection[] = [];

    // Create article nodes
    if (historicalArticle) {
      newNodes.push({
        id: 'historical',
        label: historicalArticle.title.substring(0, 50) + (historicalArticle.title.length > 50 ? '...' : ''),
        type: 'historical',
        x: 150,
        y: 200,
        data: historicalArticle,
        connections: []
      });

      // Add concept nodes from historical article
      const historicalConcepts = extractConcepts(historicalArticle);
      historicalConcepts.forEach((concept, index) => {
        const nodeId = `hist_concept_${index}`;
        newNodes.push({
          id: nodeId,
          label: concept,
          type: 'concept',
          x: 50 + index * 80,
          y: 100,
          data: { concept, source: 'historical' },
          connections: ['historical']
        });
        
        newConnections.push({
          from: 'historical',
          to: nodeId,
          strength: 0.7,
          type: 'conceptual',
          label: 'contains'
        });
      });
    }

    if (modernArticle) {
      newNodes.push({
        id: 'modern',
        label: modernArticle.title.substring(0, 50) + (modernArticle.title.length > 50 ? '...' : ''),
        type: 'modern',
        x: 550,
        y: 200,
        data: modernArticle,
        connections: []
      });

      // Add concept nodes from modern article
      const modernConcepts = extractConcepts(modernArticle);
      modernConcepts.forEach((concept, index) => {
        const nodeId = `mod_concept_${index}`;
        newNodes.push({
          id: nodeId,
          label: concept,
          type: 'concept',
          x: 450 + index * 80,
          y: 100,
          data: { concept, source: 'modern' },
          connections: ['modern']
        });
        
        newConnections.push({
          from: 'modern',
          to: nodeId,
          strength: 0.7,
          type: 'conceptual',
          label: 'contains'
        });
      });
    }

    // Add hypothesis connection if both articles exist
    if (historicalArticle && modernArticle) {
      newConnections.push({
        from: 'historical',
        to: 'modern',
        strength: hypothesis ? 0.9 : 0.5,
        type: 'hypothesis',
        label: hypothesis ? 'hypothesis generated' : 'potential connection'
      });

      // Add cross-temporal concept connections
      const historicalConcepts = extractConcepts(historicalArticle);
      const modernConcepts = extractConcepts(modernArticle);
      
      historicalConcepts.forEach((histConcept, histIndex) => {
        modernConcepts.forEach((modConcept, modIndex) => {
          if (conceptsSimilar(histConcept, modConcept)) {
            newConnections.push({
              from: `hist_concept_${histIndex}`,
              to: `mod_concept_${modIndex}`,
              strength: 0.6,
              type: 'temporal',
              label: 'related concept'
            });
          }
        });
      });
    }

    // Add hypothesis node if generated
    if (hypothesis && historicalArticle && modernArticle) {
      newNodes.push({
        id: 'hypothesis',
        label: 'Generated Hypothesis',
        type: 'connection',
        x: 350,
        y: 300,
        data: hypothesis,
        connections: ['historical', 'modern']
      });

      newConnections.push({
        from: 'historical',
        to: 'hypothesis',
        strength: 0.8,
        type: 'hypothesis'
      });

      newConnections.push({
        from: 'modern',
        to: 'hypothesis',
        strength: 0.8,
        type: 'hypothesis'
      });
    }

    setNodes(newNodes);
    setConnections(newConnections);
  }, [historicalArticle, modernArticle, hypothesis]);

  // Extract key concepts from article (simplified)
  const extractConcepts = (article: Article): string[] => {
    const concepts: string[] = [];
    
    // Extract from keywords if available
    if (article.keywords && article.keywords.length > 0) {
      concepts.push(...article.keywords.slice(0, 3));
    }
    
    // Extract from title (simplified concept extraction)
    const titleWords = article.title.toLowerCase().split(' ')
      .filter(word => word.length > 4 && !['study', 'analysis', 'research', 'investigation'].includes(word))
      .slice(0, 2);
    concepts.push(...titleWords);

    // Extract from abstract (simplified)
    if (article.abstract) {
      const abstractWords = article.abstract.toLowerCase()
        .match(/\b[a-z]{5,}\b/g)?.slice(0, 2) || [];
      concepts.push(...abstractWords);
    }

    return [...new Set(concepts)].slice(0, 4); // Limit to 4 unique concepts
  };

  // Check if two concepts are similar (simplified)
  const conceptsSimilar = (concept1: string, concept2: string): boolean => {
    const c1 = concept1.toLowerCase();
    const c2 = concept2.toLowerCase();
    
    // Exact match
    if (c1 === c2) return true;
    
    // Substring match
    if (c1.includes(c2) || c2.includes(c1)) return true;
    
    // Medical term similarity (simplified)
    const medicalTerms = [
      ['tuberculosis', 'tb', 'mycobacterium'],
      ['thrombosis', 'dvt', 'clot'],
      ['hiv', 'aids', 'immunodeficiency'],
      ['cancer', 'tumor', 'carcinoma', 'neoplasm'],
      ['diabetes', 'glucose', 'insulin']
    ];
    
    for (const group of medicalTerms) {
      if (group.includes(c1) && group.includes(c2)) return true;
    }
    
    return false;
  };

  // Redraw when data changes
  useEffect(() => {
    const drawNode = (ctx: CanvasRenderingContext2D, node: GraphNode) => {
      const isSelected = selectedNode?.id === node.id;
      const radius = node.type === 'concept' ? 25 : 40;
      
      // Node colors
      const colors = {
        historical: { bg: '#FEF3C7', border: '#F59E0B', text: '#92400E' },
        modern: { bg: '#DBEAFE', border: '#3B82F6', text: '#1E40AF' },
        concept: { bg: '#F3F4F6', border: '#6B7280', text: '#374151' },
        connection: { bg: '#F3E8FF', border: '#8B5CF6', text: '#5B21B6' }
      };
      
      const color = colors[node.type];
      
      // Draw node circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = isSelected ? color.border : color.bg;
      ctx.fill();
      ctx.strokeStyle = color.border;
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.stroke();

      // Draw node icon
      ctx.fillStyle = color.text;
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const icons = {
        historical: '🕰️',
        modern: '🔬',
        concept: '💡',
        connection: '🧠'
      };
      
      ctx.fillText(icons[node.type], node.x, node.y - 5);

      // Draw node label
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      
      const maxWidth = radius * 2;
      const words = node.label.split(' ');
      let line = '';
      let y = node.y + radius + 10;
      
      for (const word of words) {
        const testLine = line + word + ' ';
        const metrics = ctx.measureText(testLine);
        
        if (metrics.width > maxWidth && line !== '') {
          ctx.fillText(line, node.x, y);
          line = word + ' ';
          y += 14;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, node.x, y);
    };

    const drawConnection = (ctx: CanvasRenderingContext2D, fromNode: GraphNode, toNode: GraphNode, connection: GraphConnection) => {
      const colors = {
        temporal: '#F59E0B',
        conceptual: '#6B7280',
        methodological: '#10B981',
        hypothesis: '#8B5CF6'
      };

      ctx.beginPath();
      ctx.moveTo(fromNode.x, fromNode.y);
      ctx.lineTo(toNode.x, toNode.y);
      ctx.strokeStyle = colors[connection.type];
      ctx.lineWidth = Math.max(1, connection.strength * 3);
      ctx.setLineDash(connection.type === 'hypothesis' ? [5, 5] : []);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw connection label
      if (connection.label) {
        const midX = (fromNode.x + toNode.x) / 2;
        const midY = (fromNode.y + toNode.y) / 2;
        
        ctx.fillStyle = colors[connection.type];
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Background for label
        const metrics = ctx.measureText(connection.label);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fillRect(midX - metrics.width/2 - 2, midY - 6, metrics.width + 4, 12);
        
        ctx.fillStyle = colors[connection.type];
        ctx.fillText(connection.label, midX, midY);
      }
    };

    const drawGraph = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Apply transformations
      ctx.save();
      ctx.translate(offset.x, offset.y);
      ctx.scale(scale, scale);

      // Draw connections first
      connections.forEach(connection => {
        const fromNode = nodes.find(n => n.id === connection.from);
        const toNode = nodes.find(n => n.id === connection.to);
        
        if (fromNode && toNode) {
          drawConnection(ctx, fromNode, toNode, connection);
        }
      });

      // Draw nodes
      nodes.forEach(node => {
        drawNode(ctx, node);
      });

      ctx.restore();
    };

    drawGraph();
  }, [nodes, connections, selectedNode, scale, offset]);

  // Event handlers
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left - offset.x) / scale;
    const y = (event.clientY - rect.top - offset.y) / scale;

    // Find clicked node
    const clickedNode = nodes.find(node => {
      const radius = node.type === 'concept' ? 25 : 40;
      const distance = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
      return distance <= radius;
    });

    setSelectedNode(clickedNode || null);
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: event.clientX - offset.x, y: event.clientY - offset.y });
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    
    setOffset({
      x: event.clientX - dragStart.x,
      y: event.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => setScale(prev => Math.min(prev * 1.2, 3));
  const handleZoomOut = () => setScale(prev => Math.max(prev / 1.2, 0.3));
  const handleReset = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
    setSelectedNode(null);
  };

  const NodeDetailsPanel = ({ node }: { node: GraphNode }) => (
    <Card className="p-4 mt-4">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          {node.type === 'historical' && <Clock className="h-5 w-5 text-amber-600" />}
          {node.type === 'modern' && <Microscope className="h-5 w-5 text-blue-600" />}
          {node.type === 'concept' && <Tag className="h-5 w-5 text-gray-600" />}
          {node.type === 'connection' && <Brain className="h-5 w-5 text-purple-600" />}
          <h3 className="font-semibold">{node.label}</h3>
        </div>
        
        {node.type === 'historical' || node.type === 'modern' ? (
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 opacity-70" />
              <span className="font-medium">Authors:</span>
              <span className="text-muted-foreground">
                {(node.data as Article).authors?.slice(0, 2).join(', ') || 'Unknown'}
                {(node.data as Article).authors?.length > 2 && ' et al.'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 opacity-70" />
              <span className="font-medium">Published:</span>
              <span className="text-muted-foreground">{(node.data as Article).publication_date || 'Unknown'}</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 opacity-70" />
              <span className="font-medium">PMID:</span>
              <span className="font-mono text-muted-foreground">{(node.data as Article).pmid}</span>
            </div>
            {(node.data as Article).abstract && (
              <div className="mt-3">
                <span className="font-medium">Abstract:</span>
                <p className="text-muted-foreground text-xs mt-1 line-clamp-3">{(node.data as Article).abstract}</p>
              </div>
            )}
          </div>
        ) : node.type === 'concept' ? (
          <div className="text-sm">
            <span className="font-medium">Source:</span>
            <span className="text-muted-foreground ml-2 capitalize">{(node.data as { concept: string; source: string }).source} article</span>
          </div>
        ) : node.type === 'connection' ? (
          <div className="text-sm">
            <span className="font-medium">Hypothesis:</span>
            <p className="text-muted-foreground mt-1 text-xs">{(node.data as HypothesisResponse).hypothesis}</p>
          </div>
        ) : null}
      </div>
    </Card>
  );

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Network className="h-5 w-5" />
          <span className="font-medium">Knowledge Graph</span>
          <span className="text-sm text-muted-foreground">
            ({nodes.length} nodes, {connections.length} connections)
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div className="border rounded-lg overflow-hidden bg-white">
        <canvas
          ref={canvasRef}
          width={700}
          height={400}
          className="cursor-move"
          onClick={handleCanvasClick}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-amber-200 border-2 border-amber-500"></div>
          <span>Historical Study</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-blue-200 border-2 border-blue-500"></div>
          <span>Modern Study</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-gray-200 border-2 border-gray-500"></div>
          <span>Concept</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-purple-200 border-2 border-purple-500"></div>
          <span>Hypothesis</span>
        </div>
      </div>

      {/* Selected Node Details */}
      {selectedNode && <NodeDetailsPanel node={selectedNode} />}
    </div>
  );
}
