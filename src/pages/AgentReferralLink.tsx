import { useEffect, useState } from "react";
import { AgentLayout } from "@/components/AgentLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Copy, Share2, MessageCircle, Facebook, Link as LinkIcon, ExternalLink } from "lucide-react";

const AgentReferralLink = () => {
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
      toast.error("Failed to load referral code");
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

  if (loading) {
    return (
      <AgentLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
        </div>
      </AgentLayout>
    );
  }

  return (
    <AgentLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Referral Link</h1>
          <p className="text-muted-foreground mt-2">
            Share your unique referral link to earn commissions
          </p>
        </div>

        {/* Referral Code Display */}
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/20 dark:to-amber-900/10 border-amber-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="h-5 w-5 text-amber-700" />
              Your Referral Code
            </CardTitle>
            <CardDescription>Use this code to track your referrals</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <code className="flex-1 text-2xl font-mono font-bold text-amber-700 bg-white dark:bg-gray-800 px-6 py-4 rounded-lg border-2 border-amber-300">
                {referralCode}
              </code>
            </div>
          </CardContent>
        </Card>

        {/* Referral Link */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Your Referral Link
            </CardTitle>
            <CardDescription>
              Share this link with property owners to earn commissions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Input
                value={referralLink}
                readOnly
                className="flex-1 font-mono text-sm"
              />
              <Button onClick={copyToClipboard} className="bg-amber-600 hover:bg-amber-700 shrink-0">
                <Copy className="h-4 w-4 mr-2" />
                Copy Link
              </Button>
            </div>

            <div className="pt-4">
              <p className="text-sm font-medium mb-3">Quick Share:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={shareViaWhatsApp}
                  className="w-full justify-start h-auto py-4"
                >
                  <MessageCircle className="h-5 w-5 mr-3 text-green-600" />
                  <div className="text-left">
                    <p className="font-medium">Share on WhatsApp</p>
                    <p className="text-xs text-muted-foreground">Send to contacts</p>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  onClick={shareViaFacebook}
                  className="w-full justify-start h-auto py-4"
                >
                  <Facebook className="h-5 w-5 mr-3 text-blue-600" />
                  <div className="text-left">
                    <p className="font-medium">Share on Facebook</p>
                    <p className="text-xs text-muted-foreground">Post to your timeline</p>
                  </div>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* How It Works */}
        <Card>
          <CardHeader>
            <CardTitle>How Referrals Work</CardTitle>
            <CardDescription>Earn commissions by referring property partners</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-700 font-bold">
                  1
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Share Your Link</h4>
                  <p className="text-sm text-muted-foreground">
                    Send your referral link to property owners or managers who want to list on BomaBnB
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-700 font-bold">
                  2
                </div>
                <div>
                  <h4 className="font-semibold mb-1">They Register</h4>
                  <p className="text-sm text-muted-foreground">
                    When they click your link and register, they become your referred partner
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-700 font-bold">
                  3
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Earn Commissions</h4>
                  <p className="text-sm text-muted-foreground">
                    You earn a commission on every booking made at their properties - passive income!
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tips */}
        <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
          <CardHeader>
            <CardTitle className="text-blue-900 dark:text-blue-100">💡 Pro Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-blue-900 dark:text-blue-100">
              <li className="flex items-start gap-2">
                <ExternalLink className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>Target property owners with multiple properties for maximum earnings</span>
              </li>
              <li className="flex items-start gap-2">
                <ExternalLink className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>Share your link on social media and property management groups</span>
              </li>
              <li className="flex items-start gap-2">
                <ExternalLink className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>Follow up with potential partners to help them complete registration</span>
              </li>
              <li className="flex items-start gap-2">
                <ExternalLink className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>Build relationships - satisfied partners list more properties!</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </AgentLayout>
  );
};

export default AgentReferralLink;
