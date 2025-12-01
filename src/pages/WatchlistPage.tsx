import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Watchlist } from "@/components/Watchlist";
import { StockMarket } from "@/components/StockMarket";
import { useLayoutContext } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";

const WatchlistPage = () => {
  const navigate = useNavigate();
  const { user } = useLayoutContext();
  const [availableStocks, setAvailableStocks] = useState<Array<{ symbol: string; name: string; price: number }>>([]);

  if (!user) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Watchlist</h1>
          <p className="text-muted-foreground">
            Track your favorite stocks and set price alerts
          </p>
        </div>

        <Card className="p-8 text-center">
          <LogIn className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">Login Required</h2>
          <p className="text-muted-foreground mb-4">
            Please login to access your watchlist and set price alerts.
          </p>
          <Button onClick={() => navigate("/auth")}>
            Login to Continue
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Watchlist</h1>
        <p className="text-muted-foreground">
          Track your favorite stocks and set price alerts
        </p>
      </div>

      <div className="grid gap-6">
        <StockMarket onStocksUpdate={setAvailableStocks} />
        <Watchlist availableStocks={availableStocks} />
      </div>
    </div>
  );
};

export default WatchlistPage;
