import { useEffect, useState } from "react";
import { ReferrerLayout } from "@/components/ReferrerLayout";
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
import { DollarSign, TrendingUp, Clock, CheckCircle } from "lucide-react";

interface Commission {
  id: string;
  booking_amount: number;
  commission_amount: number;
  commission_rate: number;
  status: string;
  created_at: string;
  properties: {
    property_name: string;
  };
}

interface PayoutRequest {
  id: string;
  amount: number;
  payment_method: string;
  status: string;
  created_at: string;
  processed_at: string | null;
}

const ReferrerCommissions = () => {
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
      const { data: commissionsData } = await supabase
        .from("commissions")
        .select(`
          id,
          booking_amount,
          commission_amount,
          commission_rate,
          status,
          created_at,
          properties (property_name)
        `)
        .eq("referrer_id", referrerId)
        .order("created_at", { ascending: false });

      const { data: payoutsData } = await supabase
        .from("payout_requests")
        .select("*")
        .eq("referrer_id", referrerId)
        .order("created_at", { ascending: false });

      if (commissionsData) {
        setCommissions(commissionsData as any);
        
        const totalEarnings = commissionsData.reduce((sum, c) => sum + Number(c.commission_amount), 0);
        const pendingCommissions = commissionsData
          .filter(c => c.status === "pending")
          .reduce((sum, c) => sum + Number(c.commission_amount), 0);
        const paidCommissions = commissionsData
          .filter(c => c.status === "paid")
          .reduce((sum, c) => sum + Number(c.commission_amount), 0);

        setStats({
          totalEarnings,
          pendingCommissions,
          paidOut: paidCommissions,
        });
      }

      if (payoutsData) {
        setPayoutRequests(payoutsData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPayout = async () => {
    if (!referrerId || !payoutForm.amount || !payoutForm.paymentMethod) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const { error } = await supabase.from("payout_requests").insert({
        referrer_id: referrerId,
        amount: parseFloat(payoutForm.amount),
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
      pending: { label: "Pending", variant: "outline" as const, color: "text-yellow-600" },
      paid: { label: "Paid", variant: "default" as const, color: "text-green-600" },
      processing: { label: "Processing", variant: "secondary" as const, color: "text-blue-600" },
      rejected: { label: "Rejected", variant: "destructive" as const, color: "text-red-600" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <ReferrerLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Commissions & Payouts</h1>
            <p className="text-muted-foreground mt-2">
              Track your earnings and request payouts
            </p>
          </div>
          <Button onClick={() => setShowPayoutDialog(true)} disabled={stats.pendingCommissions === 0}>
            <DollarSign className="h-4 w-4 mr-2" />
            Request Payout
          </Button>
        </div>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                <DollarSign className="h-5 w-5 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">KSh {stats.totalEarnings.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">All-time commissions</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <Clock className="h-5 w-5 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">KSh {stats.pendingCommissions.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">Awaiting payout</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Paid Out</CardTitle>
                <CheckCircle className="h-5 w-5 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">KSh {stats.paidOut.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">Successfully paid</p>
              </CardContent>
            </Card>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Commission History</CardTitle>
            <CardDescription>Your earnings from referred bookings</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
                ))}
              </div>
            ) : commissions.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                No commissions yet
              </p>
            ) : (
              <div className="space-y-3">
                {commissions.map((commission) => (
                  <div
                    key={commission.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div>
                      <p className="font-medium">{commission.properties.property_name}</p>
                      <p className="text-sm text-muted-foreground">
                        Booking: KSh {Number(commission.booking_amount).toLocaleString()} × {commission.commission_rate}%
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(commission.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-green-600">
                        +KSh {Number(commission.commission_amount).toLocaleString()}
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
            <CardTitle>Payout Requests</CardTitle>
            <CardDescription>Your payout request history</CardDescription>
          </CardHeader>
          <CardContent>
            {payoutRequests.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                No payout requests yet
              </p>
            ) : (
              <div className="space-y-3">
                {payoutRequests.map((payout) => (
                  <div
                    key={payout.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">KSh {Number(payout.amount).toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">{payout.payment_method}</p>
                      <p className="text-xs text-muted-foreground">
                        Requested: {new Date(payout.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(payout.status)}
                      {payout.processed_at && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Processed: {new Date(payout.processed_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={showPayoutDialog} onOpenChange={setShowPayoutDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request Payout</DialogTitle>
              <DialogDescription>
                Request a payout for your pending commissions (KSh {stats.pendingCommissions.toLocaleString()})
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="amount">Amount (KSh)</Label>
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
                <Label htmlFor="paymentMethod">Payment Method</Label>
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
                <Label htmlFor="paymentDetails">Payment Details (JSON)</Label>
                <Textarea
                  id="paymentDetails"
                  placeholder='{"phone": "0712345678"} or {"account": "1234567890", "bank": "Bank Name"}'
                  value={payoutForm.paymentDetails}
                  onChange={(e) => setPayoutForm({ ...payoutForm, paymentDetails: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPayoutDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleRequestPayout}>Submit Request</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ReferrerLayout>
  );
};

export default ReferrerCommissions;
