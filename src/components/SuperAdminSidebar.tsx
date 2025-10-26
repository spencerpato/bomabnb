import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useGlobalSettings } from "@/hooks/useGlobalSettings";
import {
  BarChart3,
  Users,
  Home,
  Calendar,
  Star,
  Settings,
  Wrench,
  Bell,
  LogOut,
  Menu,
  X,
  Shield,
  MessageCircle,
  Phone,
  Mail,
  MessageSquare,
  UserCog,
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

interface SuperAdminSidebarProps {
  onClose?: () => void;
}

interface AdminInfo {
  fullName: string;
  email: string;
  avatarUrl?: string;
}

export const SuperAdminSidebar = ({ onClose }: SuperAdminSidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { settings } = useGlobalSettings();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [adminInfo, setAdminInfo] = useState<AdminInfo>({
    fullName: "Patrick",
    email: "patomaich611@gmail.com",
  });

  useEffect(() => {
    fetchAdminInfo();
  }, []);

  const fetchAdminInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name, email, avatar_url")
        .eq("id", user.id)
        .single();

      if (profileData) {
        setAdminInfo({
          fullName: profileData.full_name || "Patrick",
          email: profileData.email || "patomaich611@gmail.com",
          avatarUrl: profileData.avatar_url,
        });
      }
    } catch (error) {
      console.error("Error fetching admin info:", error);
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
      icon: BarChart3,
      label: "Dashboard Overview",
      path: "/admin",
      description: "Main analytics & stats",
    },
    {
      icon: Users,
      label: "Partners",
      path: "/admin/partners",
      description: "Manage partner accounts",
    },
    {
      icon: UserCog,
      label: "Agent Management",
      path: "/admin/agents",
      description: "Manage agent/referrer accounts",
    },
    {
      icon: Home,
      label: "Properties",
      path: "/admin/properties",
      description: "All partner listings",
    },
    {
      icon: Calendar,
      label: "Bookings",
      path: "/admin/bookings",
      description: "Sitewide bookings",
    },
    {
      icon: Star,
      label: "Featured Requests",
      path: "/admin/featured-requests",
      description: "Feature listing approvals",
    },
    {
      icon: MessageSquare,
      label: "Reviews",
      path: "/admin/reviews",
      description: "Manage ratings & reviews",
    },
    {
      icon: Wrench,
      label: "Maintenance",
      path: "/admin/maintenance",
      description: "System management",
    },
    {
      icon: Bell,
      label: "Notifications",
      path: "/admin/notifications",
      description: "Send messages",
    },
    {
      icon: Settings,
      label: "Settings",
      path: "/admin/settings",
      description: "Platform configuration",
    },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <div className="h-full flex flex-col bg-card border-r">
        {/* Sidebar Header - Admin Info */}
        <div className="p-6 border-b bg-gradient-to-br from-primary/5 to-secondary/5">
          <div className="flex items-center gap-4 mb-4">
            {adminInfo.avatarUrl ? (
              <img
                src={adminInfo.avatarUrl}
                alt={adminInfo.fullName}
                className="w-16 h-16 rounded-full object-cover border-4 border-primary/20"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center border-4 border-primary/20">
                <Shield className="w-8 h-8 text-primary" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg truncate">{adminInfo.fullName}</h3>
              <p className="text-sm text-muted-foreground truncate">Superadmin</p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">{getCurrentDate()}</p>
            <Badge variant="default" className="text-xs">
              🟢 Online
            </Badge>
          </div>

          {/* Contact Information */}
          <div className="mt-4 pt-4 border-t border-border/50">
            <h4 className="text-xs font-semibold text-muted-foreground mb-2">Quick Contact</h4>
            <div className="space-y-1">
              {settings?.contact_email && (
                <a 
                  href={`mailto:${settings.contact_email}`}
                  className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors"
                  title="Email Support"
                >
                  <Mail className="h-3 w-3" />
                  <span className="truncate">{settings.contact_email}</span>
                </a>
              )}
              {settings?.contact_phone && (
                <a 
                  href={`tel:${settings.contact_phone}`}
                  className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors"
                  title="Call Support"
                >
                  <Phone className="h-3 w-3" />
                  <span className="truncate">{settings.contact_phone}</span>
                </a>
              )}
              {settings?.whatsapp_number && (
                <a 
                  href={`https://wa.me/${settings.whatsapp_number.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors"
                  title="WhatsApp Support"
                >
                  <MessageCircle className="h-3 w-3" />
                  <span className="truncate">{settings.whatsapp_number}</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  onClose?.();
                }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all
                  ${
                    active
                      ? "bg-primary text-primary-foreground shadow-md border-l-4 border-primary"
                      : "hover:bg-muted text-foreground"
                  }
                `}
              >
                <Icon className={`h-5 w-5 ${active ? "scale-110" : ""}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${active ? "font-bold" : ""}`}>
                    {item.label}
                  </p>
                  <p className={`text-xs ${active ? "opacity-90" : "text-muted-foreground"}`}>
                    {item.description}
                  </p>
                </div>
              </button>
            );
          })}
        </nav>

        <Separator />

        {/* Logout Button */}
        <div className="p-4">
          <Button
            variant="ghost"
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => setShowLogoutDialog(true)}
          >
            <LogOut className="h-5 w-5 mr-3" />
            <span className="font-medium">Logout</span>
          </Button>
        </div>
      </div>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>🚪 Are you sure you want to log out?</AlertDialogTitle>
            <AlertDialogDescription>
              You will be returned to the homepage and will need to log in again to access the
              Superadmin Dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>❌ Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout} className="bg-destructive hover:bg-destructive/90">
              ✅ Yes, Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

// Mobile Sidebar Wrapper
export const MobileSuperAdminSidebar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="outline"
        size="icon"
        className="lg:hidden fixed top-4 left-4 z-50 shadow-lg"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="lg:hidden fixed left-0 top-0 h-full w-80 z-50 shadow-2xl">
            <SuperAdminSidebar onClose={() => setIsOpen(false)} />
          </div>
        </>
      )}
    </>
  );
};

