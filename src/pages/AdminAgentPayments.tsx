import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SuperAdminLayout } from "@/components/SuperAdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Users, DollarSign, TrendingUp, Clock, CheckCircle, Wallet, Search, Eye, Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AgentWithStats {
  id: string;
  user_id: string;
  referral_code: string;
  business_name?: string;
  status: string;
  commission_rate: string;
  payment_mode?: string;
  bank_name?: string;
  bank_branch?: string;
  account_number?: string;
  account_name?: string;
  mobile_money_provider?: string;
  mobile_money_number?: string;
  mobile_money_name?: string;
  profiles: {
    full_name: string;
    email: string;
  };
  totalEarnings: number;
  totalPaid: number;
  pendingPayment: number;
  referredPartnersCount: number;
  totalBookings: number;
}

interface BookingCommission {
  id: string;
  property_name: string;
  partner_name: string;
  booking_amount: number;
  commission: number;
  status: string;
  booking_date: string;
}

const AdminAgentPayments = () => {
  const navigate = useNavigate();
  const [agents, setAgents] = useState<AgentWithStats[]>([]);
  const [filteredAgents, setFilteredAgents] = useState<AgentWithStats[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAgent, setSelectedAgent] = useState<AgentWithStats | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    paymentMethod: "",
    transactionRef: "",
    notes: "",
  });
  const [bookingCommissions, setBookingCommissions] = useState<BookingCommission[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    filterAgents();
  }, [searchQuery, agents]);

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

      await fetchAgents();
    } catch (error) {
      console.error("Error checking auth:", error);
      navigate("/admin-login");
    }
  };

  const fetchAgents = async () => {
    try {
      setIsLoading(true);

      // Fetch all agents/referrers
      const { data: agentsData, error: agentsError } = await supabase
        .from("referrers")
        .select("*")
        .order("created_at", { ascending: false });

      console.log("=== ADMIN AGENT PAYMENTS DEBUG ===");
      console.log("Agents data:", agentsData);
      console.log("Agents error:", agentsError);
      console.log("Number of agents:", agentsData?.length || 0);

      if (agentsError) {
        console.error("Error fetching agents:", agentsError);
        toast.error("Failed to load agents: " + agentsError.message);
        return;
      }

      if (!agentsData || agentsData.length === 0) {
        console.log("No agents found in database");
        setAgents([]);
        setFilteredAgents([]);
        setIsLoading(false);
        return;
      }

      // Calculate stats for each agent
      const agentsWithStats = await Promise.all(
        agentsData.map(async (agent) => {
          // Get profile data for this agent
          const { data: profileData } = await supabase
            .from("profiles")
            .select("full_name, email")
            .eq("id", agent.user_id)
            .single();

          // Get referrals
          const { data: referrals } = await supabase
            .from("referrals")
            .select("partner_id")
            .eq("referrer_id", agent.id);

          const partnerIds = referrals?.map(r => r.partner_id) || [];

          let totalBookings = 0;
          let totalEarnings = 0;

          if (partnerIds.length > 0) {
            // Get properties
            const { data: properties } = await supabase
              .from("properties")
              .select("id")
              .in("partner_id", partnerIds);

            if (properties && properties.length > 0) {
              const propertyIds = properties.map(p => p.id);

              // Get confirmed bookings
              const { data: bookings } = await supabase
                .from("bookings")
                .select("total_price, status")
                .in("property_id", propertyIds)
                .eq("status", "confirmed");

              totalBookings = bookings?.length || 0;
              totalEarnings = bookings?.reduce((sum, b) => 
                sum + (Number(b.total_price) * 0.10), 0
              ) || 0;
            }
          }

          // Get total paid
          // @ts-expect-error - agent_payments not in types yet
          const { data: payments } = await supabase
            .from("agent_payments")
            .select("amount")
            .eq("referrer_id", agent.id);

          const totalPaid = payments?.reduce((sum: number, p: any) => 
            sum + Number(p.amount), 0
          ) || 0;

          return {
            ...agent,
            profiles: {
              full_name: profileData?.full_name || "Unknown",
              email: profileData?.email || "No email",
            },
            totalEarnings,
            totalPaid,
            pendingPayment: totalEarnings - totalPaid,
            referredPartnersCount: partnerIds.length,
            totalBookings,
          };
        })
      );

      setAgents(agentsWithStats);
      setFilteredAgents(agentsWithStats);
    } catch (error) {
      console.error("Error fetching agents:", error);
      toast.error("Failed to load agents");
    } finally {
      setIsLoading(false);
    }
  };

  const filterAgents = () => {
    if (!searchQuery.trim()) {
      setFilteredAgents(agents);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = agents.filter(
      (agent) =>
        agent.profiles.full_name.toLowerCase().includes(query) ||
        agent.profiles.email.toLowerCase().includes(query) ||
        agent.business_name?.toLowerCase().includes(query) ||
        agent.referral_code.toLowerCase().includes(query)
    );
    setFilteredAgents(filtered);
  };

  const viewAgentDetails = async (agent: AgentWithStats) => {
    setSelectedAgent(agent);
    
    // Fetch booking commissions for this agent
    try {
      const { data: referrals } = await supabase
        .from("referrals")
        .select("partner_id")
        .eq("referrer_id", agent.id);

      const partnerIds = referrals?.map(r => r.partner_id) || [];

      if (partnerIds.length > 0) {
        const { data: properties } = await supabase
          .from("properties")
          .select("id, property_name, partner_id")
          .in("partner_id", partnerIds);

        if (properties && properties.length > 0) {
          const propertyIds = properties.map(p => p.id);

          const { data: bookings } = await supabase
            .from("bookings")
            .select("id, total_price, status, created_at, property_id")
            .in("property_id", propertyIds);

          // Fetch partner names separately
          const { data: partners } = await supabase
            .from("partners")
            .select("id, user_id")
            .in("id", partnerIds);

          // Fetch profiles for partners
          const partnerProfiles: { [key: string]: string } = {};
          if (partners) {
            for (const partner of partners) {
              const { data: profile } = await supabase
                .from("profiles")
                .select("full_name")
                .eq("id", partner.user_id)
                .single();
              if (profile) {
                partnerProfiles[partner.id] = profile.full_name;
              }
            }
          }

          const commissionsData = bookings?.map(b => {
            const property = properties.find(p => p.id === b.property_id);
            const partnerName = property ? partnerProfiles[property.partner_id] : "Unknown";
            return {
              id: b.id,
              property_name: property?.property_name || "Unknown",
              partner_name: partnerName || "Unknown",
              booking_amount: b.total_price,
              commission: Number(b.total_price) * 0.10,
              status: b.status,
              booking_date: b.created_at,
            };
          }) || [];

          console.log("Commission data fetched:", commissionsData);
          setBookingCommissions(commissionsData);
        } else {
          setBookingCommissions([]);
        }
      } else {
        setBookingCommissions([]);
      }

      // Fetch payment history
      // @ts-expect-error - agent_payments not in types yet
      const { data: payments } = await supabase
        .from("agent_payments")
        .select("*")
        .eq("referrer_id", agent.id)
        .order("created_at", { ascending: false });

      setPaymentHistory(payments || []);
    } catch (error) {
      console.error("Error fetching agent details:", error);
    }

    setShowDetailsDialog(true);
  };

  // Generate transaction reference
  const generateTransactionRef = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `TXN-${timestamp}-${random}`;
  };

  const handleRecordPayment = async () => {
    if (!selectedAgent || !paymentForm.amount || !paymentForm.paymentMethod) {
      toast.error("Please fill in all required fields");
      return;
    }

    const amount = parseFloat(paymentForm.amount);
    if (amount > selectedAgent.pendingPayment) {
      toast.error(`Maximum amount is KES ${selectedAgent.pendingPayment.toLocaleString()}`);
      return;
    }

    if (amount <= 0) {
      toast.error("Amount must be greater than zero");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      // Use provided transaction ref or auto-generate one
      const transactionRef = paymentForm.transactionRef.trim() || generateTransactionRef();

      // @ts-expect-error - agent_payments not in types yet
      const { error } = await supabase.from("agent_payments").insert({
        referrer_id: selectedAgent.id,
        amount: amount,
        payment_method: paymentForm.paymentMethod,
        transaction_ref: transactionRef,
        notes: paymentForm.notes,
        processed_by: user?.id,
      });

      if (error) throw error;

      toast.success(`✅ Payment recorded! Ref: ${transactionRef}`);
      setShowPaymentDialog(false);
      setPaymentForm({ amount: "", paymentMethod: "", transactionRef: "", notes: "" });
      fetchAgents();
      if (selectedAgent) {
        viewAgentDetails(selectedAgent);
      }
    } catch (error) {
      console.error("Error recording payment:", error);
      toast.error("Failed to record payment");
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: "✅ Active", className: "bg-green-100 text-green-800" },
      pending: { label: "🕓 Pending", className: "bg-yellow-100 text-yellow-800" },
      suspended: { label: "🚫 Suspended", className: "bg-red-100 text-red-800" },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getPaymentDetails = (agent: AgentWithStats) => {
    if (agent.payment_mode === "bank") {
      return (
        <div className="text-sm">
          <p><strong>Bank:</strong> {agent.bank_name}</p>
          <p><strong>Branch:</strong> {agent.bank_branch}</p>
          <p><strong>Account:</strong> {agent.account_number}</p>
          <p><strong>Name:</strong> {agent.account_name}</p>
        </div>
      );
    } else if (agent.payment_mode === "mpesa" || agent.payment_mode === "airtel") {
      return (
        <div className="text-sm">
          <p><strong>Provider:</strong> {agent.mobile_money_provider?.toUpperCase()}</p>
          <p><strong>Number:</strong> {agent.mobile_money_number}</p>
          <p><strong>Name:</strong> {agent.mobile_money_name}</p>
        </div>
      );
    } else {
      return <p className="text-sm text-muted-foreground">No payment details provided</p>;
    }
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-4 md:space-y-6 p-2 md:p-0">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Agent Payment Management</h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1 md:mt-2">
              Manage agent commissions and process payments
            </p>
          </div>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-4 md:pt-6 p-4 md:p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search agents by name, email, or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Stats Overview */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 p-4 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium">Total Agents</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <div className="text-xl md:text-2xl font-bold">{agents.length}</div>
              <p className="text-xs text-muted-foreground">Active referrers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 p-4 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium">Total Earned</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <div className="text-xl md:text-2xl font-bold text-green-600">
                KES {agents.reduce((sum, a) => sum + a.totalEarnings, 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">All-time commissions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 p-4 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium">Total Pending</CardTitle>
              <Clock className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <div className="text-xl md:text-2xl font-bold text-amber-600">
                KES {agents.reduce((sum, a) => sum + a.pendingPayment, 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Awaiting payment</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 p-4 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium">Total Paid</CardTitle>
              <CheckCircle className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <div className="text-xl md:text-2xl font-bold text-blue-600">
                KES {agents.reduce((sum, a) => sum + a.totalPaid, 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Successfully paid</p>
            </CardContent>
          </Card>
        </div>

        {/* Agents List */}
        <Card>
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-lg md:text-xl">Agents</CardTitle>
            <CardDescription className="text-sm">View and manage agent payments</CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading agents...</p>
              </div>
            ) : filteredAgents.length === 0 ? (
              <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No agents found</p>
              </div>
            ) : (
              <div className="space-y-3 md:space-y-4">
                {filteredAgents.map((agent) => (
                  <Card key={agent.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-3 md:p-4">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-2">
                            <h3 className="font-semibold text-base md:text-lg">{agent.profiles.full_name}</h3>
                            {getStatusBadge(agent.status)}
                          </div>
                          <p className="text-xs md:text-sm text-muted-foreground break-all">{agent.profiles.email}</p>
                          {agent.business_name && (
                            <p className="text-xs md:text-sm text-muted-foreground">{agent.business_name}</p>
                          )}
                          <div className="flex flex-wrap gap-3 md:gap-4 mt-2 text-xs md:text-sm">
                            <span><strong>{agent.referredPartnersCount}</strong> Partners</span>
                            <span><strong>{agent.totalBookings}</strong> Bookings</span>
                            <span className="text-green-600"><strong>KES {agent.totalEarnings.toLocaleString()}</strong> Earned</span>
                          </div>
                        </div>
                        <div className="text-left md:text-right space-y-2 md:space-y-3">
                          <div>
                            <p className="text-xs text-muted-foreground">Pending Payment</p>
                            <p className="text-xl md:text-2xl font-bold text-amber-600">
                              KES {agent.pendingPayment.toLocaleString()}
                            </p>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => viewAgentDetails(agent)}
                              className="w-full sm:w-auto"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View Details
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedAgent(agent);
                                setShowPaymentDialog(true);
                              }}
                              disabled={agent.pendingPayment === 0}
                              className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                            >
                              <Wallet className="h-4 w-4 mr-1" />
                              Record Payment
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Dialog */}
        <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
          <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Record Payment to {selectedAgent?.profiles.full_name}</DialogTitle>
              <DialogDescription>
                Pending balance: KES {selectedAgent?.pendingPayment.toLocaleString()}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Payment Method *</Label>
                <Input
                  id="paymentMethod"
                  placeholder="e.g. M-Pesa, Bank Transfer"
                  value={paymentForm.paymentMethod}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="transactionRef">Transaction Reference (Optional)</Label>
                <Input
                  id="transactionRef"
                  placeholder="e.g. MPESA123ABC (leave empty to auto-generate)"
                  value={paymentForm.transactionRef}
                  onChange={(e) => setPaymentForm({ ...paymentForm, transactionRef: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty to auto-generate, or enter M-Pesa/Bank reference
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any notes about this payment"
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleRecordPayment} className="bg-green-600 hover:bg-green-700">
                Record Payment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Agent Details Dialog */}
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedAgent?.profiles.full_name} - Agent Details</DialogTitle>
            </DialogHeader>
            
            {selectedAgent && (
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="commissions">Commissions</TabsTrigger>
                  <TabsTrigger value="payments">Payment History</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Personal Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p><strong>Name:</strong> {selectedAgent.profiles.full_name}</p>
                      <p><strong>Email:</strong> {selectedAgent.profiles.email}</p>
                      <p><strong>Referral Code:</strong> <code>{selectedAgent.referral_code}</code></p>
                      <p><strong>Commission Rate:</strong> {selectedAgent.commission_rate}%</p>
                      <p><strong>Status:</strong> {getStatusBadge(selectedAgent.status)}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Payment Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {getPaymentDetails(selectedAgent)}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Commission Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span>Total Earned:</span>
                        <span className="font-bold text-green-600">KES {selectedAgent.totalEarnings.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Already Paid:</span>
                        <span className="font-bold text-blue-600">KES {selectedAgent.totalPaid.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="font-bold">Pending Payment:</span>
                        <span className="font-bold text-amber-600">KES {selectedAgent.pendingPayment.toLocaleString()}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Performance</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span>Partners Referred:</span>
                        <span className="font-bold">{selectedAgent.referredPartnersCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Bookings:</span>
                        <span className="font-bold">{selectedAgent.totalBookings}</span>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="commissions" className="space-y-3">
                  {bookingCommissions.length === 0 ? (
                    <div className="text-center py-12">
                      <DollarSign className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">No commissions yet</p>
                    </div>
                  ) : (
                    bookingCommissions.map((commission) => (
                      <Card key={commission.id}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{commission.property_name}</p>
                              <p className="text-sm text-muted-foreground">Partner: {commission.partner_name}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(commission.booking_date).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">Booking: KES {commission.booking_amount.toLocaleString()}</p>
                              <p className="text-lg font-bold text-green-600">
                                +KES {commission.commission.toLocaleString(undefined, {maximumFractionDigits: 0})}
                              </p>
                              <Badge variant={commission.status === "confirmed" ? "default" : "secondary"}>
                                {commission.status}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="payments" className="space-y-3">
                  {paymentHistory.length === 0 ? (
                    <div className="text-center py-12">
                      <Wallet className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">No payments recorded yet</p>
                    </div>
                  ) : (
                    paymentHistory.map((payment: any) => (
                      <Card key={payment.id} className="bg-green-50/50 dark:bg-green-950/20">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-bold text-green-700 text-lg">+KES {Number(payment.amount).toLocaleString()}</p>
                              <p className="text-sm text-muted-foreground">{payment.payment_method}</p>
                              {payment.transaction_ref && (
                                <p className="text-xs font-mono text-muted-foreground mt-1">
                                  Ref: {payment.transaction_ref}
                                </p>
                              )}
                              {payment.notes && (
                                <p className="text-sm text-muted-foreground mt-1 italic">{payment.notes}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <Badge variant="default" className="bg-green-600">✅ Paid</Badge>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(payment.payment_date || payment.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </TabsContent>
              </Tabs>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </SuperAdminLayout>
  );
};

export default AdminAgentPayments;
