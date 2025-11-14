import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Fetching market data...');

    // TODO: Replace with real API when available
    // For now, using demo data structure
    // You can connect to NSE API, Alpha Vantage, or other providers here
    const marketData = {
      indices: [
        {
          name: 'NIFTY 50',
          value: 22453.30,
          change: 145.20,
          changePercent: 0.65,
          timestamp: new Date().toISOString(),
        },
        {
          name: 'SENSEX',
          value: 74112.10,
          change: 259.60,
          changePercent: 0.35,
          timestamp: new Date().toISOString(),
        },
        {
          name: 'NIFTY BANK',
          value: 48234.85,
          change: -123.40,
          changePercent: -0.26,
          timestamp: new Date().toISOString(),
        },
      ],
      topStocks: [
        {
          symbol: 'RELIANCE',
          name: 'Reliance Industries',
          price: 2456.75,
          change: 23.50,
          changePercent: 0.97,
          volume: '5.2M',
        },
        {
          symbol: 'TCS',
          name: 'Tata Consultancy Services',
          price: 3678.30,
          change: -15.20,
          changePercent: -0.41,
          volume: '2.8M',
        },
        {
          symbol: 'HDFCBANK',
          name: 'HDFC Bank',
          price: 1623.45,
          change: 8.70,
          changePercent: 0.54,
          volume: '4.1M',
        },
        {
          symbol: 'INFY',
          name: 'Infosys',
          price: 1456.90,
          change: 12.30,
          changePercent: 0.85,
          volume: '3.5M',
        },
        {
          symbol: 'ICICIBANK',
          name: 'ICICI Bank',
          price: 1089.60,
          change: -5.40,
          changePercent: -0.49,
          volume: '6.2M',
        },
      ],
    };

    console.log('Market data fetched successfully');

    return new Response(
      JSON.stringify(marketData),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error fetching market data:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to fetch market data' 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
