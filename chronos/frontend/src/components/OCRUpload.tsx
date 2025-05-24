import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, AlertTriangle, CheckCircle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";
import { toast } from "sonner";

interface OCRUploadProps {
  onTextExtracted: (text: string, nodeId: string) => void;
}

export default function OCRUpload({ onTextExtracted }: OCRUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  const [sourceId, setSourceId] = useState('');
  const [connectionError, setConnectionError] = useState(false);
  const [ingestLoading, setIngestLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setConnectionError(false);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file to upload");
      return;
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error("File size too large. Maximum 10MB allowed.");
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/tiff', 'image/bmp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Please select a valid image file (JPG, PNG, TIFF, BMP)");
      return;
    }

    setLoading(true);
    setConnectionError(false);
    
    try {
      const response = await api.processOCR(file);
      if (response && response.text) {
        setExtractedText(response.text);
        if (response.text.trim() === "") {
          toast.warning("No text could be extracted from this image. Please ensure the image contains readable text.");
        } else {
          toast.success(`Text extracted successfully (${response.text.length} characters)`);
        }
      } else {
        setConnectionError(true);
        toast.error("Could not connect to the backend OCR service");
      }
    } catch (error) {
      console.error('OCR error:', error);
      setConnectionError(true);
      toast.error("Failed to extract text from image");
    } finally {
      setLoading(false);
    }
  };

  const handleIngest = async () => {
    if (!extractedText.trim()) {
      toast.error("No text to ingest");
      return;
    }

    if (!sourceId.trim()) {
      toast.error("Please enter a source ID");
      return;
    }

    setIngestLoading(true);
    try {
      const response = await api.ingestHistorical(extractedText, sourceId);
      if (response?.id) {
        toast.success("Historical observation ingested to graph");
        onTextExtracted(extractedText, response.id);
      } else {
        toast.error("Failed to ingest historical observation");
      }
    } catch (error) {
      console.error('Ingest error:', error);
      toast.error("Failed to ingest historical observation");
    } finally {
      setIngestLoading(false);
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Historical Text OCR
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Upload an image containing historical text to extract and analyze.
        </p>

        {connectionError && (
          <div className="p-3 border border-destructive rounded-lg bg-destructive/10 flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">
              Connection to backend failed. Please ensure the OCR service is running and properly configured.
            </p>
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            type="file"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            aria-label="Upload image file"
          />
          <Button
            variant="outline"
            className="flex-1"
            onClick={triggerFileInput}
          >
            {file ? file.name : "Select Image"}
          </Button>
          <Button 
            onClick={handleUpload} 
            disabled={!file || loading}
            className="flex items-center gap-1"
          >
            {loading ? (
              <>Processing... <span className="ml-1 animate-spin">⏳</span></>
            ) : (
              <>Extract Text <Upload className="ml-2 h-4 w-4" /></>
            )}
          </Button>
        </div>

        {extractedText && (
          <div className="space-y-4">
            <Textarea
              value={extractedText}
              onChange={(e) => setExtractedText(e.target.value)}
              className="min-h-[200px]"
              placeholder="Extracted text will appear here..."
              aria-label="Extracted text"
            />
            
            <div className="flex gap-2">
              <Input
                placeholder="Source ID (e.g., book title, manuscript reference)"
                value={sourceId}
                onChange={(e) => setSourceId(e.target.value)}
                aria-label="Source ID"
              />
              <Button 
                onClick={handleIngest} 
                disabled={!extractedText.trim() || !sourceId.trim() || ingestLoading}
                className="whitespace-nowrap flex items-center gap-1"
              >
                {ingestLoading ? (
                  <>Ingesting... <span className="ml-1 animate-spin">⏳</span></>
                ) : (
                  <>Ingest to Graph <CheckCircle className="ml-2 h-4 w-4" /></>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
