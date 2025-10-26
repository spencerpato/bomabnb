import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User, Session } from "@supabase/supabase-js";

const Auth = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            checkUserRoleAndRedirect(session.user.id);
          }, 0);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        checkUserRoleAndRedirect(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUserRoleAndRedirect = async (userId: string) => {
    try {
      // Fetch user roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      console.log("DEBUG - User ID:", userId);
      console.log("DEBUG - Roles found:", roles);
      console.log("DEBUG - Roles error:", rolesError);

      if (rolesError) {
        console.error("Error fetching roles:", rolesError);
        toast.error("Unable to verify account. Please try again.");
        await supabase.auth.signOut();
        return;
      }

      // Check if user has agent/referrer role
      if (roles && roles.some(r => r.role === "referrer")) {
        // Query referrers table for agent status
        const { data: referrer, error: referrerError } = await supabase
          .from("referrers")
          .select("status")
          .eq("user_id", userId)
          .single();

        // Handle case where referrer role exists but no referrer record found
        if (referrerError || !referrer) {
          console.error("Referrer record not found:", referrerError);
          toast.error("❌ Invalid agent credentials. Please contact support.");
          await supabase.auth.signOut();
          return;
        }

        // Check agent status and redirect accordingly
        if (referrer.status === "pending") {
          toast.error("⏳ Your registration is pending approval. You'll be notified once approved.");
          await supabase.auth.signOut();
          return;
        } else if (referrer.status === "rejected") {
          toast.error("⚠️ Your account has been rejected. Contact support for help.");
          await supabase.auth.signOut();
          return;
        } else if (referrer.status === "suspended") {
          toast.error("🚫 Your account has been suspended. Contact support for help.");
          await supabase.auth.signOut();
          return;
        } else if (referrer.status === "active") {
          toast.success("💼 Welcome to your Agent Dashboard!");
          navigate("/agent-dashboard");
          return;
        }
      } 
      
      // Check if user has partner role
      else if (roles && roles.some(r => r.role === "partner")) {
        // Query partners table for partner status
        const { data: partner, error: partnerError } = await supabase
          .from("partners")
          .select("status")
          .eq("user_id", userId)
          .single();

        // Handle case where partner role exists but no partner record found
        if (partnerError || !partner) {
          console.error("Partner record not found:", partnerError);
          toast.error("❌ Invalid partner credentials. Please contact support.");
          await supabase.auth.signOut();
          return;
        }

        // Check partner status and redirect accordingly
        if (partner.status === "pending") {
          toast.error("⏳ Your registration is pending approval. You'll be notified once approved.");
          await supabase.auth.signOut();
          return;
        } else if (partner.status === "rejected") {
          toast.error("⚠️ Your account has been rejected. Contact support for help.");
          await supabase.auth.signOut();
          return;
        } else if (partner.status === "suspended") {
          toast.error("🚫 Your account has been suspended. Contact support for help.");
          await supabase.auth.signOut();
          return;
        } else if (partner.status === "active") {
          toast.success("🎉 Welcome to your Partner Dashboard!");
          navigate("/partner-dashboard");
          return;
        }
      } 
      
      // Check if user has admin role
      else if (roles && roles.some(r => r.role === "admin")) {
        toast.success("👑 Welcome to Admin Dashboard!");
        navigate("/admin");
        return;
      } 
      
      // User has no recognized role - redirect to homepage
      else {
        console.warn("User has no recognized role:", roles);
        navigate("/");
      }
    } catch (error) {
      console.error("Error in checkUserRoleAndRedirect:", error);
      toast.error("An error occurred during login. Please try again.");
      await supabase.auth.signOut();
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Check will be handled by onAuthStateChange
    } catch (error: any) {
      console.error("Login error:", error);
      if (error.message?.includes("Invalid login credentials")) {
        toast.error("❌ Invalid email or password. Please check your credentials and try again.");
      } else {
        toast.error(error.message || "Failed to login. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-3xl font-heading font-bold text-center">
              Login
            </CardTitle>
            <CardDescription className="text-center">
              Sign in to access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>

              <div className="text-center text-sm text-muted-foreground space-y-1">
                <div>
                  Don't have an account?{" "}
                  <Button
                    variant="link"
                    className="text-primary p-0 h-auto font-normal"
                    onClick={() => navigate("/partner-register")}
                  >
                    Register as Partner
                  </Button>
                  {" or "}
                  <Button
                    variant="link"
                    className="text-amber-600 p-0 h-auto font-normal"
                    onClick={() => navigate("/partner-register?role=agent")}
                  >
                    Register as Agent
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
};

export default Auth;
