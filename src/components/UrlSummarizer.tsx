import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const UrlSummarizer = () => {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState("");
  const [sentiment, setSentiment] = useState<'positive' | 'neutral' | 'negative' | null>(null);

  const sentimentConfig = {
    positive: { color: "bg-green-500/10 text-green-700 border-green-500/20", label: "Positive" },
    neutral: { color: "bg-blue-500/10 text-blue-700 border-blue-500/20", label: "Neutral" },
    negative: { color: "bg-red-500/10 text-red-700 border-red-500/20", label: "Negative" },
  };

  const handleSummarize = async () => {
    if (!url) {
      toast.error("Please enter a URL");
      return;
    }

    setIsLoading(true);
    toast.info("Fetching and summarizing article...");

    try {
      const { data, error } = await supabase.functions.invoke('summarize-article', {
        body: { url }
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      setSummary(data.summary);
      setSentiment(data.sentiment);
      toast.success("Article summarized successfully");
    } catch (error) {
      console.error('Error summarizing article:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to summarize article');
      setSummary("");
      setSentiment(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-border/40 bg-card/50 backdrop-blur">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-5 w-5 text-primary" />
          Summarize Article from URL
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            type="url"
            placeholder="https://example.com/article"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1"
            disabled={isLoading}
          />
          <Button onClick={handleSummarize} disabled={isLoading}>
            {isLoading ? (
              <>
                <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                Summarizing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Summarize
              </>
            )}
          </Button>
        </div>

        {summary && (
          <div className="space-y-3 animate-in fade-in duration-500">
            {sentiment && (
              <Badge className={sentimentConfig[sentiment].color}>
                {sentimentConfig[sentiment].label}
              </Badge>
            )}
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <div className="whitespace-pre-wrap text-foreground">{summary}</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
