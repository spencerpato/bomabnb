# BomaBnB Superadmin Dashboard

## 🎯 Overview

The Superadmin Dashboard is a comprehensive management system for BomaBnB platform administrators. It provides complete control over partners, properties, bookings, and platform settings.

## 🔐 Access

### Login Credentials
- **URL**: Click the ❤️ icon in the homepage footer
- **Username**: patomaich611@gmail.com
- **Password**: Patrick3663

## 📋 Features

### 🏠 Dashboard Overview
- **Real-time Metrics**: Total partners, properties, bookings, revenue
- **Visual Analytics**: Charts showing bookings, partner distribution, and platform growth
- **Quick Access**: Shortcuts to frequently used actions
- **Pending Alerts**: Notifications for items requiring approval

### 👥 Partners Management (`/admin/partners`)
- View all registered partners
- Approve/reject pending partner applications
- Suspend active partners
- View partner profiles with contact information
- Delete partner accounts
- Search functionality by name, email, or location

### 🏘️ Properties Management (`/admin/properties`)
- View all property listings
- Feature/unfeature properties
- Activate/deactivate properties
- View property details
- Delete properties
- Search by property name, location, or owner

### 📅 Bookings Management (`/admin/bookings`)
- View all platform bookings
- Track booking status (confirmed, pending, cancelled)
- View guest information
- Monitor booking dates and pricing
- Search by guest name, email, or property

### ⭐ Featured Requests (`/admin/featured-requests`)
- Review partner feature requests
- Approve/decline feature submissions
- View payment method and duration
- Contact partners directly
- Manage featured property status

### ⚙️ Maintenance Center (`/admin/maintenance`)
- Enable/disable maintenance mode
- View system status and health
- Monitor database, storage, and API status
- View system logs
- Check platform version and uptime

### 📢 Notifications Center (`/admin/notifications`)
- Send messages to all partners
- Target specific partner groups (active, pending)
- Create different message types:
  - General Updates
  - Promotional Messages
  - Warning/Maintenance Notices
  - System Messages

### 🛠️ Settings (`/admin/settings`)
- Manage contact information (WhatsApp, phone, email)
- Update homepage content and tagline
- Configure branding colors
- Platform-wide configuration

## 🎨 Design Features

### Color Theme
- **Primary**: Safari Gold
- **Secondary**: Forest Green
- **Accent**: Red Clay
- **Background**: Off White

### Layout
- **Persistent Sidebar**: Always visible on desktop
- **Collapsible Mobile Menu**: Hamburger menu on mobile devices
- **Responsive Design**: Works on all screen sizes
- **Clean Interface**: Professional dashboard aesthetic

## 📊 Dashboard Analytics

### Charts Included
1. **Bookings Overview**: Bar chart showing daily bookings (last 7 days)
2. **Partner Distribution**: Pie chart showing partners by location (top 5)
3. **Platform Growth**: Line chart showing property additions over time (last 6 months)

### Metrics Displayed
- Total Partners
- Total Properties
- Total Bookings
- Revenue Generated
- Featured Listings
- Pending Approvals
- System Alerts
- Platform Growth

## 🚀 Quick Start Guide

### First Time Setup

1. **Run Database Migration**
   ```sql
   -- Add is_featured column to properties table
   ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT FALSE;
   CREATE INDEX IF NOT EXISTS idx_properties_is_featured ON public.properties(is_featured);
   ```

2. **Access Admin Dashboard**
   - Navigate to homepage
   - Click the ❤️ icon in the footer
   - Login with credentials above

3. **Start Managing**
   - Approve pending partners
   - Review new properties
   - Monitor bookings
   - Send notifications

## 🔧 Technical Details

### Technologies Used
- **React**: Frontend framework
- **TypeScript**: Type safety
- **Supabase**: Backend and database
- **Recharts**: Data visualization
- **Tailwind CSS**: Styling
- **Shadcn/ui**: UI components

### Database Tables Used
- `partners` - Partner information
- `properties` - Property listings
- `bookings` - Booking records
- `feature_requests` - Feature requests
- `partner_notifications` - Notifications
- `profiles` - User profiles
- `user_roles` - Role management

### Component Structure
```
src/
├── components/
│   ├── SuperAdminLayout.tsx      # Main layout wrapper
│   └── SuperAdminSidebar.tsx     # Navigation sidebar
└── pages/
    ├── Admin.tsx                 # Dashboard overview
    ├── AdminPartners.tsx         # Partners management
    ├── AdminProperties.tsx       # Properties management
    ├── AdminBookings.tsx         # Bookings management
    ├── AdminFeaturedRequests.tsx # Feature requests
    ├── AdminMaintenance.tsx      # Maintenance center
    ├── AdminNotifications.tsx     # Notifications center
    └── AdminSettings.tsx         # Settings page
```

## 📱 Responsive Design

The dashboard is fully responsive:
- **Desktop**: Sidebar always visible
- **Tablet**: Sidebar collapses to hamburger menu
- **Mobile**: Full-screen mobile menu

## 🔒 Security

- All routes require admin authentication
- Role-based access control
- Secure session management
- Protected API endpoints

## 🎯 Common Tasks

### Approving a Partner
1. Navigate to Partners Management
2. Find pending partner
3. Click "Approve" button
4. Partner status changes to "Active"

### Featuring a Property
1. Navigate to Properties Management
2. Find property to feature
3. Click star icon or use "Feature" button
4. Property appears featured on homepage

### Sending a Notification
1. Navigate to Notifications Center
2. Select message type
3. Choose recipients
4. Enter title and message
5. Click "Send Notification"

### Enabling Maintenance Mode
1. Navigate to Maintenance Center
2. Toggle "Enable Maintenance Mode"
3. Users see maintenance message
4. Disable when done

## 📝 Notes

- All timestamps are in UTC
- Date formatting uses browser locale
- Charts update dynamically based on data
- Search is case-insensitive
- All confirmations require explicit action

## 🐛 Troubleshooting

### Can't Login
- Verify credentials are correct
- Check if admin role is assigned in database
- Clear browser cache and cookies

### Charts Not Showing
- Ensure recharts is installed: `npm install recharts`
- Check browser console for errors
- Verify data exists in database

### Features Not Working
- Check Supabase connection
- Verify RLS policies allow admin access
- Review browser console for errors

## 📞 Support

For issues or questions:
- **Email**: patomaich611@gmail.com
- **Phone**: +254 703 998 717

