import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AgentLayout } from "@/components/AgentLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Users, Building2, Calendar, DollarSign, TrendingUp, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Good night";
};

const AgentDashboard = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [stats, setStats] = useState({
    totalReferrals: 0,
    activePartners: 0,
    totalProperties: 0,
    totalBookings: 0,
    totalCommissions: 0,
    pendingCommissions: 0,
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      if (profileData) {
        setUserName(profileData.full_name);
      }

      // @ts-expect-error - Supabase types need regeneration to include referrer role
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "referrer");

      if (!roles || roles.length === 0) {
        toast.error("Access denied. Agent account required.");
        navigate("/");
        return;
      }

      // @ts-expect-error - Supabase types need regeneration to include referrers table
      const { data: referrerData, error: referrerError } = await supabase
        .from("referrers")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (referrerError) throw referrerError;
      
      if (referrerData) {
        setReferralCode(referrerData.referral_code);
        await fetchStats(referrerData.id);
      }
    } catch (error) {
      console.error("Error loading dashboard:", error);
      toast.error("Failed to load dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async (referrerId: string) => {
    try {
      // @ts-expect-error - Supabase types need regeneration to include referrals table
      const { data: referrals } = await supabase
        .from("referrals")
        .select("*, partners(id, status)")
        .eq("referrer_id", referrerId);

      // @ts-expect-error - Type assertion needed
      const activePartners = referrals?.filter(r => r.partners?.status === "active").length || 0;

      // @ts-expect-error - Type assertion needed
      const partnerIds = referrals?.map(r => r.partner_id) || [];

      let totalProperties = 0;
      let totalBookings = 0;

      if (partnerIds.length > 0) {
        const { data: properties } = await supabase
          .from("properties")
          .select("id")
          .in("partner_id", partnerIds);

        totalProperties = properties?.length || 0;

        if (properties && properties.length > 0) {
          const propertyIds = properties.map(p => p.id);
          const { data: bookings } = await supabase
            .from("bookings")
            .select("id")
            .in("property_id", propertyIds);

          totalBookings = bookings?.length || 0;
        }
      }

      // @ts-expect-error - Supabase types need regeneration to include commissions table
      const { data: commissions } = await supabase
        .from("commissions")
        .select("commission_amount, status")
        .eq("referrer_id", referrerId);

      // @ts-expect-error - Type assertion needed
      const totalCommissions = commissions?.reduce((sum, c) => sum + Number(c.commission_amount), 0) || 0;
      // @ts-expect-error - Type assertion needed
      const pendingCommissions = commissions
        ?.filter(c => c.status === "pending")
        .reduce((sum, c) => sum + Number(c.commission_amount), 0) || 0;

      setStats({
        totalReferrals: referrals?.length || 0,
        activePartners,
        totalProperties,
        totalBookings,
        totalCommissions,
        pendingCommissions,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const getReferralLink = () => {
    return `${window.location.origin}/register?ref=${referralCode}`;
  };

  const copyReferralLink = () => {
    navigator.clipboard.writeText(getReferralLink());
    toast.success("Referral link copied to clipboard!");
  };

  if (isLoading) {
    return (
      <AgentLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
        </div>
      </AgentLayout>
    );
  }

  return (
    <AgentLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-heading font-bold">{getGreeting()}, {userName}! 💼</h1>
          <p className="text-muted-foreground mt-1">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/20 dark:to-amber-900/10 border-amber-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5 text-amber-700" />
              Your Referral Link
            </CardTitle>
            <CardDescription>Share this link with property owners to earn commissions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <code className="flex-1 text-sm sm:text-base font-mono text-amber-700 bg-white dark:bg-gray-800 px-4 py-3 rounded-lg border-2 border-amber-300 break-all">
                {getReferralLink()}
              </code>
              <Button onClick={copyReferralLink} size="lg" className="bg-amber-600 hover:bg-amber-700 shrink-0">
                Copy Link
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              <strong>Your Referral Code:</strong> <code className="bg-white dark:bg-gray-800 px-2 py-1 rounded">{referralCode}</code>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalReferrals}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activePartners} active partners
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Referred Properties</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProperties}</div>
              <p className="text-xs text-muted-foreground">
                From your referrals
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBookings}</div>
              <p className="text-xs text-muted-foreground">
                All referred properties
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Commissions</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">KSh {stats.totalCommissions.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                All time earnings
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Commissions</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">KSh {stats.pendingCommissions.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting payout
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Partners</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activePartners}</div>
              <p className="text-xs text-muted-foreground">
                Approved & listing
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks for agents</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button
              variant="outline"
              className="h-auto py-6 flex flex-col items-center gap-2"
              onClick={() => navigate("/agent-referrals")}
            >
              <Users className="h-6 w-6" />
              <span className="text-sm">View Referrals</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-6 flex flex-col items-center gap-2"
              onClick={() => navigate("/agent-commissions")}
            >
              <DollarSign className="h-6 w-6" />
              <span className="text-sm">View Commissions</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-6 flex flex-col items-center gap-2"
              onClick={() => navigate("/agent-properties")}
            >
              <Building2 className="h-6 w-6" />
              <span className="text-sm">Referred Properties</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-6 flex flex-col items-center gap-2"
              onClick={copyReferralLink}
            >
              <Share2 className="h-6 w-6" />
              <span className="text-sm">Copy Referral Link</span>
            </Button>
          </CardContent>
        </Card>
      </div>
    </AgentLayout>
  );
};

export default AgentDashboard;
