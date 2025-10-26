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
  referrer_info?: {
    referrer_id: string;
    business_name: string | null;
    referral_code: string;
    profiles: {
      full_name: string;
    };
  } | null;
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
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [showReactivateDialog, setShowReactivateDialog] = useState(false);

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

          // @ts-expect-error - Supabase types need regeneration to include referrals table
          const { data: referralData } = await supabase
            .from("referrals")
            .select(`
              referrer_id,
              referrers (
                id,
                business_name,
                referral_code,
                user_id
              )
            `)
            .eq("partner_id", partner.id)
            .eq("status", "active")
            .single();

          let referrerInfo = null;
          if (referralData && referralData.referrers) {
            const { data: referrerProfile } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("id", referralData.referrers.user_id)
              .single();

            referrerInfo = {
              referrer_id: referralData.referrer_id,
              business_name: referralData.referrers.business_name,
              referral_code: referralData.referrers.referral_code,
              profiles: {
                full_name: referrerProfile?.full_name || "Unknown Agent",
              },
            };
          }

          return {
            ...partner,
            profiles: profile || { full_name: "", email: "", phone_number: "" },
            properties_count: propertiesData?.length || 0,
            referrer_info: referrerInfo,
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

  const handleReactivatePartner = async () => {
    if (!selectedPartner) return;

    try {
      const { error } = await supabase
        .from("partners")
        .update({ status: "active", approved_at: new Date().toISOString() })
        .eq("id", selectedPartner.id);

      if (error) throw error;

      // Get partner profile for notification
      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", selectedPartner.user_id)
        .single();

      const partnerName = profileData?.full_name || "Partner";

      // Create notification for the partner
      await supabase
        .from("partner_notifications")
        .insert({
          partner_id: selectedPartner.id,
          type: "account_reactivated",
          title: "✅ Account Reactivated!",
          message: `Great news ${partnerName}! Your BomaBnB partner account has been reactivated. You can now access your dashboard and manage your properties again. Welcome back!`,
          status: "unread"
        });

      toast.success("Partner reactivated successfully");
      setShowReactivateDialog(false);
      setSelectedPartner(null);
      fetchData();
    } catch (error) {
      console.error("Error reactivating partner:", error);
      toast.error("Failed to reactivate partner");
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
              <table className="w-full hidden md:table">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-semibold">Partner Name</th>
                    <th className="text-left p-4 font-semibold">Business Name</th>
                    <th className="text-left p-4 font-semibold">Email</th>
                    <th className="text-left p-4 font-semibold">Referred By</th>
                    <th className="text-left p-4 font-semibold">Status</th>
                    <th className="text-left p-4 font-semibold">Joined On</th>
                    <th className="text-left p-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPartners.map((partner) => (
                    <tr key={partner.id} className="border-b hover:bg-muted/50" data-testid={`row-partner-${partner.id}`}>
                      <td className="p-4">
                        <p className="font-medium" data-testid={`text-partnername-${partner.id}`}>{partner.profiles.full_name}</p>
                      </td>
                      <td className="p-4">
                        <p className="text-sm" data-testid={`text-businessname-${partner.id}`}>
                          {partner.business_name || "N/A"}
                        </p>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span data-testid={`text-email-${partner.id}`}>{partner.profiles.email}</span>
                        </div>
                      </td>
                      <td className="p-4" data-testid={`text-referrer-${partner.id}`}>
                        {partner.referrer_info ? (
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">{partner.referrer_info.profiles.full_name}</span>
                            <span className="text-xs text-muted-foreground">Code: {partner.referrer_info.referral_code}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">Direct</span>
                        )}
                      </td>
                      <td className="p-4">{getStatusBadge(partner.status)}</td>
                      <td className="p-4 text-sm" data-testid={`text-joined-${partner.id}`}>
                        {new Date(partner.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={() => {
                              setSelectedPartner(partner);
                              setShowProfileDialog(true);
                            }}
                            title="View Profile"
                            data-testid={`button-viewprofile-${partner.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {partner.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => {
                                  setSelectedPartner(partner);
                                  setShowApproveDialog(true);
                                }}
                                data-testid={`button-approve-${partner.id}`}
                              >
                                <UserCheck className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                className="bg-red-600 hover:bg-red-700 text-white"
                                onClick={() => handleRejectPartner(partner.id)}
                                data-testid={`button-reject-${partner.id}`}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                          {partner.status === "active" && (
                            <Button
                              size="sm"
                              className="bg-red-600 hover:bg-red-700 text-white"
                              onClick={() => {
                                setSelectedPartner(partner);
                                setShowSuspendDialog(true);
                              }}
                              data-testid={`button-suspend-${partner.id}`}
                            >
                              <Ban className="h-4 w-4 mr-1" />
                              Suspend
                            </Button>
                          )}
                          {(partner.status === "suspended" || partner.status === "rejected") && (
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => {
                                setSelectedPartner(partner);
                                setShowReactivateDialog(true);
                              }}
                              data-testid={`button-reactivate-${partner.id}`}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Reactivate
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => {
                              setSelectedPartner(partner);
                              setShowDeleteDialog(true);
                            }}
                            title="Delete Partner"
                            data-testid={`button-delete-${partner.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* Mobile Card View */}
              <div className="md:hidden space-y-4">
                {filteredPartners.map((partner) => (
                  <Card key={partner.id} data-testid={`card-partner-${partner.id}`}>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-semibold text-lg">{partner.profiles.full_name}</p>
                            <p className="text-sm text-muted-foreground">{partner.business_name || "No business name"}</p>
                          </div>
                          {getStatusBadge(partner.status)}
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span>{partner.profiles.email}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Phone: </span>
                            {partner.profiles.phone_number || "N/A"}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Joined: </span>
                            {new Date(partner.created_at).toLocaleDateString()}
                          </div>
                          {partner.referrer_info && (
                            <div>
                              <span className="text-muted-foreground">Referred By: </span>
                              <span className="font-medium">{partner.referrer_info.profiles.full_name}</span>
                              <span className="text-xs text-muted-foreground ml-1">({partner.referrer_info.referral_code})</span>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2 pt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-blue-600 border-blue-200 hover:bg-blue-50"
                            onClick={() => {
                              setSelectedPartner(partner);
                              setShowProfileDialog(true);
                            }}
                            data-testid={`button-mobile-viewprofile-${partner.id}`}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          {partner.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => {
                                  setSelectedPartner(partner);
                                  setShowApproveDialog(true);
                                }}
                                data-testid={`button-mobile-approve-${partner.id}`}
                              >
                                <UserCheck className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                className="bg-red-600 hover:bg-red-700 text-white"
                                onClick={() => handleRejectPartner(partner.id)}
                                data-testid={`button-mobile-reject-${partner.id}`}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                          {partner.status === "active" && (
                            <Button
                              size="sm"
                              className="bg-red-600 hover:bg-red-700 text-white"
                              onClick={() => {
                                setSelectedPartner(partner);
                                setShowSuspendDialog(true);
                              }}
                              data-testid={`button-mobile-suspend-${partner.id}`}
                            >
                              <Ban className="h-4 w-4 mr-1" />
                              Suspend
                            </Button>
                          )}
                          {(partner.status === "suspended" || partner.status === "rejected") && (
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => {
                                setSelectedPartner(partner);
                                setShowReactivateDialog(true);
                              }}
                              data-testid={`button-mobile-reactivate-${partner.id}`}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Reactivate
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => {
                              setSelectedPartner(partner);
                              setShowDeleteDialog(true);
                            }}
                            data-testid={`button-mobile-delete-${partner.id}`}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
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
              {selectedPartner.referrer_info && (
                <>
                  <div className="col-span-2 pt-4 border-t">
                    <p className="text-sm font-medium text-muted-foreground mb-2">🤝 Referral Information</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Referred By (Agent)</p>
                    <p className="font-semibold">{selectedPartner.referrer_info.profiles.full_name}</p>
                    {selectedPartner.referrer_info.business_name && (
                      <p className="text-sm text-muted-foreground">{selectedPartner.referrer_info.business_name}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Agent Referral Code</p>
                    <p className="font-mono text-primary font-semibold">{selectedPartner.referrer_info.referral_code}</p>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve Confirmation Dialog */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Partner?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve this partner? They will gain access to the partner dashboard and be able to list properties.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (selectedPartner) {
                  handleApprovePartner(selectedPartner.id, selectedPartner.user_id);
                  setShowApproveDialog(false);
                  setSelectedPartner(null);
                }
              }} 
              className="bg-green-600 hover:bg-green-700"
              data-testid="button-confirm-approve"
            >
              Approve Partner
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Suspend Confirmation Dialog */}
      <AlertDialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Suspend Partner?</AlertDialogTitle>
            <AlertDialogDescription>
              Suspend this partner temporarily? They will lose access to their dashboard but their data will remain intact. You can reactivate them later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (selectedPartner) {
                  handleSuspendPartner(selectedPartner.id);
                  setShowSuspendDialog(false);
                  setSelectedPartner(null);
                }
              }} 
              className="bg-red-600 hover:bg-red-700"
              data-testid="button-confirm-suspend"
            >
              Suspend Partner
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reactivate Confirmation Dialog */}
      <AlertDialog open={showReactivateDialog} onOpenChange={setShowReactivateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reactivate Partner?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reactivate this partner? They will regain full access to their dashboard and be able to manage their properties.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleReactivatePartner}
              className="bg-green-600 hover:bg-green-700"
              data-testid="button-confirm-reactivate"
            >
              Reactivate Partner
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Partner?</AlertDialogTitle>
            <AlertDialogDescription>
              Delete this partner and all their listings? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePartner} className="bg-destructive hover:bg-destructive/90" data-testid="button-confirm-delete">
              Delete Partner
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SuperAdminLayout>
  );
};

export default AdminPartners;

