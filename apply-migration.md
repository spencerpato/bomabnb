# Apply RLS Migration to Supabase

## How to Apply This Migration

Since your project uses Supabase (not the local Neon database), you need to apply the migration in your Supabase dashboard:

### Option 1: Supabase SQL Editor (Recommended)

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your BomaBnB project
3. Click on **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy the entire contents of `supabase/migrations/20251026_fix_rls_policies.sql`
6. Paste it into the SQL Editor
7. Click **Run** (or press Ctrl+Enter)
8. Wait for the success message

### Option 2: Supabase CLI (If installed)

```bash
supabase db push
```

### What This Migration Does

1. **Fixes user_roles table RLS** - Allows users to insert their own role during registration
2. **Fixes profiles table RLS** - Allows admins to view all profiles
3. **Fixes referrers table RLS** - Allows users to create agent records and admins to view all agents
4. **Fixes referrals table RLS** - Allows agents to view their referrals
5. **Fixes commissions table RLS** - Allows agents to view their earnings

### After Migration

- Agent registration will work without RLS errors
- Admin dashboard will properly load agent details
- Agents can view their own data
- Admins can manage all agents

---

**⚠️ IMPORTANT:** You must apply this migration before testing agent registration!
