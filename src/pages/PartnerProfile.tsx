import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PartnerLayout } from "@/components/PartnerLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User, Building2, MapPin, Phone, Mail, MessageCircle, Lock, Camera, Eye } from "lucide-react";

interface PartnerProfile {
  business_name?: string;
  location: string;
  about?: string;
  show_contacts_publicly?: boolean;
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
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });
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
        setPhotoPreview(profileData.avatar_url || "");
        // Load WhatsApp number from database (separate from phone)
        setWhatsappNumber((profileData as any).whatsapp_number || profileData.phone_number || "");
      }

      const { data: partnerData } = await supabase
        .from("partners")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (partnerData) {
        setPartnerProfile(partnerData);
        setShowContacts((partnerData as any).show_contacts_publicly ?? true);
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

      let avatarUrl = userProfile.avatar_url || "";

      // Upload profile photo if changed
      if (profilePhoto) {
        const fileExt = profilePhoto.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `partner-photos/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, profilePhoto, { upsert: true });

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);
          avatarUrl = publicUrl;
        }
      }

      // Update profiles (including separate WhatsApp number)
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: userProfile.full_name,
          phone_number: userProfile.phone_number,
          whatsapp_number: whatsappNumber || null,
          avatar_url: avatarUrl,
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
          show_contacts_publicly: showContacts,
        })
        .eq("user_id", user.id);

      if (partnerError) throw partnerError;

      toast.success("✅ Profile updated successfully! Your contacts will automatically appear under all your properties.");
      fetchProfiles(); // Refresh data
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
        return;
      }
      setProfilePhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePasswordChange = async () => {
    if (!passwords.new || !passwords.confirm) {
      toast.error("Please fill in all password fields");
      return;
    }

    if (passwords.new !== passwords.confirm) {
      toast.error("New passwords do not match");
      return;
    }

    if (passwords.new.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwords.new,
      });

      if (error) throw error;

      toast.success("Password updated successfully!");
      setPasswords({ current: "", new: "", confirm: "" });
    } catch (error: any) {
      console.error("Error updating password:", error);
      toast.error(error.message || "Failed to update password");
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
    <PartnerLayout>
      <div className="max-w-4xl mx-auto">

          <Card>
            <CardHeader>
              <CardTitle className="text-3xl font-heading font-bold flex items-center gap-2">
                <User className="h-8 w-8" />
                My Profile & Contacts
              </CardTitle>
              <CardDescription>
                Update your information. Your contacts will automatically appear under all your properties.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-8">
                {/* Profile Photo Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Camera className="h-5 w-5 text-primary" />
                    <h3 className="text-xl font-semibold">Profile Photo / Business Logo</h3>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      {photoPreview ? (
                        <img 
                          src={photoPreview} 
                          alt="Profile" 
                          className="w-24 h-24 rounded-full object-cover border-4 border-primary/20"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center border-4 border-primary/20">
                          <User className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <Input
                        id="profilePhoto"
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="cursor-pointer"
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        Max size: 5MB. Recommended: Square image (500x500px)
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Personal Information */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    <h3 className="text-xl font-semibold">Personal Information</h3>
                  </div>
                  
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
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          value={userProfile.email}
                          disabled
                          className="bg-muted flex-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Contact Details */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Phone className="h-5 w-5 text-primary" />
                    <h3 className="text-xl font-semibold">Contact Details</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    These contacts will appear under your property listings
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
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

                    <div className="space-y-2">
                      <Label htmlFor="whatsapp">WhatsApp Number</Label>
                      <div className="flex items-center gap-2">
                        <MessageCircle className="h-4 w-4 text-green-600" />
                        <Input
                          id="whatsapp"
                          type="tel"
                          placeholder="+254 700 000 000"
                          value={whatsappNumber}
                          onChange={(e) => setWhatsappNumber(formatPhoneNumber(e.target.value))}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Business Information */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    <h3 className="text-xl font-semibold">Business Information</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="businessName">Business Name (Optional)</Label>
                      <Input
                        id="businessName"
                        placeholder="e.g. Sunset Homes, Mombasa Villas"
                        value={partnerProfile.business_name}
                        onChange={(e) => setPartnerProfile({ ...partnerProfile, business_name: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location">Base Location / County *</Label>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <Input
                          id="location"
                          placeholder="e.g. Nairobi, Mombasa"
                          value={partnerProfile.location}
                          onChange={(e) => setPartnerProfile({ ...partnerProfile, location: e.target.value })}
                          required
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="about">Short Bio / Description</Label>
                    <Textarea
                      id="about"
                      rows={4}
                      placeholder="Tell travelers about your hosting experience, e.g. 'I've hosted over 200 guests in Naivasha and love offering local travel tips.'"
                      value={partnerProfile.about}
                      onChange={(e) => setPartnerProfile({ ...partnerProfile, about: e.target.value })}
                    />
                  </div>
                </div>

                <Separator />

                {/* Contact Visibility & Preview */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Eye className="h-5 w-5 text-primary" />
                    <h3 className="text-xl font-semibold">Contact Visibility</h3>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label htmlFor="showContacts" className="text-base">Show my contacts publicly</Label>
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

                  {showContacts && (userProfile.phone_number || whatsappNumber) && (
                    <div className="bg-muted/50 p-4 rounded-lg border">
                      <p className="text-sm font-medium mb-3">Preview: How contacts appear on your properties</p>
                      <div className="flex flex-wrap gap-2">
                        {whatsappNumber && (
                          <Button
                            type="button"
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => window.open(`https://wa.me/${whatsappNumber.replace(/\D/g, '')}`, '_blank')}
                          >
                            <MessageCircle className="h-4 w-4 mr-2" />
                            WhatsApp
                          </Button>
                        )}
                        {userProfile.phone_number && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(`tel:${userProfile.phone_number}`, '_blank')}
                          >
                            <Phone className="h-4 w-4 mr-2" />
                            Call
                          </Button>
                        )}
                        {userProfile.email && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(`mailto:${userProfile.email}`, '_blank')}
                          >
                            <Mail className="h-4 w-4 mr-2" />
                            Email
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading}>
                  {isLoading ? "Saving Changes..." : "💾 Save Changes"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Password Change Card */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-2xl font-heading font-bold flex items-center gap-2">
                <Lock className="h-6 w-6" />
                Change Password
              </CardTitle>
              <CardDescription>
                Update your account password for security
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password *</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Enter new password (min 6 characters)"
                  value={passwords.new}
                  onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  value={passwords.confirm}
                  onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                />
              </div>

              <Button 
                type="button"
                onClick={handlePasswordChange}
                className="w-full"
                variant="outline"
              >
                🔒 Update Password
              </Button>
            </CardContent>
          </Card>
      </div>
    </PartnerLayout>
  );
};

export default PartnerProfile;
