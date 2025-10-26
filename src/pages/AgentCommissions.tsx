import { useEffect, useState } from "react";
import { AgentLayout } from "@/components/AgentLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DollarSign, TrendingUp, Clock, CheckCircle, Wallet } from "lucide-react";

interface Commission {
  id: string;
  total_price: number;
  commission_amount: number;
  status: string;
  created_at: string;
  property_name: string;
}

interface PayoutRequest {
  id: string;
  amount: number;
  payment_method: string;
  status: string;
  created_at: string;
  processed_at: string | null;
}

const AgentCommissions = () => {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPayoutDialog, setShowPayoutDialog] = useState(false);
  const [referrerId, setReferrerId] = useState<string | null>(null);
  const [payoutForm, setPayoutForm] = useState({
    amount: "",
    paymentMethod: "",
    paymentDetails: "",
  });

  const [stats, setStats] = useState({
    totalEarnings: 0,
    pendingCommissions: 0,
    paidOut: 0,
  });

  useEffect(() => {
    fetchReferrerId();
  }, []);

  useEffect(() => {
    if (referrerId) {
      fetchData();
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

  const fetchData = async () => {
    if (!referrerId) return;
    
    setLoading(true);
    try {
      // Get referrals for this agent
      const { data: referralsData } = await supabase
        .from("referrals")
        .select("partner_id")
        .eq("referrer_id", referrerId);

      const partnerIds = referralsData?.map(r => r.partner_id) || [];

      let bookingsData: any[] = [];
      if (partnerIds.length > 0) {
        // Get properties for these partners
        const { data: properties } = await supabase
          .from("properties")
          .select("id, property_name, partner_id")
          .in("partner_id", partnerIds);

        if (properties && properties.length > 0) {
          const propertyIds = properties.map(p => p.id);
          
          // Get bookings for these properties
          const { data } = await supabase
            .from("bookings")
            .select("id, total_price, status, created_at, property_id")
            .in("property_id", propertyIds)
            .order("created_at", { ascending: false });

          // Map bookings with property names and calculate commission
          const AGENT_COMMISSION_RATE = 0.10;
          bookingsData = (data || []).map(booking => {
            const property = properties.find(p => p.id === booking.property_id);
            return {
              id: booking.id,
              total_price: booking.total_price,
              commission_amount: Number(booking.total_price) * AGENT_COMMISSION_RATE,
              status: booking.status,
              created_at: booking.created_at,
              property_name: property?.property_name || "Unknown Property",
            };
          });
        }
      }

      setCommissions(bookingsData);
      
      // Calculate stats
      const confirmedCommissions = bookingsData.filter(c => c.status === "confirmed");
      
      const totalEarnings = confirmedCommissions.reduce((sum, c) => sum + c.commission_amount, 0);

      // Get agent payment history (amounts paid by admin)
      // @ts-expect-error - agent_payments table not in generated types yet
      const { data: paymentsData } = await supabase
        .from("agent_payments")
        .select("*")
        .eq("referrer_id", referrerId)
        .order("created_at", { ascending: false });

      if (paymentsData) {
        setPayoutRequests(paymentsData);
      }

      // Calculate total paid out by admin
      const paidOut = paymentsData?.reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0;
      
      // Pending = Total Earnings - Already Paid
      const pendingCommissions = totalEarnings - paidOut;

      setStats({
        totalEarnings,
        pendingCommissions,
        paidOut,
      });
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load commission data");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPayout = async () => {
    if (!referrerId || !payoutForm.amount || !payoutForm.paymentMethod) {
      toast.error("Please fill in all required fields");
      return;
    }

    const amount = parseFloat(payoutForm.amount);
    if (amount > stats.pendingCommissions) {
      toast.error(`Maximum payout amount is KSh ${stats.pendingCommissions.toLocaleString()}`);
      return;
    }

    try {
      const { error } = await supabase.from("payout_requests").insert({
        referrer_id: referrerId,
        amount: amount,
        payment_method: payoutForm.paymentMethod,
        payment_details: JSON.parse(payoutForm.paymentDetails || "{}"),
        status: "pending",
      });

      if (error) throw error;

      toast.success("Payout request submitted successfully!");
      setShowPayoutDialog(false);
      setPayoutForm({ amount: "", paymentMethod: "", paymentDetails: "" });
      fetchData();
    } catch (error) {
      console.error("Error submitting payout request:", error);
      toast.error("Failed to submit payout request");
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "⏳ Pending", variant: "outline" as const, className: "border-yellow-300 text-yellow-700" },
      paid: { label: "✅ Paid", variant: "default" as const, className: "bg-green-600" },
      processing: { label: "🔄 Processing", variant: "secondary" as const, className: "" },
      rejected: { label: "❌ Rejected", variant: "destructive" as const, className: "" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant={config.variant} className={config.className}>{config.label}</Badge>;
  };

  return (
    <AgentLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Commissions & Payouts</h1>
          <p className="text-muted-foreground mt-2">
            Track your earnings and payments received
          </p>
        </div>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                <DollarSign className="h-5 w-5 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-700">KSh {stats.totalEarnings.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">All-time commissions</p>
              </CardContent>
            </Card>
            <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Pending Payment</CardTitle>
                <Clock className="h-5 w-5 text-amber-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-700">KSh {stats.pendingCommissions.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">Awaiting payment from admin</p>
              </CardContent>
            </Card>
            <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Already Paid</CardTitle>
                <CheckCircle className="h-5 w-5 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-700">KSh {stats.paidOut.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">Received from admin</p>
              </CardContent>
            </Card>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Commission History</CardTitle>
            <CardDescription>Your earnings from referred partner bookings</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
                ))}
              </div>
            ) : commissions.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-muted-foreground text-lg">No commissions yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Commissions appear when your referred partners get bookings
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {commissions.map((commission) => (
                  <div
                    key={commission.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{commission.property_name}</p>
                      <p className="text-sm text-muted-foreground">
                        Booking Amount: KSh {Number(commission.total_price).toLocaleString()} × 10% (Agent Rate)
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(commission.created_at).toLocaleDateString('en-US', { 
                          day: 'numeric', 
                          month: 'short', 
                          year: 'numeric' 
                        })}
                      </p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-2">
                      <p className="font-bold text-lg text-green-600">
                        +KSh {commission.commission_amount.toLocaleString(undefined, {maximumFractionDigits: 0})}
                      </p>
                      {getStatusBadge(commission.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
            <CardDescription>Payments received from admin</CardDescription>
          </CardHeader>
          <CardContent>
            {payoutRequests.length === 0 ? (
              <div className="text-center py-8">
                <Wallet className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No payments received yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Payments will appear here once admin processes them
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {payoutRequests.map((payment: any) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-4 border rounded-lg bg-green-50/50 dark:bg-green-950/20"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-lg text-green-700">+KSh {Number(payment.amount).toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground capitalize">{payment.payment_method || "Bank Transfer"}</p>
                      {payment.transaction_ref && (
                        <p className="text-xs font-mono text-muted-foreground mt-1">
                          Ref: {payment.transaction_ref}
                        </p>
                      )}
                      {payment.notes && (
                        <p className="text-xs text-muted-foreground mt-1 italic">{payment.notes}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <Badge variant="default" className="bg-green-600">
                        ✅ Paid
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(payment.payment_date || payment.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={showPayoutDialog} onOpenChange={setShowPayoutDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Request Payout</DialogTitle>
              <DialogDescription>
                Withdraw your pending commissions (KSh {stats.pendingCommissions.toLocaleString()})
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="amount">Amount (KSh) *</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount"
                  value={payoutForm.amount}
                  onChange={(e) => setPayoutForm({ ...payoutForm, amount: e.target.value })}
                  max={stats.pendingCommissions}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Maximum: KSh {stats.pendingCommissions.toLocaleString()}
                </p>
              </div>
              <div>
                <Label htmlFor="paymentMethod">Payment Method *</Label>
                <Select
                  value={payoutForm.paymentMethod}
                  onValueChange={(value) => setPayoutForm({ ...payoutForm, paymentMethod: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mpesa">M-Pesa</SelectItem>
                    <SelectItem value="bank">Bank Transfer</SelectItem>
                    <SelectItem value="cash">Cash Pickup</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="paymentDetails">Payment Details (JSON) *</Label>
                <Textarea
                  id="paymentDetails"
                  placeholder='{"phone": "0712345678"} or {"account": "1234567890", "bank": "Bank Name"}'
                  value={payoutForm.paymentDetails}
                  onChange={(e) => setPayoutForm({ ...payoutForm, paymentDetails: e.target.value })}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter your payment details in JSON format
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPayoutDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleRequestPayout} className="bg-amber-600 hover:bg-amber-700">
                Submit Request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AgentLayout>
  );
};

export default AgentCommissions;
