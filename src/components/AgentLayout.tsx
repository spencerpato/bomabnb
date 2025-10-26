import { ReactNode } from "react";
import { AgentSidebar, MobileAgentSidebar } from "@/components/AgentSidebar";

interface AgentLayoutProps {
  children: ReactNode;
}

export const AgentLayout = ({ children }: AgentLayoutProps) => {
  return (
    <div className="min-h-screen flex bg-background">
      <aside className="hidden lg:block w-80 h-screen sticky top-0 overflow-hidden border-r">
        <AgentSidebar />
      </aside>

      <MobileAgentSidebar />

      <main className="flex-1 overflow-x-hidden">
        <div className="container mx-auto px-4 py-8 lg:px-8 min-h-screen">
          {children}
        </div>
      </main>
    </div>
  );
};
