import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, TrendingUp, TrendingDown, Loader2, Target, ShieldAlert, CheckCircle, BarChart3, ArrowUpDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface StockSuggestion {
  recommendation: "BUY" | "SELL" | "HOLD";
  confidence: number;
  reasons: string[];
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  targetPrice: number;
  summary: string;
}

interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: string;
  high52w?: number;
  low52w?: number;
  suggestion: StockSuggestion;
}

export const StockSuggestions = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchStock = async () => {
    if (!searchTerm.trim()) {
      toast.error("Please enter a stock symbol");
      return;
    }

    setIsLoading(true);
    setError(null);
    setStockData(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('stock-suggestions', {
        body: { symbol: searchTerm.trim() }
      });

      if (fnError) throw fnError;
      if (data.error) throw new Error(data.error);

      setStockData(data);
      toast.success(`Analysis complete for ${data.symbol}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch stock data";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchStock();
    }
  };

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case "BUY": return "bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30";
      case "SELL": return "bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30";
      default: return "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30";
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "LOW": return "text-green-600 dark:text-green-400";
      case "HIGH": return "text-red-600 dark:text-red-400";
      default: return "text-yellow-600 dark:text-yellow-400";
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Target className="h-5 w-5 text-primary" />
        Stock Analysis & Suggestions
      </h3>

      {/* Search Input */}
      <div className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Enter stock symbol (e.g., RELIANCE, TCS, INFY)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value.toUpperCase())}
            onKeyPress={handleKeyPress}
            className="pl-10"
          />
        </div>
        <Button onClick={searchStock} disabled={isLoading}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Analyze"}
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
          {error}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin mb-2" />
          <p>Analyzing {searchTerm}...</p>
          <p className="text-sm">Getting AI-powered recommendations</p>
        </div>
      )}

      {/* Stock Data Display */}
      {stockData && !isLoading && (
        <div className="space-y-4">
          {/* Stock Header */}
          <div className="p-4 rounded-lg bg-muted/50 border border-border">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-xl font-bold">{stockData.symbol}</h4>
                <p className="text-sm text-muted-foreground">{stockData.name}</p>
              </div>
              <Badge className={`text-lg px-4 py-1 ${getRecommendationColor(stockData.suggestion.recommendation)}`}>
                {stockData.suggestion.recommendation}
              </Badge>
            </div>

            <div className="mt-4 flex flex-wrap items-end gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Current Price</p>
                <p className="text-3xl font-bold">
                  ₹{stockData.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className={`flex items-center gap-1 text-lg ${stockData.change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {stockData.change >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                <span>{stockData.change >= 0 ? '+' : ''}₹{stockData.change.toFixed(2)}</span>
                <span>({stockData.changePercent >= 0 ? '+' : ''}{stockData.changePercent.toFixed(2)}%)</span>
              </div>
            </div>

            {/* 52-Week Range & Volume */}
            {(stockData.high52w || stockData.volume) && (
              <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                {stockData.volume && (
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Volume</p>
                      <p className="font-semibold">{stockData.volume}</p>
                    </div>
                  </div>
                )}
                {stockData.high52w && (
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="text-muted-foreground">52W High</p>
                      <p className="font-semibold text-green-600 dark:text-green-400">₹{stockData.high52w.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                )}
                {stockData.low52w && (
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="h-4 w-4 text-red-500" />
                    <div>
                      <p className="text-muted-foreground">52W Low</p>
                      <p className="font-semibold text-red-600 dark:text-red-400">₹{stockData.low52w.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* AI Analysis */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Confidence & Risk */}
            <div className="p-4 rounded-lg bg-muted/30 border border-border">
              <h5 className="font-semibold mb-3">Analysis Metrics</h5>
              
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Confidence</span>
                    <span className="font-medium">{stockData.suggestion.confidence}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${stockData.suggestion.confidence}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <ShieldAlert className="h-4 w-4" />
                    Risk Level
                  </span>
                  <span className={`font-semibold ${getRiskColor(stockData.suggestion.riskLevel)}`}>
                    {stockData.suggestion.riskLevel}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Target className="h-4 w-4" />
                    Target Price
                  </span>
                  <span className="font-semibold">
                    ₹{stockData.suggestion.targetPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="p-4 rounded-lg bg-muted/30 border border-border">
              <h5 className="font-semibold mb-3">Summary</h5>
              <p className="text-muted-foreground">{stockData.suggestion.summary}</p>
            </div>
          </div>

          {/* Reasons */}
          <div className="p-4 rounded-lg bg-muted/30 border border-border">
            <h5 className="font-semibold mb-3">Key Reasons</h5>
            <ul className="space-y-2">
              {stockData.suggestion.reasons.map((reason, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">{reason}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Disclaimer */}
          <p className="text-xs text-muted-foreground text-center pt-2">
            ⚠️ This is AI-generated analysis for educational purposes only. Always consult a financial advisor before making investment decisions.
          </p>
        </div>
      )}

      {/* Empty State */}
      {!stockData && !isLoading && !error && (
        <div className="text-center py-8 text-muted-foreground">
          <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Search for a stock to get AI-powered analysis</p>
          <p className="text-sm mt-1">Try: RELIANCE, TCS, HDFCBANK, INFY, ICICIBANK</p>
        </div>
      )}
    </Card>
  );
};
