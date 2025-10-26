import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SuperAdminLayout } from "@/components/SuperAdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Bell, Send, Users, Mail, AlertCircle } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const AdminNotifications = () => {
  const navigate = useNavigate();
  const [messageType, setMessageType] = useState("general");
  const [recipientType, setRecipientType] = useState("all");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
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
    } catch (error) {
      console.error("Error checking auth:", error);
      navigate("/admin-login");
    }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !message) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      setIsLoading(true);

      // Get all partners
      const { data: partnersData, error: partnersError } = await supabase
        .from("partners")
        .select("id");

      if (partnersError) throw partnersError;

      const partners = partnersData || [];

      // Create notifications for selected partners
      let targetPartners = partners;
      if (recipientType === "active") {
        const { data: activePartners } = await supabase
          .from("partners")
          .select("id")
          .eq("status", "active");
        targetPartners = activePartners || [];
      } else if (recipientType === "pending") {
        const { data: pendingPartners } = await supabase
          .from("partners")
          .select("id")
          .eq("status", "pending");
        targetPartners = pendingPartners || [];
      }

      // Insert notifications for each partner
      const notifications = targetPartners.map((partner) => ({
        partner_id: partner.id,
        type: messageType,
        title,
        message,
        status: "unread",
      }));

      const { error: notificationError } = await supabase
        .from("partner_notifications")
        .insert(notifications);

      if (notificationError) throw notificationError;

      toast.success(`Notification sent to ${targetPartners.length} partner(s)`);
      setTitle("");
      setMessage("");
    } catch (error) {
      console.error("Error sending notification:", error);
      toast.error("Failed to send notification");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SuperAdminLayout>
      <div className="mb-8">
        <h1 className="font-heading font-bold text-4xl mb-2">Notifications Center</h1>
        <p className="text-muted-foreground">Send system or promotional messages to partners</p>
      </div>

      {/* Send Notification Form */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Send Notification
          </CardTitle>
          <CardDescription>Create and send messages to partners</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSendNotification} className="space-y-6">
            {/* Message Type */}
            <div className="space-y-3">
              <Label>Message Type</Label>
              <RadioGroup value={messageType} onValueChange={setMessageType}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="general" id="general" />
                  <Label htmlFor="general" className="cursor-pointer">
                    General Update
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="promotional" id="promotional" />
                  <Label htmlFor="promotional" className="cursor-pointer">
                    Promotional
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="warning" id="warning" />
                  <Label htmlFor="warning" className="cursor-pointer">
                    Warning / Maintenance Notice
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="system" id="system" />
                  <Label htmlFor="system" className="cursor-pointer">
                    System Message
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Recipient Type */}
            <div className="space-y-3">
              <Label>Recipients</Label>
              <Select value={recipientType} onValueChange={setRecipientType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Partners</SelectItem>
                  <SelectItem value="active">Active Partners Only</SelectItem>
                  <SelectItem value="pending">Pending Partners Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Textarea
                id="title"
                placeholder="Enter notification title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                rows={1}
              />
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Enter notification message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
              />
            </div>

            {/* Submit Button */}
            <Button type="submit" disabled={isLoading} className="w-full">
              <Send className="h-4 w-4 mr-2" />
              {isLoading ? "Sending..." : "Send Notification"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Information
          </CardTitle>
          <CardDescription>How notifications work</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
              <Mail className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Instant Delivery</p>
                <p className="text-sm text-muted-foreground">
                  Notifications appear immediately on partner dashboards
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
              <Users className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Targeted Messaging</p>
                <p className="text-sm text-muted-foreground">
                  Send to all partners or filter by status
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
              <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Read Status</p>
                <p className="text-sm text-muted-foreground">
                  Partners can mark notifications as read on their dashboard
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </SuperAdminLayout>
  );
};

export default AdminNotifications;

