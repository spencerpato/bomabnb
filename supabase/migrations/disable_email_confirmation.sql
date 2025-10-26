-- Disable email confirmation for new signups
-- This allows partners to register without email verification

-- Note: You also need to disable email confirmation in Supabase Dashboard:
-- Go to: Authentication > Settings > Email Auth
-- Turn OFF "Enable email confirmations"

-- This script ensures users are auto-confirmed on signup
CREATE OR REPLACE FUNCTION public.auto_confirm_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Auto-confirm the user
  NEW.email_confirmed_at = NOW();
  NEW.confirmed_at = NOW();
  RETURN NEW;
END;
$$;

-- Create trigger to auto-confirm users on signup
DROP TRIGGER IF EXISTS on_auth_user_auto_confirm ON auth.users;
CREATE TRIGGER on_auth_user_auto_confirm
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_confirm_user();
