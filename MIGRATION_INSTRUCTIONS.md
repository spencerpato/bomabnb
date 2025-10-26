# Rating & Review System - Database Migration Instructions

## Overview
A comprehensive rating and review system has been added to BomaBnB. To enable this feature, you need to apply the database migration to your Supabase database.

## Migration File Location
The migration SQL file is located at:
```
supabase/migrations/create_ratings_reviews_system.sql
```

## How to Apply the Migration

### Option 1: Using Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Open the file `supabase/migrations/create_ratings_reviews_system.sql`
5. Copy the entire contents
6. Paste into the Supabase SQL Editor
7. Click **Run** to execute the migration

### Option 2: Using Supabase CLI
If you have the Supabase CLI installed:
```bash
supabase db push
```

## What the Migration Creates

### Tables
1. **property_reviews** - Stores user ratings and reviews
   - Supports ratings from 1-5 stars
   - Optional review text
   - Device fingerprinting to prevent duplicate reviews
   - Approval system for moderation

2. **review_replies** - Partner responses to reviews
   - Partners can reply to reviews on their properties

3. **review_reports** - User-reported inappropriate reviews
   - Flagging system for offensive content
   - Admin moderation workflow

4. **property_ratings_summary** (Materialized View)
   - Cached rating statistics for performance
   - Auto-refreshes when reviews change

### Features Enabled
- ⭐ Star ratings (1-5) on property pages
- 💬 Written reviews with reviewer name
- 🔒 Duplicate prevention (logged-in users and anonymous via device fingerprint)
- ✅ Admin approval/moderation system
- 💬 Partner replies to reviews
- 🚩 Report inappropriate reviews
- 📊 Rating breakdowns and statistics
- 📱 Mobile-responsive design

## Verification
After running the migration, verify it worked by:
1. Go to your Supabase dashboard
2. Click on **Table Editor**
3. You should see these new tables:
   - `property_reviews`
   - `review_replies`
   - `review_reports`
   - `property_ratings_summary` (in Views)

## Testing the System
1. Visit any property page on your site
2. Scroll down to the "Ratings & Reviews" section
3. Click "Leave a Review"
4. Submit a test review
5. Check the Admin Dashboard → Reviews to see the review

## Troubleshooting

### Issue: "Table not found" error
- **Solution**: Make sure you've run the migration SQL in Supabase SQL Editor

### Issue: Reviews not showing up
- **Solution**: Check that `is_approved` is set to `true` for the review in the database

### Issue: Can't submit review
- **Solution**: 
  1. Check browser console for errors
  2. Verify the migration was applied successfully
  3. Ensure your Supabase API keys are correct

## Features Overview

### For Visitors/Users
- Rate any property from 1-5 stars
- Leave optional written feedback
- View average ratings and review breakdown
- Sort and filter reviews

### For Property Partners
- View all reviews for their properties
- Reply to reviews
- See aggregate statistics
- Access from Partner Dashboard → View Reviews button

### For Administrators
- Moderate all reviews (approve/reject)
- Delete inappropriate content
- Manage reported reviews
- View system-wide statistics
- Access from Admin Dashboard → Reviews

## Mobile Responsive
All review components are fully mobile-responsive:
- Stacked layout on phones
- Centered stars and ratings
- Touch-friendly buttons
- Responsive forms

## Performance
- Materialized views for fast rating queries
- Real-time updates via Supabase subscriptions
- Cached rating summaries
- Efficient database indexes

## Support
If you encounter any issues:
1. Check the browser console for errors
2. Verify all migration tables were created
3. Ensure Supabase permissions are correctly set
4. Contact support if needed

---
**Migration Created:** October 24, 2025
**System:** BomaBnB Rating & Review System
