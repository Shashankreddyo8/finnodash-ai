import { useState } from "react";
import { ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NewsCardProps {
  headline: string;
  snippet: string;
  source: string;
  link: string;
  timestamp: string;
  sentiment: "positive" | "neutral" | "negative";
  fullText?: string;
}

const sentimentConfig = {
  positive: {
    color: "bg-success text-success-foreground",
    label: "Positive",
  },
  neutral: {
    color: "bg-warning text-warning-foreground",
    label: "Neutral",
  },
  negative: {
    color: "bg-destructive text-destructive-foreground",
    label: "Negative",
  },
};

export const NewsCard = ({
  headline,
  snippet,
  source,
  link,
  timestamp,
  sentiment,
  fullText,
}: NewsCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="hover:shadow-medium transition-shadow duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold leading-tight flex-1">
            {headline}
          </h3>
          <Badge className={cn("shrink-0", sentimentConfig[sentiment].color)}>
            {sentimentConfig[sentiment].label}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
          <span className="font-medium">{source}</span>
          <span>•</span>
          <span>{timestamp}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-foreground/80 leading-relaxed">{snippet}</p>
        
        {fullText && isExpanded && (
          <div className="pt-3 border-t">
            <p className="text-sm text-foreground/70 leading-relaxed">{fullText}</p>
          </div>
        )}

        <div className="flex items-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            asChild
            className="gap-2"
          >
            <a href={link} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
              Read Full Article
            </a>
          </Button>
          
          {fullText && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="gap-1"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Show More
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
