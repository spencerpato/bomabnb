import { useEffect, useState } from "react";
import { AgentLayout } from "@/components/AgentLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Calendar, DollarSign, Users } from "lucide-react";
import { toast } from "sonner";

interface Referral {
  id: string;
  partner_id: string;
  referred_at: string;
  partners: {
    business_name: string | null;
    location: string;
    status: string;
    created_at: string;
    profiles?: {
      full_name: string;
      email: string;
    };
  };
  stats: {
    propertiesCount: number;
    bookingsCount: number;
    totalCommissions: number;
  };
}

const AgentReferrals = () => {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReferrals();
  }, []);

  const fetchReferrals = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: referrerData } = await supabase
        .from("referrers")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!referrerData) return;

      const { data: referralsData, error: referralsError } = await supabase
        .from("referrals")
        .select(`
          id,
          partner_id,
          referred_at,
          partners (
            business_name,
            location,
            status,
            created_at,
            user_id
          )
        `)
        .eq("referrer_id", referrerData.id)
        .eq("status", "active")
        .order("referred_at", { ascending: false });

      if (referralsError) throw referralsError;

      if (referralsData) {
        const referralsWithStats = await Promise.all(
          referralsData.map(async (referral) => {
            // Fetch partner profile
            const { data: partnerProfile } = await supabase
              .from("profiles")
              .select("full_name, email")
              .eq("id", referral.partners.user_id)
              .single();

            // Fetch properties
            const { data: propertiesData, count: propertiesCount } = await supabase
              .from("properties")
              .select("id", { count: "exact" })
              .eq("partner_id", referral.partner_id);

            const propertyIds = propertiesData?.map(p => p.id) || [];

            // Fetch bookings for this partner's properties
            let bookingsData: any[] = [];
            if (propertyIds.length > 0) {
              const { data } = await supabase
                .from("bookings")
                .select("id, total_price, status")
                .in("property_id", propertyIds);
              bookingsData = data || [];
            }

            // Calculate agent commission (10% of confirmed bookings)
            const AGENT_COMMISSION_RATE = 0.10;
            const confirmedBookings = bookingsData?.filter(b => b.status === "confirmed") || [];
            
            const bookingsCount = bookingsData?.length || 0;
            const totalCommissions = confirmedBookings.reduce(
              (sum, b) => sum + (Number(b.total_price) * AGENT_COMMISSION_RATE),
              0
            );

            return {
              ...referral,
              partners: {
                ...referral.partners,
                profiles: partnerProfile || { full_name: "Unknown", email: "" },
              },
              stats: {
                propertiesCount: propertiesCount || 0,
                bookingsCount,
                totalCommissions,
              },
            };
          })
        );

        setReferrals(referralsWithStats as any);
      }
    } catch (error) {
      console.error("Error fetching referrals:", error);
      toast.error("Failed to load referrals");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "⏳ Pending", variant: "outline" as const },
      active: { label: "✅ Active", variant: "default" as const },
      rejected: { label: "❌ Rejected", variant: "destructive" as const },
      suspended: { label: "🚫 Suspended", variant: "destructive" as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <AgentLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Referrals</h1>
          <p className="text-muted-foreground mt-2">
            Partners you've referred to BomaBnB
          </p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        ) : referrals.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-lg mb-2">
                No referrals yet
              </p>
              <p className="text-sm text-muted-foreground">
                Start sharing your referral link to earn commissions!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {referrals.map((referral) => (
              <Card key={referral.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl">
                        {referral.partners.business_name || referral.partners.profiles?.full_name || "Partner"}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        📍 {referral.partners.location}
                      </CardDescription>
                      {referral.partners.profiles?.email && (
                        <CardDescription className="mt-1 text-xs">
                          📧 {referral.partners.profiles.email}
                        </CardDescription>
                      )}
                    </div>
                    {getStatusBadge(referral.partners.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
                      <Building2 className="h-8 w-8 text-blue-600" />
                      <div>
                        <p className="text-2xl font-bold">{referral.stats.propertiesCount}</p>
                        <p className="text-sm text-muted-foreground">Properties Listed</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
                      <Calendar className="h-8 w-8 text-green-600" />
                      <div>
                        <p className="text-2xl font-bold">{referral.stats.bookingsCount}</p>
                        <p className="text-sm text-muted-foreground">Bookings</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-900">
                      <DollarSign className="h-8 w-8 text-amber-600" />
                      <div>
                        <p className="text-2xl font-bold">
                          KSh {referral.stats.totalCommissions.toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground">Your Commissions</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t text-sm text-muted-foreground flex items-center justify-between">
                    <span>Referred on {new Date(referral.referred_at).toLocaleDateString()}</span>
                    <span className="text-xs">
                      Registered: {new Date(referral.partners.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AgentLayout>
  );
};

export default AgentReferrals;
