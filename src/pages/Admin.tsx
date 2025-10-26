import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SuperAdminLayout } from "@/components/SuperAdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Users,
  Home,
  Calendar,
  DollarSign,
  Star,
  AlertCircle,
  Bell,
  Plus,
  MessageSquare,
  Wrench,
  TrendingUp,
  Clock,
  UserCog,
} from "lucide-react";
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Good night";
};

const Admin = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalPartners: 0,
    totalProperties: 0,
    totalBookings: 0,
    revenueGenerated: 0,
    featuredListings: 0,
    pendingApprovals: 0,
    systemAlerts: 0,
    totalAgents: 0,
    totalReferredPartners: 0,
    totalCommissionPayouts: 0,
  });
  const [bookingData, setBookingData] = useState<any[]>([]);
  const [partnerDistributionData, setPartnerDistributionData] = useState<any[]>([]);
  const [growthData, setGrowthData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const COLORS = ["#eab308", "#16a34a", "#dc2626", "#ca8a04"];

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

      // Fetch all data
      const [partnersData, propertiesData, bookingsData, featureRequestsData, agentsData, referralsData, commissionsData] = await Promise.all([
        supabase.from("partners").select("*"),
        supabase.from("properties").select("*"),
        supabase.from("bookings").select("*"),
        supabase.from("feature_requests").select("*"),
        supabase.from("referrers").select("*"),
        supabase.from("referrals").select("*"),
        supabase.from("commissions").select("commission_amount"),
      ]);

      const partners = partnersData.data || [];
      const properties = propertiesData.data || [];
      const bookings = bookingsData.data || [];
      const featureRequests = featureRequestsData.data || [];
      const agents = agentsData.data || [];
      const referrals = referralsData.data || [];
      const commissions = commissionsData.data || [];

      // Calculate stats
      const pendingPartners = partners.filter((p) => p.status === "pending").length;
      const pendingAgents = agents.filter((a) => a.status === "pending").length;
      const pendingListings = properties.filter((p) => !p.is_active).length;
      const featuredListings = properties.filter((p) => p.is_featured).length;
      const activeAgents = agents.filter((a) => a.status === "active").length;
      const totalReferredPartners = referrals.filter((r) => r.status === "active").length;
      
      // Calculate system commission (15% of confirmed bookings)
      const SYSTEM_COMMISSION_RATE = 0.15;
      const confirmedBookings = bookings.filter((b) => b.status === "confirmed");
      const revenueGenerated = confirmedBookings.reduce(
        (sum, b) => sum + (Number(b.total_price) * SYSTEM_COMMISSION_RATE), 
        0
      );
      
      // Calculate total agent commission payouts (10% of confirmed bookings)
      const AGENT_COMMISSION_RATE = 0.10;
      const totalCommissionPayouts = confirmedBookings.reduce(
        (sum, b) => sum + (Number(b.total_price) * AGENT_COMMISSION_RATE), 
        0
      );

      setStats({
        totalPartners: partners.length,
        totalProperties: properties.length,
        totalBookings: bookings.length,
        revenueGenerated,
        featuredListings,
        pendingApprovals: pendingPartners + pendingListings + pendingAgents,
        systemAlerts: 0,
        totalAgents: activeAgents,
        totalReferredPartners,
        totalCommissionPayouts,
      });

      // Generate booking chart data (last 7 days)
      const bookingsByDay: { [key: string]: number } = {};
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateKey = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        bookingsByDay[dateKey] = 0;
      }

      bookings.forEach((booking) => {
        const date = new Date(booking.created_at);
        const dateKey = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        if (bookingsByDay[dateKey] !== undefined) {
          bookingsByDay[dateKey]++;
        }
      });

      setBookingData(Object.entries(bookingsByDay).map(([name, value]) => ({ name, bookings: value })));

      // Generate partner distribution by location
      const partnerLocations: { [key: string]: number } = {};
      partners.forEach((partner) => {
        const location = partner.location || "Unknown";
        partnerLocations[location] = (partnerLocations[location] || 0) + 1;
      });

      const topLocations = Object.entries(partnerLocations)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name, value]) => ({ name, partners: value }));

      setPartnerDistributionData(topLocations);

      // Generate growth data (last 6 months)
      const growth: { [key: string]: number } = {};
      const last6Months = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthKey = date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
        last6Months.push(monthKey);
        growth[monthKey] = 0;
      }

      // Count properties created in each month
      properties.forEach((property) => {
        const date = new Date(property.created_at);
        const monthKey = date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
        if (growth[monthKey] !== undefined) {
          growth[monthKey]++;
        }
      });

      setGrowthData(last6Months.map((name) => ({ month: name, properties: growth[name] || 0 })));
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <SuperAdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout>
      {/* Header Section */}
          <div className="mb-8">
            <h1 className="font-heading font-bold text-4xl mb-2">
          {getGreeting()}, Patrick 👋
            </h1>
            <p className="text-muted-foreground">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
        {stats.pendingApprovals > 0 && (
          <div className="mt-4 p-4 bg-accent/10 border border-accent rounded-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-accent" />
            <span className="text-sm font-medium">
              {stats.pendingApprovals} new approval{stats.pendingApprovals > 1 ? "s" : ""} pending
            </span>
          </div>
        )}
          </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Partners</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalPartners}</div>
            <p className="text-xs text-muted-foreground mt-1">Registered Partners</p>
            <Button
              variant="link"
              className="p-0 h-auto mt-2 text-xs"
              onClick={() => navigate("/admin/partners")}
            >
              View Details →
            </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
                <Home className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalProperties}</div>
            <p className="text-xs text-muted-foreground mt-1">Approved Properties</p>
            <Button
              variant="link"
              className="p-0 h-auto mt-2 text-xs"
              onClick={() => navigate("/admin/properties")}
            >
              View Details →
            </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalBookings}</div>
            <p className="text-xs text-muted-foreground mt-1">All Bookings</p>
            <Button
              variant="link"
              className="p-0 h-auto mt-2 text-xs"
              onClick={() => navigate("/admin/bookings")}
            >
              View Details →
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Generated</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES {stats.revenueGenerated.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">From Featured Listings</p>
            <Button
              variant="link"
              className="p-0 h-auto mt-2 text-xs"
              onClick={() => navigate("/admin/featured-requests")}
            >
              View Details →
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Featured Listings</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.featuredListings}</div>
            <p className="text-xs text-muted-foreground mt-1">Currently Active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <Clock className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{stats.pendingApprovals}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting Review</p>
            <Button
              variant="link"
              className="p-0 h-auto mt-2 text-xs"
              onClick={() => navigate("/admin/partners")}
            >
              Review Now →
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Alerts</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.systemAlerts}</div>
            <p className="text-xs text-muted-foreground mt-1">Active Issues</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Growth</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{growthData[growthData.length - 1]?.properties || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">This Month</p>
              </CardContent>
            </Card>
          </div>

      {/* Agent Analytics Section */}
      <div className="mb-6">
        <h2 className="text-2xl font-heading font-bold mb-4">Agent Analytics</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Active Agents</CardTitle>
            <UserCog className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAgents}</div>
            <p className="text-xs text-muted-foreground mt-1">Approved & Active</p>
            <Button
              variant="link"
              className="p-0 h-auto mt-2 text-xs"
              onClick={() => navigate("/admin/agents")}
            >
              View Details →
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Referred Partners</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReferredPartners}</div>
            <p className="text-xs text-muted-foreground mt-1">Across All Agents</p>
            <Button
              variant="link"
              className="p-0 h-auto mt-2 text-xs"
              onClick={() => navigate("/admin/agents")}
            >
              View Details →
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Commission Payouts</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES {stats.totalCommissionPayouts.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Cumulative Earnings</p>
            <Button
              variant="link"
              className="p-0 h-auto mt-2 text-xs"
              onClick={() => navigate("/admin/agents")}
            >
              View Details →
            </Button>
          </CardContent>
        </Card>
          </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Bookings Chart */}
          <Card>
            <CardHeader>
            <CardTitle>Bookings Overview</CardTitle>
            <CardDescription>Bookings per day (Last 7 days)</CardDescription>
            </CardHeader>
            <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={bookingData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="bookings" fill="#eab308" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Partner Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Partner Distribution</CardTitle>
            <CardDescription>Partners by location (Top 5)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={partnerDistributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="partners"
                >
                  {partnerDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
                      </div>

      {/* Growth Chart */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Platform Growth</CardTitle>
          <CardDescription>Properties added over time (Last 6 months)</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={growthData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="properties" stroke="#16a34a" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Quick Access Shortcuts */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Access</CardTitle>
          <CardDescription>Frequently used actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Button
              variant="outline"
              className="h-auto flex-col p-4 gap-2"
              onClick={() => navigate("/admin/partners")}
            >
              <Users className="h-6 w-6" />
              <span className="text-sm font-medium">View Pending Partners</span>
                        </Button>
                        <Button
              variant="outline"
              className="h-auto flex-col p-4 gap-2"
              onClick={() => navigate("/admin/properties")}
            >
              <Home className="h-6 w-6" />
              <span className="text-sm font-medium">View New Listings</span>
                        </Button>
            <Button
              variant="outline"
              className="h-auto flex-col p-4 gap-2"
              onClick={() => navigate("/admin/notifications")}
            >
              <MessageSquare className="h-6 w-6" />
              <span className="text-sm font-medium">Send Notification</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col p-4 gap-2"
              onClick={() => navigate("/admin/maintenance")}
            >
              <Wrench className="h-6 w-6" />
              <span className="text-sm font-medium">Maintenance Mode</span>
            </Button>
                    </div>
            </CardContent>
          </Card>
    </SuperAdminLayout>
  );
};

export default Admin;
