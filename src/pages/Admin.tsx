import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { User, Session } from "@supabase/supabase-js";

interface Profile {
  id: string;
  email: string;
  created_at: string;
}

interface SearchHistory {
  id: string;
  user_id: string;
  query: string;
  results_count: number;
  sentiment_positive: number;
  sentiment_neutral: number;
  sentiment_negative: number;
  language: string;
  created_at: string;
}

export default function Admin() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
    const checkAdminAndFetchData = async () => {
      if (!user) {
        navigate("/auth");
        return;
      }

      try {
        const { data: roles, error: rolesError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id);

        if (rolesError) throw rolesError;

        const hasAdminRole = roles?.some((r) => r.role === "admin");
        if (!hasAdminRole) {
          toast.error("Access denied. Admin privileges required.");
          navigate("/");
          return;
        }

        setIsAdmin(true);

        const [profilesRes, historyRes] = await Promise.all([
          supabase.from("profiles").select("*").order("created_at", { ascending: false }),
          supabase.from("search_history").select("*").order("created_at", { ascending: false }).limit(50),
        ]);

        if (profilesRes.error) throw profilesRes.error;
        if (historyRes.error) throw historyRes.error;

        setProfiles(profilesRes.data || []);
        setSearchHistory(historyRes.data || []);
      } catch (error: any) {
        toast.error(error.message || "Failed to load admin data");
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminAndFetchData();
  }, [user, navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Loading...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => navigate("/")}>
              Back to Home
            </Button>
            <Button variant="destructive" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Registered Users ({profiles.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead>Created At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.map((profile) => (
                  <TableRow key={profile.id}>
                    <TableCell>{profile.email}</TableCell>
                    <TableCell className="font-mono text-xs">{profile.id}</TableCell>
                    <TableCell>{new Date(profile.created_at).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Search History ({searchHistory.length} shown)</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Query</TableHead>
                  <TableHead>Results</TableHead>
                  <TableHead>Sentiment</TableHead>
                  <TableHead>Language</TableHead>
                  <TableHead>Created At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {searchHistory.map((search) => (
                  <TableRow key={search.id}>
                    <TableCell className="max-w-xs truncate">{search.query}</TableCell>
                    <TableCell>{search.results_count}</TableCell>
                    <TableCell>
                      <span className="text-green-600">+{search.sentiment_positive}</span>{" "}
                      <span className="text-gray-600">~{search.sentiment_neutral}</span>{" "}
                      <span className="text-red-600">-{search.sentiment_negative}</span>
                    </TableCell>
                    <TableCell>{search.language}</TableCell>
                    <TableCell>{new Date(search.created_at).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
