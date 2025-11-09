import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    
    if (!url) {
      throw new Error('URL is required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log(`Fetching article from URL: ${url}`);

    // Fetch the article content
    const articleResponse = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!articleResponse.ok) {
      throw new Error(`Failed to fetch article: ${articleResponse.status}`);
    }

    const html = await articleResponse.text();
    
    // Extract text content from HTML (simple extraction)
    const textContent = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 15000); // Limit content length

    console.log(`Extracted ${textContent.length} characters from article`);

    // Summarize using Lovable AI
    const summaryResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a financial news analyst. Summarize articles with key points, financial implications, and sentiment analysis. Format your response with bullet points.'
          },
          {
            role: 'user',
            content: `Summarize this article and provide:\n1. Main topic and key points\n2. Financial implications\n3. Overall sentiment (positive/neutral/negative)\n\nArticle:\n${textContent}`
          }
        ],
      }),
    });

    if (!summaryResponse.ok) {
      if (summaryResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (summaryResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error('AI summarization failed');
    }

    const summaryData = await summaryResponse.json();
    const summary = summaryData.choices[0]?.message?.content || 'Failed to generate summary';

    // Determine sentiment from summary
    const sentimentText = summary.toLowerCase();
    let sentiment = 'neutral';
    if (sentimentText.includes('positive') || sentimentText.includes('growth') || sentimentText.includes('gains')) {
      sentiment = 'positive';
    } else if (sentimentText.includes('negative') || sentimentText.includes('decline') || sentimentText.includes('losses')) {
      sentiment = 'negative';
    }

    console.log('Summary generated successfully');

    return new Response(
      JSON.stringify({
        summary,
        sentiment,
        url,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in summarize-article function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
