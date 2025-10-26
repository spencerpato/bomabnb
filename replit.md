# BomaBnB - Kenyan Homestay Marketplace

## Overview

BomaBnB is a platform connecting travelers with authentic, locally-owned accommodations across Kenya. The application enables property owners (Partners) to list their homestays, manage bookings, and interact with guests, while providing administrators with comprehensive management tools. The platform emphasizes Kenyan hospitality, featuring properties from Nairobi to Mombasa, Maasai Mara to Kisumu.

**Core Purpose**: Facilitate authentic travel experiences by connecting guests with verified Kenyan property owners through a user-friendly booking platform.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack**:
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6 with client-side routing
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **Styling**: Tailwind CSS with custom design tokens (Safari Gold #D4A017, Forest Green #2D5016, Red Clay #B6461E)
- **State Management**: React hooks + TanStack Query for server state
- **Form Handling**: React Hook Form with Zod validation

**Design System**:
- Mobile-first responsive design with breakpoints at 768px (tablet) and 1024px (desktop)
- Progressive Web App (PWA) capabilities with service worker for offline functionality
- Dynamic browser tab titles based on user role and current page
- Consistent color palette representing Kenyan aesthetics

**Key UI Patterns**:
- Role-based layouts: Public pages, Partner Dashboard with sidebar, SuperAdmin Dashboard with sidebar
- Responsive navigation with mobile hamburger menu
- Real-time search and filtering for property listings
- Image carousels with touch gesture support on mobile
- Toast notifications (Sonner) for user feedback

### Backend Architecture

**Database**: Supabase (PostgreSQL) with Row Level Security (RLS)

**Authentication & Authorization**:
- Supabase Auth for user management (email/password)
- Role-based access control via `user_roles` table (roles: 'partner', 'admin', 'referrer')
- RLS policies enforce data access boundaries
- Session-based authentication with automatic role checking on route access
- Role-based dashboard redirection: partners → Partner Dashboard, admins → Admin Dashboard, referrers → Agent Dashboard
- Enhanced login validation with comprehensive error handling:
  - Validates role existence in user_roles table
  - Cross-references with respective entity tables (referrers/partners)
  - Handles edge cases (missing records, database errors)
  - Status-based access control (active users only can access dashboards)
  - Clear user feedback for all login states (pending, suspended, rejected, invalid credentials)

**Data Model** (Core Tables):
- `profiles`: User profile information (full_name, email, phone, whatsapp_number, avatar_url)
- `partners`: Partner-specific data (business_name, location, status: pending/active/rejected/suspended, show_contacts_publicly)
- `referrers`: Agent/referrer data (referral_code, business_name, contact_phone, status: pending/active/suspended/rejected, commission_rate)
- `referrals`: Tracks partner referrals by agents (referrer_id, partner_id, status, referral_date)
- `commissions`: Agent commission records (referrer_id, partner_id, commission_amount, status, payment_date)
- `properties`: Property listings (property_name, type, location, price_per_night, amenities, is_featured, is_active)
- `bookings`: Booking requests (guest info, check_in/out dates, status, total_price)
- `feature_requests`: Partner requests to feature properties (duration_days, payment_method, status)
- `notifications`: User notifications (type, title, message, read status)
- `global_settings`: Platform-wide settings (contact_email, whatsapp_number, company_name, etc.)
- `user_roles`: Maps users to roles for access control

**Storage**:
- Supabase Storage buckets:
  - `property-images`: Public bucket for property photos
  - `avatars`: Partner/admin profile photos

**Business Logic**:
- Partner registration workflow: Submit → Pending → Admin Approval/Rejection → Active/Rejected status
  - WhatsApp notification: Partners can notify admin (+254 114097160) via WhatsApp after registration
- Agent/Referrer registration workflow: Submit → Pending (default) → Admin Approval/Rejection → Active/Rejected/Suspended status
  - Unique referral code generated automatically for each agent
  - WhatsApp notification: Agents can notify admin via WhatsApp after registration
  - Pending agents cannot access dashboard until approved
- Agent commission system: Agents refer partners using unique referral codes and earn commissions
  - Commission tracking: referrals table links agents to referred partners
  - Commission payouts: commissions table records earnings per agent per partner
- Property management: Partners create/edit properties, admins can feature/activate/deactivate
- Booking workflow: Guests submit booking → Partner receives notification → Guest can send WhatsApp message to owner
  - WhatsApp automation: After successful booking, guests can contact property owner via WhatsApp with pre-filled message
  - Fallback chain for owner contact: whatsapp_number → phone_number → property.contact_phone
- Feature requests: Partners request featured listings, admins approve with duration tracking
- Notification system: Automated notifications for bookings, approvals, rejections, feature approvals, agent approvals

### External Dependencies

**Core Services**:
- **Supabase**: Backend-as-a-Service providing PostgreSQL database, authentication, storage, and real-time subscriptions
  - Database hosting and management
  - Row Level Security for data access control
  - File storage with public/private bucket support
  - Email authentication (email confirmation disabled)

**Third-Party Integrations**:
- **Google Maps**: Property location links (google_maps_link field stores URLs)
- **WhatsApp Business**: 
  - Click-to-chat integration for guest-partner communication
  - Automated booking confirmation messages to property owners
  - Partner registration notifications to superadmin (+254 114097160)
  - Uses WhatsApp Web API (wa.me) with URL encoding for message pre-filling
- **Email Services**: Contact functionality (mailto: links for clickable email addresses)

**UI Libraries**:
- Radix UI: Accessible component primitives (Dialog, Dropdown, Select, etc.)
- Lucide React: Icon library
- Recharts: Data visualization for admin dashboard analytics
- Embla Carousel: Image carousel functionality
- date-fns: Date formatting and manipulation

**Development Tools**:
- Vite: Fast build tooling with hot module replacement
- Tailwind CSS: Utility-first styling
- TypeScript: Type safety across codebase
- ESLint: Code linting (strict mode disabled for flexibility)

**PWA Features**:
- Service Worker: Offline caching and asset management
- Manifest.json: App metadata for installability
- Favicon/Icons: Multiple sizes for cross-platform support (16x16 to 512x512)

**Key Architectural Decisions**:

1. **Supabase over custom backend**: Chose managed PostgreSQL with built-in auth and RLS to accelerate development while maintaining security
2. **Role-based UI rendering**: Single React app with conditional rendering based on user role rather than separate applications
3. **Public storage for property images**: Simplified image serving at the cost of exposing URLs (acceptable for public listings)
4. **Global settings system**: Centralized platform configuration (contact info, company name) in database for easy admin updates without code changes
5. **Notification table over email**: In-app notifications for immediate feedback; email integration planned but not critical path
6. **Client-side search/filter**: Real-time property filtering without server round-trips for better UX
7. **Separate WhatsApp field**: Independent WhatsApp number from phone number to accommodate different contact preferences