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
    <Card className="group hover:-translate-y-1.5 hover:shadow-strong transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden relative">
      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      
      <CardHeader className="pb-3 relative z-10">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold leading-tight flex-1 group-hover:text-primary transition-colors duration-300">
            {headline}
          </h3>
          <Badge className={cn(
            "shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:shadow-soft", 
            sentimentConfig[sentiment].color
          )}>
            {sentimentConfig[sentiment].label}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
          <span className="font-medium">{source}</span>
          <span className="opacity-50">•</span>
          <span>{timestamp}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 relative z-10">
        <p className="text-foreground/80 leading-relaxed">{snippet}</p>
        
        <div 
          className={cn(
            "overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
            fullText && isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <div className="pt-3 border-t border-border/50 animate-fade-in">
            <p className="text-sm text-foreground/70 leading-relaxed">{fullText}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            asChild
            className="gap-2 group/btn"
          >
            <a href={link} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 transition-transform duration-300 group-hover/btn:rotate-12" />
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
                  <ChevronUp className="h-4 w-4 transition-transform duration-300" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 transition-transform duration-300 group-hover:translate-y-0.5" />
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
