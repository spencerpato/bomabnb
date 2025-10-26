import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Clock, CheckCircle, XCircle, UserCheck, AlertCircle, LogOut, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PartnerStatus {
  status: string;
  business_name?: string;
  location: string;
  created_at: string;
  approved_at?: string;
  referrer_info?: {
    business_name: string | null;
    profiles: {
      full_name: string;
    };
  } | null;
}

const PartnerPendingApproval = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [partnerStatus, setPartnerStatus] = useState<PartnerStatus | null>(null);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    checkPartnerStatus();
    // Poll status every 30 seconds
    const interval = setInterval(checkPartnerStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkPartnerStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Get user profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      if (profileData) {
        setUserName(profileData.full_name);
      }

      // Get partner status
      const { data: partnerData } = await supabase
        .from("partners")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (!partnerData) {
        navigate("/partner-register");
        return;
      }

      // If partner is active, redirect to dashboard
      if (partnerData.status === "active") {
        navigate("/partner-dashboard");
        return;
      }

      // Check if referred by agent
      const { data: referralData } = await supabase
        .from("referrals")
        .select(`
          referrer_id,
          referrers (
            business_name,
            user_id
          )
        `)
        .eq("partner_id", partnerData.id)
        .eq("status", "active")
        .single();

      let referrerInfo = null;
      if (referralData && referralData.referrers) {
        const { data: referrerProfile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", referralData.referrers.user_id)
          .single();

        referrerInfo = {
          business_name: referralData.referrers.business_name,
          profiles: {
            full_name: referrerProfile?.full_name || "Agent",
          },
        };
      }

      setPartnerStatus({
        ...partnerData,
        referrer_info: referrerInfo,
      });
    } catch (error) {
      console.error("Error checking status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      pending: {
        icon: Clock,
        title: "Account Pending Approval",
        color: "text-yellow-600",
        bgColor: "bg-yellow-50 dark:bg-yellow-950/20",
        borderColor: "border-yellow-200",
      },
      rejected: {
        icon: XCircle,
        title: "Account Rejected",
        color: "text-red-600",
        bgColor: "bg-red-50 dark:bg-red-950/20",
        borderColor: "border-red-200",
      },
      suspended: {
        icon: AlertCircle,
        title: "Account Suspended",
        color: "text-orange-600",
        bgColor: "bg-orange-50 dark:bg-orange-950/20",
        borderColor: "border-orange-200",
      },
    };

    return configs[status as keyof typeof configs] || configs.pending;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!partnerStatus) {
    return null;
  }

  const statusConfig = getStatusConfig(partnerStatus.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className={`w-full max-w-2xl ${statusConfig.borderColor} border-2`}>
        <CardHeader className={statusConfig.bgColor}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <StatusIcon className={`h-12 w-12 ${statusConfig.color}`} />
              <div>
                <CardTitle className="text-2xl">{statusConfig.title}</CardTitle>
                <CardDescription className="mt-1">
                  Welcome, {userName}
                </CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {/* Registration Details */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Registration Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              {partnerStatus.business_name && (
                <div>
                  <span className="text-muted-foreground">Business Name:</span>
                  <p className="font-medium">{partnerStatus.business_name}</p>
                </div>
              )}
              <div>
                <span className="text-muted-foreground">Location:</span>
                <p className="font-medium">{partnerStatus.location}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Registered:</span>
                <p className="font-medium">
                  {new Date(partnerStatus.created_at).toLocaleDateString('en-US', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Status:</span>
                <div className="mt-1">
                  <Badge variant={partnerStatus.status === "pending" ? "outline" : "destructive"}>
                    {partnerStatus.status.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Referral Info if exists */}
          {partnerStatus.referrer_info && (
            <div className={`p-4 rounded-lg ${statusConfig.bgColor} border ${statusConfig.borderColor}`}>
              <div className="flex items-center gap-2 mb-2">
                <UserCheck className={`h-5 w-5 ${statusConfig.color}`} />
                <h3 className="font-semibold">Referred By Agent</h3>
              </div>
              <p className="text-sm">
                <span className="text-muted-foreground">Agent: </span>
                <span className="font-medium">{partnerStatus.referrer_info.profiles.full_name}</span>
                {partnerStatus.referrer_info.business_name && (
                  <span className="text-muted-foreground"> ({partnerStatus.referrer_info.business_name})</span>
                )}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Your referring agent will be notified once your account is approved.
              </p>
            </div>
          )}

          {/* Status-specific message */}
          <div className="space-y-3">
            {partnerStatus.status === "pending" && (
              <>
                <div className={`p-4 rounded-lg ${statusConfig.bgColor} border ${statusConfig.borderColor}`}>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Clock className={`h-5 w-5 ${statusConfig.color}`} />
                    What's Happening?
                  </h3>
                  <ul className="text-sm space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Your registration has been received successfully</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Clock className={`h-4 w-4 ${statusConfig.color} mt-0.5 flex-shrink-0`} />
                      <span>Our admin team is reviewing your application</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>You will receive an email notification once approved</span>
                    </li>
                  </ul>
                </div>
                <p className="text-sm text-center text-muted-foreground">
                  This usually takes 24-48 hours. Thank you for your patience!
                </p>
              </>
            )}

            {partnerStatus.status === "rejected" && (
              <div className={`p-4 rounded-lg ${statusConfig.bgColor} border ${statusConfig.borderColor}`}>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <XCircle className={`h-5 w-5 ${statusConfig.color}`} />
                  Application Not Approved
                </h3>
                <p className="text-sm mb-3">
                  Unfortunately, your partner application was not approved at this time.
                </p>
                <p className="text-sm text-muted-foreground">
                  Please contact our support team at <a href="mailto:support@bomabnb.com" className="text-primary underline">support@bomabnb.com</a> for more information.
                </p>
              </div>
            )}

            {partnerStatus.status === "suspended" && (
              <div className={`p-4 rounded-lg ${statusConfig.bgColor} border ${statusConfig.borderColor}`}>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <AlertCircle className={`h-5 w-5 ${statusConfig.color}`} />
                  Account Suspended
                </h3>
                <p className="text-sm mb-3">
                  Your partner account has been temporarily suspended.
                </p>
                <p className="text-sm text-muted-foreground">
                  Please contact our support team at <a href="mailto:support@bomabnb.com" className="text-primary underline">support@bomabnb.com</a> to resolve this issue.
                </p>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-4">
            <Button 
              onClick={checkPartnerStatus} 
              variant="outline" 
              className="flex-1"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh Status
            </Button>
            <Button 
              onClick={handleLogout} 
              variant="secondary" 
              className="flex-1"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>

          {/* Auto-refresh notice */}
          <p className="text-xs text-center text-muted-foreground">
            Status auto-refreshes every 30 seconds
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PartnerPendingApproval;
