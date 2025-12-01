import { useState } from "react";
import { StockMarket } from "@/components/StockMarket";
import { StockSuggestions } from "@/components/StockSuggestions";
import { Watchlist } from "@/components/Watchlist";
import { useLayoutContext } from "@/components/AppLayout";

const Dashboard = () => {
  const { user } = useLayoutContext();
  const [availableStocks, setAvailableStocks] = useState<Array<{ symbol: string; name: string; price: number }>>([]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of market data, stock analysis, and your watchlist
        </p>
      </div>

      <div className="grid gap-6">
        <StockMarket onStocksUpdate={setAvailableStocks} />
        <StockSuggestions />
        {user && <Watchlist availableStocks={availableStocks} />}
      </div>
    </div>
  );
};

export default Dashboard;
