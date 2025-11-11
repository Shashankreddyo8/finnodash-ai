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
    const { query, language = 'en' } = await req.json();
    
    // Validate and sanitize query
    const trimmedQuery = query?.trim();
    if (!trimmedQuery || trimmedQuery.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Query parameter is required and cannot be empty' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const GNEWS_API_KEY = Deno.env.get('GNEWS_API_KEY');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!GNEWS_API_KEY) {
      throw new Error('GNEWS_API_KEY is not configured');
    }
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log(`Fetching news for query: ${trimmedQuery}, language: ${language}`);

    // Fetch news from GNews API
    const gnewsUrl = `https://gnews.io/api/v4/search?q=${encodeURIComponent(trimmedQuery)}&lang=${language}&max=10&apikey=${GNEWS_API_KEY}`;
    const newsResponse = await fetch(gnewsUrl);
    
    if (!newsResponse.ok) {
      const errorText = await newsResponse.text();
      console.error('GNews API error:', newsResponse.status, errorText);
      throw new Error(`GNews API error: ${newsResponse.status}`);
    }

    const newsData = await newsResponse.json();
    console.log(`Fetched ${newsData.articles?.length || 0} articles`);

    if (!newsData.articles || newsData.articles.length === 0) {
      return new Response(
        JSON.stringify({ articles: [], summary: 'No articles found for this query.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Summarize each article using Lovable AI (Gemini)
    const summarizedArticles = await Promise.all(
      newsData.articles.map(async (article: any) => {
        try {
          const summaryResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${LOVABLE_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash-lite',
              messages: [
                {
                  role: 'system',
                  content: 'You are a financial news analyst. Summarize news articles concisely in 2-3 sentences, focusing on key financial implications.'
                },
                {
                  role: 'user',
                  content: `Summarize this article:\n\nTitle: ${article.title}\n\nContent: ${article.description || article.content || ''}`
                }
              ],
            }),
          });

          if (!summaryResponse.ok) {
            console.error(`AI summary error for article "${article.title}":`, summaryResponse.status);
            return {
              headline: article.title,
              snippet: article.description || 'No description available',
              source: article.source.name,
              link: article.url,
              timestamp: new Date(article.publishedAt).toLocaleString(),
              sentiment: 'neutral',
              fullText: article.content || article.description || '',
            };
          }

          const summaryData = await summaryResponse.json();
          const summary = summaryData.choices[0]?.message?.content || article.description;

          // Simple sentiment analysis based on keywords
          const sentimentText = summary.toLowerCase();
          let sentiment = 'neutral';
          if (sentimentText.includes('growth') || sentimentText.includes('gains') || sentimentText.includes('positive') || sentimentText.includes('strong')) {
            sentiment = 'positive';
          } else if (sentimentText.includes('decline') || sentimentText.includes('losses') || sentimentText.includes('negative') || sentimentText.includes('concern')) {
            sentiment = 'negative';
          }

          return {
            headline: article.title,
            snippet: summary,
            source: article.source.name,
            link: article.url,
            timestamp: new Date(article.publishedAt).toLocaleString(),
            sentiment: sentiment as 'positive' | 'neutral' | 'negative',
            fullText: article.content || article.description || '',
          };
        } catch (error) {
          console.error(`Error processing article "${article.title}":`, error);
          return {
            headline: article.title,
            snippet: article.description || 'No description available',
            source: article.source.name,
            link: article.url,
            timestamp: new Date(article.publishedAt).toLocaleString(),
            sentiment: 'neutral' as const,
            fullText: article.content || article.description || '',
          };
        }
      })
    );

    // Generate overall summary
    const allTitles = summarizedArticles.map(a => a.headline).join('\n');
    const overallSummaryResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
            content: 'You are a financial analyst. Create an executive summary of news trends in bullet points.'
          },
          {
            role: 'user',
            content: `Create an executive summary for these news headlines:\n\n${allTitles}`
          }
        ],
      }),
    });

    let overallSummary = 'No summary available';
    if (overallSummaryResponse.ok) {
      const summaryData = await overallSummaryResponse.json();
      overallSummary = summaryData.choices[0]?.message?.content || 'No summary available';
    }

    return new Response(
      JSON.stringify({
        articles: summarizedArticles,
        summary: overallSummary,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in fetch-news function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
