import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { QueryInput } from "@/components/QueryInput";
import { NewsCard } from "@/components/NewsCard";
import { SentimentDisplay } from "@/components/SentimentDisplay";
import { ExecutiveSummary } from "@/components/ExecutiveSummary";
import { VoiceControls } from "@/components/VoiceControls";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useLayoutContext } from "@/components/AppLayout";

interface Article {
  headline: string;
  snippet: string;
  source: string;
  link: string;
  timestamp: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  fullText?: string;
}

const News = () => {
  const navigate = useNavigate();
  const { user, language } = useLayoutContext();
  const [isLoading, setIsLoading] = useState(false);
  const [hasResults, setHasResults] = useState(false);
  const [news, setNews] = useState<Article[]>([]);
  const [summary, setSummary] = useState("");
  const [currentQuery, setCurrentQuery] = useState("");

  const handleQuery = async (query: string) => {
    if (!user) {
      toast.error("Please login to search");
      navigate("/auth");
      return;
    }

    setIsLoading(true);
    setCurrentQuery(query);
    toast.info(`Searching for: ${query}`);
    
    try {
      const { data, error } = await supabase.functions.invoke('fetch-news', {
        body: { query, language }
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      setNews(data.articles || []);
      setSummary(data.summary || '');
      setHasResults(true);
      toast.success(`Found ${data.articles?.length || 0} articles`);

      if (user) {
        const sentimentStats = {
          positive: (data.articles || []).filter((a: Article) => a.sentiment === 'positive').length,
          neutral: (data.articles || []).filter((a: Article) => a.sentiment === 'neutral').length,
          negative: (data.articles || []).filter((a: Article) => a.sentiment === 'negative').length,
        };

        await supabase.from('search_history').insert({
          user_id: user.id,
          query,
          results_count: data.articles?.length || 0,
          sentiment_positive: sentimentStats.positive,
          sentiment_neutral: sentimentStats.neutral,
          sentiment_negative: sentimentStats.negative,
          language,
        });
      }
    } catch (error) {
      console.error('Error fetching news:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch news');
      setNews([]);
      setSummary('');
      setHasResults(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-3xl font-bold mb-2">News Search</h1>
        <p className="text-muted-foreground">
          Get AI-powered analysis, sentiment tracking, and executive summaries
        </p>
      </div>

      <div className="max-w-3xl mx-auto animate-scale-in" style={{ animationDelay: '0.1s' }}>
        <QueryInput onSubmit={handleQuery} isLoading={isLoading} />
      </div>

      {hasResults && (
        <div className="grid lg:grid-cols-3 gap-6 animate-fade-in">
          <div className="lg:col-span-2 space-y-6">
            <ExecutiveSummary summary={summary} query={currentQuery} />
            <div className="space-y-4">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                Latest News
                <span className="text-sm font-normal text-muted-foreground">
                  ({news.length} articles)
                </span>
              </h3>
              {news.length > 0 ? (
                news.map((article, index) => (
                  <div 
                    key={index} 
                    className="animate-slide-up" 
                    style={{ animationDelay: `${index * 0.08}s` }}
                  >
                    <NewsCard {...article} />
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">No articles found.</p>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="animate-slide-in-right" style={{ animationDelay: '0.2s' }}>
              <SentimentDisplay
                stats={{
                  positive: news.filter(a => a.sentiment === 'positive').length,
                  neutral: news.filter(a => a.sentiment === 'neutral').length,
                  negative: news.filter(a => a.sentiment === 'negative').length,
                }}
                totalArticles={news.length}
              />
            </div>
            <div className="animate-slide-in-right" style={{ animationDelay: '0.3s' }}>
              <VoiceControls />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default News;
