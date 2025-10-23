import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PartnerProfile {
  business_name?: string;
  location: string;
  about?: string;
}

interface UserProfile {
  full_name: string;
  email: string;
  phone_number?: string;
  avatar_url?: string;
}

const PartnerProfile = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showContacts, setShowContacts] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    full_name: "",
    email: "",
    phone_number: "",
  });
  const [partnerProfile, setPartnerProfile] = useState<PartnerProfile>({
    business_name: "",
    location: "",
    about: "",
  });

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileData) {
        setUserProfile(profileData);
      }

      const { data: partnerData } = await supabase
        .from("partners")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (partnerData) {
        setPartnerProfile(partnerData);
      }
    } catch (error) {
      console.error("Error fetching profiles:", error);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Update profiles
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: userProfile.full_name,
          phone_number: userProfile.phone_number,
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      // Update partner
      const { error: partnerError } = await supabase
        .from("partners")
        .update({
          business_name: partnerProfile.business_name,
          location: partnerProfile.location,
          about: partnerProfile.about,
        })
        .eq("user_id", user.id);

      if (partnerError) throw partnerError;

      toast.success("Profile updated successfully!");
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (!cleaned.startsWith("254") && cleaned.length > 0) {
      return `+254${cleaned}`;
    }
    return cleaned.startsWith("254") ? `+${cleaned}` : value;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />

      <div className="flex-1 px-4 py-12">
        <div className="container mx-auto max-w-4xl">
          <Button variant="ghost" onClick={() => navigate("/partner-dashboard")} className="mb-6">
            ← Back to Dashboard
          </Button>

          <Card>
            <CardHeader>
              <CardTitle className="text-3xl font-heading font-bold">My Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Personal Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input
                        id="fullName"
                        value={userProfile.full_name}
                        onChange={(e) => setUserProfile({ ...userProfile, full_name: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={userProfile.email}
                        disabled
                        className="bg-muted"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number (WhatsApp)</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+254 700 000 000"
                        value={userProfile.phone_number}
                        onChange={(e) => setUserProfile({ 
                          ...userProfile, 
                          phone_number: formatPhoneNumber(e.target.value)
                        })}
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6 space-y-4">
                  <h3 className="text-xl font-semibold">Business Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="businessName">Business Name</Label>
                      <Input
                        id="businessName"
                        value={partnerProfile.business_name}
                        onChange={(e) => setPartnerProfile({ ...partnerProfile, business_name: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location">Base Location *</Label>
                      <Input
                        id="location"
                        value={partnerProfile.location}
                        onChange={(e) => setPartnerProfile({ ...partnerProfile, location: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="about">About / Bio</Label>
                    <Textarea
                      id="about"
                      rows={4}
                      placeholder="Tell guests about yourself and your hosting experience..."
                      value={partnerProfile.about}
                      onChange={(e) => setPartnerProfile({ ...partnerProfile, about: e.target.value })}
                    />
                  </div>
                </div>

                <div className="border-t pt-6 space-y-4">
                  <h3 className="text-xl font-semibold">Contact Visibility</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="showContacts">Show contact information on listings</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Allow guests to see your phone and email on property pages
                      </p>
                    </div>
                    <Switch
                      id="showContacts"
                      checked={showContacts}
                      onCheckedChange={setShowContacts}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading}>
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default PartnerProfile;
