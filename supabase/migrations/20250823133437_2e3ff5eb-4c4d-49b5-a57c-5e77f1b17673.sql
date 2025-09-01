-- Create the missing profile for danlynn@gmail.com
INSERT INTO public.profiles (id, email, created_at, updated_at)
VALUES ('user_31f9tE6saTzzJcASXhW1gdIFOUj', 'danlynn@gmail.com', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  updated_at = EXCLUDED.updated_at;