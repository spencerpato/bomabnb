import { supabase } from "@/integrations/supabase/client";
import { NavigateFunction } from "react-router-dom";
import { toast } from "sonner";

export interface PartnerStatusCheck {
  isApproved: boolean;
  status: string;
  partnerId: string | null;
}

/**
 * Check if partner is approved and redirect if not
 * @param navigate - React Router navigate function
 * @returns Partner status information
 */
export const checkPartnerApproval = async (
  navigate: NavigateFunction
): Promise<PartnerStatusCheck> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate("/auth");
      return { isApproved: false, status: "unauthenticated", partnerId: null };
    }

    // Check if user is a partner
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "partner");

    if (!roles || roles.length === 0) {
      toast.error("Access denied. Partner account required.");
      navigate("/");
      return { isApproved: false, status: "not_partner", partnerId: null };
    }

    // Fetch partner data
    const { data: partnerData, error: partnerError } = await supabase
      .from("partners")
      .select("id, status")
      .eq("user_id", user.id)
      .single();

    if (partnerError || !partnerData) {
      toast.error("Partner account not found.");
      navigate("/partner-register");
      return { isApproved: false, status: "not_found", partnerId: null };
    }

    // If partner is not active, redirect to pending approval page
    if (partnerData.status !== "active") {
      navigate("/partner-pending-approval");
      return { 
        isApproved: false, 
        status: partnerData.status, 
        partnerId: partnerData.id 
      };
    }

    // Partner is approved
    return { 
      isApproved: true, 
      status: "active", 
      partnerId: partnerData.id 
    };
  } catch (error) {
    console.error("Error checking partner approval:", error);
    toast.error("Failed to verify account status");
    navigate("/");
    return { isApproved: false, status: "error", partnerId: null };
  }
};
