# Superadmin Dashboard Setup Instructions

## 🚀 Quick Setup

### 1. Database Migration

Run this SQL in your Supabase Dashboard:

```sql
-- Add is_featured column to properties table
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT FALSE;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_properties_is_featured ON public.properties(is_featured);

-- Add comment
COMMENT ON COLUMN public.properties.is_featured IS 'Indicates if the property is currently featured on the homepage';
```

### 2. Verify Admin User

Ensure your admin user exists in the database:

```sql
-- Check if admin role exists
SELECT * FROM user_roles WHERE role = 'admin';

-- If not exists, create admin role (replace USER_ID with your actual user ID)
INSERT INTO user_roles (user_id, role) 
VALUES ('YOUR_USER_ID', 'admin');
```

### 3. Access the Dashboard

1. Navigate to the homepage
2. Scroll to the footer
3. Click the ❤️ icon
4. Login with:
   - Email: patomaich611@gmail.com
   - Password: Patrick3663

### 4. Test Features

- ✅ Dashboard Overview loads with metrics
- ✅ Charts display correctly
- ✅ Partners page shows all partners
- ✅ Properties page shows all listings
- ✅ Bookings page shows all bookings
- ✅ Featured Requests page works
- ✅ Maintenance page accessible
- ✅ Notifications can be sent
- ✅ Settings page loads

## 📋 Features Checklist

- [x] Dashboard Overview with metrics
- [x] Visual charts (bookings, distribution, growth)
- [x] Partners Management (CRUD operations)
- [x] Properties Management (feature/unfeature)
- [x] Bookings Management
- [x] Featured Requests approval
- [x] Maintenance Center
- [x] Notifications Center
- [x] Settings page
- [x] Responsive design
- [x] Persistent sidebar
- [x] Mobile hamburger menu

## 🎨 Design Verification

The dashboard uses the existing BomaBnB color scheme:
- Safari Gold (Primary)
- Forest Green (Secondary)
- Red Clay (Accent)
- Off White (Background)

## 🔐 Security Notes

- All routes require admin authentication
- Role-based access control implemented
- Protected API endpoints
- Secure session management

## 📊 Data Flow

1. Admin logs in via `/admin-login`
2. Redirected to `/admin` dashboard
3. Sidebar navigation to different sections
4. Each section fetches its own data
5. Actions update database via Supabase
6. Real-time updates via Supabase subscriptions

## 🐛 Common Issues

### Issue: Can't see charts
**Solution**: Install recharts if not already installed:
```bash
npm install recharts
```

### Issue: Properties not showing as featured
**Solution**: Run the database migration above

### Issue: Notifications not sending
**Solution**: Verify `partner_notifications` table exists and has proper RLS policies

### Issue: Can't approve partners
**Solution**: Verify admin role is assigned in `user_roles` table

## 📞 Support

If you encounter any issues:
1. Check browser console for errors
2. Verify Supabase connection
3. Check database migrations
4. Contact: patomaich611@gmail.com

