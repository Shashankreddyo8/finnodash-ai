import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface SentimentStats {
  positive: number;
  neutral: number;
  negative: number;
}

interface SentimentDisplayProps {
  stats: SentimentStats;
  totalArticles: number;
}

export const SentimentDisplay = ({ stats, totalArticles }: SentimentDisplayProps) => {
  const positivePercent = (stats.positive / totalArticles) * 100;
  const neutralPercent = (stats.neutral / totalArticles) * 100;
  const negativePercent = (stats.negative / totalArticles) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Sentiment Analysis</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-success" />
                <span className="text-sm font-medium">Positive</span>
              </div>
              <span className="text-sm font-semibold">{stats.positive} ({positivePercent.toFixed(0)}%)</span>
            </div>
            <Progress value={positivePercent} className="h-2 [&>div]:bg-success" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-warning" />
                <span className="text-sm font-medium">Neutral</span>
              </div>
              <span className="text-sm font-semibold">{stats.neutral} ({neutralPercent.toFixed(0)}%)</span>
            </div>
            <Progress value={neutralPercent} className="h-2 [&>div]:bg-warning" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-destructive" />
                <span className="text-sm font-medium">Negative</span>
              </div>
              <span className="text-sm font-semibold">{stats.negative} ({negativePercent.toFixed(0)}%)</span>
            </div>
            <Progress value={negativePercent} className="h-2 [&>div]:bg-destructive" />
          </div>
        </div>

        <div className="pt-4 border-t grid grid-cols-3 gap-4">
          <div className="text-center">
            <TrendingUp className="h-6 w-6 mx-auto mb-1 text-success" />
            <p className="text-2xl font-bold">{stats.positive}</p>
            <p className="text-xs text-muted-foreground">Positive</p>
          </div>
          <div className="text-center">
            <Minus className="h-6 w-6 mx-auto mb-1 text-warning" />
            <p className="text-2xl font-bold">{stats.neutral}</p>
            <p className="text-xs text-muted-foreground">Neutral</p>
          </div>
          <div className="text-center">
            <TrendingDown className="h-6 w-6 mx-auto mb-1 text-destructive" />
            <p className="text-2xl font-bold">{stats.negative}</p>
            <p className="text-xs text-muted-foreground">Negative</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
