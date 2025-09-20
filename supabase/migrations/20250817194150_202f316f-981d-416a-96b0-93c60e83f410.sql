-- Enable the http extension for network calls
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

-- Also enable pg_net extension if available
CREATE EXTENSION IF NOT EXISTS pg_net;