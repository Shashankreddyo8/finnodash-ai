import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Stock symbol mapping for Yahoo Finance (NSE stocks need .NS suffix)
const stockMapping: Record<string, { yahooSymbol: string; name: string }> = {
  'RELIANCE': { yahooSymbol: 'RELIANCE.NS', name: 'Reliance Industries' },
  'TCS': { yahooSymbol: 'TCS.NS', name: 'Tata Consultancy Services' },
  'HDFCBANK': { yahooSymbol: 'HDFCBANK.NS', name: 'HDFC Bank' },
  'INFY': { yahooSymbol: 'INFY.NS', name: 'Infosys' },
  'ICICIBANK': { yahooSymbol: 'ICICIBANK.NS', name: 'ICICI Bank' },
  'SBIN': { yahooSymbol: 'SBIN.NS', name: 'State Bank of India' },
  'BHARTIARTL': { yahooSymbol: 'BHARTIARTL.NS', name: 'Bharti Airtel' },
  'ITC': { yahooSymbol: 'ITC.NS', name: 'ITC Limited' },
  'KOTAKBANK': { yahooSymbol: 'KOTAKBANK.NS', name: 'Kotak Mahindra Bank' },
  'LT': { yahooSymbol: 'LT.NS', name: 'Larsen & Toubro' },
  'WIPRO': { yahooSymbol: 'WIPRO.NS', name: 'Wipro' },
  'AXISBANK': { yahooSymbol: 'AXISBANK.NS', name: 'Axis Bank' },
  'TATAMOTORS': { yahooSymbol: 'TATAMOTORS.NS', name: 'Tata Motors' },
  'MARUTI': { yahooSymbol: 'MARUTI.NS', name: 'Maruti Suzuki' },
  'SUNPHARMA': { yahooSymbol: 'SUNPHARMA.NS', name: 'Sun Pharma' },
  'HINDUNILVR': { yahooSymbol: 'HINDUNILVR.NS', name: 'Hindustan Unilever' },
  'BAJFINANCE': { yahooSymbol: 'BAJFINANCE.NS', name: 'Bajaj Finance' },
  'ASIANPAINT': { yahooSymbol: 'ASIANPAINT.NS', name: 'Asian Paints' },
  'TITAN': { yahooSymbol: 'TITAN.NS', name: 'Titan Company' },
  'ULTRACEMCO': { yahooSymbol: 'ULTRACEMCO.NS', name: 'UltraTech Cement' },
  'NESTLEIND': { yahooSymbol: 'NESTLEIND.NS', name: 'Nestle India' },
  'TATASTEEL': { yahooSymbol: 'TATASTEEL.NS', name: 'Tata Steel' },
  'POWERGRID': { yahooSymbol: 'POWERGRID.NS', name: 'Power Grid Corp' },
  'NTPC': { yahooSymbol: 'NTPC.NS', name: 'NTPC Limited' },
  'ONGC': { yahooSymbol: 'ONGC.NS', name: 'Oil & Natural Gas Corp' },
  'ADANIENT': { yahooSymbol: 'ADANIENT.NS', name: 'Adani Enterprises' },
  'ADANIPORTS': { yahooSymbol: 'ADANIPORTS.NS', name: 'Adani Ports' },
  'COALINDIA': { yahooSymbol: 'COALINDIA.NS', name: 'Coal India' },
  'JSWSTEEL': { yahooSymbol: 'JSWSTEEL.NS', name: 'JSW Steel' },
  'TECHM': { yahooSymbol: 'TECHM.NS', name: 'Tech Mahindra' },
  // Cryptocurrencies
  'BTC': { yahooSymbol: 'BTC-USD', name: 'Bitcoin' },
  'ETH': { yahooSymbol: 'ETH-USD', name: 'Ethereum' },
  'SOL': { yahooSymbol: 'SOL-USD', name: 'Solana' },
  'XRP': { yahooSymbol: 'XRP-USD', name: 'Ripple' },
  'DOGE': { yahooSymbol: 'DOGE-USD', name: 'Dogecoin' },
  'ADA': { yahooSymbol: 'ADA-USD', name: 'Cardano' },
  'MATIC': { yahooSymbol: 'MATIC-USD', name: 'Polygon' },
  'DOT': { yahooSymbol: 'DOT-USD', name: 'Polkadot' },
  'AVAX': { yahooSymbol: 'AVAX-USD', name: 'Avalanche' },
  'LINK': { yahooSymbol: 'LINK-USD', name: 'Chainlink' },
  // US Stocks
  'AAPL': { yahooSymbol: 'AAPL', name: 'Apple Inc.' },
  'GOOGL': { yahooSymbol: 'GOOGL', name: 'Alphabet Inc.' },
  'MSFT': { yahooSymbol: 'MSFT', name: 'Microsoft Corp.' },
  'AMZN': { yahooSymbol: 'AMZN', name: 'Amazon.com Inc.' },
  'TSLA': { yahooSymbol: 'TSLA', name: 'Tesla Inc.' },
  'NVDA': { yahooSymbol: 'NVDA', name: 'NVIDIA Corp.' },
  'META': { yahooSymbol: 'META', name: 'Meta Platforms Inc.' },
};

async function fetchYahooQuote(symbol: string): Promise<{
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high52w: number;
  low52w: number;
  marketCap: number;
  pe: number;
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
      high52w: meta.fiftyTwoWeekHigh || currentPrice * 1.2,
      low52w: meta.fiftyTwoWeekLow || currentPrice * 0.8,
      marketCap: meta.marketCap || 0,
      pe: meta.trailingPE || 0
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
    const { symbol } = await req.json();
    
    if (!symbol) {
      return new Response(
        JSON.stringify({ error: 'Stock symbol is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const upperSymbol = symbol.toUpperCase().replace('.NS', '');
    const stockInfo = stockMapping[upperSymbol];

    if (!stockInfo) {
      // Try to fetch directly with .NS suffix
      const directSymbol = upperSymbol.includes('.') ? upperSymbol : `${upperSymbol}.NS`;
      const quote = await fetchYahooQuote(directSymbol);
      
      if (!quote || quote.price === 0) {
        return new Response(
          JSON.stringify({ 
            error: `Symbol "${upperSymbol}" not found. Try: Indian stocks (RELIANCE, TCS, INFY), US stocks (AAPL, GOOGL, TSLA), or Crypto (BTC, ETH, SOL)` 
          }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const yahooSymbol = stockInfo?.yahooSymbol || `${upperSymbol}.NS`;
    const stockName = stockInfo?.name || upperSymbol;

    console.log(`Fetching real-time data for ${yahooSymbol}...`);

    const quote = await fetchYahooQuote(yahooSymbol);

    if (!quote || quote.price === 0) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch stock data. Market may be closed or symbol invalid.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetched ${upperSymbol}: ₹${quote.price}`);

    // Get AI suggestions using Lovable AI
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an expert Indian stock market analyst. Analyze the given stock data and provide a recommendation.
            Always respond with valid JSON in this exact format:
            {
              "recommendation": "BUY" | "SELL" | "HOLD",
              "confidence": number between 1-100,
              "reasons": ["reason1", "reason2", "reason3"],
              "riskLevel": "LOW" | "MEDIUM" | "HIGH",
              "targetPrice": number,
              "summary": "brief 1-2 sentence summary"
            }
            Consider the current price, daily change, 52-week range, and general market conditions.
            Be balanced and realistic in your analysis.`
          },
          {
            role: "user",
            content: `Analyze this Indian stock:
            Symbol: ${upperSymbol}
            Company: ${stockName}
            Current Price: ₹${quote.price.toFixed(2)}
            Daily Change: ${quote.change >= 0 ? '+' : ''}₹${quote.change.toFixed(2)} (${quote.changePercent >= 0 ? '+' : ''}${quote.changePercent.toFixed(2)}%)
            52-Week High: ₹${quote.high52w.toFixed(2)}
            52-Week Low: ₹${quote.low52w.toFixed(2)}
            Volume: ${formatVolume(quote.volume)}
            
            Provide your recommendation in JSON format only.`
          }
        ],
      }),
    });

    let suggestion;
    
    if (!aiResponse.ok) {
      console.error("AI API error:", aiResponse.status);
      suggestion = {
        recommendation: "HOLD",
        confidence: 50,
        reasons: ["AI analysis temporarily unavailable", "Please do your own research", "Consult a financial advisor"],
        riskLevel: "MEDIUM",
        targetPrice: quote.price * 1.05,
        summary: "Unable to generate AI analysis. Please consult other sources."
      };
    } else {
      const aiData = await aiResponse.json();
      const content = aiData.choices?.[0]?.message?.content || "";
      
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          suggestion = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("No JSON found");
        }
      } catch (parseError) {
        console.error("Error parsing AI response:", parseError);
        suggestion = {
          recommendation: "HOLD",
          confidence: 50,
          reasons: ["Analysis parsing error", "Please do your own research"],
          riskLevel: "MEDIUM",
          targetPrice: quote.price * 1.05,
          summary: "Unable to parse AI analysis."
        };
      }
    }

    console.log(`Suggestion for ${upperSymbol}: ${suggestion.recommendation}`);

    return new Response(
      JSON.stringify({
        symbol: upperSymbol,
        name: stockName,
        price: quote.price,
        change: quote.change,
        changePercent: quote.changePercent,
        volume: formatVolume(quote.volume),
        high52w: quote.high52w,
        low52w: quote.low52w,
        suggestion
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in stock-suggestions:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
