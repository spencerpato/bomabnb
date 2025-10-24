import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SuperAdminLayout } from "@/components/SuperAdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Users,
  CheckCircle,
  XCircle,
  Trash2,
  Eye,
  Mail,
  Search,
  AlertCircle,
  Ban,
  UserCheck,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Partner {
  id: string;
  user_id: string;
  business_name?: string;
  location: string;
  status: string;
  created_at: string;
  approved_at?: string;
  profiles: {
    full_name: string;
    email: string;
    phone_number?: string;
  };
  properties_count?: number;
}

const AdminPartners = () => {
  const navigate = useNavigate();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [filteredPartners, setFilteredPartners] = useState<Partner[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    filterPartners();
  }, [searchQuery, partners]);

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

      const { data: partnersData, error } = await supabase
        .from("partners")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const partnersWithProfiles = await Promise.all(
        (partnersData || []).map(async (partner) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, email, phone_number")
            .eq("id", partner.user_id)
            .single();

          const { data: propertiesData } = await supabase
            .from("properties")
            .select("id", { count: "exact" })
            .eq("partner_id", partner.id);

          return {
            ...partner,
            profiles: profile || { full_name: "", email: "", phone_number: "" },
            properties_count: propertiesData?.length || 0,
          };
        })
      );

      setPartners(partnersWithProfiles);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load partners");
    } finally {
      setIsLoading(false);
    }
  };

  const filterPartners = () => {
    if (!searchQuery.trim()) {
      setFilteredPartners(partners);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = partners.filter(
      (partner) =>
        partner.profiles.full_name.toLowerCase().includes(query) ||
        partner.profiles.email.toLowerCase().includes(query) ||
        partner.location.toLowerCase().includes(query) ||
        partner.business_name?.toLowerCase().includes(query)
    );
    setFilteredPartners(filtered);
  };

  const handleApprovePartner = async (partnerId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from("partners")
        .update({ status: "active", approved_at: new Date().toISOString() })
        .eq("id", partnerId);

      if (error) throw error;

      // Get partner profile for notification
      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", userId)
        .single();

      const partnerName = profileData?.full_name || "Partner";

      // Create notification for the partner
      await supabase
        .from("partner_notifications")
        .insert({
          partner_id: partnerId,
          type: "account_approved",
          title: "🎉 Account Approved!",
          message: `Congratulations ${partnerName}! Your BomaBnB partner account has been approved. You can now access your dashboard and start listing your properties. Welcome to the BomaBnB family!`,
          status: "unread"
        });

      toast.success("Partner approved successfully");
      fetchData();
    } catch (error) {
      console.error("Error approving partner:", error);
      toast.error("Failed to approve partner");
    }
  };

  const handleSuspendPartner = async (partnerId: string) => {
    try {
      const { error } = await supabase
        .from("partners")
        .update({ status: "suspended" })
        .eq("id", partnerId);

      if (error) throw error;

      // Get partner profile for notification
      const { data: partnerData } = await supabase
        .from("partners")
        .select("user_id")
        .eq("id", partnerId)
        .single();

      if (partnerData) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", partnerData.user_id)
          .single();

        const partnerName = profileData?.full_name || "Partner";

        // Create notification for the partner
        await supabase
          .from("partner_notifications")
          .insert({
            partner_id: partnerId,
            type: "account_suspended",
            title: "⚠️ Account Suspended",
            message: `Hello ${partnerName}, your BomaBnB partner account has been suspended. Please contact our support team for more information and assistance.`,
            status: "unread"
          });
      }

      toast.success("Partner suspended");
      fetchData();
    } catch (error) {
      console.error("Error suspending partner:", error);
      toast.error("Failed to suspend partner");
    }
  };

  const handleRejectPartner = async (partnerId: string) => {
    try {
      const { error } = await supabase
        .from("partners")
        .update({ status: "rejected" })
        .eq("id", partnerId);

      if (error) throw error;

      // Get partner profile for notification
      const { data: partnerData } = await supabase
        .from("partners")
        .select("user_id")
        .eq("id", partnerId)
        .single();

      if (partnerData) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", partnerData.user_id)
          .single();

        const partnerName = profileData?.full_name || "Partner";

        // Create notification for the partner
        await supabase
          .from("partner_notifications")
          .insert({
            partner_id: partnerId,
            type: "account_rejected",
            title: "❌ Account Application Rejected",
            message: `Hello ${partnerName}, unfortunately your BomaBnB partner account application has been rejected. Please contact our support team if you have any questions or would like to reapply.`,
            status: "unread"
          });
      }

      toast.success("Partner rejected");
      fetchData();
    } catch (error) {
      console.error("Error rejecting partner:", error);
      toast.error("Failed to reject partner");
    }
  };

  const handleDeletePartner = async () => {
    if (!selectedPartner) return;

    try {
      const { error } = await supabase.from("partners").delete().eq("id", selectedPartner.id);

      if (error) throw error;

      toast.success("Partner deleted");
      setShowDeleteDialog(false);
      setSelectedPartner(null);
      fetchData();
    } catch (error) {
      console.error("Error deleting partner:", error);
      toast.error("Failed to delete partner");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default">🟢 Active</Badge>;
      case "pending":
        return <Badge variant="secondary">⏳ Pending</Badge>;
      case "rejected":
        return <Badge variant="destructive">❌ Rejected</Badge>;
      case "suspended":
        return <Badge variant="destructive">🚫 Suspended</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <SuperAdminLayout>
      <div className="mb-8">
        <h1 className="font-heading font-bold text-4xl mb-2">Partners Management</h1>
        <p className="text-muted-foreground">View, approve, reject, or manage partner accounts</p>
      </div>

      {/* Search Bar */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search partners by name, email, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Partners Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            All Partners ({filteredPartners.length})
          </CardTitle>
          <CardDescription>Manage partner accounts and their status</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredPartners.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No partners found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-semibold">Partner Name</th>
                    <th className="text-left p-4 font-semibold">Email</th>
                    <th className="text-left p-4 font-semibold">Phone</th>
                    <th className="text-left p-4 font-semibold">Status</th>
                    <th className="text-left p-4 font-semibold">Properties</th>
                    <th className="text-left p-4 font-semibold">Registered On</th>
                    <th className="text-left p-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPartners.map((partner) => (
                    <tr key={partner.id} className="border-b hover:bg-muted/50">
                      <td className="p-4">
                        <div>
                          <p className="font-medium">{partner.profiles.full_name}</p>
                          {partner.business_name && (
                            <p className="text-sm text-muted-foreground">{partner.business_name}</p>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          {partner.profiles.email}
                        </div>
                      </td>
                      <td className="p-4">{partner.profiles.phone_number || "N/A"}</td>
                      <td className="p-4">{getStatusBadge(partner.status)}</td>
                      <td className="p-4">{partner.properties_count || 0}</td>
                      <td className="p-4 text-sm">
                        {new Date(partner.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedPartner(partner);
                              setShowProfileDialog(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {partner.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleApprovePartner(partner.id, partner.user_id)}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleRejectPartner(partner.id)}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                          {partner.status === "active" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSuspendPartner(partner.id)}
                            >
                              <Ban className="h-4 w-4 mr-1" />
                              Suspend
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedPartner(partner);
                              setShowDeleteDialog(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Profile Dialog */}
      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Partner Profile</DialogTitle>
            <DialogDescription>View detailed information about this partner</DialogDescription>
          </DialogHeader>
          {selectedPartner && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                <p className="text-lg font-semibold">{selectedPartner.profiles.full_name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p>{selectedPartner.profiles.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Phone</p>
                <p>{selectedPartner.profiles.phone_number || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Business Name</p>
                <p>{selectedPartner.business_name || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Location</p>
                <p>{selectedPartner.location}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                {getStatusBadge(selectedPartner.status)}
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Properties</p>
                <p>{selectedPartner.properties_count || 0}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Registered On</p>
                <p>{new Date(selectedPartner.created_at).toLocaleString()}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Partner?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the partner account and all associated data. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePartner} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SuperAdminLayout>
  );
};

export default AdminPartners;

