-- Make description field optional in properties table
ALTER TABLE public.properties 
ALTER COLUMN description DROP NOT NULL;
