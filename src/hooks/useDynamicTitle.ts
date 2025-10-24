import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';

interface UserProfile {
  full_name: string;
  business_name?: string;
}

interface PartnerInfo {
  business_name?: string;
  user_id: string;
}

export const useDynamicTitle = () => {
  const location = useLocation();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [partnerInfo, setPartnerInfo] = useState<PartnerInfo | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Get user profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user.id)
            .single();

          // Get user role
          const { data: roles } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id);

          const role = roles?.[0]?.role;
          setUserRole(role);

          if (profile) {
            setUserProfile(profile);

            // If partner, get business name
            if (role === 'partner') {
              const { data: partner } = await supabase
                .from('partners')
                .select('business_name')
                .eq('user_id', user.id)
                .single();

              if (partner) {
                setPartnerInfo({ business_name: partner.business_name, user_id: user.id });
              }
            }
          }
        }
      } catch (error) {
        console.error('Error fetching user data for title:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const setPageTitle = (title: string) => {
    document.title = title;
  };

  const getPartnerTitle = (pageName: string, includeBusinessName = true) => {
    if (!userProfile) return `${pageName} | BomaBnB Partner Dashboard`;
    
    const partnerName = userProfile.full_name;
    const businessName = partnerInfo?.business_name;
    
    if (includeBusinessName && businessName) {
      return `${pageName} – ${businessName} – ${partnerName} | BomaBnB Partner Dashboard`;
    }
    
    return `${pageName} – ${partnerName} | BomaBnB Partner Dashboard`;
  };

  const getSuperadminTitle = (section?: string) => {
    if (section) {
      return `Superadmin | ${section} – BomaBnB`;
    }
    return 'Superadmin | BomaBnB Management Panel';
  };

  const getDefaultTitle = () => {
    return 'BomaBnB – Find Your Perfect Stay';
  };

  // Auto-set title based on current route
  useEffect(() => {
    if (isLoading) return;

    const path = location.pathname;

    // Public pages
    if (path === '/' || path === '/about' || path === '/contact' || path === '/terms') {
      setPageTitle(getDefaultTitle());
      return;
    }

    // Superadmin pages
    if (path.startsWith('/admin')) {
      const sectionMap: { [key: string]: string } = {
        '/admin': 'Dashboard',
        '/admin/partners': 'Partners Approval',
        '/admin/properties': 'Properties Management',
        '/admin/bookings': 'Bookings Management',
        '/admin/featured-requests': 'Featured Requests',
        '/admin/maintenance': 'Maintenance Center',
        '/admin/notifications': 'Notifications Center',
        '/admin/settings': 'Settings'
      };
      
      const section = sectionMap[path] || 'Management Panel';
      setPageTitle(getSuperadminTitle(section));
      return;
    }

    // Partner pages
    if (userRole === 'partner' && userProfile) {
      const pageMap: { [key: string]: string } = {
        '/partner-dashboard': 'Dashboard',
        '/partner-profile': 'Edit Profile',
        '/add-property': 'Add New Property',
        '/partner-listings': 'My Properties',
        '/partner-bookings': 'Bookings',
        '/partner-notifications': 'Notifications',
        '/partner-settings': 'Settings',
        '/partner-support': 'Support'
      };

      const pageName = pageMap[path] || 'Partner Dashboard';
      
      // Special cases for different title formats
      if (path === '/partner-dashboard') {
        const businessName = partnerInfo?.business_name;
        const partnerName = userProfile.full_name;
        
        if (businessName) {
          setPageTitle(`${businessName} – ${partnerName} | BomaBnB Partner Dashboard`);
        } else {
          setPageTitle(`${partnerName} | BomaBnB Partner Dashboard`);
        }
      } else if (path === '/partner-bookings') {
        const businessName = partnerInfo?.business_name;
        if (businessName) {
          setPageTitle(`Bookings – ${businessName} | BomaBnB Partner Dashboard`);
        } else {
          setPageTitle(getPartnerTitle('Bookings', false));
        }
      } else {
        setPageTitle(getPartnerTitle(pageName));
      }
      return;
    }

    // Default fallback
    setPageTitle(getDefaultTitle());
  }, [location.pathname, userProfile, partnerInfo, userRole, isLoading]);

  return {
    setPageTitle,
    getPartnerTitle,
    getSuperadminTitle,
    getDefaultTitle,
    userProfile,
    partnerInfo,
    userRole,
    isLoading
  };
};
