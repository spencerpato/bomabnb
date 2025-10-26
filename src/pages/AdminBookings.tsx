import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SuperAdminLayout } from "@/components/SuperAdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Calendar, Search, AlertCircle, Mail, Phone, Users } from "lucide-react";

interface Booking {
  id: string;
  property_id: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  check_in: string;
  check_out: string;
  number_of_guests: number;
  total_price: number;
  status: string;
  created_at: string;
  properties: {
    property_name: string;
    partners: {
      profiles: {
        full_name: string;
      };
    };
  };
}

const AdminBookings = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    filterBookings();
  }, [searchQuery, bookings]);

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

      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          properties (
            property_name,
            partner_id
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch partner details separately for each booking
      const bookingsWithPartners = await Promise.all(
        (data || []).map(async (booking) => {
          const partnerId = booking.properties?.partner_id;
          if (!partnerId) {
            return {
              ...booking,
              properties: {
                ...booking.properties,
                partners: null,
              },
            };
          }

          // First get the partner
          const { data: partnerData } = await supabase
            .from("partners")
            .select("user_id")
            .eq("id", partnerId)
            .single();

          // Then get the profile using user_id
          let profileData = null;
          if (partnerData?.user_id) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("id", partnerData.user_id)
              .single();
            
            profileData = profile;
          }

          return {
            ...booking,
            properties: {
              ...booking.properties,
              partners: {
                profiles: profileData || null,
              },
            },
          };
        })
      );

      setBookings(bookingsWithPartners);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load bookings");
    } finally {
      setIsLoading(false);
    }
  };

  const filterBookings = () => {
    if (!searchQuery.trim()) {
      setFilteredBookings(bookings);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = bookings.filter(
      (booking) =>
        booking.guest_name.toLowerCase().includes(query) ||
        booking.guest_email.toLowerCase().includes(query) ||
        booking.properties?.property_name.toLowerCase().includes(query)
    );
    setFilteredBookings(filtered);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge variant="default">✅ Confirmed</Badge>;
      case "pending":
        return <Badge variant="secondary">⏳ Pending</Badge>;
      case "cancelled":
        return <Badge variant="destructive">❌ Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <SuperAdminLayout>
      <div className="mb-8">
        <h1 className="font-heading font-bold text-4xl mb-2">Bookings Management</h1>
        <p className="text-muted-foreground">Monitor all sitewide bookings</p>
      </div>

      {/* Search Bar */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search bookings by guest name, email, or property..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Bookings Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            All Bookings ({filteredBookings.length})
          </CardTitle>
          <CardDescription>View and manage all platform bookings</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No bookings found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-semibold">Booking ID</th>
                    <th className="text-left p-4 font-semibold">Property</th>
                    <th className="text-left p-4 font-semibold">Partner</th>
                    <th className="text-left p-4 font-semibold">Guest</th>
                    <th className="text-left p-4 font-semibold">Dates</th>
                    <th className="text-left p-4 font-semibold">Guests</th>
                    <th className="text-left p-4 font-semibold">Total Price</th>
                    <th className="text-left p-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((booking) => (
                    <tr key={booking.id} className="border-b hover:bg-muted/50">
                      <td className="p-4">
                        <p className="font-mono text-sm">#{booking.id.substring(0, 8)}</p>
                      </td>
                      <td className="p-4">
                        <p className="font-medium">{booking.properties?.property_name || "Unknown"}</p>
                      </td>
                      <td className="p-4">
                        {booking.properties?.partners?.profiles?.full_name || "Unknown"}
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          <p className="font-medium">{booking.guest_name}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {booking.guest_email}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {booking.guest_phone}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          <p>
                            {new Date(booking.check_in).toLocaleDateString()} -{" "}
                            {new Date(booking.check_out).toLocaleDateString()}
                          </p>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          {booking.number_of_guests}
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="font-medium">KES {booking.total_price.toLocaleString()}</p>
                      </td>
                      <td className="p-4">{getStatusBadge(booking.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </SuperAdminLayout>
  );
};

export default AdminBookings;

