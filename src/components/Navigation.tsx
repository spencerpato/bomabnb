import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { User, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { User as SupabaseUser } from "@supabase/supabase-js";
import logo from "@/assets/bomabnb-logo.png";

export const Navigation = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isPartner, setIsPartner] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkUserRole(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkUserRole(session.user.id);
      } else {
        setIsPartner(false);
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUserRole = async (userId: string) => {
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    if (roles) {
      setIsPartner(roles.some(r => r.role === "partner"));
      setIsAdmin(roles.some(r => r.role === "admin"));
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <img src={logo} alt="BomaBnB" className="h-12 w-auto" />
        </Link>

        <div className="flex items-center gap-6">
          <Link to="/" className="text-foreground hover:text-primary transition-colors font-medium">
            Home
          </Link>
          <Link to="/about" className="text-foreground hover:text-primary transition-colors font-medium">
            About
          </Link>
          <Link to="/contact" className="text-foreground hover:text-primary transition-colors font-medium">
            Contact
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {!user ? (
            <>
              <Button asChild variant="outline" className="border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground">
                <Link to="/partner-register">Partner With Us</Link>
              </Button>
              <Button asChild variant="default" className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Link to="/auth">Partner Login</Link>
              </Button>
            </>
          ) : (
            <>
              {isAdmin && (
                <Button asChild variant="outline">
                  <Link to="/admin">Admin Dashboard</Link>
                </Button>
              )}
              {isPartner && (
                <Button asChild variant="outline">
                  <Link to="/partner-dashboard">
                    <User className="mr-2 h-4 w-4" />
                    Dashboard
                  </Link>
                </Button>
              )}
              <Button variant="ghost" onClick={handleLogout} className="text-foreground hover:text-accent">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};
