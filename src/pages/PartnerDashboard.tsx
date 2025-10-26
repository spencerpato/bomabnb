import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PartnerLayout } from "@/components/PartnerLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Plus,
  Home,
  Calendar,
  DollarSign,
  Star,
  AlertCircle,
  Bell,
  X,
  TrendingUp,
  Clock,
  MessageCircle,
  Settings,
  List,
  CheckCircle,
  Eye,
  MessageSquare,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import PropertyReviewsSection from "@/components/partner/PropertyReviewsSection";

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
  is_featured: boolean;
  featured_image: string;
  created_at: string;
}

interface Booking {
  id: string;
  guest_name: string;
  guest_email: string;
  check_in: string;
  check_out: string;
  total_price: number;
  status: string;
  created_at: string;
  properties: {
    property_name: string;
  };
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  status: string;
  created_at: string;
}

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Good night";
};

const getGreetingEmoji = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "👋";
  if (hour < 17) return "🌞";
  if (hour < 21) return "🌙";
  return "🌙";
};

const PartnerDashboard = () => {
  const navigate = useNavigate();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [userName, setUserName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const [stats, setStats] = useState({
    totalProperties: 0,
    activeListings: 0,
    pendingApproval: 0,
    totalBookings: 0,
    totalEarnings: 0,
    systemCommission: 0,
    netRevenue: 0,
    featuredProperties: 0,
  });

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (notifications.length > 0 && notifications.some((n) => n.status === "unread")) {
      setShowNotificationPanel(true);
    }
  }, [notifications]);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Get user profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      if (profileData) {
        setUserName(profileData.full_name);
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
      
      // Check if partner is approved
      if (partnerData.status !== "active") {
        navigate("/partner-pending-approval");
        return;
      }

      setPartner(partnerData);

      // Fetch all data
      await Promise.all([
        fetchProperties(partnerData.id),
        fetchBookings(partnerData.id),
        fetchNotifications(partnerData.id),
      ]);
    } catch (error) {
      console.error("Error loading dashboard:", error);
      toast.error("Failed to load dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProperties = async (partnerId: string) => {
    try {
      const { data: propertiesData, error } = await supabase
        .from("properties")
        .select("*")
        .eq("partner_id", partnerId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProperties(propertiesData || []);

      // Calculate stats
      const activeListings = propertiesData?.filter((p) => p.is_active).length || 0;
      const pendingApproval = propertiesData?.filter((p) => !p.is_active).length || 0;
      const featuredProperties = propertiesData?.filter((p) => p.is_featured).length || 0;

      setStats((prev) => ({
        ...prev,
        totalProperties: propertiesData?.length || 0,
        activeListings,
        pendingApproval,
        featuredProperties,
      }));
    } catch (error) {
      console.error("Error fetching properties:", error);
    }
  };

  const fetchBookings = async (partnerId: string) => {
    try {
      const { data: propertiesData } = await supabase
        .from("properties")
        .select("id")
        .eq("partner_id", partnerId);

      if (!propertiesData || propertiesData.length === 0) {
        setBookings([]);
        return;
      }

      const propertyIds = propertiesData.map((p) => p.id);

      const { data: bookingsData, error } = await supabase
        .from("bookings")
        .select(`
          *,
          properties (property_name)
        `)
        .in("property_id", propertyIds)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      setBookings(bookingsData || []);

      // Calculate earnings and commission
      const confirmedBookings = bookingsData?.filter((b) => b.status === "confirmed") || [];
      const SYSTEM_COMMISSION_RATE = 0.15; // 15% platform fee
      
      const totalEarnings = confirmedBookings.reduce((sum, b) => sum + Number(b.total_price), 0);
      const systemCommission = totalEarnings * SYSTEM_COMMISSION_RATE;
      const netRevenue = totalEarnings - systemCommission; // Partner keeps 85%

      setStats((prev) => ({
        ...prev,
        totalBookings: bookingsData?.length || 0,
        totalEarnings,
        systemCommission,
        netRevenue,
      }));
    } catch (error) {
      console.error("Error fetching bookings:", error);
    }
  };

  const fetchNotifications = async (partnerId: string) => {
    try {
      const { data, error } = await supabase
        .from("partner_notifications")
        .select("*")
        .eq("partner_id", partnerId)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const dismissNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from("partner_notifications")
        .update({ status: "read" })
        .eq("id", notificationId);

      if (error) throw error;

      setNotifications((prevNotifications) =>
        prevNotifications.map((n) => (n.id === notificationId ? { ...n, status: "read" } : n))
      );
    } catch (error) {
      console.error("Error dismissing notification:", error);
    }
  };

  const dismissNotificationPanel = async () => {
    try {
      // Mark all unread notifications shown in the panel as read
      const unreadNotificationIds = notifications
        .filter((n) => n.status === "unread")
        .slice(0, 3)
        .map((n) => n.id);

      if (unreadNotificationIds.length > 0) {
        const { error } = await supabase
          .from("partner_notifications")
          .update({ status: "read" })
          .in("id", unreadNotificationIds);

        if (error) {
          console.error("Error marking notifications as read:", error);
        } else {
          // Update local state
          setNotifications((prevNotifications) =>
            prevNotifications.map((n) =>
              unreadNotificationIds.includes(n.id) ? { ...n, status: "read" } : n
            )
          );
        }
      }

      setShowNotificationPanel(false);
    } catch (error) {
      console.error("Error dismissing notification panel:", error);
      setShowNotificationPanel(false);
    }
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

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "property_approval":
      case "feature_approved":
        return "✅";
      case "booking":
        return "📅";
      case "promotional":
        return "🎉";
      case "warning":
      case "maintenance":
        return "⚠️";
      default:
        return "🔔";
    }
  };

  const getTopProperties = () => {
    // Sort properties by number of bookings (simplified - in real app you'd count actual bookings)
    return properties.slice(0, 3);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  if (partner?.status === "pending") {
    return (
      <PartnerLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md text-center">
            <CardHeader>
              <CardTitle>⏳ Application Pending</CardTitle>
              <CardDescription>
                Your partner application is currently under review by our admin team. This usually takes 24-48 hours.
                You'll be able to access your dashboard once approved.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </PartnerLayout>
    );
  }

  if (partner?.status === "rejected") {
    return (
      <PartnerLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md text-center">
            <CardHeader>
              <CardTitle>⚠️ Application Not Approved</CardTitle>
              <CardDescription>
                Unfortunately, your partner application was not approved. Please contact admin at
                patomaich611@gmail.com or +254 703 998 717 for more information.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </PartnerLayout>
    );
  }

  const featuredProperties = properties.filter((p) => p.is_featured);
  const hasFeaturedListing = featuredProperties.length > 0;

  return (
    <PartnerLayout>
      <div className="space-y-6">
        {/* Dynamic Notification Panel */}
        {showNotificationPanel && notifications.some((n) => n.status === "unread") && (
          <Alert className="bg-[#F9E8C6] border-accent animate-in slide-in-from-top-5 duration-500">
            <div className="flex items-start justify-between w-full">
              <div className="flex-1">
                <AlertTitle className="flex items-center gap-2 mb-2">
                  <Bell className="h-5 w-5 text-accent" />
                  Recent Updates
                </AlertTitle>
                <div className="space-y-2">
                  {notifications
                    .filter((n) => n.status === "unread")
                    .slice(0, 3)
                    .map((notification) => (
                      <AlertDescription key={notification.id} className="text-sm">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <span className="mr-2">{getNotificationIcon(notification.type)}</span>
                            <span className="font-medium">{notification.title}</span>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatTimeAgo(notification.created_at)}
                            </p>
                          </div>
                        </div>
                      </AlertDescription>
                    ))}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={dismissNotificationPanel}
                className="ml-4 h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </Alert>
        )}

        {/* Top Section - Greeting */}
          <div className="mb-8">
            <h1 className="font-heading font-bold text-4xl mb-2">
            {getGreeting()}, {userName || "Partner"} {getGreetingEmoji()}
            </h1>
            <p className="text-muted-foreground">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Here's how your BnBs are performing today.
            </p>
          </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
              <Home className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
              <div className="text-2xl font-bold">{stats.totalProperties}</div>
              <p className="text-xs text-muted-foreground mt-1">Properties</p>
              <Button
                variant="link"
                className="p-0 h-auto mt-2 text-xs"
                onClick={() => navigate("/partner-listings")}
              >
                View Properties →
              </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Listings</CardTitle>
              <CheckCircle className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeListings}</div>
              <p className="text-xs text-muted-foreground mt-1">Visible to users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
              <Clock className="h-5 w-5 text-accent" />
              </CardHeader>
              <CardContent>
              <div className="text-2xl font-bold text-accent">{stats.pendingApproval}</div>
              <p className="text-xs text-muted-foreground mt-1">Awaiting Superadmin review</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              <Calendar className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBookings}</div>
              <p className="text-xs text-muted-foreground mt-1">All bookings</p>
              <Button
                variant="link"
                className="p-0 h-auto mt-2 text-xs"
                onClick={() => navigate("/partner-bookings")}
              >
                View All →
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gross Revenue</CardTitle>
              <DollarSign className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">KES {stats.totalEarnings.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Total from confirmed bookings</p>
            </CardContent>
          </Card>

          <Card className="border-orange-200 bg-orange-50/50 dark:bg-orange-950/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Platform Commission</CardTitle>
              <AlertCircle className="h-5 w-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">-KES {stats.systemCommission.toLocaleString(undefined, {maximumFractionDigits: 0})}</div>
              <p className="text-xs text-muted-foreground mt-1">15% platform fee</p>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Your Net Revenue</CardTitle>
              <TrendingUp className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">KES {stats.netRevenue.toLocaleString(undefined, {maximumFractionDigits: 0})}</div>
              <p className="text-xs text-muted-foreground mt-1">You keep 85%</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Featured Properties</CardTitle>
              <Star className="h-5 w-5 text-yellow-500" />
              </CardHeader>
              <CardContent>
              <div className="text-2xl font-bold">{stats.featuredProperties}</div>
              <p className="text-xs text-muted-foreground mt-1">Currently featured</p>
              </CardContent>
            </Card>
          </div>

        {/* Recent Bookings */}
        {bookings.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Recent Bookings
                  </CardTitle>
                  <CardDescription>Your latest booking requests</CardDescription>
                </div>
                <Button variant="outline" onClick={() => navigate("/partner-bookings")}>
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {bookings.slice(0, 5).map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{booking.properties?.property_name || "Unknown"}</p>
                      <p className="text-sm text-muted-foreground">{booking.guest_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(booking.check_in).toLocaleDateString()} -{" "}
                        {new Date(booking.check_out).toLocaleDateString()}
                        </p>
                      </div>
                    <div className="text-right">
                      {getStatusBadge(booking.status)}
                      <p className="text-sm font-medium mt-1">KES {booking.total_price.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Top Performing Properties */}
        {properties.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Top Performing Properties
              </CardTitle>
              <CardDescription>Your properties with the most activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {getTopProperties().map((property) => (
                  <div key={property.id} className="border rounded-lg overflow-hidden">
                    <div className="aspect-video bg-muted">
                      {property.featured_image ? (
                        <img
                          src={property.featured_image}
                          alt={property.property_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Home className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold mb-1">{property.property_name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{property.location}</p>
                      <Badge variant={property.is_featured ? "default" : "outline"}>
                        {property.is_featured ? "⭐ Featured" : "Regular"}
                        </Badge>
                    </div>
                    </div>
                  ))}
                </div>
            </CardContent>
          </Card>
        )}

        {/* Property Reviews Section */}
        {partner && (
          <div className="mb-8">
            <PropertyReviewsSection partnerId={partner.id} />
          </div>
        )}

        {/* Feature My Listing Prompt */}
        {!hasFeaturedListing && (
          <Alert className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-300">
            <Star className="h-5 w-5 text-yellow-600" />
            <AlertTitle className="text-yellow-900">Want your property to appear on top searches? 🌟</AlertTitle>
            <AlertDescription className="text-yellow-800">
              Feature your listings to get more visibility and bookings. Your property will appear at the top of
              search results.
            </AlertDescription>
            <Button
              className="mt-3 bg-yellow-600 hover:bg-yellow-700"
              onClick={() => navigate("/feature-request")}
            >
              Feature My Listing
            </Button>
          </Alert>
        )}

        {/* Quick Action Buttons */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Fast access to frequently used features</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <Button
                onClick={() => navigate("/add-property")}
                className="h-auto py-6 flex flex-col items-center gap-2 bg-primary hover:bg-primary/90"
              >
                <Plus className="h-6 w-6" />
                <span className="text-sm">Add New Property</span>
              </Button>
              <Button
                onClick={() => navigate("/partner-listings")}
                variant="outline"
                className="h-auto py-6 flex flex-col items-center gap-2"
              >
                <List className="h-6 w-6" />
                <span className="text-sm">Manage Listings</span>
              </Button>
              <Button
                onClick={() => navigate("/partner-bookings")}
                variant="outline"
                className="h-auto py-6 flex flex-col items-center gap-2"
              >
                <Calendar className="h-6 w-6" />
                <span className="text-sm">View Bookings</span>
              </Button>
              <Button
                onClick={() => window.open("https://wa.me/0114097160", "_blank")}
                variant="outline"
                className="h-auto py-6 flex flex-col items-center gap-2"
              >
                <MessageCircle className="h-6 w-6" />
                <span className="text-sm">Contact Admin</span>
              </Button>
              <Button
                onClick={() => navigate("/partner-profile")}
                variant="outline"
                className="h-auto py-6 flex flex-col items-center gap-2"
              >
                <Settings className="h-6 w-6" />
                <span className="text-sm">Edit Profile</span>
              </Button>
        </div>
          </CardContent>
        </Card>
      </div>
    </PartnerLayout>
  );
};

export default PartnerDashboard;
