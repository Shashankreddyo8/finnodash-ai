import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Index {
  name: string;
  value: number;
  change: number;
  changePercent: number;
  timestamp: string;
}

interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: string;
}

interface MarketData {
  indices: Index[];
  topStocks: Stock[];
}

interface StockMarketProps {
  onStocksUpdate?: (stocks: Stock[]) => void;
}

export const StockMarket = ({ onStocksUpdate }: StockMarketProps = {}) => {
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchMarketData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-market-data');

      if (error) throw error;

      setMarketData(data);
      setLastUpdated(new Date());
      toast.success("Market data updated");
      
      // Notify parent about stock updates
      if (onStocksUpdate && data.topStocks) {
        onStocksUpdate(data.topStocks);
      }
    } catch (error) {
      console.error('Error fetching market data:', error);
      toast.error('Failed to fetch market data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketData();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchMarketData, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const formatChange = (change: number, changePercent: number) => {
    const isPositive = change >= 0;
    return (
      <span className={isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
        {isPositive ? <TrendingUp className="h-4 w-4 inline mr-1" /> : <TrendingDown className="h-4 w-4 inline mr-1" />}
        {isPositive ? '+' : ''}{change.toFixed(2)} ({changePercent.toFixed(2)}%)
      </span>
    );
  };

  if (!marketData) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Market Indices */}
      <Card className="p-6 animate-fade-in backdrop-blur-sm bg-card/80">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold">Market Indices</h3>
            <p className="text-sm text-muted-foreground">Live market performance</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMarketData}
            disabled={isLoading}
            className="gap-2 group"
          >
            <RefreshCw className={`h-4 w-4 transition-all duration-500 group-hover:rotate-180 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        
        <div className="grid md:grid-cols-3 gap-4">
          {marketData.indices.map((index, i) => (
            <div
              key={index.name}
              className="relative p-5 rounded-xl bg-gradient-to-br from-muted/50 to-muted/20 border border-border/50 backdrop-blur-sm transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-muted/60 hover:shadow-medium hover:-translate-y-1 hover:border-border group animate-slide-up cursor-default"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <div className="text-sm text-muted-foreground mb-2 font-medium">{index.name}</div>
                <div className="text-2xl font-bold mb-2 transition-transform duration-300 group-hover:scale-[1.02]">
                  {index.value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-sm">
                  {formatChange(index.change, index.changePercent)}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {lastUpdated && (
          <div className="text-xs text-muted-foreground mt-6 animate-fade-in flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse-soft" />
            Last updated: {lastUpdated.toLocaleTimeString('en-IN')}
          </div>
        )}
      </Card>

      {/* Top Stocks */}
      <Card className="p-6 animate-fade-in backdrop-blur-sm bg-card/80" style={{ animationDelay: '0.2s' }}>
        <div className="mb-6">
          <h3 className="text-lg font-semibold">Top Stocks</h3>
          <p className="text-sm text-muted-foreground">Most active Indian stocks</p>
        </div>
        
        <div className="space-y-3">
          {marketData.topStocks.map((stock, i) => (
            <div
              key={stock.symbol}
              className="relative flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-muted/30 to-muted/10 border border-transparent transition-all duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] hover:from-muted/50 hover:to-muted/30 hover:shadow-soft hover:-translate-y-0.5 hover:border-border/50 group animate-slide-up cursor-default"
              style={{ animationDelay: `${(i + 3) * 0.06}s` }}
            >
              <div className="flex-1">
                <div className="font-semibold transition-colors duration-200 group-hover:text-primary">{stock.symbol}</div>
                <div className="text-sm text-muted-foreground">{stock.name}</div>
              </div>
              
              <div className="text-right mr-4">
                <div className="font-semibold transition-transform duration-300 group-hover:scale-105 origin-right">
                  ₹{stock.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-xs text-muted-foreground">
                  Vol: {stock.volume}
                </div>
              </div>
              
              <div className="text-sm min-w-[120px] text-right">
                {formatChange(stock.change, stock.changePercent)}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
