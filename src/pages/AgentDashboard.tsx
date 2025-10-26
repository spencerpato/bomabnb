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
      console.log("=== FETCHING STATS FOR REFERRER:", referrerId, "===");
      
      // @ts-expect-error - Supabase types need regeneration to include referrals table
      const { data: referrals, error: referralsError } = await supabase
        .from("referrals")
        .select("*, partners(id, status)")
        .eq("referrer_id", referrerId);

      console.log("1. REFERRALS FOUND:", referrals?.length || 0);
      console.log("   Referrals data:", referrals);

      if (referralsError) {
        console.error("Error fetching referrals:", referralsError);
        throw referralsError;
      }

      // @ts-expect-error - Type assertion needed
      const activePartners = referrals?.filter(r => r.partners?.status === "active").length || 0;
      console.log("2. ACTIVE PARTNERS:", activePartners);

      // @ts-expect-error - Type assertion needed
      const partnerIds = referrals?.map(r => r.partner_id).filter(id => id) || [];
      console.log("3. PARTNER IDs:", partnerIds);

      let totalProperties = 0;
      let totalBookings = 0;
      let totalCommissions = 0;
      let pendingCommissions = 0;

      if (partnerIds.length > 0) {
        const { data: properties, error: propertiesError } = await supabase
          .from("properties")
          .select("id, partner_id")
          .in("partner_id", partnerIds);

        console.log("4. PROPERTIES FOUND:", properties?.length || 0);
        console.log("   Properties data:", properties);

        if (propertiesError) {
          console.error("Error fetching properties:", propertiesError);
        }

        totalProperties = properties?.length || 0;

        if (properties && properties.length > 0) {
          const propertyIds = properties.map(p => p.id);
          console.log("5. PROPERTY IDs TO SEARCH:", propertyIds);
          
          const { data: bookings, error: bookingsError } = await supabase
            .from("bookings")
            .select("id, total_price, status, property_id")
            .in("property_id", propertyIds);

          console.log("6. BOOKINGS QUERY RESULT:");
          console.log("   Bookings found:", bookings?.length || 0);
          console.log("   Bookings data:", bookings);
          
          // Double check - fetch ALL bookings to see if any exist
          const { data: allBookings } = await supabase
            .from("bookings")
            .select("id, property_id, status, total_price")
            .limit(10);
          console.log("7. ALL BOOKINGS IN DATABASE (first 10):", allBookings);
          console.log("   Checking if any match our property IDs:", propertyIds);

          if (bookingsError) {
            console.error("Error fetching bookings:", bookingsError);
          }

          // Calculate agent commission (10% of confirmed bookings)
          const AGENT_COMMISSION_RATE = 0.10;
          const confirmedBookings = bookings?.filter(b => b.status === "confirmed") || [];
          const pendingBookings = bookings?.filter(b => b.status === "pending") || [];
          
          // Total bookings = only confirmed bookings
          totalBookings = confirmedBookings.length;
          
          console.log("=== Agent Commission Debug ===");
          console.log("All bookings found:", bookings?.length || 0);
          console.log("Confirmed bookings (counted):", confirmedBookings.length);
          console.log("Pending bookings:", pendingBookings.length);
          console.log("Bookings data:", bookings);
          
          // Total commission = 10% of all confirmed booking amounts
          totalCommissions = confirmedBookings.reduce((sum, b) => {
            const commission = Number(b.total_price) * AGENT_COMMISSION_RATE;
            console.log(`Booking ${b.id}: KES ${b.total_price} → Commission: KES ${commission}`);
            return sum + commission;
          }, 0);
          
          console.log("Total bookings (confirmed only):", totalBookings);
          console.log("Total commissions (10%):", totalCommissions);
          console.log("==============================");
        }
      }

      // Fetch total amount already paid to this agent
      // @ts-expect-error - agent_payments table not in generated types yet
      const { data: payoutData, error: payoutError } = await supabase
        .from("agent_payments")
        .select("amount")
        .eq("referrer_id", referrerId);

      if (payoutError) {
        console.log("Note: agent_payments table not found yet. Pending = Total");
      }

      const totalPaid = payoutData?.reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0;
      
      // Pending commission = Total earnings - Amount already paid
      pendingCommissions = totalCommissions - totalPaid;

      console.log("💰 PAYOUT CALCULATION:");
      console.log("   Total Commissions Earned:", totalCommissions);
      console.log("   Total Already Paid:", totalPaid);
      console.log("   Pending Commission:", pendingCommissions);

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
    return `${window.location.origin}/partner-register?ref=${referralCode}`;
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
            <CardDescription>Manage your referrals and earnings</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Button
              variant="outline"
              className="h-auto py-6 flex flex-col items-center gap-2"
              onClick={copyReferralLink}
            >
              <Share2 className="h-6 w-6 text-amber-600" />
              <span className="text-sm font-medium">Copy Referral Link</span>
              <span className="text-xs text-muted-foreground">Share with partners</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-6 flex flex-col items-center gap-2"
              onClick={() => navigate("/agent-referrals")}
            >
              <Users className="h-6 w-6 text-blue-600" />
              <span className="text-sm font-medium">View My Referrals</span>
              <span className="text-xs text-muted-foreground">{stats.totalReferrals} partners</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-6 flex flex-col items-center gap-2"
              onClick={() => navigate("/agent-commissions")}
            >
              <DollarSign className="h-6 w-6 text-green-600" />
              <span className="text-sm font-medium">View Commissions</span>
              <span className="text-xs text-muted-foreground">KSh {stats.totalCommissions.toFixed(0)}</span>
            </Button>
          </CardContent>
        </Card>
      </div>
    </AgentLayout>
  );
};

export default AgentDashboard;
