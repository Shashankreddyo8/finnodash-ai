import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Star, TrendingUp, TrendingDown, Bell, Trash2, Plus, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface WatchlistItem {
  id: string;
  stock_symbol: string;
  stock_name: string;
  target_price: number | null;
  alert_type: string | null;
  current_price: number | null;
  created_at: string;
}

interface StockPrice {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

export const Watchlist = () => {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [stockPrices, setStockPrices] = useState<Map<string, StockPrice>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingPrice, setIsFetchingPrice] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [stockSymbol, setStockSymbol] = useState("");
  const [stockName, setStockName] = useState("");
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [targetPrice, setTargetPrice] = useState("");
  const [alertType, setAlertType] = useState<"above" | "below" | "none">("none");

  const fetchWatchlist = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('watchlist')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching watchlist:', error);
      return;
    }

    setWatchlist(data || []);
    
    // Fetch current prices for all watchlist items
    if (data && data.length > 0) {
      fetchPricesForWatchlist(data);
    }
  };

  const fetchPricesForWatchlist = async (items: WatchlistItem[]) => {
    const prices = new Map<string, StockPrice>();
    
    for (const item of items) {
      try {
        const { data, error } = await supabase.functions.invoke('stock-suggestions', {
          body: { query: item.stock_symbol }
        });
        
        if (!error && data?.currentPrice) {
          prices.set(item.stock_symbol, {
            symbol: item.stock_symbol,
            price: data.currentPrice,
            change: data.change || 0,
            changePercent: data.changePercent || 0
          });
        }
      } catch (err) {
        console.error(`Error fetching price for ${item.stock_symbol}:`, err);
      }
    }
    
    setStockPrices(prices);
  };

  useEffect(() => {
    fetchWatchlist();
    
    // Refresh prices every 60 seconds
    const interval = setInterval(() => {
      if (watchlist.length > 0) {
        fetchPricesForWatchlist(watchlist);
      }
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchStockPrice = async () => {
    if (!stockSymbol.trim()) {
      toast.error("Please enter a stock symbol");
      return;
    }

    setIsFetchingPrice(true);
    try {
      const { data, error } = await supabase.functions.invoke('stock-suggestions', {
        body: { query: stockSymbol.toUpperCase().trim() }
      });

      if (error) {
        toast.error("Failed to fetch stock data");
        setIsFetchingPrice(false);
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        setIsFetchingPrice(false);
        return;
      }

      if (data?.currentPrice) {
        setCurrentPrice(data.currentPrice);
        setStockName(data.name || stockSymbol.toUpperCase());
        toast.success(`Found ${stockSymbol.toUpperCase()} at ₹${data.currentPrice.toFixed(2)}`);
      } else {
        toast.error("Stock not found");
      }
    } catch (err) {
      toast.error("Failed to fetch stock data");
    }
    setIsFetchingPrice(false);
  };

  const addToWatchlist = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please log in to add stocks to watchlist");
      return;
    }

    if (!stockSymbol.trim()) {
      toast.error("Please enter a stock symbol");
      return;
    }

    if (currentPrice === null) {
      toast.error("Please fetch the stock price first");
      return;
    }

    setIsLoading(true);

    const { error } = await supabase
      .from('watchlist')
      .insert({
        user_id: user.id,
        stock_symbol: stockSymbol.toUpperCase().trim(),
        stock_name: stockName || stockSymbol.toUpperCase().trim(),
        current_price: currentPrice,
        target_price: targetPrice ? parseFloat(targetPrice) : null,
        alert_type: alertType,
      });

    if (error) {
      if (error.code === '23505') {
        toast.error("Stock already in watchlist");
      } else {
        toast.error("Failed to add to watchlist");
      }
    } else {
      toast.success(`${stockSymbol.toUpperCase()} added to watchlist`);
      fetchWatchlist();
      setIsOpen(false);
      resetForm();
    }

    setIsLoading(false);
  };

  const resetForm = () => {
    setStockSymbol("");
    setStockName("");
    setCurrentPrice(null);
    setTargetPrice("");
    setAlertType("none");
  };

  const removeFromWatchlist = async (id: string, symbol: string) => {
    const { error } = await supabase
      .from('watchlist')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error("Failed to remove from watchlist");
    } else {
      toast.success(`${symbol} removed from watchlist`);
      fetchWatchlist();
    }
  };

  const checkPriceAlert = (item: WatchlistItem) => {
    if (!item.target_price || item.alert_type === 'none') return false;
    
    const currentStockPrice = stockPrices.get(item.stock_symbol);
    if (!currentStockPrice) return false;
    
    if (item.alert_type === 'above' && currentStockPrice.price >= item.target_price) return true;
    if (item.alert_type === 'below' && currentStockPrice.price <= item.target_price) return true;
    return false;
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">My Watchlist</h3>
        </div>
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Stock
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Stock to Watchlist</DialogTitle>
              <DialogDescription>
                Enter any stock symbol (Indian, US, or Crypto) and set a price alert.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="stockSymbol">Stock Symbol</Label>
                <div className="flex gap-2">
                  <Input
                    id="stockSymbol"
                    placeholder="e.g., RELIANCE, TCS, BTC, AAPL"
                    value={stockSymbol}
                    onChange={(e) => {
                      setStockSymbol(e.target.value.toUpperCase());
                      setCurrentPrice(null);
                      setStockName("");
                    }}
                  />
                  <Button 
                    variant="outline" 
                    onClick={fetchStockPrice}
                    disabled={isFetchingPrice || !stockSymbol.trim()}
                  >
                    {isFetchingPrice ? <Loader2 className="h-4 w-4 animate-spin" /> : "Fetch"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Examples: RELIANCE, TCS, HDFCBANK, BTC, ETH, AAPL, GOOGL, TSLA
                </p>
              </div>

              {currentPrice !== null && (
                <div className="p-3 rounded-lg bg-muted/50 border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{stockName}</p>
                      <p className="text-sm text-muted-foreground">{stockSymbol}</p>
                    </div>
                    <p className="text-xl font-bold">₹{currentPrice.toFixed(2)}</p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="alertType">Alert Type</Label>
                <Select value={alertType} onValueChange={(value: "above" | "below" | "none") => setAlertType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Alert</SelectItem>
                    <SelectItem value="above">Alert when price goes above</SelectItem>
                    <SelectItem value="below">Alert when price goes below</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {alertType !== "none" && (
                <div className="space-y-2">
                  <Label htmlFor="targetPrice">Target Price (₹)</Label>
                  <Input
                    id="targetPrice"
                    type="number"
                    step="0.01"
                    placeholder="Enter target price"
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(e.target.value)}
                  />
                </div>
              )}
            </div>
            <Button 
              onClick={addToWatchlist} 
              disabled={isLoading || currentPrice === null} 
              className="w-full"
            >
              {isLoading ? "Adding..." : "Add to Watchlist"}
            </Button>
          </DialogContent>
        </Dialog>
      </div>

      {watchlist.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Star className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Your watchlist is empty</p>
          <p className="text-sm">Add any stock, crypto, or index to track</p>
        </div>
      ) : (
        <div className="space-y-3">
          {watchlist.map((item) => {
            const alertTriggered = checkPriceAlert(item);
            const currentStockPrice = stockPrices.get(item.stock_symbol);

            return (
              <div
                key={item.id}
                className={`p-4 rounded-lg border transition-colors ${
                  alertTriggered 
                    ? 'bg-primary/10 border-primary' 
                    : 'bg-muted/30 border-border hover:bg-muted/50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{item.stock_symbol}</span>
                      {alertTriggered && (
                        <Bell className="h-4 w-4 text-primary animate-pulse" />
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground mb-2">{item.stock_name}</div>
                    
                    <div className="flex items-center gap-3">
                      {currentStockPrice ? (
                        <>
                          <span className="text-lg font-bold">
                            ₹{currentStockPrice.price.toFixed(2)}
                          </span>
                          <span className={`text-sm flex items-center ${
                            currentStockPrice.changePercent >= 0 
                              ? 'text-green-600 dark:text-green-400' 
                              : 'text-red-600 dark:text-red-400'
                          }`}>
                            {currentStockPrice.changePercent >= 0 
                              ? <TrendingUp className="h-3 w-3 mr-1" /> 
                              : <TrendingDown className="h-3 w-3 mr-1" />}
                            {currentStockPrice.changePercent >= 0 ? '+' : ''}
                            {currentStockPrice.changePercent.toFixed(2)}%
                          </span>
                        </>
                      ) : (
                        <span className="text-lg font-bold">
                          ₹{item.current_price?.toFixed(2) || '--'}
                        </span>
                      )}
                    </div>

                    {item.alert_type !== 'none' && item.target_price && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        Alert: {item.alert_type === 'above' ? 'Above' : 'Below'} ₹{item.target_price.toFixed(2)}
                      </div>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFromWatchlist(item.id, item.stock_symbol)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};
