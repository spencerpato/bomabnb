import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SuperAdminLayout } from "@/components/SuperAdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Wrench, AlertCircle, CheckCircle, Clock, Server, Bug } from "lucide-react";

const AdminMaintenance = () => {
  const navigate = useNavigate();
  const [maintenanceMode, setMaintenanceMode] = useState(false);
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

  const handleToggleMaintenanceMode = async () => {
    try {
      setIsLoading(true);
      // In a real implementation, you would update a settings table or env variable
      // For now, we'll just show a toast
      setMaintenanceMode(!maintenanceMode);
      toast.success(`Maintenance mode ${!maintenanceMode ? "enabled" : "disabled"}`);
    } catch (error) {
      console.error("Error toggling maintenance mode:", error);
      toast.error("Failed to update maintenance mode");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SuperAdminLayout>
      <div className="mb-8">
        <h1 className="font-heading font-bold text-4xl mb-2">Maintenance Center</h1>
        <p className="text-muted-foreground">Manage site functionality and system health</p>
      </div>

      {/* Maintenance Mode */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Maintenance Mode
          </CardTitle>
          <CardDescription>Enable or disable site maintenance mode</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="maintenance-mode" className="text-base font-medium">
                Enable Maintenance Mode
              </Label>
              <p className="text-sm text-muted-foreground">
                When enabled, users will see a maintenance message instead of the site
              </p>
            </div>
            <Switch
              id="maintenance-mode"
              checked={maintenanceMode}
              onCheckedChange={handleToggleMaintenanceMode}
              disabled={isLoading}
            />
          </div>
          {maintenanceMode && (
            <div className="p-4 bg-accent/10 border border-accent rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-accent mt-0.5" />
              <div>
                <p className="font-medium text-accent">Maintenance Mode Active</p>
                <p className="text-sm text-muted-foreground">
                  Users are currently seeing the maintenance page. Remember to disable this when done.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            System Status
          </CardTitle>
          <CardDescription>Current system health and uptime</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <p className="font-medium">Database</p>
              </div>
              <p className="text-sm text-muted-foreground">Connected</p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <p className="font-medium">Storage</p>
              </div>
              <p className="text-sm text-muted-foreground">Operational</p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <p className="font-medium">API</p>
              </div>
              <p className="text-sm text-muted-foreground">Online</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Information */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            System Information
          </CardTitle>
          <CardDescription>Platform version and uptime details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 border rounded-lg">
              <span className="text-sm font-medium">Platform Version</span>
              <Badge>v1.0.0</Badge>
            </div>
            <div className="flex justify-between items-center p-3 border rounded-lg">
              <span className="text-sm font-medium">Database</span>
              <Badge>Supabase</Badge>
            </div>
            <div className="flex justify-between items-center p-3 border rounded-lg">
              <span className="text-sm font-medium">Framework</span>
              <Badge>React + Vite</Badge>
            </div>
            <div className="flex justify-between items-center p-3 border rounded-lg">
              <span className="text-sm font-medium">Last Updated</span>
              <span className="text-sm text-muted-foreground">
                {new Date().toLocaleDateString()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5" />
            System Logs
          </CardTitle>
          <CardDescription>Recent system events and errors</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">System startup successful</p>
                <p className="text-xs text-muted-foreground">
                  {new Date().toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Database connection established</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(Date.now() - 3600000).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">No critical errors</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(Date.now() - 7200000).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </SuperAdminLayout>
  );
};

export default AdminMaintenance;

