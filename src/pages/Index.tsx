import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { QueryInput } from "@/components/QueryInput";
import { LanguageSelector } from "@/components/LanguageSelector";
import { NewsCard } from "@/components/NewsCard";
import { SentimentDisplay } from "@/components/SentimentDisplay";
import { ExecutiveSummary } from "@/components/ExecutiveSummary";
import { VoiceControls } from "@/components/VoiceControls";
import { ChatInterface } from "@/components/ChatInterface";
import { Button } from "@/components/ui/button";
import { Sparkles, LogOut, History as HistoryIcon, LogIn } from "lucide-react";
import { toast } from "sonner";
import type { Session } from "@supabase/supabase-js";

// Mock data for demonstration
const mockNews = [
  {
    headline: "Tech Giants Report Strong Q4 Earnings",
    snippet: "Major technology companies exceeded analyst expectations with robust quarterly results...",
    source: "Financial Times",
    link: "https://example.com",
    timestamp: "2 hours ago",
    sentiment: "positive" as const,
    fullText: "In a remarkable display of resilience, leading technology companies have reported earnings that significantly surpassed Wall Street expectations...",
  },
  {
    headline: "Federal Reserve Maintains Interest Rates",
    snippet: "The central bank announced it will hold rates steady amid economic uncertainty...",
    source: "Bloomberg",
    link: "https://example.com",
    timestamp: "5 hours ago",
    sentiment: "neutral" as const,
  },
  {
    headline: "Energy Sector Faces Volatility Concerns",
    snippet: "Oil prices fluctuate as geopolitical tensions and supply concerns persist...",
    source: "Reuters",
    link: "https://example.com",
    timestamp: "1 day ago",
    sentiment: "negative" as const,
  },
];

const mockSummary = `Based on the latest financial news and market analysis:

• Technology sector shows strong momentum with earnings beats across major players
• Federal Reserve policy remains cautious with steady interest rates
• Energy markets experiencing increased volatility due to supply concerns
• Overall market sentiment is cautiously optimistic with mixed signals

Key takeaway: While tech leads growth, diversification remains crucial given sector-specific challenges.`;

const Index = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [language, setLanguage] = useState("en");
  const [isLoading, setIsLoading] = useState(false);
  const [hasResults, setHasResults] = useState(false);
  const [currentQuery, setCurrentQuery] = useState("");

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    setHasResults(false);
  };

  const saveSearchHistory = async (query: string) => {
    if (!session) return;

    try {
      const { error } = await supabase.from("search_history").insert({
        user_id: session.user.id,
        query,
        language,
        results_count: mockNews.length,
        sentiment_positive: 8,
        sentiment_neutral: 5,
        sentiment_negative: 3,
      });

      if (error) throw error;
    } catch (error: any) {
      console.error("Failed to save search history:", error);
    }
  };

  const handleQuery = (query: string) => {
    setIsLoading(true);
    setCurrentQuery(query);
    toast.info(`Searching for: ${query}`);
    
    // Simulate API call
    setTimeout(async () => {
      setIsLoading(false);
      setHasResults(true);
      toast.success("Results loaded successfully");
      
      // Save to history if user is logged in
      if (session) {
        await saveSearchHistory(query);
      }
    }, 1500);
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
            <div className="flex items-center gap-3">
              <LanguageSelector value={language} onChange={setLanguage} />
              {session ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/history")}
                    className="gap-2"
                  >
                    <HistoryIcon className="h-4 w-4" />
                    History
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                    className="gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </Button>
                </>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => navigate("/auth")}
                  className="gap-2"
                >
                  <LogIn className="h-4 w-4" />
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
                <ExecutiveSummary summary={mockSummary} query={currentQuery} />

                {/* News Results */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    Latest News
                    <span className="text-sm font-normal text-muted-foreground">
                      ({mockNews.length} articles)
                    </span>
                  </h3>
                  {mockNews.map((news, index) => (
                    <NewsCard key={index} {...news} />
                  ))}
                </div>
              </div>

              {/* Right Column - Sentiment & Chat */}
              <div className="space-y-6">
                <SentimentDisplay
                  stats={{ positive: 8, neutral: 5, negative: 3 }}
                  totalArticles={16}
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
