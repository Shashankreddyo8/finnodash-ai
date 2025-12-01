import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { QueryInput } from "@/components/QueryInput";
import { LanguageSelector } from "@/components/LanguageSelector";
import { NewsCard } from "@/components/NewsCard";
import { SentimentDisplay } from "@/components/SentimentDisplay";
import { ExecutiveSummary } from "@/components/ExecutiveSummary";
import { VoiceControls } from "@/components/VoiceControls";
import { ChatInterface } from "@/components/ChatInterface";
import { UrlSummarizer } from "@/components/UrlSummarizer";
import { StockMarket } from "@/components/StockMarket";
import { Watchlist } from "@/components/Watchlist";
import { StockSuggestions } from "@/components/StockSuggestions";
import { IndianRupee, Shield, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";

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
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [availableStocks, setAvailableStocks] = useState<Array<{ symbol: string; name: string; price: number }>>([]);
  const [language, setLanguage] = useState("en");
  const [isLoading, setIsLoading] = useState(false);
  const [hasResults, setHasResults] = useState(false);
  const [news, setNews] = useState<Article[]>([]);
  const [summary, setSummary] = useState("");
  const [currentQuery, setCurrentQuery] = useState("");

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) return;
      
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      
      setIsAdmin(roles?.some((r) => r.role === "admin") || false);
    };

    checkAdmin();
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
  };

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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <IndianRupee className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  FINNOLAN
                </h1>
                <p className="text-xs text-muted-foreground">AI Financial Assistant</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <LanguageSelector value={language} onChange={setLanguage} />
              {user ? (
                <>
                  {isAdmin && (
                    <Button variant="outline" size="sm" onClick={() => navigate("/admin")}>
                      <Shield className="h-4 w-4 mr-2" />
                      Admin
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </>
              ) : (
                <Button variant="default" size="sm" onClick={() => navigate("/auth")}>
                  Login
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Stock Market Section */}
          <div className="mb-8 space-y-6">
            <StockMarket onStocksUpdate={setAvailableStocks} />
            <StockSuggestions />
            {user && <Watchlist availableStocks={availableStocks} />}
          </div>

          {/* Search Section */}
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold mb-2">Intelligent Financial Insights</h2>
              <p className="text-muted-foreground">
                Get AI-powered analysis, sentiment tracking, and executive summaries
              </p>
            </div>
            <QueryInput onSubmit={handleQuery} isLoading={isLoading} />
            <UrlSummarizer />
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
