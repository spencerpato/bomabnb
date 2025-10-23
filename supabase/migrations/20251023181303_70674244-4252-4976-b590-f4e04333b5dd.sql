-- Grant admin role to superadmin account (patomaich611@gmail.com)
-- First, find the user ID and insert admin role
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Get the user ID for patomaich611@gmail.com
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'patomaich611@gmail.com'
  LIMIT 1;

  -- If user exists, grant admin role
  IF admin_user_id IS NOT NULL THEN
    -- Remove any existing role for this user (to avoid duplicates)
    DELETE FROM public.user_roles WHERE user_id = admin_user_id;
    
    -- Insert admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_user_id, 'admin');
    
    RAISE NOTICE 'Admin role granted to user: %', admin_user_id;
  ELSE
    RAISE NOTICE 'User patomaich611@gmail.com not found. Please create the user first.';
  END IF;
END $$;
