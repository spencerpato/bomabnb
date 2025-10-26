import { ReactNode } from "react";
import { ReferrerSidebar, MobileReferrerSidebar } from "@/components/ReferrerSidebar";

interface ReferrerLayoutProps {
  children: ReactNode;
}

export const ReferrerLayout = ({ children }: ReferrerLayoutProps) => {
  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop Sidebar - Fixed on left */}
      <aside className="hidden lg:block w-80 h-screen sticky top-0 overflow-hidden border-r">
        <ReferrerSidebar />
      </aside>

      {/* Mobile Sidebar */}
      <MobileReferrerSidebar />

      {/* Main Content Area */}
      <main className="flex-1 overflow-x-hidden">
        <div className="container mx-auto px-4 py-8 lg:px-8 min-h-screen lg:mt-0 mt-16">
          {children}
        </div>
      </main>
    </div>
  );
};
