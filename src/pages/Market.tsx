import { useState } from "react";
import { StockMarket } from "@/components/StockMarket";

const Market = () => {
  const [_, setAvailableStocks] = useState<Array<{ symbol: string; name: string; price: number }>>([]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Market Data</h1>
        <p className="text-muted-foreground">
          Live market indices and top stock prices
        </p>
      </div>

      <StockMarket onStocksUpdate={setAvailableStocks} />
    </div>
  );
};

export default Market;
