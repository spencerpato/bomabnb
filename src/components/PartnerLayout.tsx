import { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PartnerSidebar, MobilePartnerSidebar } from "@/components/PartnerSidebar";
import { checkPartnerApproval } from "@/utils/partnerAuth";

interface PartnerLayoutProps {
  children: ReactNode;
}

export const PartnerLayout = ({ children }: PartnerLayoutProps) => {
  const navigate = useNavigate();
  const [isApproved, setIsApproved] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const verifyApproval = async () => {
      const result = await checkPartnerApproval(navigate);
      setIsApproved(result.isApproved);
      setIsChecking(false);
    };

    verifyApproval();
  }, [navigate]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isApproved) {
    return null; // User will be redirected by checkPartnerApproval
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop Sidebar - Fixed on left */}
      <aside className="hidden lg:block w-80 h-screen sticky top-0 overflow-hidden border-r">
        <PartnerSidebar />
      </aside>

      {/* Mobile Sidebar */}
      <MobilePartnerSidebar />

      {/* Main Content Area */}
      <main className="flex-1 overflow-x-hidden">
        <div className="container mx-auto px-4 py-8 lg:px-8 min-h-screen">
          {children}
        </div>
      </main>
    </div>
  );
};
