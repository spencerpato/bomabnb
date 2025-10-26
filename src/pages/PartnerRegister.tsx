import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, CheckCircle2, MessageCircle, Copy, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const PartnerRegister = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const registrationType = searchParams.get('role') === 'agent' ? 'agent' : 'partner';
  const referralCode = searchParams.get('ref'); // Get referral code from URL
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [generatedReferralCode, setGeneratedReferralCode] = useState<string>("");
  const [codeCopied, setCodeCopied] = useState(false);
  const [referrerInfo, setReferrerInfo] = useState<{ id: string; business_name: string } | null>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    businessName: "",
    email: "",
    phoneNumber: "",
    idPassportNo: "",
    password: "",
    confirmPassword: "",
    location: "",
    about: "",
  });

  // Verify referral code on component mount
  useEffect(() => {
    if (referralCode && registrationType === 'partner') {
      verifyReferralCode(referralCode);
    }
  }, [referralCode, registrationType]);

  const verifyReferralCode = async (code: string) => {
    try {
      // @ts-expect-error - Supabase types need regeneration to include referrers table
      const { data, error } = await supabase
        .from('referrers')
        .select('id, business_name, status')
        .eq('referral_code', code)
        .eq('status', 'active')
        .single();

      if (error || !data) {
        toast.error('Invalid or inactive referral code');
        return;
      }

      setReferrerInfo({ id: data.id, business_name: data.business_name || 'BomaBnB Agent' });
      toast.success(`Referred by: ${data.business_name || 'BomaBnB Agent'}`);
    } catch (error) {
      console.error('Error verifying referral code:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    let value = e.target.value;
    
    // Auto-format phone number to +254
    if (e.target.name === "phoneNumber" && value && !value.startsWith("+")) {
      if (value.startsWith("0")) {
        value = "+254" + value.substring(1);
      } else if (!value.startsWith("254")) {
        value = "+254" + value;
      }
    }
    
    setFormData({ ...formData, [e.target.name]: value });
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

  const generateReferralCode = () => {
    return `REF${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  };

  const handleNotifyAdmin = () => {
    const adminWhatsApp = "254114097160";
    const personName = formData.fullName || formData.businessName || `Unknown ${registrationType}`;
    const roleText = registrationType === 'agent' ? 'agent/referrer' : 'partner';
    const message = `Hello Patrick, a new ${roleText} (${personName}) has just registered on BomaBnB and is awaiting approval.`;
    
    window.open(
      `https://wa.me/${adminWhatsApp}?text=${encodeURIComponent(message)}`,
      "_blank"
    );
  };

  const copyReferralCode = () => {
    if (generatedReferralCode) {
      navigator.clipboard.writeText(generatedReferralCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
      toast.success("Referral code copied to clipboard!");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);
    try {
      let avatarUrl = "";

      // Upload profile photo if provided
      if (profilePhoto) {
        const fileExt = profilePhoto.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `partner-photos/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, profilePhoto);

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);
          avatarUrl = publicUrl;
        }
      }

      // Sign up user WITHOUT email confirmation
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: formData.fullName,
            phone_number: formData.phoneNumber,
            avatar_url: avatarUrl,
          },
          // Disable email confirmation
          emailRedirectTo: undefined,
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("User creation failed");

      if (registrationType === 'agent') {
        // Generate unique referral code for agent
        const referralCode = generateReferralCode();
        setGeneratedReferralCode(referralCode);

        // Create referrer record
        // @ts-expect-error - Supabase types need regeneration to include referrers table
        const { error: referrerError } = await supabase.from("referrers").insert({
          user_id: authData.user.id,
          referral_code: referralCode,
          business_name: formData.businessName || null,
          contact_phone: formData.phoneNumber,
          contact_email: formData.email,
          status: "pending",
        });

        if (referrerError) throw referrerError;

        // Assign referrer role
        // @ts-expect-error - Supabase types need regeneration to include referrer role
        const { error: roleError } = await supabase.from("user_roles").insert({
          user_id: authData.user.id,
          role: "referrer",
        });

        if (roleError) throw roleError;
      } else {
        // Create partner record
        const { data: partnerData, error: partnerError } = await supabase.from("partners").insert({
          user_id: authData.user.id,
          business_name: formData.businessName || null,
          id_passport_number: formData.idPassportNo || null,
          location: formData.location,
          about: formData.about || null,
          status: "pending",
        }).select().single();

        if (partnerError) throw partnerError;

        // Assign partner role
        const { error: roleError } = await supabase.from("user_roles").insert({
          user_id: authData.user.id,
          role: "partner",
        });

        if (roleError) throw roleError;

        // If partner registered with a referral code, create referral record
        if (referrerInfo && partnerData) {
          // @ts-expect-error - Supabase types need regeneration to include referrals table
          const { error: referralError } = await supabase.from("referrals").insert({
            referrer_id: referrerInfo.id,
            partner_id: partnerData.id,
            status: "active",
          });

          if (referralError) {
            console.error("Error creating referral:", referralError);
            // Don't throw error - partner is still registered
          } else {
            toast.success(`Successfully linked to agent: ${referrerInfo.business_name}`);
          }
        }
      }

      // Show success modal instead of toast
      setShowSuccessModal(true);
      
      // Auto-redirect after 5 seconds
      setTimeout(() => {
        setShowSuccessModal(false);
        navigate("/");
      }, 5000);
    } catch (error: any) {
      console.error("Registration error:", error);
      toast.error(error.message || "Failed to register");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-2xl shadow-lg">
          <CardHeader>
            <CardTitle className="text-3xl font-heading font-bold text-center">
              {registrationType === 'agent' ? 'Agent Registration' : 'Partner Registration'}
            </CardTitle>
            <CardDescription className="text-center">
              {registrationType === 'agent' 
                ? 'Join BomaBnB as an agent and earn commissions by referring hosts'
                : 'Join BomaBnB and start listing your properties'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name (Optional)</Label>
                  <Input
                    id="businessName"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number *</Label>
                  <Input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    placeholder="+254 700 000 000"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="idPassportNo">ID / Passport No. (Optional)</Label>
                  <Input
                    id="idPassportNo"
                    name="idPassportNo"
                    value={formData.idPassportNo}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location / Base of Operation *</Label>
                  <Input
                    id="location"
                    name="location"
                    placeholder="e.g. Nairobi, Kisumu, Naivasha"
                    value={formData.location}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="about">About / Short Bio (Optional)</Label>
                <Textarea
                  id="about"
                  name="about"
                  placeholder="Tell us about your BnB or your hosting experience..."
                  value={formData.about}
                  onChange={handleChange}
                  rows={4}
                />
              </div>

              {/* Profile Photo Upload */}
              <div className="space-y-2">
                <Label htmlFor="profilePhoto">Profile Photo or Business Logo (Optional)</Label>
                <div className="flex items-center gap-4">
                  {photoPreview && (
                    <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-primary">
                      <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1">
                    <Input
                      id="profilePhoto"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Max size: 5MB. Accepted: JPG, PNG, WEBP
                    </p>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={isLoading}
              >
                {isLoading ? "Submitting Application..." : "Submit Application"}
              </Button>

              <p className="text-sm text-center text-muted-foreground">
                Already have an account?{" "}
                <Button
                  variant="link"
                  className="text-primary p-0 h-auto font-normal"
                  onClick={() => navigate("/auth")}
                >
                  Sign in here
                </Button>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-secondary/20 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-secondary" />
              </div>
            </div>
            <DialogTitle className="text-center text-2xl">🎉 Registration Successful!</DialogTitle>
            <DialogDescription className="text-center space-y-3 pt-4">
              {registrationType === 'agent' && generatedReferralCode && (
                <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4 mb-4">
                  <p className="text-sm font-semibold text-amber-900 mb-2">Your Referral Code:</p>
                  <div className="flex items-center justify-center gap-2">
                    <code className="text-2xl font-bold text-amber-700 bg-white px-4 py-2 rounded border border-amber-200">
                      {generatedReferralCode}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={copyReferralCode}
                      className="h-10"
                    >
                      {codeCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-amber-700 mt-2">
                    Share this code with property owners to earn commissions!
                  </p>
                </div>
              )}
              <p className="text-base">
                Your account is awaiting approval from our admin team.
              </p>
              <p className="text-sm text-muted-foreground">
                You will be notified once approved. This usually takes 24-48 hours.
              </p>
              <p className="text-xs text-muted-foreground italic">
                Redirecting to homepage in 5 seconds...
              </p>
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-4">
            <Button 
              onClick={handleNotifyAdmin}
              className="w-full bg-[#25D366] hover:bg-[#20BA5A] text-white"
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Send to Admin via WhatsApp
            </Button>
            <div className="flex gap-3">
              <Button onClick={() => {
                setShowSuccessModal(false);
                navigate("/");
              }} className="flex-1 bg-primary">
                Go to Homepage
              </Button>
              <Button variant="outline" onClick={() => {
                setShowSuccessModal(false);
                navigate("/auth");
              }} className="flex-1">
                Try Login
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default PartnerRegister;
