import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Star, TrendingUp, TrendingDown, Bell, Trash2, Plus } from "lucide-react";
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

interface WatchlistProps {
  availableStocks: Array<{ symbol: string; name: string; price: number }>;
}

export const Watchlist = ({ availableStocks }: WatchlistProps) => {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState("");
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
  };

  useEffect(() => {
    fetchWatchlist();
  }, []);

  const addToWatchlist = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please log in to add stocks to watchlist");
      return;
    }

    if (!selectedStock) {
      toast.error("Please select a stock");
      return;
    }

    setIsLoading(true);
    const stock = availableStocks.find(s => s.symbol === selectedStock);
    
    if (!stock) {
      toast.error("Stock not found");
      setIsLoading(false);
      return;
    }

    const { error } = await supabase
      .from('watchlist')
      .insert({
        user_id: user.id,
        stock_symbol: stock.symbol,
        stock_name: stock.name,
        current_price: stock.price,
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
      toast.success(`${stock.symbol} added to watchlist`);
      fetchWatchlist();
      setIsOpen(false);
      setSelectedStock("");
      setTargetPrice("");
      setAlertType("none");
    }

    setIsLoading(false);
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
    if (!item.target_price || !item.current_price || item.alert_type === 'none') return false;
    
    if (item.alert_type === 'above' && item.current_price >= item.target_price) return true;
    if (item.alert_type === 'below' && item.current_price <= item.target_price) return true;
    return false;
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">My Watchlist</h3>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
                Select a stock and optionally set a price alert.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="stock">Select Stock</Label>
                <Select value={selectedStock} onValueChange={setSelectedStock}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a stock" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableStocks.map((stock) => (
                      <SelectItem key={stock.symbol} value={stock.symbol}>
                        {stock.symbol} - {stock.name} (₹{stock.price.toFixed(2)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
            <Button onClick={addToWatchlist} disabled={isLoading} className="w-full">
              {isLoading ? "Adding..." : "Add to Watchlist"}
            </Button>
          </DialogContent>
        </Dialog>
      </div>

      {watchlist.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Star className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Your watchlist is empty</p>
          <p className="text-sm">Add stocks to track them here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {watchlist.map((item) => {
            const alertTriggered = checkPriceAlert(item);
            const currentStock = availableStocks.find(s => s.symbol === item.stock_symbol);
            const priceChange = currentStock && item.current_price 
              ? ((currentStock.price - item.current_price) / item.current_price) * 100
              : 0;

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
                    
                    {currentStock && (
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold">
                          ₹{currentStock.price.toFixed(2)}
                        </span>
                        <span className={`text-sm flex items-center ${
                          priceChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        }`}>
                          {priceChange >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                          {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
                        </span>
                      </div>
                    )}

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