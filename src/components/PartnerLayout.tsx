import { ReactNode } from "react";
import { PartnerSidebar, MobilePartnerSidebar } from "@/components/PartnerSidebar";

interface PartnerLayoutProps {
  children: ReactNode;
}

export const PartnerLayout = ({ children }: PartnerLayoutProps) => {
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
