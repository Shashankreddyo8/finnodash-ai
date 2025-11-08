import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trash2, Search, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { toast } from "sonner";
import type { Session } from "@supabase/supabase-js";

interface SearchHistory {
  id: string;
  query: string;
  language: string;
  results_count: number;
  sentiment_positive: number;
  sentiment_neutral: number;
  sentiment_negative: number;
  created_at: string;
}

const History = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [history, setHistory] = useState<SearchHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check authentication
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      } else {
        fetchHistory();
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from("search_history")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setHistory(data || []);
    } catch (error: any) {
      toast.error("Failed to load search history");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("search_history")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setHistory(history.filter(item => item.id !== id));
      toast.success("Search deleted from history");
    } catch (error: any) {
      toast.error("Failed to delete search");
    }
  };

  const getDominantSentiment = (item: SearchHistory) => {
    if (item.sentiment_positive >= item.sentiment_neutral && item.sentiment_positive >= item.sentiment_negative) {
      return { label: "Positive", color: "bg-success", icon: TrendingUp };
    } else if (item.sentiment_negative >= item.sentiment_neutral) {
      return { label: "Negative", color: "bg-destructive", icon: TrendingDown };
    }
    return { label: "Neutral", color: "bg-warning", icon: Minus };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="animate-pulse text-center">
          <Search className="h-12 w-12 mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Search History</h1>
              <p className="text-sm text-muted-foreground">
                {history.length} {history.length === 1 ? "search" : "searches"} recorded
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {history.length === 0 ? (
          <Card className="max-w-md mx-auto text-center py-12">
            <CardContent>
              <Search className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No search history yet</h3>
              <p className="text-muted-foreground mb-6">
                Start searching for financial insights to build your history
              </p>
              <Button onClick={() => navigate("/")}>
                Start Searching
              </Button>
            </CardContent>
          </Card>
        ) : (
          <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="space-y-4 max-w-4xl mx-auto">
              {history.map((item) => {
                const sentiment = getDominantSentiment(item);
                const SentimentIcon = sentiment.icon;
                
                return (
                  <Card key={item.id} className="hover:shadow-medium transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Search className="h-5 w-5 text-primary" />
                            <h3 className="text-lg font-semibold">{item.query}</h3>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>
                              {new Date(item.created_at).toLocaleDateString()} at{" "}
                              {new Date(item.created_at).toLocaleTimeString()}
                            </span>
                            <span>•</span>
                            <span className="uppercase">{item.language}</span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(item.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="gap-1">
                            <SentimentIcon className="h-3 w-3" />
                            {sentiment.label}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {item.results_count} articles
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-success" />
                            <span>{item.sentiment_positive}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-warning" />
                            <span>{item.sentiment_neutral}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-destructive" />
                            <span>{item.sentiment_negative}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </main>
    </div>
  );
};

export default History;
