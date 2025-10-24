import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SuperAdminLayout } from "@/components/SuperAdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Settings as SettingsIcon, Save, Mail, Phone, MessageCircle, MapPin, Building, Globe } from "lucide-react";
import { useGlobalSettings } from "@/hooks/useGlobalSettings";

const AdminSettings = () => {
  const navigate = useNavigate();
  const { settings, isLoading: settingsLoading, updateMultipleSettings } = useGlobalSettings();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    contact_email: "",
    contact_phone: "",
    whatsapp_number: "",
    business_address: "",
    support_email: "",
    privacy_email: "",
    company_name: "",
    website_url: "",
  });

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (settings) {
      setFormData({
        contact_email: settings.contact_email,
        contact_phone: settings.contact_phone,
        whatsapp_number: settings.whatsapp_number,
        business_address: settings.business_address,
        support_email: settings.support_email,
        privacy_email: settings.privacy_email,
        company_name: settings.company_name,
        website_url: settings.website_url,
      });
    }
  }, [settings]);

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

  const handleSaveContactInfo = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSaving(true);
      
      const contactUpdates = {
        contact_email: formData.contact_email,
        contact_phone: formData.contact_phone,
        whatsapp_number: formData.whatsapp_number,
        business_address: formData.business_address,
        support_email: formData.support_email,
        privacy_email: formData.privacy_email,
      };

      const success = await updateMultipleSettings(contactUpdates);
      
      if (success) {
        toast.success("Contact information saved successfully");
      } else {
        toast.error("Failed to save contact information");
      }
    } catch (error) {
      console.error("Error saving contact info:", error);
      toast.error("Failed to save contact information");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveCompanyInfo = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSaving(true);
      
      const companyUpdates = {
        company_name: formData.company_name,
        website_url: formData.website_url,
      };

      const success = await updateMultipleSettings(companyUpdates);
      
      if (success) {
        toast.success("Company information saved successfully");
      } else {
        toast.error("Failed to save company information");
      }
    } catch (error) {
      console.error("Error saving company info:", error);
      toast.error("Failed to save company information");
    } finally {
      setIsSaving(false);
    }
  };

  if (settingsLoading) {
    return (
      <SuperAdminLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout>
      <div className="mb-8">
        <h1 className="font-heading font-bold text-4xl mb-2">Global Settings</h1>
        <p className="text-muted-foreground">Manage platform-wide contact information and branding</p>
      </div>

      {/* Contact Information */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5" />
            Contact Information
          </CardTitle>
          <CardDescription>
            These contact details will appear throughout the platform - homepage, footer, privacy policy, terms, support pages, etc.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveContactInfo} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact_email">Primary Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="contact_email"
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    className="pl-10"
                    placeholder="contact@bomabnb.com"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_phone">Primary Phone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="contact_phone"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    className="pl-10"
                    placeholder="+254 700 000 000"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp_number">WhatsApp Number</Label>
                <div className="relative">
                  <MessageCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="whatsapp_number"
                    value={formData.whatsapp_number}
                    onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                    className="pl-10"
                    placeholder="+254 700 000 000"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="business_address">Business Address</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="business_address"
                    value={formData.business_address}
                    onChange={(e) => setFormData({ ...formData, business_address: e.target.value })}
                    className="pl-10"
                    placeholder="Nairobi, Kenya"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="support_email">Support Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="support_email"
                    type="email"
                    value={formData.support_email}
                    onChange={(e) => setFormData({ ...formData, support_email: e.target.value })}
                    className="pl-10"
                    placeholder="support@bomabnb.com"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="privacy_email">Privacy Contact Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="privacy_email"
                    type="email"
                    value={formData.privacy_email}
                    onChange={(e) => setFormData({ ...formData, privacy_email: e.target.value })}
                    className="pl-10"
                    placeholder="privacy@bomabnb.com"
                  />
                </div>
              </div>
            </div>
            <Button type="submit" disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Saving..." : "Save Contact Information"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Company Information */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Company Information
          </CardTitle>
          <CardDescription>Basic company details used across the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveCompanyInfo} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company_name">Company Name</Label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="company_name"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    className="pl-10"
                    placeholder="BomaBnB"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="website_url">Website URL</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="website_url"
                    value={formData.website_url}
                    onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                    className="pl-10"
                    placeholder="https://bomabnb.com"
                  />
                </div>
              </div>
            </div>
            <Button type="submit" disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Saving..." : "Save Company Information"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Usage Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5" />
            Where These Settings Appear
          </CardTitle>
          <CardDescription>These contact details will be used throughout the platform</CardDescription>
        </CardHeader>
        <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold mb-3">Public Pages</h3>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>• Homepage footer</li>
                        <li>• Privacy Policy page</li>
                        <li>• Terms & Conditions page</li>
                        <li>• Contact page</li>
                        <li>• About page</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-3">Partner Dashboard</h3>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>• Support page</li>
                        <li>• Help documentation</li>
                        <li>• Error messages</li>
                        <li>• Notification emails</li>
                        <li>• Account-related communications</li>
                      </ul>
                    </div>
                  </div>
                  
                  {/* Contact Preview */}
                  <div className="mt-6 p-4 bg-muted rounded-lg">
                    <h3 className="font-semibold mb-3">Contact Information Preview</h3>
                    <div className="space-y-2 text-sm">
                      <p>
                        <strong>Email:</strong>{" "}
                        {formData.contact_email ? (
                          <a 
                            href={`mailto:${formData.contact_email}`}
                            className="text-primary hover:underline transition-colors"
                          >
                            {formData.contact_email}
                          </a>
                        ) : (
                          "Not set"
                        )}
                      </p>
                      <p>
                        <strong>Phone:</strong>{" "}
                        {formData.contact_phone ? (
                          <a 
                            href={`tel:${formData.contact_phone}`}
                            className="text-primary hover:underline transition-colors"
                          >
                            {formData.contact_phone}
                          </a>
                        ) : (
                          "Not set"
                        )}
                      </p>
                      {formData.whatsapp_number && (
                        <p>
                          <strong>WhatsApp:</strong>{" "}
                          <a 
                            href={`https://wa.me/${formData.whatsapp_number.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline transition-colors"
                          >
                            {formData.whatsapp_number}
                          </a>
                        </p>
                      )}
                      <p>
                        <strong>Address:</strong> {formData.business_address || "Not set"}
                      </p>
                    </div>
                  </div>
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> Changes to these settings will be reflected across the entire platform immediately. 
              Make sure all contact information is accurate and up-to-date.
            </p>
          </div>
        </CardContent>
              </Card>
            </SuperAdminLayout>
          );
        };

        export default AdminSettings;

