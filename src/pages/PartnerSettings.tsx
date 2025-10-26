import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PartnerLayout } from "@/components/PartnerLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Settings as SettingsIcon, Moon, Sun, Bell, Grid3x3, List, Mail, MessageCircle, Globe, RotateCcw } from "lucide-react";

interface SettingsState {
  theme: "light" | "dark" | "system";
  defaultView: "grid" | "list";
  emailNotifications: boolean;
  smsNotifications: boolean;
  bookingAlerts: boolean;
  propertyUpdates: boolean;
  featureUpdates: boolean;
  language: string;
}

const PartnerSettings = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState<SettingsState>({
    theme: "light",
    defaultView: "grid",
    emailNotifications: true,
    smsNotifications: false,
    bookingAlerts: true,
    propertyUpdates: true,
    featureUpdates: true,
    language: "en",
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    // Load from localStorage for demo purposes
    const savedSettings = localStorage.getItem("partner_settings");
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  };

  const handleSave = () => {
    setIsLoading(true);
    
    // Save to localStorage for demo purposes
    // In production, this would save to database
    localStorage.setItem("partner_settings", JSON.stringify(settings));
    
    // Apply theme if needed
    if (settings.theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    
    setTimeout(() => {
      setIsLoading(false);
      toast.success("✅ Settings saved successfully!");
    }, 500);
  };

  const handleReset = () => {
    const defaultSettings: SettingsState = {
      theme: "light",
      defaultView: "grid",
      emailNotifications: true,
      smsNotifications: false,
      bookingAlerts: true,
      propertyUpdates: true,
      featureUpdates: true,
      language: "en",
    };
    setSettings(defaultSettings);
    toast.success("Settings reset to defaults");
  };

  return (
    <PartnerLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="font-heading font-bold text-4xl mb-2 flex items-center gap-3">
            <SettingsIcon className="h-10 w-10 text-primary" />
            Settings & Preferences
          </h1>
          <p className="text-muted-foreground">
            Customize your dashboard experience and notification preferences
          </p>
        </div>

        <div className="space-y-6">
          {/* Appearance Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sun className="h-5 w-5 text-primary" />
                <CardTitle>Appearance</CardTitle>
              </div>
              <CardDescription>
                Customize how your dashboard looks and feels
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="theme" className="text-base">Theme Mode</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Choose your preferred color scheme
                  </p>
                  <Select value={settings.theme} onValueChange={(value: any) => setSettings({ ...settings, theme: value })}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">
                        <div className="flex items-center gap-2">
                          <Sun className="h-4 w-4" />
                          Light Mode
                        </div>
                      </SelectItem>
                      <SelectItem value="dark">
                        <div className="flex items-center gap-2">
                          <Moon className="h-4 w-4" />
                          Dark Mode
                        </div>
                      </SelectItem>
                      <SelectItem value="system">
                        <div className="flex items-center gap-2">
                          <SettingsIcon className="h-4 w-4" />
                          System Default
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div>
                  <Label htmlFor="defaultView" className="text-base">Default Listings View</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    How properties are displayed in "My Properties"
                  </p>
                  <Select value={settings.defaultView} onValueChange={(value: any) => setSettings({ ...settings, defaultView: value })}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="grid">
                        <div className="flex items-center gap-2">
                          <Grid3x3 className="h-4 w-4" />
                          Grid View
                        </div>
                      </SelectItem>
                      <SelectItem value="list">
                        <div className="flex items-center gap-2">
                          <List className="h-4 w-4" />
                          List View
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notification Preferences */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                <CardTitle>Notification Preferences</CardTitle>
              </div>
              <CardDescription>
                Choose how and when you want to be notified
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <Label htmlFor="emailNotifications" className="text-base">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive updates via email
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="emailNotifications"
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <MessageCircle className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <Label htmlFor="smsNotifications" className="text-base">SMS Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Get text messages for important updates
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="smsNotifications"
                    checked={settings.smsNotifications}
                    onCheckedChange={(checked) => setSettings({ ...settings, smsNotifications: checked })}
                  />
                </div>

                <Separator />

                <p className="text-sm font-medium">Notify me about:</p>

                <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                  <div>
                    <Label htmlFor="bookingAlerts" className="text-base">New Booking Requests</Label>
                    <p className="text-sm text-muted-foreground">
                      Instant alerts for new bookings
                    </p>
                  </div>
                  <Switch
                    id="bookingAlerts"
                    checked={settings.bookingAlerts}
                    onCheckedChange={(checked) => setSettings({ ...settings, bookingAlerts: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                  <div>
                    <Label htmlFor="propertyUpdates" className="text-base">Property Approvals</Label>
                    <p className="text-sm text-muted-foreground">
                      When your listings are approved/rejected
                    </p>
                  </div>
                  <Switch
                    id="propertyUpdates"
                    checked={settings.propertyUpdates}
                    onCheckedChange={(checked) => setSettings({ ...settings, propertyUpdates: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                  <div>
                    <Label htmlFor="featureUpdates" className="text-base">Feature Request Responses</Label>
                    <p className="text-sm text-muted-foreground">
                      Updates on your feature requests
                    </p>
                  </div>
                  <Switch
                    id="featureUpdates"
                    checked={settings.featureUpdates}
                    onCheckedChange={(checked) => setSettings({ ...settings, featureUpdates: checked })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Language Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                <CardTitle>Language & Region</CardTitle>
              </div>
              <CardDescription>
                Set your preferred language (Coming soon)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Label htmlFor="language">Preferred Language</Label>
                <Select value={settings.language} onValueChange={(value) => setSettings({ ...settings, language: value })}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="sw">Swahili (Coming Soon)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button 
              onClick={handleSave} 
              className="flex-1 bg-primary hover:bg-primary/90"
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : "💾 Save Changes"}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleReset}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset to Default
            </Button>
          </div>

          {/* Info Box */}
          <Card className="bg-muted/50">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <SettingsIcon className="h-5 w-5 text-primary" />
                About Settings
              </h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Changes are saved immediately</li>
                <li>• Theme changes apply instantly</li>
                <li>• Notification preferences can be updated anytime</li>
                <li>• Some features are still in development</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </PartnerLayout>
  );
};

export default PartnerSettings;
