import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Users, Home, Calendar, CheckCircle, XCircle } from "lucide-react";

interface Partner {
  id: string;
  user_id: string;
  business_name?: string;
  location: string;
  status: string;
  created_at: string;
  profiles: {
    full_name: string;
    email: string;
  };
}

const Admin = () => {
  const navigate = useNavigate();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [stats, setStats] = useState({
    totalPartners: 0,
    pendingPartners: 0,
    totalProperties: 0,
    totalBookings: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/admin-login");
        return;
      }

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin");

      if (!roles || roles.length === 0) {
        toast.error("Access denied. Administrator privileges required.");
        navigate("/");
        return;
      }

      await fetchData();
    } catch (error) {
      console.error("Error checking auth:", error);
      navigate("/admin-login");
    }
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);

      // Fetch partners with profiles
      const { data: partnersData, error: partnersError } = await supabase
        .from("partners")
        .select("*")
        .order("created_at", { ascending: false });

      if (partnersError) throw partnersError;

      // Fetch profiles separately
      const partnersWithProfiles = await Promise.all(
        (partnersData || []).map(async (partner) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, email")
            .eq("id", partner.user_id)
            .single();

          return {
            ...partner,
            profiles: profile || { full_name: "", email: "" },
          };
        })
      );

      setPartners(partnersWithProfiles);

      // Fetch stats
      const { data: propertiesData } = await supabase
        .from("properties")
        .select("id", { count: "exact" });

      const { data: bookingsData } = await supabase
        .from("bookings")
        .select("id", { count: "exact" });

      setStats({
        totalPartners: partnersData?.length || 0,
        pendingPartners: partnersData?.filter(p => p.status === "pending").length || 0,
        totalProperties: propertiesData?.length || 0,
        totalBookings: bookingsData?.length || 0,
      });
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprovePartner = async (partnerId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from("partners")
        .update({ status: "active", approved_at: new Date().toISOString() })
        .eq("id", partnerId);

      if (error) throw error;

      toast.success("Partner approved successfully");
      fetchData();
    } catch (error) {
      console.error("Error approving partner:", error);
      toast.error("Failed to approve partner");
    }
  };

  const handleRejectPartner = async (partnerId: string) => {
    try {
      const { error } = await supabase
        .from("partners")
        .update({ status: "rejected" })
        .eq("id", partnerId);

      if (error) throw error;

      toast.success("Partner rejected");
      fetchData();
    } catch (error) {
      console.error("Error rejecting partner:", error);
      toast.error("Failed to reject partner");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />

      <div className="flex-1 px-4 py-12">
        <div className="container mx-auto max-w-7xl">
          <div className="mb-8">
            <h1 className="font-heading font-bold text-4xl mb-2">Superadmin Dashboard</h1>
            <p className="text-muted-foreground">
              Complete platform management and oversight
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Partners</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalPartners}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
                <Users className="h-4 w-4 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-accent">{stats.pendingPartners}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
                <Home className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalProperties}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalBookings}</div>
              </CardContent>
            </Card>
          </div>

          {/* Partner Management */}
          <Card>
            <CardHeader>
              <CardTitle>Partner Management</CardTitle>
              <CardDescription>Review and manage partner applications</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="pending" className="w-full">
                <TabsList>
                  <TabsTrigger value="pending">
                    Pending ({partners.filter(p => p.status === "pending").length})
                  </TabsTrigger>
                  <TabsTrigger value="active">
                    Active ({partners.filter(p => p.status === "active").length})
                  </TabsTrigger>
                  <TabsTrigger value="all">All Partners</TabsTrigger>
                </TabsList>

                <TabsContent value="pending" className="space-y-4 mt-4">
                  {partners.filter(p => p.status === "pending").map((partner) => (
                    <div
                      key={partner.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <h3 className="font-bold">{partner.profiles.full_name}</h3>
                        <p className="text-sm text-muted-foreground">{partner.profiles.email}</p>
                        <p className="text-sm text-muted-foreground">{partner.location}</p>
                        {partner.business_name && (
                          <p className="text-sm font-medium mt-1">Business: {partner.business_name}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApprovePartner(partner.id, partner.user_id)}
                          className="bg-secondary hover:bg-secondary/90"
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRejectPartner(partner.id)}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                  {partners.filter(p => p.status === "pending").length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No pending applications
                    </p>
                  )}
                </TabsContent>

                <TabsContent value="active" className="space-y-4 mt-4">
                  {partners.filter(p => p.status === "active").map((partner) => (
                    <div
                      key={partner.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <h3 className="font-bold">{partner.profiles.full_name}</h3>
                        <p className="text-sm text-muted-foreground">{partner.profiles.email}</p>
                        <p className="text-sm text-muted-foreground">{partner.location}</p>
                      </div>
                      <Badge variant="default">Active</Badge>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="all" className="space-y-4 mt-4">
                  {partners.map((partner) => (
                    <div
                      key={partner.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <h3 className="font-bold">{partner.profiles.full_name}</h3>
                        <p className="text-sm text-muted-foreground">{partner.profiles.email}</p>
                        <p className="text-sm text-muted-foreground">{partner.location}</p>
                      </div>
                      <Badge
                        variant={
                          partner.status === "active"
                            ? "default"
                            : partner.status === "pending"
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {partner.status}
                      </Badge>
                    </div>
                  ))}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Admin;
