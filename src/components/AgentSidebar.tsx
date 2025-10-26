import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import {
  Home,
  User,
  DollarSign,
  LogOut,
  Users,
  Share2,
  Menu,
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

interface AgentSidebarProps {
  onClose?: () => void;
}

interface AgentInfo {
  fullName: string;
  businessName?: string;
  status: string;
  avatarUrl?: string;
  referralCode?: string;
}

export const AgentSidebar = ({ onClose }: AgentSidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [agentInfo, setAgentInfo] = useState<AgentInfo>({
    fullName: "",
    status: "pending",
  });

  useEffect(() => {
    fetchAgentInfo();
  }, []);

  const fetchAgentInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", user.id)
        .single();

      const { data: agentData } = await supabase
        .from("referrers")
        .select("business_name, status, referral_code")
        .eq("user_id", user.id)
        .single();

      if (profileData && agentData) {
        setAgentInfo({
          fullName: profileData.full_name || "Agent",
          businessName: agentData.business_name,
          status: agentData.status,
          avatarUrl: profileData.avatar_url,
          referralCode: agentData.referral_code,
        });
      }
    } catch (error) {
      console.error("Error fetching agent info:", error);
    }
  };

  const getCurrentDate = () => {
    const date = new Date();
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const navItems = [
    {
      icon: Home,
      label: "Dashboard",
      path: "/agent-dashboard",
      description: "Overview & stats",
    },
    {
      icon: Share2,
      label: "My Referral Link",
      path: "/agent-referral",
      description: "Share & earn commissions",
    },
    {
      icon: Users,
      label: "My Referrals",
      path: "/agent-referrals",
      description: "Referred partners",
    },
    {
      icon: DollarSign,
      label: "Commissions & Payouts",
      path: "/agent-commissions",
      description: "Earnings & withdrawals",
    },
    {
      icon: User,
      label: "Profile Settings",
      path: "/agent-profile",
      description: "Edit account info",
    },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <div className="h-full flex flex-col bg-card border-r">
        <div className="p-6 border-b bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/20 dark:to-amber-900/10">
          <div className="flex items-center gap-4 mb-4">
            {agentInfo.avatarUrl ? (
              <img
                src={agentInfo.avatarUrl}
                alt={agentInfo.fullName}
                className="w-16 h-16 rounded-full object-cover border-4 border-amber-300/50"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-amber-200/30 flex items-center justify-center border-4 border-amber-300/50">
                <User className="w-8 h-8 text-amber-700" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg truncate">{agentInfo.fullName}</h3>
              {agentInfo.businessName && (
                <p className="text-sm text-muted-foreground truncate">
                  {agentInfo.businessName}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">{getCurrentDate()}</p>
            <Badge
              variant={agentInfo.status === "active" ? "default" : "secondary"}
              className="text-xs bg-amber-600 hover:bg-amber-700"
            >
              {agentInfo.status === "active" ? "💼 Active Agent" : "🕓 Pending Approval"}
            </Badge>
            {agentInfo.referralCode && (
              <div className="bg-white dark:bg-gray-800 rounded p-2 border border-amber-200">
                <p className="text-xs text-muted-foreground mb-1">Referral Code</p>
                <code className="text-sm font-bold text-amber-700">{agentInfo.referralCode}</code>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <Button
                key={item.path}
                variant={active ? "default" : "ghost"}
                onClick={() => {
                  navigate(item.path);
                  onClose?.();
                }}
                className={`
                  w-full justify-start h-auto py-3 px-4
                  ${
                    active
                      ? "bg-amber-600 hover:bg-amber-700 text-white shadow-md"
                      : "hover:bg-muted"
                  }
                `}
              >
                <Icon className={`h-5 w-5 mr-3 flex-shrink-0 ${active ? "scale-110" : ""}`} />
                <div className="flex-1 min-w-0 text-left">
                  <p className={`text-sm font-medium ${active ? "font-bold" : ""}`}>
                    {item.label}
                  </p>
                  <p className={`text-xs ${active ? "opacity-90" : "text-muted-foreground"}`}>
                    {item.description}
                  </p>
                </div>
              </Button>
            );
          })}
        </nav>

        <Separator />

        <div className="p-4 space-y-2">
          <Button
            variant="destructive"
            className="w-full"
            onClick={() => setShowLogoutDialog(true)}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to logout? You'll need to sign in again to access your dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout}>Logout</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export const MobileAgentSidebar = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <>
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b p-4 flex items-center justify-between">
        <h1 className="font-heading font-bold text-xl">Agent Dashboard</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          <Menu className="h-6 w-6" />
        </Button>
      </div>

      <div className="lg:hidden h-16" />

      {isSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm">
          <div className="fixed inset-y-0 left-0 w-80 bg-card border-r shadow-lg animate-slide-in-left">
            <AgentSidebar onClose={() => setIsSidebarOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
};
