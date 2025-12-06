import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Star, TrendingUp, TrendingDown, Bell, Trash2, Plus, Loader2, Search, Sparkles, Mail, MailCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import confetti from "canvas-confetti";

interface WatchlistItem {
  id: string;
  stock_symbol: string;
  stock_name: string;
  target_price: number | null;
  alert_type: string | null;
  current_price: number | null;
  created_at: string;
  email_alert_enabled: boolean | null;
  last_alert_sent: string | null;
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
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isFetchingPrice, setIsFetchingPrice] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [stockSymbol, setStockSymbol] = useState("");
  const [stockName, setStockName] = useState("");
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [targetPrice, setTargetPrice] = useState("");
  const [alertType, setAlertType] = useState<"above" | "below" | "none">("none");
  const [emailAlertEnabled, setEmailAlertEnabled] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sendingAlertId, setSendingAlertId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const getUserEmail = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setUserEmail(user.email);
      }
    };
    getUserEmail();
  }, []);

  const fetchWatchlist = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setIsInitialLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('watchlist')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching watchlist:', error);
      setIsInitialLoading(false);
      return;
    }

    setWatchlist(data || []);
    setIsInitialLoading(false);
    
    if (data && data.length > 0) {
      fetchPricesForWatchlist(data);
    }
  };

  const fetchPricesForWatchlist = async (items: WatchlistItem[]) => {
    const prices = new Map<string, StockPrice>();
    
    for (const item of items) {
      try {
        const { data, error } = await supabase.functions.invoke('stock-suggestions', {
          body: { symbol: item.stock_symbol }
        });
        
        if (!error && data?.price) {
          prices.set(item.stock_symbol, {
            symbol: item.stock_symbol,
            price: data.price,
            change: data.change || 0,
            changePercent: data.changePercent || 0
          });

          // Check if alert should be triggered
          if (item.email_alert_enabled && item.target_price && item.alert_type !== 'none' && userEmail) {
            const shouldTrigger = 
              (item.alert_type === 'above' && data.price >= item.target_price) ||
              (item.alert_type === 'below' && data.price <= item.target_price);
            
            // Only send if not sent in last hour
            const lastSent = item.last_alert_sent ? new Date(item.last_alert_sent) : null;
            const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
            
            if (shouldTrigger && (!lastSent || lastSent < hourAgo)) {
              sendEmailAlert(item, data.price);
            }
          }
        }
      } catch (err) {
        console.error(`Error fetching price for ${item.stock_symbol}:`, err);
      }
    }
    
    setStockPrices(prices);
  };

  const sendEmailAlert = async (item: WatchlistItem, currentPrice: number) => {
    if (!userEmail || !item.target_price) return;
    
    try {
      const { error } = await supabase.functions.invoke('send-watchlist-alert', {
        body: {
          watchlistId: item.id,
          stockSymbol: item.stock_symbol,
          stockName: item.stock_name,
          currentPrice,
          targetPrice: item.target_price,
          alertType: item.alert_type,
          userEmail
        }
      });

      if (error) {
        console.error('Failed to send email alert:', error);
      } else {
        console.log(`Email alert sent for ${item.stock_symbol}`);
      }
    } catch (err) {
      console.error('Error sending email alert:', err);
    }
  };

  const toggleEmailAlert = async (item: WatchlistItem) => {
    const newValue = !item.email_alert_enabled;
    
    const { error } = await supabase
      .from('watchlist')
      .update({ email_alert_enabled: newValue })
      .eq('id', item.id);

    if (error) {
      toast.error("Failed to update email alert setting");
    } else {
      setWatchlist(prev => 
        prev.map(w => w.id === item.id ? { ...w, email_alert_enabled: newValue } : w)
      );
      toast.success(newValue ? "Email alerts enabled" : "Email alerts disabled");
    }
  };

  const testEmailAlert = async (item: WatchlistItem) => {
    if (!userEmail || !item.target_price) {
      toast.error("Please set a target price first");
      return;
    }

    setSendingAlertId(item.id);
    const currentStockPrice = stockPrices.get(item.stock_symbol);
    
    try {
      const { error } = await supabase.functions.invoke('send-watchlist-alert', {
        body: {
          watchlistId: item.id,
          stockSymbol: item.stock_symbol,
          stockName: item.stock_name,
          currentPrice: currentStockPrice?.price || item.current_price || 0,
          targetPrice: item.target_price,
          alertType: item.alert_type || 'above',
          userEmail
        }
      });

      if (error) {
        toast.error("Failed to send test email");
      } else {
        // Small celebration for successful email
        confetti({
          particleCount: 50,
          spread: 45,
          origin: { y: 0.7 },
          colors: ['#3b82f6', '#60a5fa', '#93c5fd']
        });
        toast.success("Test email sent! ✉️");
      }
    } catch (err) {
      toast.error("Failed to send test email");
    }
    setSendingAlertId(null);
  };

  useEffect(() => {
    fetchWatchlist();
    
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
        body: { symbol: stockSymbol.toUpperCase().trim() }
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

      if (data?.price) {
        setCurrentPrice(data.price);
        setStockName(data.name || stockSymbol.toUpperCase());
        toast.success(`Found ${stockSymbol.toUpperCase()} at ₹${data.price.toFixed(2)}`);
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
        email_alert_enabled: emailAlertEnabled && alertType !== 'none',
      });

    if (error) {
      if (error.code === '23505') {
        toast.error("Stock already in watchlist");
      } else {
        toast.error("Failed to add to watchlist");
      }
    } else {
      // Fire confetti celebration!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6']
      });
      
      toast.success(`${stockSymbol.toUpperCase()} added to watchlist 🎉`);
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
    setEmailAlertEnabled(false);
  };

  const removeFromWatchlist = async (id: string, symbol: string) => {
    setDeletingId(id);
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const { error } = await supabase
      .from('watchlist')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error("Failed to remove from watchlist");
      setDeletingId(null);
    } else {
      toast.success(`${symbol} removed from watchlist`);
      setWatchlist(prev => prev.filter(item => item.id !== id));
      setDeletingId(null);
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

  const WatchlistSkeleton = () => (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-4 rounded-xl border border-border/50 bg-muted/20">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-6 w-20" />
            </div>
            <Skeleton className="h-8 w-8 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <Card className="p-4 sm:p-6 border-border/50 bg-gradient-to-br from-card to-card/80 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10 ring-1 ring-primary/20">
            <Star className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">My Watchlist</h3>
            <p className="text-xs text-muted-foreground">
              {watchlist.length} {watchlist.length === 1 ? 'stock' : 'stocks'} tracked
            </p>
          </div>
        </div>
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button 
              size="sm" 
              className="gap-2 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Stock</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md mx-4 rounded-2xl border-border/50 bg-gradient-to-br from-background to-background/95">
            <DialogHeader className="pb-2">
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Add to Watchlist
              </DialogTitle>
              <DialogDescription>
                Search any stock, crypto, or index to track
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-5 py-4">
              {/* Stock Search */}
              <div className="space-y-2">
                <Label htmlFor="stockSymbol" className="text-sm font-medium">
                  Stock Symbol
                </Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="stockSymbol"
                      placeholder="RELIANCE, BTC, AAPL..."
                      value={stockSymbol}
                      onChange={(e) => {
                        setStockSymbol(e.target.value.toUpperCase());
                        setCurrentPrice(null);
                        setStockName("");
                      }}
                      className="pl-9 h-11 rounded-xl border-border/50 bg-muted/30 focus:bg-background transition-colors"
                    />
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={fetchStockPrice}
                    disabled={isFetchingPrice || !stockSymbol.trim()}
                    className="h-11 px-4 rounded-xl border-border/50 hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                  >
                    {isFetchingPrice ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Search"
                    )}
                  </Button>
                </div>
              </div>

              {/* Stock Preview */}
              <div 
                className={`overflow-hidden transition-all duration-500 ease-out ${
                  currentPrice !== null ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="p-4 rounded-xl bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-lg">{stockName}</p>
                      <p className="text-sm text-muted-foreground">{stockSymbol}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">
                        ₹{currentPrice?.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">Current Price</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Alert Settings */}
              <div className="space-y-2">
                <Label htmlFor="alertType" className="text-sm font-medium">
                  Price Alert
                </Label>
                <Select value={alertType} onValueChange={(value: "above" | "below" | "none") => setAlertType(value)}>
                  <SelectTrigger className="h-11 rounded-xl border-border/50 bg-muted/30 focus:bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border/50">
                    <SelectItem value="none" className="rounded-lg">No Alert</SelectItem>
                    <SelectItem value="above" className="rounded-lg">Alert when price rises above</SelectItem>
                    <SelectItem value="below" className="rounded-lg">Alert when price drops below</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Target Price */}
              <div 
                className={`overflow-hidden transition-all duration-400 ease-out ${
                  alertType !== "none" ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="targetPrice" className="text-sm font-medium">
                      Target Price (₹)
                    </Label>
                    <Input
                      id="targetPrice"
                      type="number"
                      step="0.01"
                      placeholder="Enter target price"
                      value={targetPrice}
                      onChange={(e) => setTargetPrice(e.target.value)}
                      className="h-11 rounded-xl border-border/50 bg-muted/30 focus:bg-background transition-colors"
                    />
                  </div>
                  
                  {/* Email Alert Toggle */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-sm font-medium">Email Alerts</p>
                        <p className="text-xs text-muted-foreground">Get notified via email</p>
                      </div>
                    </div>
                    <Switch
                      checked={emailAlertEnabled}
                      onCheckedChange={setEmailAlertEnabled}
                    />
                  </div>
                </div>
              </div>
            </div>

            <Button 
              onClick={addToWatchlist} 
              disabled={isLoading || currentPrice === null} 
              className="w-full h-12 rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add to Watchlist
                </>
              )}
            </Button>
          </DialogContent>
        </Dialog>
      </div>

      {/* Content */}
      {isInitialLoading ? (
        <WatchlistSkeleton />
      ) : watchlist.length === 0 ? (
        <div className="text-center py-12 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-muted/50 mb-4">
            <Star className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <p className="font-medium text-foreground mb-1">Your watchlist is empty</p>
          <p className="text-sm text-muted-foreground mb-4">
            Add stocks, crypto, or indices to start tracking
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsOpen(true)}
            className="rounded-xl"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add your first stock
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {watchlist.map((item, index) => {
            const alertTriggered = checkPriceAlert(item);
            const currentStockPrice = stockPrices.get(item.stock_symbol);
            const isDeleting = deletingId === item.id;
            const isSendingAlert = sendingAlertId === item.id;

            return (
              <div
                key={item.id}
                className={`p-4 rounded-xl border transition-all duration-300 ease-out ${
                  isDeleting 
                    ? 'opacity-0 scale-95 -translate-x-4' 
                    : 'opacity-100 scale-100 translate-x-0'
                } ${
                  alertTriggered 
                    ? 'bg-gradient-to-r from-primary/10 to-primary/5 border-primary/30 shadow-md shadow-primary/10' 
                    : 'bg-muted/20 border-border/50 hover:bg-muted/40 hover:border-border hover:shadow-sm'
                }`}
                style={{
                  animationDelay: `${index * 50}ms`,
                  animation: 'fade-in 0.4s ease-out forwards'
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-semibold truncate">{item.stock_symbol}</span>
                      {alertTriggered && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/20 text-primary animate-pulse">
                          <Bell className="h-3 w-3" />
                          Alert
                        </span>
                      )}
                      {item.email_alert_enabled && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-600 dark:text-green-400">
                          <MailCheck className="h-3 w-3" />
                          Email
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground mb-2 truncate">
                      {item.stock_name}
                    </div>
                    
                    <div className="flex items-center gap-3 flex-wrap">
                      {currentStockPrice ? (
                        <>
                          <span className="text-xl font-bold">
                            ₹{currentStockPrice.price.toFixed(2)}
                          </span>
                          <span className={`inline-flex items-center text-sm font-medium px-2 py-0.5 rounded-full ${
                            currentStockPrice.changePercent >= 0 
                              ? 'bg-green-500/10 text-green-600 dark:text-green-400' 
                              : 'bg-red-500/10 text-red-600 dark:text-red-400'
                          }`}>
                            {currentStockPrice.changePercent >= 0 
                              ? <TrendingUp className="h-3 w-3 mr-1" /> 
                              : <TrendingDown className="h-3 w-3 mr-1" />}
                            {currentStockPrice.changePercent >= 0 ? '+' : ''}
                            {currentStockPrice.changePercent.toFixed(2)}%
                          </span>
                        </>
                      ) : (
                        <span className="text-xl font-bold">
                          ₹{item.current_price?.toFixed(2) || '--'}
                        </span>
                      )}
                    </div>

                    {item.alert_type !== 'none' && item.target_price && (
                      <div className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">
                        <Bell className="h-3 w-3" />
                        {item.alert_type === 'above' ? 'Above' : 'Below'} ₹{item.target_price.toFixed(2)}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {/* Email Alert Toggle */}
                    {item.alert_type !== 'none' && item.target_price && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleEmailAlert(item)}
                        className={`h-9 w-9 rounded-xl transition-all duration-200 ${
                          item.email_alert_enabled 
                            ? 'text-green-600 bg-green-500/10 hover:bg-green-500/20' 
                            : 'text-muted-foreground hover:text-primary hover:bg-primary/10'
                        }`}
                        title={item.email_alert_enabled ? "Disable email alerts" : "Enable email alerts"}
                      >
                        {item.email_alert_enabled ? (
                          <MailCheck className="h-4 w-4" />
                        ) : (
                          <Mail className="h-4 w-4" />
                        )}
                      </Button>
                    )}

                    {/* Test Email Button */}
                    {item.email_alert_enabled && item.target_price && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => testEmailAlert(item)}
                        disabled={isSendingAlert}
                        className="h-9 w-9 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200"
                        title="Send test email"
                      >
                        {isSendingAlert ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Bell className="h-4 w-4" />
                        )}
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFromWatchlist(item.id, item.stock_symbol)}
                      disabled={isDeleting}
                      className="h-9 w-9 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
                    >
                      {isDeleting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};
