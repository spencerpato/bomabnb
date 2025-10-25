import { useEffect, useState } from "react";
import { ReferrerLayout } from "@/components/ReferrerLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Calendar, DollarSign } from "lucide-react";

interface Referral {
  id: string;
  partner_id: string;
  referred_at: string;
  partners: {
    business_name: string | null;
    location: string;
    status: string;
    created_at: string;
  };
  stats: {
    propertiesCount: number;
    bookingsCount: number;
    totalCommissions: number;
  };
}

const ReferrerReferrals = () => {
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

      const { data: referralsData } = await supabase
        .from("referrals")
        .select(`
          id,
          partner_id,
          referred_at,
          partners (
            business_name,
            location,
            status,
            created_at
          )
        `)
        .eq("referrer_id", referrerData.id)
        .eq("status", "active")
        .order("referred_at", { ascending: false });

      if (referralsData) {
        const referralsWithStats = await Promise.all(
          referralsData.map(async (referral) => {
            const { count: propertiesCount } = await supabase
              .from("properties")
              .select("*", { count: "exact", head: true })
              .eq("partner_id", referral.partner_id);

            const { data: commissionsData } = await supabase
              .from("commissions")
              .select("commission_amount")
              .eq("partner_id", referral.partner_id)
              .eq("referrer_id", referrerData.id);

            const bookingsCount = commissionsData?.length || 0;
            const totalCommissions = commissionsData?.reduce(
              (sum, c) => sum + Number(c.commission_amount),
              0
            ) || 0;

            return {
              ...referral,
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
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Pending", variant: "outline" as const },
      active: { label: "Active", variant: "default" as const },
      rejected: { label: "Rejected", variant: "destructive" as const },
      suspended: { label: "Suspended", variant: "destructive" as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <ReferrerLayout>
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
              <p className="text-muted-foreground">
                No referrals yet. Start sharing your referral link to earn commissions!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {referrals.map((referral) => (
              <Card key={referral.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">
                        {referral.partners.business_name || "Partner"}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {referral.partners.location}
                      </CardDescription>
                    </div>
                    {getStatusBadge(referral.partners.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                      <Building2 className="h-8 w-8 text-blue-600" />
                      <div>
                        <p className="text-2xl font-bold">{referral.stats.propertiesCount}</p>
                        <p className="text-sm text-muted-foreground">Properties</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                      <Calendar className="h-8 w-8 text-green-600" />
                      <div>
                        <p className="text-2xl font-bold">{referral.stats.bookingsCount}</p>
                        <p className="text-sm text-muted-foreground">Bookings</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg">
                      <DollarSign className="h-8 w-8 text-orange-600" />
                      <div>
                        <p className="text-2xl font-bold">
                          KSh {referral.stats.totalCommissions.toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground">Commissions</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t text-sm text-muted-foreground">
                    Referred on {new Date(referral.referred_at).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ReferrerLayout>
  );
};

export default ReferrerReferrals;
