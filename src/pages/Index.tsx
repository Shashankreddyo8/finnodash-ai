import { useState } from "react";
import { QueryInput } from "@/components/QueryInput";
import { LanguageSelector } from "@/components/LanguageSelector";
import { NewsCard } from "@/components/NewsCard";
import { SentimentDisplay } from "@/components/SentimentDisplay";
import { ExecutiveSummary } from "@/components/ExecutiveSummary";
import { VoiceControls } from "@/components/VoiceControls";
import { ChatInterface } from "@/components/ChatInterface";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Article {
  headline: string;
  snippet: string;
  source: string;
  link: string;
  timestamp: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  fullText?: string;
}

const Index = () => {
  const [language, setLanguage] = useState("en");
  const [isLoading, setIsLoading] = useState(false);
  const [hasResults, setHasResults] = useState(false);
  const [news, setNews] = useState<Article[]>([]);
  const [summary, setSummary] = useState("");
  const [currentQuery, setCurrentQuery] = useState("");

  const handleQuery = async (query: string) => {
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  FINNOLAN
                </h1>
                <p className="text-xs text-muted-foreground">AI Financial Assistant</p>
              </div>
            </div>
            <LanguageSelector value={language} onChange={setLanguage} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Search Section */}
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold mb-2">Intelligent Financial Insights</h2>
              <p className="text-muted-foreground">
                Get AI-powered analysis, sentiment tracking, and executive summaries
              </p>
            </div>
            <QueryInput onSubmit={handleQuery} isLoading={isLoading} />
          </div>

          {/* Results Section */}
          {hasResults && (
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Left Column - News & Summary */}
              <div className="lg:col-span-2 space-y-6">
                {/* Executive Summary */}
                <ExecutiveSummary summary={summary} query={currentQuery} />

                {/* News Results */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    Latest News
                    <span className="text-sm font-normal text-muted-foreground">
                      ({news.length} articles)
                    </span>
                  </h3>
                  {news.length > 0 ? (
                    news.map((article, index) => (
                      <NewsCard key={index} {...article} />
                    ))
                  ) : (
                    <p className="text-muted-foreground">No articles found.</p>
                  )}
                </div>
              </div>

              {/* Right Column - Sentiment & Chat */}
              <div className="space-y-6">
                <SentimentDisplay
                  stats={{
                    positive: news.filter(a => a.sentiment === 'positive').length,
                    neutral: news.filter(a => a.sentiment === 'neutral').length,
                    negative: news.filter(a => a.sentiment === 'negative').length,
                  }}
                  totalArticles={news.length}
                />
                <VoiceControls />
              </div>
            </div>
          )}

          {/* Chat Section */}
          {hasResults && (
            <div className="max-w-5xl mx-auto">
              <ChatInterface />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
