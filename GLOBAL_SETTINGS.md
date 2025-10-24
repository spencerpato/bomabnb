# 🌐 Global Settings System

## Overview
BomaBnB now has a centralized global settings system that allows Superadmins to manage contact information and company details from one location. These settings automatically appear throughout the entire platform, ensuring consistency and easy maintenance.

## 🎯 Key Benefits

### **Centralized Management**
- **Single Source of Truth:** All contact information managed in one place
- **Instant Updates:** Changes reflect immediately across the entire platform
- **Consistency:** Same contact details everywhere
- **Easy Maintenance:** No need to update multiple files

### **Professional Experience**
- **Brand Consistency:** Company name and details consistent everywhere
- **Accurate Information:** Always up-to-date contact details
- **Professional Image:** Centralized management shows attention to detail

## 🗄️ Database Schema

### **global_settings Table**
```sql
CREATE TABLE global_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### **Default Settings**
- `contact_email` - Primary contact email
- `contact_phone` - Primary contact phone
- `whatsapp_number` - WhatsApp contact number
- `business_address` - Business physical address
- `support_email` - Support email address
- `privacy_email` - Privacy policy contact email
- `company_name` - Company/platform name
- `website_url` - Main website URL

## 🔧 Technical Implementation

### **Core Hook: `useGlobalSettings`**
Located at `src/hooks/useGlobalSettings.ts`, this hook provides:
- **Data Fetching:** Automatically loads settings from database
- **State Management:** Manages loading states and errors
- **Update Functions:** `updateSetting()` and `updateMultipleSettings()`
- **Type Safety:** TypeScript interface for all settings

### **Usage Example**
```typescript
import { useGlobalSettings } from '@/hooks/useGlobalSettings';

const MyComponent = () => {
  const { settings, isLoading, updateSetting } = useGlobalSettings();
  
  if (isLoading) return <LoadingSpinner />;
  
  return (
    <div>
      <p>Email: {settings?.contact_email}</p>
      <p>Phone: {settings?.contact_phone}</p>
    </div>
  );
};
```

## 📍 Where Settings Appear

### **Public Pages**
- ✅ **Homepage Footer** - Contact info and company name
- ✅ **Privacy Policy** - Contact details for privacy inquiries
- ✅ **Terms & Conditions** - Contact information
- ✅ **Contact Page** - Primary contact details
- ✅ **About Page** - Company information

### **Partner Dashboard**
- ✅ **Support Page** - Support contact information
- ✅ **Help Documentation** - Contact details
- ✅ **Error Messages** - Support contact for issues
- ✅ **Notification Emails** - Company branding
- ✅ **Account Communications** - Professional contact info

### **Admin Dashboard**
- ✅ **Settings Page** - Management interface
- ✅ **System Messages** - Company branding
- ✅ **Partner Communications** - Professional contact info

## 🎛️ Superadmin Management

### **Settings Page Features**
- **Contact Information Section:**
  - Primary Email
  - Primary Phone
  - WhatsApp Number
  - Business Address
  - Support Email
  - Privacy Contact Email

- **Company Information Section:**
  - Company Name
  - Website URL

- **Usage Information:**
  - Shows where settings appear
  - Explains impact of changes
  - Provides guidance for updates

### **Management Features**
- **Real-time Updates:** Changes save immediately
- **Form Validation:** Ensures data integrity
- **Error Handling:** Graceful error management
- **Loading States:** User feedback during operations
- **Success Notifications:** Confirmation of changes

## 🔒 Security & Access Control

### **Row Level Security (RLS)**
- **Admin Access:** Only admins can modify settings
- **Public Read:** Everyone can read settings
- **Secure Updates:** All changes logged with timestamps

### **Data Protection**
- **Input Validation:** All inputs validated
- **SQL Injection Protection:** Parameterized queries
- **Access Control:** Role-based permissions

## 📱 User Experience

### **For Superadmins**
- **Easy Management:** Simple form interface
- **Clear Organization:** Settings grouped logically
- **Immediate Feedback:** Success/error notifications
- **Usage Guidance:** Clear explanation of where settings appear

### **For Users**
- **Consistent Information:** Same contact details everywhere
- **Accurate Details:** Always up-to-date information
- **Professional Experience:** Consistent branding
- **Easy Contact:** Multiple contact methods available

## 🚀 Implementation Details

### **Files Created/Modified**
- ✅ `supabase/migrations/create_global_settings.sql` - Database schema
- ✅ `src/hooks/useGlobalSettings.ts` - Core settings hook
- ✅ `src/pages/AdminSettings.tsx` - Management interface
- ✅ `src/components/Footer.tsx` - Dynamic footer
- ✅ `src/pages/PrivacyPolicy.tsx` - Dynamic contact info

### **Database Migration**
```sql
-- Run this in Supabase SQL Editor
-- Creates table, policies, indexes, and default data
-- Safe to run multiple times
```

### **Hook Features**
- **Automatic Loading:** Fetches settings on mount
- **Error Handling:** Graceful error management
- **Type Safety:** Full TypeScript support
- **Update Functions:** Single and batch updates
- **Loading States:** Proper loading indicators

## 🔮 Future Enhancements

### **Potential Additions**
- **Logo Management:** Upload and manage company logo
- **Social Media Links:** Facebook, Twitter, Instagram
- **Business Hours:** Operating hours display
- **Multiple Languages:** Localized contact information
- **Theme Settings:** Color scheme management

### **Advanced Features**
- **Setting Categories:** Group related settings
- **Setting History:** Track changes over time
- **Bulk Import/Export:** CSV settings management
- **Conditional Settings:** Different settings for different regions
- **API Endpoints:** External access to settings

## 📋 Setup Instructions

### **1. Database Setup**
```sql
-- Run the migration file in Supabase SQL Editor
-- This creates the table, policies, and default data
```

### **2. Update Components**
```typescript
// Import the hook in any component that needs settings
import { useGlobalSettings } from '@/hooks/useGlobalSettings';

// Use settings in your component
const { settings, isLoading } = useGlobalSettings();
```

### **3. Admin Access**
- Navigate to `/admin/settings`
- Update contact information as needed
- Changes appear immediately across the platform

## 🎯 Benefits Summary

### **Operational Benefits**
- **Reduced Maintenance:** Update once, changes everywhere
- **Consistency:** Same information across all pages
- **Accuracy:** No outdated contact information
- **Efficiency:** Faster updates and management

### **User Benefits**
- **Reliable Contact:** Always accurate contact information
- **Professional Experience:** Consistent branding
- **Easy Access:** Multiple ways to contact support
- **Trust Building:** Professional, well-maintained platform

The global settings system ensures that BomaBnB maintains professional, consistent contact information throughout the platform while providing easy management for administrators.
