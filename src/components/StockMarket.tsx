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
    <div className="space-y-4">
      {/* Market Indices */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Market Indices</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMarketData}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        
        <div className="grid md:grid-cols-3 gap-4">
          {marketData.indices.map((index) => (
            <div
              key={index.name}
              className="p-4 rounded-lg bg-muted/50 border border-border"
            >
              <div className="text-sm text-muted-foreground mb-1">{index.name}</div>
              <div className="text-2xl font-bold mb-1">
                {index.value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-sm">
                {formatChange(index.change, index.changePercent)}
              </div>
            </div>
          ))}
        </div>
        
        {lastUpdated && (
          <div className="text-xs text-muted-foreground mt-4">
            Last updated: {lastUpdated.toLocaleTimeString('en-IN')}
          </div>
        )}
      </Card>

      {/* Top Stocks */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Top Stocks</h3>
        
        <div className="space-y-3">
          {marketData.topStocks.map((stock) => (
            <div
              key={stock.symbol}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1">
                <div className="font-semibold">{stock.symbol}</div>
                <div className="text-sm text-muted-foreground">{stock.name}</div>
              </div>
              
              <div className="text-right mr-4">
                <div className="font-semibold">
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
