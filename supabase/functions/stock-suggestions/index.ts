import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Mock stock data - in production, replace with real API
const stockData: Record<string, { name: string; price: number; change: number; changePercent: number }> = {
  'RELIANCE': { name: 'Reliance Industries', price: 2456.75, change: 23.5, changePercent: 0.97 },
  'TCS': { name: 'Tata Consultancy Services', price: 3678.30, change: -15.2, changePercent: -0.41 },
  'HDFCBANK': { name: 'HDFC Bank', price: 1623.45, change: 8.7, changePercent: 0.54 },
  'INFY': { name: 'Infosys', price: 1456.90, change: 12.3, changePercent: 0.85 },
  'ICICIBANK': { name: 'ICICI Bank', price: 1089.60, change: -5.4, changePercent: -0.49 },
  'SBIN': { name: 'State Bank of India', price: 756.30, change: 4.2, changePercent: 0.56 },
  'BHARTIARTL': { name: 'Bharti Airtel', price: 1234.50, change: 18.9, changePercent: 1.55 },
  'ITC': { name: 'ITC Limited', price: 456.80, change: -2.1, changePercent: -0.46 },
  'KOTAKBANK': { name: 'Kotak Mahindra Bank', price: 1789.25, change: 11.3, changePercent: 0.64 },
  'LT': { name: 'Larsen & Toubro', price: 3456.70, change: 28.4, changePercent: 0.83 },
  'WIPRO': { name: 'Wipro', price: 456.30, change: 3.2, changePercent: 0.71 },
  'AXISBANK': { name: 'Axis Bank', price: 1123.45, change: -8.9, changePercent: -0.79 },
  'TATAMOTORS': { name: 'Tata Motors', price: 876.50, change: 15.6, changePercent: 1.81 },
  'MARUTI': { name: 'Maruti Suzuki', price: 11234.60, change: 89.3, changePercent: 0.80 },
  'SUNPHARMA': { name: 'Sun Pharma', price: 1567.80, change: -12.4, changePercent: -0.78 },
};

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

    const upperSymbol = symbol.toUpperCase();
    const stock = stockData[upperSymbol];

    if (!stock) {
      return new Response(
        JSON.stringify({ error: 'Stock not found. Try: RELIANCE, TCS, HDFCBANK, INFY, ICICIBANK, etc.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching suggestions for ${upperSymbol}...`);

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
            content: `You are a stock market analyst. Analyze the given stock and provide a clear recommendation.
            Always respond with valid JSON in this exact format:
            {
              "recommendation": "BUY" | "SELL" | "HOLD",
              "confidence": number between 1-100,
              "reasons": ["reason1", "reason2", "reason3"],
              "riskLevel": "LOW" | "MEDIUM" | "HIGH",
              "targetPrice": number,
              "summary": "brief 1-2 sentence summary"
            }
            Base your analysis on general market knowledge about Indian stocks.`
          },
          {
            role: "user",
            content: `Analyze this stock:
            Symbol: ${upperSymbol}
            Company: ${stock.name}
            Current Price: ₹${stock.price}
            Daily Change: ${stock.change >= 0 ? '+' : ''}${stock.change} (${stock.changePercent >= 0 ? '+' : ''}${stock.changePercent}%)
            
            Provide your recommendation in JSON format.`
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      console.error("AI API error:", aiResponse.status);
      // Return stock data with default suggestion if AI fails
      return new Response(
        JSON.stringify({
          symbol: upperSymbol,
          ...stock,
          suggestion: {
            recommendation: "HOLD",
            confidence: 50,
            reasons: ["AI analysis temporarily unavailable", "Please do your own research", "Consult a financial advisor"],
            riskLevel: "MEDIUM",
            targetPrice: stock.price * 1.05,
            summary: "Unable to generate AI analysis. Please consult other sources."
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "";
    
    // Parse the JSON from AI response
    let suggestion;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        suggestion = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      suggestion = {
        recommendation: "HOLD",
        confidence: 50,
        reasons: ["Analysis parsing error", "Please do your own research"],
        riskLevel: "MEDIUM",
        targetPrice: stock.price * 1.05,
        summary: "Unable to parse AI analysis. Please consult other sources."
      };
    }

    console.log(`Suggestion generated for ${upperSymbol}: ${suggestion.recommendation}`);

    return new Response(
      JSON.stringify({
        symbol: upperSymbol,
        ...stock,
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
