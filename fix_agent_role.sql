-- Fix missing agent role in user_roles table
-- This will add the 'referrer' role to any agent account that's missing it

-- First, let's see which referrers are missing roles
SELECT 
    r.id as referrer_id,
    r.user_id,
    p.email,
    p.full_name,
    r.status,
    r.referral_code
FROM referrers r
JOIN profiles p ON r.user_id = p.id
LEFT JOIN user_roles ur ON r.user_id = ur.user_id AND ur.role = 'referrer'
WHERE ur.id IS NULL;

-- To fix: Insert the missing 'referrer' role for all agents
-- Run this to add the role to ALL agents who don't have it:
INSERT INTO user_roles (user_id, role)
SELECT r.user_id, 'referrer'::app_role
FROM referrers r
LEFT JOIN user_roles ur ON r.user_id = ur.user_id AND ur.role = 'referrer'
WHERE ur.id IS NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- Verify the fix
SELECT 
    p.email,
    p.full_name,
    ur.role,
    r.status
FROM user_roles ur
JOIN profiles p ON ur.user_id = p.id
JOIN referrers r ON ur.user_id = r.user_id
WHERE ur.role = 'referrer';
