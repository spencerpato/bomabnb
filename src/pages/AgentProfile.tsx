import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AgentLayout } from "@/components/AgentLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User, Building2, Phone, Mail, Lock, Camera, Code, DollarSign } from "lucide-react";

interface AgentProfile {
  business_name?: string;
  referral_code: string;
  contact_phone?: string;
  contact_email?: string;
  status: string;
  commission_rate: string;
  payment_mode?: string;
  bank_name?: string;
  bank_branch?: string;
  account_number?: string;
  account_name?: string;
  mobile_money_number?: string;
  mobile_money_name?: string;
  mobile_money_provider?: string;
}

interface UserProfile {
  full_name: string;
  email: string;
  phone_number?: string;
  avatar_url?: string;
}

const AgentProfile = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [passwords, setPasswords] = useState({
    new: "",
    confirm: "",
  });
  const [userProfile, setUserProfile] = useState<UserProfile>({
    full_name: "",
    email: "",
    phone_number: "",
  });
  const [agentProfile, setAgentProfile] = useState<AgentProfile>({
    business_name: "",
    referral_code: "",
    contact_phone: "",
    contact_email: "",
    status: "pending",
    commission_rate: "10",
  });
  const [paymentMode, setPaymentMode] = useState<string>("");

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
      }

      const { data: agentData } = await supabase
        .from("referrers")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (agentData) {
        setAgentProfile(agentData);
        setPaymentMode(agentData.payment_mode || "");
      }
    } catch (error) {
      console.error("Error fetching profiles:", error);
      toast.error("Failed to load profile");
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
        const filePath = `agent-photos/${fileName}`;

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

      // Update user profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: userProfile.full_name,
          phone_number: userProfile.phone_number,
          avatar_url: avatarUrl,
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      // Update agent/referrer profile
      const { error: agentError} = await supabase
        .from("referrers")
        .update({
          business_name: agentProfile.business_name,
          contact_phone: agentProfile.contact_phone,
          contact_email: agentProfile.contact_email,
          payment_mode: paymentMode,
          bank_name: agentProfile.bank_name,
          bank_branch: agentProfile.bank_branch,
          account_number: agentProfile.account_number,
          account_name: agentProfile.account_name,
          mobile_money_provider: agentProfile.mobile_money_provider,
          mobile_money_number: agentProfile.mobile_money_number,
          mobile_money_name: agentProfile.mobile_money_name,
        })
        .eq("user_id", user.id);

      if (agentError) throw agentError;

      toast.success("✅ Profile updated successfully!");
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
      setPasswords({ new: "", confirm: "" });
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

  const getStatusBadge = () => {
    const statusConfig = {
      pending: { label: "🕓 Pending Approval", className: "bg-yellow-100 text-yellow-800" },
      active: { label: "✅ Active Agent", className: "bg-green-100 text-green-800" },
      suspended: { label: "🚫 Suspended", className: "bg-red-100 text-red-800" },
      rejected: { label: "❌ Rejected", className: "bg-gray-100 text-gray-800" },
    };

    const config = statusConfig[agentProfile.status as keyof typeof statusConfig] || statusConfig.pending;
    return <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.className}`}>{config.label}</span>;
  };

  return (
    <AgentLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-3xl font-heading font-bold flex items-center gap-2">
                  <User className="h-8 w-8" />
                  Agent Profile Settings
                </CardTitle>
                <CardDescription className="mt-2">
                  Manage your agent account information and settings
                </CardDescription>
              </div>
              {getStatusBadge()}
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-8">
              {/* Profile Photo Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Camera className="h-5 w-5 text-amber-600" />
                  <h3 className="text-xl font-semibold">Profile Photo / Business Logo</h3>
                </div>
                <div className="flex items-center gap-6">
                  <div className="relative">
                    {photoPreview ? (
                      <img 
                        src={photoPreview} 
                        alt="Profile" 
                        className="w-24 h-24 rounded-full object-cover border-4 border-amber-200"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-amber-100 flex items-center justify-center border-4 border-amber-200">
                        <User className="h-12 w-12 text-amber-600" />
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
                  <User className="h-5 w-5 text-amber-600" />
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
                    <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                  </div>

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
                </div>
              </div>

              <Separator />

              {/* Agent/Business Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-amber-600" />
                  <h3 className="text-xl font-semibold">Agent Business Information</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Business Name (Optional)</Label>
                    <Input
                      id="businessName"
                      placeholder="e.g. Prime Realty Agents"
                      value={agentProfile.business_name}
                      onChange={(e) => setAgentProfile({ ...agentProfile, business_name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactPhone">Contact Phone</Label>
                    <Input
                      id="contactPhone"
                      type="tel"
                      placeholder="+254 700 000 000"
                      value={agentProfile.contact_phone}
                      onChange={(e) => setAgentProfile({ 
                        ...agentProfile, 
                        contact_phone: formatPhoneNumber(e.target.value)
                      })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">Contact Email</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      placeholder="business@example.com"
                      value={agentProfile.contact_email}
                      onChange={(e) => setAgentProfile({ ...agentProfile, contact_email: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Payment Details */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-amber-600" />
                  <h3 className="text-xl font-semibold">Payment Details</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Provide your payment details for commission payouts
                </p>
                
                {/* Payment Mode Selector */}
                <div className="space-y-2">
                  <Label htmlFor="paymentMode">Mode of Payment *</Label>
                  <Select 
                    value={paymentMode} 
                    onValueChange={(value) => setPaymentMode(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank">Bank Transfer</SelectItem>
                      <SelectItem value="mpesa">M-Pesa</SelectItem>
                      <SelectItem value="airtel">Airtel Money</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Bank Fields */}
                {paymentMode === "bank" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-blue-50/30 dark:bg-blue-950/20">
                    <div className="space-y-2">
                      <Label htmlFor="bankName">Bank Name *</Label>
                      <Input
                        id="bankName"
                        placeholder="e.g. Kenya Commercial Bank"
                        value={agentProfile.bank_name}
                        onChange={(e) => setAgentProfile({ ...agentProfile, bank_name: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bankBranch">Branch *</Label>
                      <Input
                        id="bankBranch"
                        placeholder="e.g. Nairobi Branch"
                        value={agentProfile.bank_branch}
                        onChange={(e) => setAgentProfile({ ...agentProfile, bank_branch: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="accountNumber">Account Number *</Label>
                      <Input
                        id="accountNumber"
                        placeholder="e.g. 1234567890"
                        value={agentProfile.account_number}
                        onChange={(e) => setAgentProfile({ ...agentProfile, account_number: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="accountName">Account Name *</Label>
                      <Input
                        id="accountName"
                        placeholder="Name as per bank account"
                        value={agentProfile.account_name}
                        onChange={(e) => setAgentProfile({ ...agentProfile, account_name: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {/* M-Pesa Fields */}
                {paymentMode === "mpesa" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-green-50/30 dark:bg-green-950/20">
                    <div className="space-y-2">
                      <Label htmlFor="mpesaNumber">M-Pesa Number *</Label>
                      <Input
                        id="mpesaNumber"
                        type="tel"
                        placeholder="+254 700 000 000"
                        value={agentProfile.mobile_money_number}
                        onChange={(e) => setAgentProfile({ 
                          ...agentProfile, 
                          mobile_money_number: formatPhoneNumber(e.target.value),
                          mobile_money_provider: "mpesa"
                        })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mpesaName">Name (for confirmation) *</Label>
                      <Input
                        id="mpesaName"
                        placeholder="Name registered on M-Pesa"
                        value={agentProfile.mobile_money_name}
                        onChange={(e) => setAgentProfile({ ...agentProfile, mobile_money_name: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {/* Airtel Money Fields */}
                {paymentMode === "airtel" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-red-50/30 dark:bg-red-950/20">
                    <div className="space-y-2">
                      <Label htmlFor="airtelNumber">Airtel Money Number *</Label>
                      <Input
                        id="airtelNumber"
                        type="tel"
                        placeholder="+254 700 000 000"
                        value={agentProfile.mobile_money_number}
                        onChange={(e) => setAgentProfile({ 
                          ...agentProfile, 
                          mobile_money_number: formatPhoneNumber(e.target.value),
                          mobile_money_provider: "airtel"
                        })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="airtelName">Name (for confirmation) *</Label>
                      <Input
                        id="airtelName"
                        placeholder="Name registered on Airtel Money"
                        value={agentProfile.mobile_money_name}
                        onChange={(e) => setAgentProfile({ ...agentProfile, mobile_money_name: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {!paymentMode && (
                  <div className="text-center p-6 border-2 border-dashed rounded-lg">
                    <p className="text-muted-foreground text-sm">
                      Please select a payment mode above to enter your payment details
                    </p>
                  </div>
                )}
              </div>

              <Separator />

              {/* Agent Info (Read-only) */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Code className="h-5 w-5 text-amber-600" />
                  <h3 className="text-xl font-semibold">Agent Account Details</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Referral Code</Label>
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border-2 border-amber-200 rounded-lg">
                      <code className="text-lg font-bold text-amber-700">{agentProfile.referral_code}</code>
                    </div>
                    <p className="text-xs text-muted-foreground">Your unique referral identifier</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Commission Rate</Label>
                    <div className="p-3 bg-green-50 dark:bg-green-950/20 border-2 border-green-200 rounded-lg">
                      <span className="text-lg font-bold text-green-700">{agentProfile.commission_rate}%</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Per booking commission</p>
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700" disabled={isLoading}>
                {isLoading ? "Saving Changes..." : "💾 Save Profile"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Password Change Card */}
        <Card>
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
    </AgentLayout>
  );
};

export default AgentProfile;
