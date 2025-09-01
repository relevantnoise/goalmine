-- Delete 12 older goals for danlynn@gmail.com, keeping only the most recent "run" goal
-- This enforces the 1-goal limit for free users

UPDATE goals 
SET is_active = false, updated_at = now()
WHERE user_id = 'user_31f9tE6saTzzJcASXhW1gdIFOUj' 
AND id IN (
  'feffcc98-e9cf-4317-95fb-3748754927d1', -- one last test - I hope
  '71186a9e-e8e7-4bb9-9b53-adc39779ca39', -- test
  '29332676-f313-4de9-b47c-8dbf14585cc1', -- Please
  '6a122747-87f1-4d68-a3d0-a79ece789aa8', -- Run a marathon
  'b6f8ef4f-2719-455d-b080-bc0e2b11a3e3', -- testing
  'c81bb4c4-59ca-405a-a0d5-dd79c4874d1d', -- test
  '03dd58ad-6e77-4d40-bb62-3246c9aeb51f', -- Another goal
  '10125cc4-59cb-4c97-ba43-37b3d5c8860e', -- test again and again
  'aca82f86-9b79-4df9-8adf-f7aefdb64092', -- testy tester
  'e4bf095e-dae7-4134-9b02-69edac531f26', -- tester
  '727b1a2b-4c24-45bd-924c-64deb2bc3527', -- Test again
  'e502ce05-a5c6-4f61-9d47-97a4a786e81f'  -- test
);