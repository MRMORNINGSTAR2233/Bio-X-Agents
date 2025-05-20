import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file to upload");
      return;
    }

    setLoading(true);
    try {
      const response = await api.processOCR(file);
      if (response) {
        setExtractedText(response.text);
        toast.success("Text extracted successfully");
      }
    } catch (error) {
      console.error('OCR error:', error);
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

    setLoading(true);
    try {
      const response = await api.ingestHistorical(extractedText, sourceId);
      if (response?.id) {
        toast.success("Historical observation ingested to graph");
        onTextExtracted(extractedText, response.id);
      }
    } catch (error) {
      console.error('Ingest error:', error);
      toast.error("Failed to ingest historical observation");
    } finally {
      setLoading(false);
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

        <div className="flex items-center gap-2">
          <label htmlFor="file-upload" className="sr-only">Upload image file</label>
          <input
            id="file-upload"
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
          >
            {loading ? "Processing..." : "Extract Text"}
            <Upload className="ml-2 h-4 w-4" />
          </Button>
        </div>

        {extractedText && (
          <div className="space-y-4">
            <Textarea
              value={extractedText}
              onChange={(e) => setExtractedText(e.target.value)}
              className="min-h-[200px]"
              placeholder="Extracted text will appear here..."
            />
            
            <div className="flex gap-2">
              <input
                type="text"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Source ID (e.g., book title, manuscript reference)"
                value={sourceId}
                onChange={(e) => setSourceId(e.target.value)}
              />
              <Button onClick={handleIngest} disabled={!extractedText.trim() || !sourceId.trim() || loading}>
                Ingest to Graph
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
