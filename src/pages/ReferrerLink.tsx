import { useEffect, useState } from "react";
import { ReferrerLayout } from "@/components/ReferrerLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Copy, Share2, MessageCircle, Facebook } from "lucide-react";

const ReferrerLink = () => {
  const [referralCode, setReferralCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [referralLink, setReferralLink] = useState("");

  useEffect(() => {
    fetchReferralCode();
  }, []);

  const fetchReferralCode = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("referrers")
        .select("referral_code")
        .eq("user_id", user.id)
        .single();

      if (data?.referral_code) {
        setReferralCode(data.referral_code);
        const baseUrl = window.location.origin;
        setReferralLink(`${baseUrl}/partner-register?ref=${data.referral_code}`);
      }
    } catch (error) {
      console.error("Error fetching referral code:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success("Referral link copied to clipboard!");
  };

  const shareViaWhatsApp = () => {
    const message = `Join BomaBnB as a property partner and start earning! Use my referral link: ${referralLink}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  const shareViaFacebook = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`;
    window.open(facebookUrl, "_blank");
  };

  const shareViaEmail = () => {
    const subject = "Join BomaBnB as a Property Partner";
    const body = `Hi,\n\nI'd like to invite you to join BomaBnB as a property partner. You can list your properties and start earning from bookings.\n\nUse my referral link to get started: ${referralLink}\n\nBest regards`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  if (loading) {
    return (
      <ReferrerLayout>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </ReferrerLayout>
    );
  }

  return (
    <ReferrerLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Referral Link</h1>
          <p className="text-muted-foreground mt-2">
            Share your unique referral link to start earning commissions
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your Referral Link</CardTitle>
            <CardDescription>
              Share this link with potential partners. When they register using your link, you'll earn 10% commission on all their completed bookings.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-2">
              <Input
                value={referralLink}
                readOnly
                className="font-mono text-sm"
              />
              <Button onClick={copyToClipboard} variant="outline">
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Your Referral Code</h4>
              <p className="text-2xl font-mono font-bold text-purple-600">{referralCode}</p>
              <p className="text-sm text-muted-foreground mt-2">
                Partners can also enter this code during registration
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Share Your Link</CardTitle>
            <CardDescription>
              Choose your preferred method to share your referral link
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Button
                onClick={shareViaWhatsApp}
                className="h-auto py-4 flex-col gap-2 bg-green-600 hover:bg-green-700"
              >
                <MessageCircle className="h-6 w-6" />
                <span>Share via WhatsApp</span>
              </Button>
              <Button
                onClick={shareViaFacebook}
                className="h-auto py-4 flex-col gap-2 bg-blue-600 hover:bg-blue-700"
              >
                <Facebook className="h-6 w-6" />
                <span>Share on Facebook</span>
              </Button>
              <Button
                onClick={shareViaEmail}
                variant="outline"
                className="h-auto py-4 flex-col gap-2"
              >
                <Share2 className="h-6 w-6" />
                <span>Share via Email</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">
                  1
                </div>
                <p className="text-sm">
                  <strong>Share your link</strong> - Send your referral link to property owners, hotels, guesthouses, or anyone with properties to rent
                </p>
              </div>
              <div className="flex gap-3">
                <div className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">
                  2
                </div>
                <p className="text-sm">
                  <strong>They register</strong> - When they sign up using your link or referral code, they're automatically linked to your account
                </p>
              </div>
              <div className="flex gap-3">
                <div className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">
                  3
                </div>
                <p className="text-sm">
                  <strong>You earn commissions</strong> - Earn 10% commission on every completed booking from their properties
                </p>
              </div>
              <div className="flex gap-3">
                <div className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">
                  4
                </div>
                <p className="text-sm">
                  <strong>Request payouts</strong> - Request payouts anytime from your Commissions & Payouts page
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ReferrerLayout>
  );
};

export default ReferrerLink;
