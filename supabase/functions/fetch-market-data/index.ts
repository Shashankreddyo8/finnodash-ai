import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function fetchYahooQuote(symbol: string): Promise<{
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  shortName?: string;
} | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) {
      console.error(`Failed to fetch ${symbol}: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    const result = data.chart?.result?.[0];
    
    if (!result) return null;
    
    const meta = result.meta;
    const previousClose = meta.previousClose || meta.chartPreviousClose;
    const currentPrice = meta.regularMarketPrice;
    const change = currentPrice - previousClose;
    const changePercent = (change / previousClose) * 100;
    
    return {
      price: currentPrice,
      change,
      changePercent,
      volume: meta.regularMarketVolume || 0,
      shortName: meta.shortName
    };
  } catch (error) {
    console.error(`Error fetching ${symbol}:`, error);
    return null;
  }
}

function formatVolume(volume: number): string {
  if (volume >= 10000000) return `${(volume / 10000000).toFixed(1)}Cr`;
  if (volume >= 100000) return `${(volume / 100000).toFixed(1)}L`;
  if (volume >= 1000) return `${(volume / 1000).toFixed(1)}K`;
  return volume.toString();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Fetching real-time market data from Yahoo Finance...');

    // Indian market indices symbols for Yahoo Finance
    const indexSymbols = [
      { symbol: '^NSEI', name: 'NIFTY 50' },
      { symbol: '^BSESN', name: 'SENSEX' },
      { symbol: '^NSEBANK', name: 'NIFTY BANK' }
    ];

    // Top Indian stocks (NSE) - add .NS suffix for Yahoo Finance
    const stockSymbols = [
      { symbol: 'RELIANCE.NS', displaySymbol: 'RELIANCE', name: 'Reliance Industries' },
      { symbol: 'TCS.NS', displaySymbol: 'TCS', name: 'Tata Consultancy Services' },
      { symbol: 'HDFCBANK.NS', displaySymbol: 'HDFCBANK', name: 'HDFC Bank' },
      { symbol: 'INFY.NS', displaySymbol: 'INFY', name: 'Infosys' },
      { symbol: 'ICICIBANK.NS', displaySymbol: 'ICICIBANK', name: 'ICICI Bank' }
    ];

    // Fetch all data in parallel
    const [indicesResults, stocksResults] = await Promise.all([
      Promise.all(indexSymbols.map(async (idx) => {
        const quote = await fetchYahooQuote(idx.symbol);
        return {
          name: idx.name,
          value: quote?.price || 0,
          change: quote?.change || 0,
          changePercent: quote?.changePercent || 0,
          timestamp: new Date().toISOString()
        };
      })),
      Promise.all(stockSymbols.map(async (stock) => {
        const quote = await fetchYahooQuote(stock.symbol);
        return {
          symbol: stock.displaySymbol,
          name: stock.name,
          price: quote?.price || 0,
          change: quote?.change || 0,
          changePercent: quote?.changePercent || 0,
          volume: formatVolume(quote?.volume || 0)
        };
      }))
    ]);

    // Filter out any failed fetches (price = 0)
    const validIndices = indicesResults.filter(i => i.value > 0);
    const validStocks = stocksResults.filter(s => s.price > 0);

    console.log(`Fetched ${validIndices.length} indices and ${validStocks.length} stocks`);

    const marketData = {
      indices: validIndices,
      topStocks: validStocks
    };

    return new Response(
      JSON.stringify(marketData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching market data:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to fetch market data' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
