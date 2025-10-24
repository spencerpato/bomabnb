import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PartnerLayout } from "@/components/PartnerLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Bell, CheckCheck, Trash2, Eye, Clock } from "lucide-react";

interface Notification {
  id: string;
  partner_id: string;
  type: string;
  title: string;
  message: string;
  action_url?: string;
  status: string;
  created_at: string;
  metadata?: any;
}

const PartnerNotifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [partnerId, setPartnerId] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Get partner ID
      const { data: partnerData } = await supabase
        .from("partners")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (partnerData) {
        setPartnerId(partnerData.id);
        await fetchNotifications(partnerData.id);
      }
    } catch (error) {
      console.error("Error checking auth:", error);
      toast.error("Failed to load notifications");
    }
  };

  const fetchNotifications = async (id: string) => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase
        .from("partner_notifications")
        .select("*")
        .eq("partner_id", id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast.error("Failed to load notifications");
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from("partner_notifications")
        .update({ status: "read" })
        .eq("id", id);

      if (error) throw error;

      setNotifications(notifications.map((n) => (n.id === id ? { ...n, status: "read" } : n)));
    toast.success("Marked as read");
    } catch (error) {
      console.error("Error marking as read:", error);
      toast.error("Failed to mark as read");
    }
  };

  const markAllAsRead = async () => {
    try {
      if (!partnerId) return;

      const { error } = await supabase
        .from("partner_notifications")
        .update({ status: "read" })
        .eq("partner_id", partnerId)
        .eq("status", "unread");

      if (error) throw error;

      setNotifications(notifications.map((n) => ({ ...n, status: "read" })));
    toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Error marking all as read:", error);
      toast.error("Failed to mark all as read");
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const { error } = await supabase.from("partner_notifications").delete().eq("id", id);

      if (error) throw error;

      setNotifications(notifications.filter((n) => n.id !== id));
    toast.success("Notification deleted");
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast.error("Failed to delete notification");
    }
  };

  const clearAll = async () => {
    try {
      if (!partnerId) return;

      const { error } = await supabase.from("partner_notifications").delete().eq("partner_id", partnerId);

      if (error) throw error;

    setNotifications([]);
    toast.success("All notifications cleared");
    } catch (error) {
      console.error("Error clearing all:", error);
      toast.error("Failed to clear all notifications");
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "property_approval":
        return "✅";
      case "property_rejection":
        return "❌";
      case "feature_approved":
        return "⭐";
      case "feature_rejected":
        return "⚠️";
      case "booking":
        return "📅";
      case "promotional":
        return "🎉";
      case "warning":
      case "maintenance":
        return "🔧";
      case "system":
        return "🔔";
      default:
        return "📢";
    }
  };

  const getTimeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    
    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    return new Date(date).toLocaleDateString();
  };

  const unreadCount = notifications.filter((n) => n.status === "unread").length;

  return (
    <PartnerLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-heading font-bold text-4xl mb-2 flex items-center gap-3">
              <Bell className="h-10 w-10 text-primary" />
              Notifications
            </h1>
            <p className="text-muted-foreground">
              Stay updated with your property approvals, bookings, and system announcements
            </p>
          </div>
          {unreadCount > 0 && (
            <Badge className="text-lg px-4 py-2">{unreadCount} unread</Badge>
          )}
        </div>

        {/* Action Buttons */}
        {notifications.length > 0 && (
          <div className="flex gap-3 mb-6">
            <Button 
              variant="outline" 
              size="sm"
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
            >
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark All as Read
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={clearAll}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}

        {/* Notifications List */}
        {!isLoading && (
        <div className="space-y-4">
          {notifications.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Bell className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">No notifications</h3>
                <p className="text-muted-foreground">
                  You're all caught up! We'll notify you about property updates, bookings, and system announcements.
                </p>
              </CardContent>
            </Card>
          ) : (
            notifications.map((notification) => (
              <Card 
                key={notification.id}
                  className={`transition-all ${
                    notification.status === "unread" ? "border-l-4 border-l-primary bg-primary/5" : ""
                  }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="text-4xl">{getNotificationIcon(notification.type)}</div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                          <h3
                            className={`font-semibold text-lg ${
                              notification.status === "unread" ? "font-bold" : ""
                            }`}
                          >
                          {notification.title}
                        </h3>
                          {notification.status === "unread" && (
                          <Badge variant="default" className="shrink-0">
                            New
                          </Badge>
                        )}
                      </div>
                      
                        <p className="text-muted-foreground mb-3">{notification.message}</p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {getTimeAgo(notification.created_at)}
                        </div>
                        
                        <div className="flex gap-2">
                            {notification.status === "unread" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Mark as Read
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteNotification(notification.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
        )}

        {/* Info Box */}
        <Card className="mt-8 bg-muted/50">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              About Notifications
            </h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Property approvals and rejections</li>
              <li>• Feature request responses</li>
              <li>• New booking requests</li>
              <li>• System maintenance announcements</li>
              <li>• Important updates from admin</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </PartnerLayout>
  );
};

export default PartnerNotifications;
