'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle } from "lucide-react";

interface ApiStatus {
  endpoint: string;
  description: string;
  status: 'checking' | 'success' | 'error';
  responseTime?: number;
}

export default function ApiStatus() {
  const [endpoints, setEndpoints] = useState<ApiStatus[]>([
    {
      endpoint: '/api/v1/spine-articles/search',
      description: 'Search PubMed articles',
      status: 'checking'
    },
    {
      endpoint: '/api/v1/ocr',
      description: 'OCR image processing',
      status: 'checking'
    },
    {
      endpoint: '/api/v1/graph/ingest-historical',
      description: 'Ingest historical observations',
      status: 'checking'
    },
    {
      endpoint: '/api/v1/graph/ingest-modern',
      description: 'Ingest modern studies',
      status: 'checking'
    },
    {
      endpoint: '/api/v1/hypothesis',
      description: 'Generate hypotheses',
      status: 'checking'
    },
    {
      endpoint: '/api/v1/dkg/write-stub',
      description: 'Write to DKG',
      status: 'checking'
    }
  ]);

  useEffect(() => {
    const checkEndpoints = async () => {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      
      const updatedEndpoints = [...endpoints];
      
      for (let i = 0; i < updatedEndpoints.length; i++) {
        const endpoint = updatedEndpoints[i];
        const start = performance.now();
        
        try {
          // For GET endpoints
          if (endpoint.endpoint.includes('search')) {
            const response = await fetch(`${baseUrl}${endpoint.endpoint}?q=test&page=1&per_page=1`);
            const end = performance.now();
            
            updatedEndpoints[i] = {
              ...endpoint,
              status: response.ok ? 'success' : 'error',
              responseTime: Math.round(end - start)
            };
          } else {
            // For POST endpoints, we'll just check if they're available (OPTIONS request)
            const response = await fetch(`${baseUrl}${endpoint.endpoint}`, {
              method: 'OPTIONS',
            });
            const end = performance.now();
            
            updatedEndpoints[i] = {
              ...endpoint,
              status: (response.status < 500) ? 'success' : 'error', 
              responseTime: Math.round(end - start)
            };
          }
        } catch (error) {
          console.error(`Error checking ${endpoint.endpoint}:`, error);
          updatedEndpoints[i] = {
            ...endpoint,
            status: 'error'
          };
        }
        
        // Update state after each check to show progress
        setEndpoints([...updatedEndpoints]);
      }
    };
    
    checkEndpoints();
  }, []);

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Chronos API Status</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Backend API Endpoints</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {endpoints.map((endpoint, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <h3 className="font-medium">{endpoint.description}</h3>
                  <code className="text-xs text-muted-foreground">{endpoint.endpoint}</code>
                </div>
                <div className="flex items-center gap-2">
                  {endpoint.status === 'checking' ? (
                    <span className="text-sm flex items-center gap-1">
                      Checking... <span className="ml-1 animate-spin">⏳</span>
                    </span>
                  ) : endpoint.status === 'success' ? (
                    <span className="text-sm text-green-600 flex items-center gap-1">
                      <CheckCircle className="h-5 w-5" />
                      {endpoint.responseTime && `${endpoint.responseTime}ms`}
                    </span>
                  ) : (
                    <span className="text-sm text-destructive flex items-center gap-1">
                      <XCircle className="h-5 w-5" />
                      Failed
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
