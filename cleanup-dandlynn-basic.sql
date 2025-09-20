-- Clean dandlynn@yahoo.com from core tables only
DELETE FROM goals WHERE user_id = 'dandlynn@yahoo.com';
DELETE FROM subscribers WHERE user_id = 'dandlynn@yahoo.com' OR email = 'dandlynn@yahoo.com';
DELETE FROM profiles WHERE email = 'dandlynn@yahoo.com';