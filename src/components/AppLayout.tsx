import { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { LanguageSelector } from "@/components/LanguageSelector";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";

export function AppLayout() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [language, setLanguage] = useState("en");

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
      if (!user) {
        setIsAdmin(false);
        return;
      }
      
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      
      setIsAdmin(roles?.some((r) => r.role === "admin") || false);
    };

    checkAdmin();
  }, [user]);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-background via-background to-muted/30 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
        </div>

        <AppSidebar user={user} isAdmin={isAdmin} />
        
        <div className="flex-1 flex flex-col relative z-10">
          {/* Header with glass effect */}
          <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 transition-all duration-500">
            <div className="flex items-center justify-between px-4 py-3">
              <SidebarTrigger className="mr-2 transition-all duration-300 hover:scale-110 hover:bg-muted/50 active:scale-95 rounded-lg" />
              <div className="flex items-center gap-2">
                <LanguageSelector value={language} onChange={setLanguage} />
              </div>
            </div>
          </header>

          {/* Main Content with smooth transitions */}
          <main className="flex-1 p-6 animate-fade-in smooth-scroll">
            <Outlet context={{ user, session, language, isAdmin }} />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

// Hook to use layout context in pages
import { useOutletContext } from "react-router-dom";

interface LayoutContext {
  user: User | null;
  session: Session | null;
  language: string;
  isAdmin: boolean;
}

export function useLayoutContext() {
  return useOutletContext<LayoutContext>();
}
