import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import {
  Home,
  User,
  Users,
  Building2,
  Calendar,
  DollarSign,
  Link,
  LogOut,
  Menu,
  X,
  Settings,
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
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface ReferrerSidebarProps {
  onClose?: () => void;
}

interface ReferrerInfo {
  fullName: string;
  businessName?: string;
  status: string;
  avatarUrl?: string;
  referralCode?: string;
}

export const ReferrerSidebar = ({ onClose }: ReferrerSidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [referrerInfo, setReferrerInfo] = useState<ReferrerInfo>({
    fullName: "",
    status: "pending",
  });

  useEffect(() => {
    fetchReferrerInfo();
  }, []);

  const fetchReferrerInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", user.id)
        .single();

      const { data: referrerData } = await supabase
        .from("referrers")
        .select("business_name, status, referral_code")
        .eq("user_id", user.id)
        .single();

      if (profileData && referrerData) {
        setReferrerInfo({
          fullName: profileData.full_name || "Referrer",
          businessName: referrerData.business_name,
          status: referrerData.status,
          avatarUrl: profileData.avatar_url,
          referralCode: referrerData.referral_code,
        });
      }
    } catch (error) {
      console.error("Error fetching referrer info:", error);
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
      label: "Dashboard Overview",
      path: "/referrer-dashboard",
      description: "Main summary & stats",
    },
    {
      icon: Link,
      label: "My Referral Link",
      path: "/referrer-link",
      description: "Share your link",
    },
    {
      icon: Users,
      label: "My Referrals",
      path: "/referrer-referrals",
      description: "Referred partners",
    },
    {
      icon: DollarSign,
      label: "Commissions & Payouts",
      path: "/referrer-commissions",
      description: "Earnings & payouts",
    },
  ];

  const getStatusBadge = () => {
    const statusConfig = {
      pending: { label: "Pending Approval", variant: "outline" as const, className: "bg-yellow-50 text-yellow-700 border-yellow-300" },
      active: { label: "Active", variant: "default" as const, className: "bg-green-50 text-green-700 border-green-300" },
      rejected: { label: "Rejected", variant: "destructive" as const, className: "" },
      suspended: { label: "Suspended", variant: "destructive" as const, className: "" },
    };

    const config = statusConfig[referrerInfo.status as keyof typeof statusConfig] || statusConfig.pending;
    
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-purple-50 to-white dark:from-purple-950 dark:to-background">
      {/* Header Section */}
      <div className="p-6 border-b bg-white/50 dark:bg-background/50 backdrop-blur">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
              {referrerInfo.fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-semibold text-sm">{referrerInfo.fullName}</h3>
              {referrerInfo.businessName && (
                <p className="text-xs text-muted-foreground">{referrerInfo.businessName}</p>
              )}
            </div>
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
        
        <div className="space-y-2">
          {getStatusBadge()}
          {referrerInfo.referralCode && (
            <div className="text-xs bg-purple-100 dark:bg-purple-900/20 p-2 rounded">
              <span className="text-muted-foreground">Code:</span>{" "}
              <span className="font-mono font-semibold">{referrerInfo.referralCode}</span>
            </div>
          )}
        </div>
        
        <p className="text-xs text-muted-foreground mt-3">{getCurrentDate()}</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <Button
                key={item.path}
                variant={active ? "secondary" : "ghost"}
                className={`w-full justify-start text-left h-auto py-3 px-4 ${
                  active ? "bg-purple-100 dark:bg-purple-900/30 text-purple-900 dark:text-purple-100" : ""
                }`}
                onClick={() => {
                  navigate(item.path);
                  onClose?.();
                }}
              >
                <div className="flex items-start gap-3 w-full">
                  <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${active ? "text-purple-600" : ""}`} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{item.label}</div>
                    <div className="text-xs text-muted-foreground">{item.description}</div>
                  </div>
                </div>
              </Button>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t bg-white/50 dark:bg-background/50">
        <Button
          variant="ghost"
          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => setShowLogoutDialog(true)}
        >
          <LogOut className="h-5 w-5 mr-3" />
          Logout
        </Button>
      </div>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to logout?</AlertDialogTitle>
            <AlertDialogDescription>
              You will be redirected to the homepage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout}>Logout</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export const MobileReferrerSidebar = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-background border-b px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
          <span className="font-semibold">Referrer Dashboard</span>
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-80">
            <ReferrerSidebar onClose={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
};
