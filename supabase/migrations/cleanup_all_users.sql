-- ============================================================
-- FULL USER CLEANUP SCRIPT
-- Run this in Supabase Dashboard > SQL Editor
-- This deletes ALL users from auth, profiles, and user_roles
-- ============================================================

-- Step 1: Delete all role assignments
DELETE FROM public.user_roles;

-- Step 2: Delete all user profiles
DELETE FROM public.profiles;

-- Step 3: Delete all auth users (requires service role / admin access)
DELETE FROM auth.users;

-- Verify cleanup
SELECT 'auth.users remaining:' AS check, COUNT(*) FROM auth.users
UNION ALL
SELECT 'profiles remaining:', COUNT(*) FROM public.profiles
UNION ALL
SELECT 'user_roles remaining:', COUNT(*) FROM public.user_roles;
