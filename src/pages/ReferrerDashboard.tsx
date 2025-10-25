import { useEffect, useState } from "react";
import { ReferrerLayout } from "@/components/ReferrerLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign, Users, Building2, Calendar, TrendingUp } from "lucide-react";

interface Stats {
  totalReferrals: number;
  totalProperties: number;
  totalBookings: number;
  totalCommissions: number;
  pendingCommissions: number;
}

const ReferrerDashboard = () => {
  const [stats, setStats] = useState<Stats>({
    totalReferrals: 0,
    totalProperties: 0,
    totalBookings: 0,
    totalCommissions: 0,
    pendingCommissions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [referrerId, setReferrerId] = useState<string | null>(null);

  useEffect(() => {
    fetchReferrerId();
  }, []);

  useEffect(() => {
    if (referrerId) {
      fetchStats();
    }
  }, [referrerId]);

  const fetchReferrerId = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("referrers")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (data) {
        setReferrerId(data.id);
      }
    } catch (error) {
      console.error("Error fetching referrer ID:", error);
    }
  };

  const fetchStats = async () => {
    if (!referrerId) return;
    
    setLoading(true);
    try {
      // Fetch total referrals
      const { count: referralsCount } = await supabase
        .from("referrals")
        .select("*", { count: "exact", head: true })
        .eq("referrer_id", referrerId)
        .eq("status", "active");

      // Fetch referred partner IDs
      const { data: referralData } = await supabase
        .from("referrals")
        .select("partner_id")
        .eq("referrer_id", referrerId)
        .eq("status", "active");

      const partnerIds = referralData?.map(r => r.partner_id) || [];

      // Fetch total properties from referred partners
      let propertiesCount = 0;
      if (partnerIds.length > 0) {
        const { count } = await supabase
          .from("properties")
          .select("*", { count: "exact", head: true })
          .in("partner_id", partnerIds);
        propertiesCount = count || 0;
      }

      // Fetch commissions
      const { data: commissionsData } = await supabase
        .from("commissions")
        .select("commission_amount, status")
        .eq("referrer_id", referrerId);

      const totalCommissions = commissionsData?.reduce((sum, c) => sum + Number(c.commission_amount), 0) || 0;
      const pendingCommissions = commissionsData?.filter(c => c.status === "pending")
        .reduce((sum, c) => sum + Number(c.commission_amount), 0) || 0;

      // Fetch total bookings
      const { count: bookingsCount } = await supabase
        .from("commissions")
        .select("*", { count: "exact", head: true })
        .eq("referrer_id", referrerId);

      setStats({
        totalReferrals: referralsCount || 0,
        totalProperties: propertiesCount,
        totalBookings: bookingsCount || 0,
        totalCommissions: totalCommissions,
        pendingCommissions: pendingCommissions,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Total Referrals",
      value: stats.totalReferrals,
      description: "Active referred partners",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Properties Listed",
      value: stats.totalProperties,
      description: "From referred partners",
      icon: Building2,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Total Bookings",
      value: stats.totalBookings,
      description: "Completed bookings",
      icon: Calendar,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Total Earnings",
      value: `KSh ${stats.totalCommissions.toLocaleString()}`,
      description: "All-time commissions",
      icon: DollarSign,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "Pending Commissions",
      value: `KSh ${stats.pendingCommissions.toLocaleString()}`,
      description: "Awaiting payout",
      icon: TrendingUp,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
  ];

  return (
    <ReferrerLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Referrer Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Track your referrals, earnings, and performance
          </p>
        </div>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {statCards.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.title} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </CardTitle>
                    <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                      <Icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stat.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>
              Start referring partners and earning commissions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-purple-50 rounded-lg">
              <div className="bg-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h4 className="font-semibold">Share Your Referral Link</h4>
                <p className="text-sm text-muted-foreground">
                  Share your unique referral link with potential partners via WhatsApp, Facebook, or other channels.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 bg-green-50 rounded-lg">
              <div className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h4 className="font-semibold">Partners Register</h4>
                <p className="text-sm text-muted-foreground">
                  When partners register using your link, they're automatically linked to your account.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 bg-orange-50 rounded-lg">
              <div className="bg-orange-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h4 className="font-semibold">Earn 10% Commission</h4>
                <p className="text-sm text-muted-foreground">
                  Earn 10% commission on every completed booking from properties listed by your referred partners.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ReferrerLayout>
  );
};

export default ReferrerDashboard;
