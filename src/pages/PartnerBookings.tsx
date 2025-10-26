import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PartnerLayout } from "@/components/PartnerLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Calendar, CheckCircle, XCircle, Clock, Mail, Phone, User, MessageCircle, Eye, RefreshCw, Search } from "lucide-react";

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
    location: string;
  };
}

const PartnerBookings = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchBookings();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "partner");

    if (!roles || roles.length === 0) {
      toast.error("Access denied. Partner account required.");
      navigate("/");
    }
  };

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: partner } = await supabase
        .from("partners")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!partner) return;

      // Get all properties for this partner
      const { data: properties } = await supabase
        .from("properties")
        .select("id")
        .eq("partner_id", partner.id);

      if (!properties || properties.length === 0) {
        setBookings([]);
        return;
      }

      const propertyIds = properties.map(p => p.id);

      // Get bookings for all properties
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          properties (property_name, location)
        `)
        .in("property_id", propertyIds)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBookings(data || []);
      setFilteredBookings(data || []);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      toast.error("Failed to load bookings");
    } finally {
      setIsLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId: string, newStatus: "confirmed" | "declined") => {
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status: newStatus })
        .eq("id", bookingId);

      if (error) throw error;

      toast.success(`Booking ${newStatus} successfully`);
      fetchBookings();
    } catch (error) {
      console.error("Error updating booking:", error);
      toast.error("Failed to update booking");
    }
  };

  const calculateNights = (checkIn: string, checkOut: string) => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diff = end.getTime() - start.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredBookings(bookings);
      return;
    }
    const filtered = bookings.filter(
      (booking) =>
        booking.guest_name.toLowerCase().includes(query.toLowerCase()) ||
        booking.properties.property_name.toLowerCase().includes(query.toLowerCase()) ||
        booking.properties.location.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredBookings(filtered);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return { label: "🕓 Pending", variant: "secondary" as const, class: "bg-yellow-500 text-white" };
      case "confirmed":
        return { label: "🟢 Confirmed", variant: "default" as const, class: "bg-green-500 text-white" };
      case "declined":
      case "cancelled":
        return { label: "🔴 Cancelled", variant: "destructive" as const, class: "bg-red-500 text-white" };
      default:
        return { label: status, variant: "outline" as const, class: "" };
    }
  };

  const contactGuestWhatsApp = (phone: string, guestName: string, propertyName: string) => {
    const cleanedPhone = phone.replace(/\D/g, '');
    const message = `Hello ${guestName}, this is regarding your booking at ${propertyName}. How can I assist you?`;
    const whatsappUrl = `https://wa.me/${cleanedPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const BookingCard = ({ booking }: { booking: Booking }) => {
    const statusBadge = getStatusBadge(booking.status);
    return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-lg">{booking.properties.property_name}</CardTitle>
              <Badge className={statusBadge.class}>
                {statusBadge.label}
              </Badge>
            </div>
            <CardDescription>{booking.properties.location}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{booking.guest_name}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <a href={`mailto:${booking.guest_email}`} className="text-primary hover:underline">
                {booking.guest_email}
              </a>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <a href={`tel:${booking.guest_phone}`} className="text-primary hover:underline">
                {booking.guest_phone}
              </a>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                {new Date(booking.check_in).toLocaleDateString()} - {new Date(booking.check_out).toLocaleDateString()}
              </span>
            </div>
            <div className="text-sm">
              <span className="font-medium">{calculateNights(booking.check_in, booking.check_out)} nights</span> • {booking.number_of_guests} guests
            </div>
            <div className="text-sm font-bold text-primary">
              KES {booking.total_price.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-4 border-t">
          {/* View Details Dialog */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Booking Details</DialogTitle>
                <DialogDescription>
                  Booking ID: {booking.id.slice(0, 8)}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Property</h4>
                  <p className="text-sm">{booking.properties.property_name}</p>
                  <p className="text-sm text-muted-foreground">{booking.properties.location}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Guest Information</h4>
                  <p className="text-sm">{booking.guest_name}</p>
                  <p className="text-sm text-muted-foreground">{booking.guest_email}</p>
                  <p className="text-sm text-muted-foreground">{booking.guest_phone}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Stay Details</h4>
                  <p className="text-sm">Check-in: {new Date(booking.check_in).toLocaleDateString()}</p>
                  <p className="text-sm">Check-out: {new Date(booking.check_out).toLocaleDateString()}</p>
                  <p className="text-sm">Guests: {booking.number_of_guests}</p>
                  <p className="text-sm font-bold text-primary">Total: KES {booking.total_price.toLocaleString()}</p>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Contact Guest WhatsApp */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => contactGuestWhatsApp(booking.guest_phone, booking.guest_name, booking.properties.property_name)}
            className="text-green-600 hover:text-green-700"
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            WhatsApp
          </Button>
        </div>

        {booking.status === "pending" && (
          <div className="grid grid-cols-2 gap-2">
            <Button
              size="sm"
              onClick={() => updateBookingStatus(booking.id, "confirmed")}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Confirm
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => updateBookingStatus(booking.id, "declined")}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Decline
            </Button>
          </div>
        )}

        <div className="text-xs text-muted-foreground pt-2 border-t">
          <p>Booked: {new Date(booking.created_at).toLocaleString()}</p>
        </div>
      </CardContent>
    </Card>
    );
  };

  const pendingBookings = filteredBookings.filter(b => b.status === "pending");
  const confirmedBookings = filteredBookings.filter(b => b.status === "confirmed");
  const cancelledBookings = filteredBookings.filter(b => b.status === "declined" || b.status === "cancelled");

  return (
    <PartnerLayout>
      <div className="max-w-6xl mx-auto">

          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="font-heading font-bold text-4xl mb-2">My Bookings</h1>
                <p className="text-muted-foreground">
                  Manage guest reservations and booking requests
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={fetchBookings}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by guest name, property, or location..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="grid w-full grid-cols-3 lg:w-auto">
              <TabsTrigger value="pending" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Pending ({pendingBookings.length})
              </TabsTrigger>
              <TabsTrigger value="confirmed" className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Confirmed ({confirmedBookings.length})
              </TabsTrigger>
              <TabsTrigger value="all">
                All Bookings ({bookings.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-4 mt-6">
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <Card key={i} className="animate-pulse">
                      <CardHeader>
                        <div className="h-6 bg-muted rounded w-1/2 mb-2"></div>
                        <div className="h-4 bg-muted rounded w-1/3"></div>
                      </CardHeader>
                      <CardContent>
                        <div className="h-20 bg-muted rounded"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : pendingBookings.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No pending bookings</p>
                  </CardContent>
                </Card>
              ) : (
                pendingBookings.map(booking => <BookingCard key={booking.id} booking={booking} />)
              )}
            </TabsContent>

            <TabsContent value="confirmed" className="space-y-4 mt-6">
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <Card key={i} className="animate-pulse">
                      <CardHeader>
                        <div className="h-6 bg-muted rounded w-1/2 mb-2"></div>
                        <div className="h-4 bg-muted rounded w-1/3"></div>
                      </CardHeader>
                      <CardContent>
                        <div className="h-20 bg-muted rounded"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : confirmedBookings.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No confirmed bookings</p>
                  </CardContent>
                </Card>
              ) : (
                confirmedBookings.map(booking => <BookingCard key={booking.id} booking={booking} />)
              )}
            </TabsContent>

            <TabsContent value="all" className="space-y-4 mt-6">
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="animate-pulse">
                      <CardHeader>
                        <div className="h-6 bg-muted rounded w-1/2 mb-2"></div>
                        <div className="h-4 bg-muted rounded w-1/3"></div>
                      </CardHeader>
                      <CardContent>
                        <div className="h-20 bg-muted rounded"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : bookings.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No bookings yet</p>
                  </CardContent>
                </Card>
              ) : (
                bookings.map(booking => <BookingCard key={booking.id} booking={booking} />)
              )}
            </TabsContent>
          </Tabs>
      </div>
    </PartnerLayout>
  );
};

export default PartnerBookings;
