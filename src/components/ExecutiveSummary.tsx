import { FileText, Download, Copy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ExecutiveSummaryProps {
  summary: string;
  query: string;
}

export const ExecutiveSummary = ({ summary, query }: ExecutiveSummaryProps) => {
  const formatSummary = (text: string) => {
    // Split by lines and process each line
    const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
    const formatted: JSX.Element[] = [];
    
    lines.forEach((line, index) => {
      // Remove leading asterisks and markdown bold markers
      let cleanLine = line.replace(/^\*+\s*/, '').replace(/\*\*/g, '');
      
      // Check if it's a heading (ends with colon)
      if (cleanLine.includes(':')) {
        const [heading, ...rest] = cleanLine.split(':');
        const content = rest.join(':').trim();
        
        formatted.push(
          <div key={index} className="mb-4">
            <h3 className="font-semibold text-foreground mb-2">{heading}</h3>
            {content && <p className="text-foreground/80 leading-relaxed">{content}</p>}
          </div>
        );
      } else {
        // Regular paragraph
        formatted.push(
          <p key={index} className="text-foreground/80 leading-relaxed mb-3">
            {cleanLine}
          </p>
        );
      }
    });
    
    return formatted;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(summary);
    toast.success("Summary copied to clipboard");
  };

  const handleDownload = () => {
    const blob = new Blob([`FINNOLAN Executive Summary\n\nQuery: ${query}\n\n${summary}`], {
      type: "text/plain",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `finnolan-summary-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Summary downloaded");
  };

  return (
    <Card className="border-primary/20 shadow-medium">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5 text-primary" />
            Executive Summary
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="gap-2"
            >
              <Copy className="h-4 w-4" />
              Copy
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {formatSummary(summary)}
        </div>
      </CardContent>
    </Card>
  );
};
