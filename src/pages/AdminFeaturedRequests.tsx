import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SuperAdminLayout } from "@/components/SuperAdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Star, CheckCircle, XCircle, AlertCircle, Mail, Phone } from "lucide-react";

interface FeatureRequest {
  id: string;
  property_id: string;
  partner_id: string;
  duration_days: number;
  payment_method: string;
  additional_remarks?: string;
  status: string;
  created_at: string;
  properties: {
    property_name: string;
    partners: {
      profiles: {
        full_name: string;
        email: string;
      };
    };
  };
}

const AdminFeaturedRequests = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<FeatureRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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

      const { data, error } = await supabase
        .from("feature_requests")
        .select(`
          *,
          properties (
            property_name,
            partner_id
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch partner details separately for each request
      const requestsWithPartners = await Promise.all(
        (data || []).map(async (request) => {
          // First get the partner
          const { data: partnerData } = await supabase
            .from("partners")
            .select("user_id")
            .eq("id", request.partner_id)
            .single();

          // Then get the profile using user_id
          let profileData = null;
          if (partnerData?.user_id) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name, email")
              .eq("id", partnerData.user_id)
              .single();
            
            profileData = profile;
          }

          return {
            ...request,
            properties: {
              ...request.properties,
              partners: {
                profiles: profileData || null,
              },
            },
          };
        })
      );

      setRequests(requestsWithPartners);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load feature requests");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveRequest = async (requestId: string, propertyId: string, partnerId: string, durationDays: number) => {
    try {
      // Update feature request status
      const { error: requestError } = await supabase
        .from("feature_requests")
        .update({ status: "approved" })
        .eq("id", requestId);

      if (requestError) throw requestError;

      // Calculate feature dates
      const startDate = new Date().toISOString();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + durationDays);
      const endDateISO = endDate.toISOString();

      // Update property to be featured with dates
      const { error: propertyError } = await supabase
        .from("properties")
        .update({ 
          is_featured: true,
          feature_start_date: startDate,
          feature_end_date: endDateISO
        })
        .eq("id", propertyId);

      if (propertyError) throw propertyError;

      // Get property name for notification
      const { data: propertyData } = await supabase
        .from("properties")
        .select("property_name")
        .eq("id", propertyId)
        .single();

      const propertyName = propertyData?.property_name || "your property";

      // Create notification for the partner
      const { error: notificationError } = await supabase
        .from("partner_notifications")
        .insert({
          partner_id: partnerId,
          type: "feature_approved",
          title: "⭐ Feature Request Approved",
          message: `Your feature request for "${propertyName}" has been approved! Your property is now featured and will appear at the top of search results for ${durationDays} days.`,
          status: "unread",
        });

      if (notificationError) {
        console.error("Error creating notification:", notificationError);
        // Don't fail the whole operation if notification fails
      }

      toast.success("Feature request approved");
      fetchData();
    } catch (error) {
      console.error("Error approving request:", error);
      toast.error("Failed to approve request");
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from("feature_requests")
        .update({ status: "rejected" })
        .eq("id", requestId);

      if (error) throw error;

      toast.success("Feature request rejected");
      fetchData();
    } catch (error) {
      console.error("Error rejecting request:", error);
      toast.error("Failed to reject request");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge variant="default">✅ Approved</Badge>;
      case "pending":
        return <Badge variant="secondary">⏳ Pending</Badge>;
      case "rejected":
        return <Badge variant="destructive">❌ Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <SuperAdminLayout>
      <div className="mb-8">
        <h1 className="font-heading font-bold text-4xl mb-2">Featured Requests</h1>
        <p className="text-muted-foreground">Review and approve/decline 'Feature My Listing' submissions</p>
      </div>

      {/* Requests List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            All Feature Requests ({requests.length})
          </CardTitle>
          <CardDescription>Manage feature listing requests from partners</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No feature requests found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div key={request.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">
                        {request.properties?.property_name || "Unknown Property"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Requested by: {request.properties?.partners?.profiles?.full_name || "Unknown"}
                      </p>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(request.status)}
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(request.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Duration</p>
                      <p className="font-medium">{request.duration_days} days</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Payment Method</p>
                      <p className="font-medium">{request.payment_method.toUpperCase()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Contact</p>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <p className="font-medium">{request.properties?.partners?.profiles?.email}</p>
                      </div>
                    </div>
                  </div>

                  {request.additional_remarks && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Additional Remarks:</p>
                      <p className="text-sm">{request.additional_remarks}</p>
                    </div>
                  )}

                  {request.status === "pending" && (
                    <div className="flex items-center gap-2 pt-2">
                      <Button
                        size="sm"
                        onClick={() => handleApproveRequest(request.id, request.property_id, request.partner_id, request.duration_days)}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleRejectRequest(request.id)}>
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </SuperAdminLayout>
  );
};

export default AdminFeaturedRequests;

