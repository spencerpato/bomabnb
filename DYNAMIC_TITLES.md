# 🏷️ Dynamic Browser Tab Titles

## Overview
The BomaBnB application now features dynamic browser tab titles that change based on the user's role and current page, providing a personalized and contextual experience.

## 🎯 Implementation

### Core Hook: `useDynamicTitle`
Located at `src/hooks/useDynamicTitle.ts`, this custom hook:
- Fetches user profile and role information
- Determines partner business name
- Automatically sets page titles based on current route
- Provides utility functions for manual title management

### Integration
The hook is integrated in `src/App.tsx` through the `AppRoutes` component, ensuring titles update automatically on route changes.

## 📋 Title Behavior

### 🏠 **Public Pages (Not Logged In)**
**Default Title:** `"BomaBnB – Find Your Perfect Stay"`

**Pages:**
- Homepage (`/`)
- About (`/about`)
- Contact (`/contact`)
- Terms (`/terms`)
- Auth (`/auth`)
- Admin Login (`/admin-login`)
- Partner Register (`/partner-register`)

### 👤 **Partner Dashboard Pages**

#### **Dashboard (`/partner-dashboard`)**
- **With Business Name:** `"[Business Name] – [Partner Name] | BomaBnB Partner Dashboard"`
  - Example: `"Lakeview Apartments – John Mwangi | BomaBnB Partner Dashboard"`
- **Without Business Name:** `"[Partner Name] | BomaBnB Partner Dashboard"`
  - Example: `"John Mwangi | BomaBnB Partner Dashboard"`

#### **Other Partner Pages**
- **Profile (`/partner-profile`):** `"Edit Profile – [Business Name] – [Partner Name] | BomaBnB Partner Dashboard"`
- **Add Property (`/add-property`):** `"Add New Property – [Business Name] – [Partner Name] | BomaBnB Partner Dashboard"`
- **My Properties (`/partner-listings`):** `"My Properties – [Business Name] – [Partner Name] | BomaBnB Partner Dashboard"`
- **Bookings (`/partner-bookings`):** `"Bookings – [Business Name] | BomaBnB Partner Dashboard"`
- **Notifications (`/partner-notifications`):** `"Notifications – [Business Name] – [Partner Name] | BomaBnB Partner Dashboard"`
- **Settings (`/partner-settings`):** `"Settings – [Business Name] – [Partner Name] | BomaBnB Partner Dashboard"`
- **Support (`/partner-support`):** `"Support – [Business Name] – [Partner Name] | BomaBnB Partner Dashboard"`

### 🧑‍💼 **Superadmin Dashboard Pages**

#### **Main Dashboard (`/admin`)**
**Title:** `"Superadmin | BomaBnB Management Panel"`

#### **Section-Specific Pages**
- **Partners (`/admin/partners`):** `"Superadmin | Partners Approval – BomaBnB"`
- **Properties (`/admin/properties`):** `"Superadmin | Properties Management – BomaBnB"`
- **Bookings (`/admin/bookings`):** `"Superadmin | Bookings Management – BomaBnB"`
- **Featured Requests (`/admin/featured-requests`):** `"Superadmin | Featured Requests – BomaBnB"`
- **Maintenance (`/admin/maintenance`):** `"Superadmin | Maintenance Center – BomaBnB"`
- **Notifications (`/admin/notifications`):** `"Superadmin | Notifications Center – BomaBnB"`
- **Settings (`/admin/settings`):** `"Superadmin | Settings – BomaBnB"`

### 🏠 **Property Pages**
- **Property Details (`/property/:id`):** Uses default title
- **Feature Request (`/feature-request`): Uses default title
- **Edit Property (`/edit-property/:id`): Uses default title

## 🔧 **Technical Details**

### Data Sources
The hook fetches data from:
- `profiles` table: `full_name`
- `partners` table: `business_name`
- `user_roles` table: `role`

### Performance
- Data is fetched once on mount
- Titles update instantly on route changes
- No unnecessary re-renders

### Fallbacks
- If user data is loading: Uses default title
- If user has no business name: Omits business name from title
- If route is not recognized: Uses default title

## 🎨 **User Experience Benefits**

### **Brand Reinforcement**
- Partners see their business name prominently in the tab
- Reinforces their brand identity
- Professional appearance

### **Context Awareness**
- Users always know which section they're in
- Clear role identification
- Reduced confusion when switching tabs

### **Professional Touch**
- Subtle but powerful UX enhancement
- Shows attention to detail
- Improves overall platform perception

## 🚀 **Usage Examples**

### Manual Title Setting
```typescript
const { setPageTitle } = useDynamicTitle();

// Set custom title
setPageTitle("Custom Page Title");
```

### Getting Title Helpers
```typescript
const { getPartnerTitle, getSuperadminTitle } = useDynamicTitle();

// Generate partner title
const title = getPartnerTitle("Custom Page", true);

// Generate superadmin title
const adminTitle = getSuperadminTitle("Custom Section");
```

## 📱 **Browser Compatibility**
- Works in all modern browsers
- Updates immediately on route changes
- Maintains title during page refreshes
- SEO-friendly for search engines

The dynamic title system enhances the user experience by providing contextual, role-aware browser tab titles that reinforce brand identity and improve navigation clarity.
