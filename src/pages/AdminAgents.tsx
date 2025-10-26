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
  UserCog,
  CheckCircle,
  XCircle,
  Trash2,
  Eye,
  Mail,
  Search,
  AlertCircle,
  Ban,
  UserCheck,
  TrendingUp,
  Users,
  DollarSign,
  Clock,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Agent {
  id: string;
  user_id: string;
  referral_code: string;
  business_name?: string;
  contact_phone?: string;
  contact_email?: string;
  status: string;
  commission_rate: string;
  created_at: string;
  approved_at?: string;
  profiles: {
    full_name: string;
    email: string;
    phone_number?: string;
  };
  referred_partners_count?: number;
  total_commissions?: number;
}

const AdminAgents = () => {
  const navigate = useNavigate();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [filteredAgents, setFilteredAgents] = useState<Agent[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [showReactivateDialog, setShowReactivateDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    filterAgents();
  }, [searchQuery, agents, activeTab]);

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

      const { data: agentsData, error } = await supabase
        .from("referrers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const agentsWithDetails = await Promise.all(
        (agentsData || []).map(async (agent) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, email, phone_number")
            .eq("id", agent.user_id)
            .single();

          const { data: referralsData, count: referralsCount } = await supabase
            .from("referrals")
            .select("id", { count: "exact" })
            .eq("referrer_id", agent.id)
            .eq("status", "active");

          const { data: commissionsData } = await supabase
            .from("commissions")
            .select("commission_amount")
            .eq("referrer_id", agent.id);

          const totalCommissions = commissionsData?.reduce(
            (sum, comm) => sum + parseFloat(comm.commission_amount),
            0
          ) || 0;

          return {
            ...agent,
            profiles: profile || { full_name: "", email: "", phone_number: "" },
            referred_partners_count: referralsCount || 0,
            total_commissions: totalCommissions,
          };
        })
      );

      setAgents(agentsWithDetails);
    } catch (error: any) {
      console.error("Error fetching agents:", error);
      toast.error("Failed to load agents data");
    } finally {
      setIsLoading(false);
    }
  };

  const filterAgents = () => {
    let filtered = agents;

    if (activeTab !== "all") {
      filtered = filtered.filter((agent) => agent.status === activeTab);
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (agent) =>
          agent.profiles.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          agent.profiles.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          agent.referral_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (agent.business_name && agent.business_name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    setFilteredAgents(filtered);
  };

  const handleApprove = async (agent: Agent) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("referrers")
        .update({
          status: "active",
          approved_at: new Date().toISOString(),
          approved_by: user.id,
        })
        .eq("id", agent.id);

      if (error) throw error;

      await supabase.from("partner_notifications").insert({
        partner_id: agent.id,
        type: "approval",
        title: "🎉 Agent Account Approved!",
        message: `Congratulations! Your agent account has been approved. You can now start referring partners and earning commissions.`,
        status: "unread",
      });

      toast.success("✅ Agent approved successfully!");
      await fetchData();
      setShowApproveDialog(false);
    } catch (error: any) {
      console.error("Error approving agent:", error);
      toast.error("Failed to approve agent");
    }
  };

  const handleSuspend = async (agent: Agent) => {
    try {
      const { error } = await supabase
        .from("referrers")
        .update({ status: "suspended" })
        .eq("id", agent.id);

      if (error) throw error;

      await supabase.from("partner_notifications").insert({
        partner_id: agent.id,
        type: "warning",
        title: "⚠️ Account Suspended",
        message: "Your agent account has been suspended. Please contact support for more information.",
        status: "unread",
      });

      toast.success("Agent account suspended");
      await fetchData();
      setShowSuspendDialog(false);
    } catch (error: any) {
      console.error("Error suspending agent:", error);
      toast.error("Failed to suspend agent");
    }
  };

  const handleReactivate = async (agent: Agent) => {
    try {
      const { error } = await supabase
        .from("referrers")
        .update({ status: "active" })
        .eq("id", agent.id);

      if (error) throw error;

      await supabase.from("partner_notifications").insert({
        partner_id: agent.id,
        type: "info",
        title: "✅ Account Reactivated",
        message: "Your agent account has been reactivated. You can now access your dashboard.",
        status: "unread",
      });

      toast.success("Agent account reactivated");
      await fetchData();
      setShowReactivateDialog(false);
    } catch (error: any) {
      console.error("Error reactivating agent:", error);
      toast.error("Failed to reactivate agent");
    }
  };

  const handleDelete = async (agent: Agent) => {
    try {
      const { error: deleteRoleError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", agent.user_id)
        .eq("role", "referrer");

      if (deleteRoleError) throw deleteRoleError;

      const { error: deleteAgentError } = await supabase
        .from("referrers")
        .delete()
        .eq("id", agent.id);

      if (deleteAgentError) throw deleteAgentError;

      toast.success("Agent deleted successfully");
      await fetchData();
      setShowDeleteDialog(false);
    } catch (error: any) {
      console.error("Error deleting agent:", error);
      toast.error("Failed to delete agent");
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: any; icon: any; label: string }> = {
      pending: {
        variant: "secondary",
        icon: Clock,
        label: "⏳ Pending",
      },
      active: {
        variant: "default",
        icon: CheckCircle,
        label: "✅ Active",
      },
      suspended: {
        variant: "destructive",
        icon: Ban,
        label: "🚫 Suspended",
      },
      rejected: {
        variant: "destructive",
        icon: XCircle,
        label: "❌ Rejected",
      },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const pendingCount = agents.filter((a) => a.status === "pending").length;
  const activeCount = agents.filter((a) => a.status === "active").length;
  const suspendedCount = agents.filter((a) => a.status === "suspended").length;

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold flex items-center gap-2">
              <UserCog className="h-8 w-8 text-primary" />
              Agent Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage agent/referrer accounts and monitor referral performance
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Active Agents</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeCount}</div>
              <p className="text-xs text-muted-foreground">
                {pendingCount} pending approval
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Referred Partners</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {agents.reduce((sum, a) => sum + (a.referred_partners_count || 0), 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Across all agents
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Commission Payouts</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                KSh {agents.reduce((sum, a) => sum + (a.total_commissions || 0), 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Cumulative earnings
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex-1">
                <CardTitle>Registered Agents</CardTitle>
                <CardDescription>
                  View and manage all agent accounts
                </CardDescription>
              </div>
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search by name, email, or referral code..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">
                  All ({agents.length})
                </TabsTrigger>
                <TabsTrigger value="pending">
                  Pending ({pendingCount})
                  {pendingCount > 0 && (
                    <Badge variant="secondary" className="ml-2 h-5 px-1">
                      {pendingCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="active">
                  Active ({activeCount})
                </TabsTrigger>
                <TabsTrigger value="suspended">
                  Suspended ({suspendedCount})
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="space-y-4 mt-6">
                {isLoading ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Loading agents...</p>
                  </div>
                ) : filteredAgents.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">
                      {searchQuery ? "No agents found matching your search" : "No agents found"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredAgents.map((agent) => (
                      <Card key={agent.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                            <div className="md:col-span-5">
                              <div className="flex items-start gap-3">
                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                  <UserCog className="w-6 h-6 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold text-lg truncate">
                                    {agent.profiles.full_name}
                                  </h3>
                                  {agent.business_name && (
                                    <p className="text-sm text-muted-foreground truncate">
                                      {agent.business_name}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-2 mt-1">
                                    <Mail className="h-3 w-3 text-muted-foreground" />
                                    <p className="text-sm text-muted-foreground truncate">
                                      {agent.profiles.email}
                                    </p>
                                  </div>
                                  <p className="text-xs text-primary font-mono mt-1">
                                    Code: {agent.referral_code}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="md:col-span-3 space-y-1">
                              <div className="flex items-center gap-2 text-sm">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{agent.referred_partners_count || 0}</span>
                                <span className="text-muted-foreground">partners</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">KSh {(agent.total_commissions || 0).toLocaleString()}</span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {agent.status === "pending" 
                                  ? `Registered ${new Date(agent.created_at).toLocaleDateString()}`
                                  : agent.approved_at
                                  ? `Approved ${new Date(agent.approved_at).toLocaleDateString()}`
                                  : ""}
                              </div>
                            </div>

                            <div className="md:col-span-2">
                              {getStatusBadge(agent.status)}
                            </div>

                            <div className="md:col-span-2 flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedAgent(agent);
                                  setShowProfileDialog(true);
                                }}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>

                              {agent.status === "pending" && (
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => {
                                    setSelectedAgent(agent);
                                    setShowApproveDialog(true);
                                  }}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                              )}

                              {agent.status === "active" && (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => {
                                    setSelectedAgent(agent);
                                    setShowSuspendDialog(true);
                                  }}
                                >
                                  <Ban className="h-4 w-4 mr-1" />
                                  Suspend
                                </Button>
                              )}

                              {agent.status === "suspended" && (
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => {
                                    setSelectedAgent(agent);
                                    setShowReactivateDialog(true);
                                  }}
                                >
                                  <UserCheck className="h-4 w-4 mr-1" />
                                  Reactivate
                                </Button>
                              )}

                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => {
                                  setSelectedAgent(agent);
                                  setShowDeleteDialog(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Approve Dialog */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>✅ Approve Agent Account?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve{" "}
              <strong>{selectedAgent?.profiles.full_name}</strong>? They will be able to access
              their agent dashboard and start referring partners.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedAgent && handleApprove(selectedAgent)}
              className="bg-primary"
            >
              Yes, Approve
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Suspend Dialog */}
      <AlertDialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>🚫 Suspend Agent Account?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to suspend{" "}
              <strong>{selectedAgent?.profiles.full_name}</strong>? They will not be able to access
              their agent dashboard until reactivated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedAgent && handleSuspend(selectedAgent)}
              className="bg-destructive"
            >
              Yes, Suspend
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reactivate Dialog */}
      <AlertDialog open={showReactivateDialog} onOpenChange={setShowReactivateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>✅ Reactivate Agent Account?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reactivate{" "}
              <strong>{selectedAgent?.profiles.full_name}</strong>? They will regain access to
              their agent dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedAgent && handleReactivate(selectedAgent)}
              className="bg-primary"
            >
              Yes, Reactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>❌ Delete Agent Account?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete{" "}
              <strong>{selectedAgent?.profiles.full_name}</strong>? This action cannot be undone
              and will remove all related data including referrals and commissions history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedAgent && handleDelete(selectedAgent)}
              className="bg-destructive"
            >
              Yes, Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Profile Dialog */}
      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Agent Profile Details</DialogTitle>
            <DialogDescription>
              Complete information about {selectedAgent?.profiles.full_name}
            </DialogDescription>
          </DialogHeader>

          {selectedAgent && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                  <p className="font-semibold">{selectedAgent.profiles.full_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Business Name</p>
                  <p className="font-semibold">{selectedAgent.business_name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="font-semibold">{selectedAgent.profiles.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Phone Number</p>
                  <p className="font-semibold">
                    {selectedAgent.contact_phone || selectedAgent.profiles.phone_number || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Referral Code</p>
                  <p className="font-semibold font-mono text-primary">{selectedAgent.referral_code}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Commission Rate</p>
                  <p className="font-semibold">{selectedAgent.commission_rate}%</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <div className="mt-1">
                    {getStatusBadge(selectedAgent.status)}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Referred Partners</p>
                  <p className="font-semibold">{selectedAgent.referred_partners_count || 0}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Commissions</p>
                  <p className="font-semibold">KSh {(selectedAgent.total_commissions || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Registered</p>
                  <p className="font-semibold">
                    {new Date(selectedAgent.created_at).toLocaleDateString()}
                  </p>
                </div>
                {selectedAgent.approved_at && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Approved</p>
                    <p className="font-semibold">
                      {new Date(selectedAgent.approved_at).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </SuperAdminLayout>
  );
};

export default AdminAgents;
