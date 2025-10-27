import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { useDynamicTitle } from "@/hooks/useDynamicTitle";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Auth from "./pages/Auth";
import AdminLogin from "./pages/AdminLogin";
import PartnerRegister from "./pages/PartnerRegister";
import PartnerDashboard from "./pages/PartnerDashboard";
import PartnerProfile from "./pages/PartnerProfile";
import Admin from "./pages/Admin";
import PropertyDetails from "./pages/PropertyDetails";
import AddProperty from "./pages/AddProperty";
import Terms from "./pages/Terms";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import FeatureRequest from "./pages/FeatureRequest";
import PartnerBookings from "./pages/PartnerBookings";
import PartnerListings from "./pages/PartnerListings";
import PartnerNotifications from "./pages/PartnerNotifications";
import PartnerSupport from "./pages/PartnerSupport";
import PartnerSettings from "./pages/PartnerSettings";
import EditProperty from "./pages/EditProperty";
import AdminPartners from "./pages/AdminPartners";
import AdminAgents from "./pages/AdminAgents";
import AdminProperties from "./pages/AdminProperties";
import AdminBookings from "./pages/AdminBookings";
import AdminFeaturedRequests from "./pages/AdminFeaturedRequests";
import AdminMaintenance from "./pages/AdminMaintenance";
import AdminNotifications from "./pages/AdminNotifications";
import AdminSettings from "./pages/AdminSettings";
import AdminReviews from "./pages/AdminReviews";
import ReferrerDashboard from "./pages/ReferrerDashboard";
import ReferrerLink from "./pages/ReferrerLink";
import ReferrerReferrals from "./pages/ReferrerReferrals";
import ReferrerCommissions from "./pages/ReferrerCommissions";
import AgentDashboard from "./pages/AgentDashboard";
import AgentReferrals from "./pages/AgentReferrals";
import AgentReferralLink from "./pages/AgentReferralLink";
import AgentCommissions from "./pages/AgentCommissions";
import AgentProfile from "./pages/AgentProfile";
import PartnerPendingApproval from "./pages/PartnerPendingApproval";
import AdminAgentPayments from "./pages/AdminAgentPayments";

const queryClient = new QueryClient();

const AppRoutes = () => {
  useDynamicTitle(); // This will handle dynamic titles based on current route
  
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/admin-login" element={<AdminLogin />} />
      <Route path="/partner-register" element={<PartnerRegister />} />
      <Route path="/partner-pending-approval" element={<PartnerPendingApproval />} />
      <Route path="/partner-dashboard" element={<PartnerDashboard />} />
      <Route path="/partner-profile" element={<PartnerProfile />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/admin/partners" element={<AdminPartners />} />
      <Route path="/admin/agents" element={<AdminAgents />} />
      <Route path="/admin/agent-payments" element={<AdminAgentPayments />} />
      <Route path="/admin/properties" element={<AdminProperties />} />
      <Route path="/admin/bookings" element={<AdminBookings />} />
      <Route path="/admin/featured-requests" element={<AdminFeaturedRequests />} />
      <Route path="/admin/maintenance" element={<AdminMaintenance />} />
      <Route path="/admin/notifications" element={<AdminNotifications />} />
      <Route path="/admin/settings" element={<AdminSettings />} />
      <Route path="/admin/reviews" element={<AdminReviews />} />
      <Route path="/property/:id" element={<PropertyDetails />} />
      <Route path="/add-property" element={<AddProperty />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/feature-request" element={<FeatureRequest />} />
      <Route path="/partner-bookings" element={<PartnerBookings />} />
      <Route path="/partner-listings" element={<PartnerListings />} />
      <Route path="/partner-notifications" element={<PartnerNotifications />} />
      <Route path="/partner-support" element={<PartnerSupport />} />
      <Route path="/partner-settings" element={<PartnerSettings />} />
      <Route path="/edit-property/:id" element={<EditProperty />} />
      
      {/* Referrer Routes */}
      <Route path="/referrer-dashboard" element={<ReferrerDashboard />} />
      <Route path="/referrer-link" element={<ReferrerLink />} />
      <Route path="/referrer-referrals" element={<ReferrerReferrals />} />
      <Route path="/referrer-commissions" element={<ReferrerCommissions />} />
      
      {/* Agent Routes - Dedicated agent components with AgentLayout */}
      <Route path="/agent-dashboard" element={<AgentDashboard />} />
      <Route path="/agent-profile" element={<AgentProfile />} />
      <Route path="/agent-referral" element={<AgentReferralLink />} />
      <Route path="/agent-referrals" element={<AgentReferrals />} />
      <Route path="/agent-commissions" element={<AgentCommissions />} />
      <Route path="/agent-properties" element={<PartnerListings />} />
      <Route path="/agent-bookings" element={<PartnerBookings />} />
      <Route path="/agent-notifications" element={<PartnerNotifications />} />
      <Route path="/agent-support" element={<PartnerSupport />} />
      <Route path="/agent-settings" element={<PartnerSettings />} />
      
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
          <PWAInstallPrompt />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
