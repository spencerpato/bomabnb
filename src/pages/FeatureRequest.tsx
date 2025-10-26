import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PartnerLayout } from "@/components/PartnerLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Star, Clock, DollarSign, CheckCircle } from "lucide-react";

interface Property {
  id: string;
  property_name: string;
  location: string;
}

interface FeatureRequest {
  id: string;
  property_id: string;
  duration_days: number;
  payment_method: string;
  additional_remarks?: string;
  status: string;
  created_at: string;
  properties: {
    property_name: string;
  };
}

const FeatureRequest = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [properties, setProperties] = useState<Property[]>([]);
  const [requests, setRequests] = useState<FeatureRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    propertyId: "",
    duration: "7",
    paymentMethod: "mpesa",
    remarks: "",
  });

  useEffect(() => {
    checkAuth();
    fetchProperties();
    fetchRequests();
  }, []);

  useEffect(() => {
    // Check if property parameter is in URL
    const propertyParam = searchParams.get("property");
    if (propertyParam && properties.length > 0) {
      setFormData(prev => ({ ...prev, propertyId: propertyParam }));
    }
  }, [searchParams, properties]);

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

  const fetchProperties = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: partner } = await supabase
        .from("partners")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!partner) return;

      const { data } = await supabase
        .from("properties")
        .select("id, property_name, location")
        .eq("partner_id", partner.id)
        .eq("is_active", true);

      setProperties(data || []);
    } catch (error) {
      console.error("Error fetching properties:", error);
    }
  };

  const fetchRequests = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: partner } = await supabase
        .from("partners")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!partner) return;

      const { data } = await supabase
        .from("feature_requests")
        .select(`
          id,
          property_id,
          duration_days,
          payment_method,
          additional_remarks,
          status,
          created_at,
          properties (property_name)
        `)
        .eq("partner_id", partner.id)
        .order("created_at", { ascending: false });

      setRequests(data || []);
    } catch (error) {
      console.error("Error fetching requests:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.propertyId) {
      toast.error("Please select a property");
      return;
    }

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

      const { error } = await supabase.from("feature_requests").insert({
        partner_id: partner.id,
        property_id: formData.propertyId,
        duration_days: parseInt(formData.duration),
        payment_method: formData.paymentMethod,
        additional_remarks: formData.remarks || null,
        status: "pending",
      });

      if (error) throw error;

      toast.success("Feature request submitted successfully! We'll review it shortly.");
      setFormData({ propertyId: "", duration: "7", paymentMethod: "mpesa", remarks: "" });
      fetchRequests();
    } catch (error: any) {
      console.error("Error submitting request:", error);
      toast.error(error.message || "Failed to submit request");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PartnerLayout>
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Request Form */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Star className="h-6 w-6 text-primary" />
                <CardTitle className="text-2xl">Request Featured Listing</CardTitle>
              </div>
              <CardDescription>
                Featured listings appear at the top of search results and get more visibility
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="property">Select Property *</Label>
                  <Select value={formData.propertyId} onValueChange={(value) => setFormData({ ...formData, propertyId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a property" />
                    </SelectTrigger>
                    <SelectContent>
                      {properties.map((property) => (
                        <SelectItem key={property.id} value={property.id}>
                          {property.property_name} - {property.location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Feature Duration *</Label>
                    <Select value={formData.duration} onValueChange={(value) => setFormData({ ...formData, duration: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">7 Days</SelectItem>
                        <SelectItem value="14">14 Days</SelectItem>
                        <SelectItem value="30">30 Days</SelectItem>
                        <SelectItem value="90">90 Days (3 Months)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Pricing Display */}
                  <div className="p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 border-2 border-yellow-300 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-yellow-600" />
                        <span className="font-semibold text-yellow-900">Total Cost:</span>
                      </div>
                      <span className="text-2xl font-bold text-yellow-900">
                        KES {formData.duration === "7" ? "5,000" : formData.duration === "14" ? "9,000" : formData.duration === "30" ? "18,000" : "45,000"}
                      </span>
                    </div>
                    <p className="text-sm text-yellow-800 mt-2">
                      Price for {formData.duration} days of featured visibility
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="payment">Payment Method *</Label>
                    <Select value={formData.paymentMethod} onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mpesa">M-Pesa</SelectItem>
                        <SelectItem value="bank">Bank Transfer</SelectItem>
                        <SelectItem value="card">Credit/Debit Card</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="remarks">Additional Remarks (Optional)</Label>
                    <Textarea
                      id="remarks"
                      value={formData.remarks}
                      onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                      placeholder="Any special requests or information..."
                      rows={3}
                    />
                  </div>

                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading}>
                    {isLoading ? "Submitting..." : "Submit Request"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Request History */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-6 w-6 text-secondary" />
                  <CardTitle className="text-2xl">Request History</CardTitle>
                </div>
                <CardDescription>
                  Track the status of your feature requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                {requests.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No requests yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {requests.map((request) => (
                      <div key={request.id} className="p-4 border rounded-lg space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold">{request.properties.property_name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {request.duration_days} days - {request.payment_method.toUpperCase()}
                            </p>
                          </div>
                          <Badge
                            variant={
                              request.status === "approved"
                                ? "default"
                                : request.status === "pending"
                                ? "secondary"
                                : "destructive"
                            }
                          >
                            {request.status}
                          </Badge>
                        </div>
                        {request.additional_remarks && (
                          <p className="text-sm text-muted-foreground italic">
                            "{request.additional_remarks}"
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Requested: {new Date(request.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
      </div>
    </PartnerLayout>
  );
};

export default FeatureRequest;
