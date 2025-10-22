import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Home, Calendar, User as UserIcon } from "lucide-react";

interface Partner {
  id: string;
  status: string;
  business_name?: string;
  location: string;
}

interface Property {
  id: string;
  property_name: string;
  location: string;
  price_per_night: number;
  is_active: boolean;
}

const PartnerDashboard = () => {
  const navigate = useNavigate();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

      // Check if user is a partner
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "partner");

      if (!roles || roles.length === 0) {
        toast.error("Access denied. Partner account required.");
        navigate("/");
        return;
      }

      // Fetch partner data
      const { data: partnerData, error: partnerError } = await supabase
        .from("partners")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (partnerError) throw partnerError;
      setPartner(partnerData);

      // Fetch properties
      const { data: propertiesData, error: propertiesError } = await supabase
        .from("properties")
        .select("*")
        .eq("partner_id", partnerData.id)
        .order("created_at", { ascending: false });

      if (propertiesError) throw propertiesError;
      setProperties(propertiesData || []);
    } catch (error) {
      console.error("Error loading dashboard:", error);
      toast.error("Failed to load dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  if (partner?.status === "pending") {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navigation />
        <div className="flex-1 flex items-center justify-center px-4">
          <Card className="max-w-md text-center">
            <CardHeader>
              <CardTitle>Application Pending</CardTitle>
              <CardDescription>
                Your partner application is currently under review. You'll receive an email once it's approved.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  if (partner?.status === "rejected") {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navigation />
        <div className="flex-1 flex items-center justify-center px-4">
          <Card className="max-w-md text-center">
            <CardHeader>
              <CardTitle>Application Rejected</CardTitle>
              <CardDescription>
                Unfortunately, your partner application was not approved. Please contact support for more information.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />

      <div className="flex-1 px-4 py-12">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-8">
            <h1 className="font-heading font-bold text-4xl mb-2">Partner Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back! Manage your properties and bookings.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
                <Home className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{properties.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Listings</CardTitle>
                <Home className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {properties.filter(p => p.is_active).length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
              </CardContent>
            </Card>
          </div>

          {/* Properties Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Your Properties</CardTitle>
                  <CardDescription>Manage your property listings</CardDescription>
                </div>
                <Button className="bg-primary hover:bg-primary/90" onClick={() => navigate("/add-property")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Property
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {properties.length === 0 ? (
                <div className="text-center py-12">
                  <Home className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No properties yet</p>
                  <Button onClick={() => navigate("/add-property")}>
                    Add Your First Property
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {properties.map((property) => (
                    <div
                      key={property.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div>
                        <h3 className="font-bold">{property.property_name}</h3>
                        <p className="text-sm text-muted-foreground">{property.location}</p>
                        <p className="text-sm font-semibold text-primary mt-1">
                          KES {property.price_per_night.toLocaleString()}/night
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={property.is_active ? "default" : "secondary"}>
                          {property.is_active ? "Active" : "Inactive"}
                        </Badge>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default PartnerDashboard;
