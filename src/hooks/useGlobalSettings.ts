import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface GlobalSettings {
  contact_email: string;
  contact_phone: string;
  whatsapp_number: string;
  business_address: string;
  support_email: string;
  privacy_email: string;
  company_name: string;
  website_url: string;
}

export const useGlobalSettings = () => {
  const [settings, setSettings] = useState<GlobalSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('Fetching global settings...');

      const { data, error: fetchError } = await supabase
        .from('global_settings')
        .select('setting_key, setting_value')
        .in('setting_key', [
          'contact_email',
          'contact_phone', 
          'whatsapp_number',
          'business_address',
          'support_email',
          'privacy_email',
          'company_name',
          'website_url'
        ]);

      if (fetchError) {
        console.error('Database error:', fetchError);
        
        // If table doesn't exist, provide fallback values
        if (fetchError.code === 'PGRST116' || fetchError.message.includes('relation "global_settings" does not exist')) {
          console.log('Table does not exist, using fallback values');
          const fallbackSettings: GlobalSettings = {
            contact_email: 'contact@bomabnb.com',
            contact_phone: '+254 700 000 000',
            whatsapp_number: '+254 700 000 000',
            business_address: 'Nairobi, Kenya',
            support_email: 'support@bomabnb.com',
            privacy_email: 'privacy@bomabnb.com',
            company_name: 'BomaBnB',
            website_url: 'https://bomabnb.com'
          };
          setSettings(fallbackSettings);
          setError('Global settings table not found. Please run the setup SQL script.');
          return;
        }
        
        throw fetchError;
      }

      console.log('Fetched data:', data);

      // Convert array to object
      const settingsObj: GlobalSettings = {
        contact_email: '',
        contact_phone: '',
        whatsapp_number: '',
        business_address: '',
        support_email: '',
        privacy_email: '',
        company_name: '',
        website_url: ''
      };

      data?.forEach(item => {
        if (item.setting_key in settingsObj) {
          (settingsObj as any)[item.setting_key] = item.setting_value;
        }
      });

      console.log('Processed settings:', settingsObj);
      setSettings(settingsObj);
    } catch (err) {
      console.error('Error fetching global settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch settings');
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = async (key: string, value: string) => {
    try {
      const { error: updateError } = await supabase
        .from('global_settings')
        .upsert({
          setting_key: key,
          setting_value: value,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'setting_key'
        });

      if (updateError) throw updateError;

      // Update local state
      setSettings(prev => prev ? { ...prev, [key]: value } : null);
      
      return true;
    } catch (err) {
      console.error('Error updating setting:', err);
      setError(err instanceof Error ? err.message : 'Failed to update setting');
      return false;
    }
  };

  const updateMultipleSettings = async (updates: Partial<GlobalSettings>) => {
    try {
      console.log('Updating settings:', updates);
      
      const updatePromises = Object.entries(updates).map(([key, value]) => {
        console.log(`Updating ${key} to ${value}`);
        return supabase
          .from('global_settings')
          .upsert({
            setting_key: key,
            setting_value: value,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'setting_key'
          });
      });

      const results = await Promise.all(updatePromises);
      
      // Log results for debugging
      results.forEach((result, index) => {
        const key = Object.keys(updates)[index];
        if (result.error) {
          console.error(`Error updating ${key}:`, result.error);
        } else {
          console.log(`Successfully updated ${key}`);
        }
      });
      
      // Check for errors
      const hasError = results.some(result => result.error);
      if (hasError) {
        const errorMessages = results
          .filter(result => result.error)
          .map(result => result.error?.message)
          .join(', ');
        throw new Error(`Some updates failed: ${errorMessages}`);
      }

      // Update local state
      setSettings(prev => prev ? { ...prev, ...updates } : null);
      
      return true;
    } catch (err) {
      console.error('Error updating multiple settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to update settings');
      return false;
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    settings,
    isLoading,
    error,
    fetchSettings,
    updateSetting,
    updateMultipleSettings
  };
};
