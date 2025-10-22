-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'partner', 'user');

-- Create enum for partner status
CREATE TYPE public.partner_status AS ENUM ('pending', 'active', 'rejected', 'suspended');

-- Create enum for property types
CREATE TYPE public.property_type AS ENUM ('apartment', 'cottage', 'villa', 'guesthouse', 'hostel', 'other');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone_number TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Create partners table
CREATE TABLE public.partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  business_name TEXT,
  id_passport_number TEXT,
  location TEXT NOT NULL,
  about TEXT,
  status partner_status NOT NULL DEFAULT 'pending',
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create properties table
CREATE TABLE public.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  property_name TEXT NOT NULL,
  property_type property_type NOT NULL,
  location TEXT NOT NULL,
  google_maps_link TEXT,
  description TEXT NOT NULL,
  price_per_night DECIMAL(10,2) NOT NULL,
  number_of_units INTEGER NOT NULL DEFAULT 1,
  max_guests_per_unit INTEGER NOT NULL,
  amenities TEXT[] DEFAULT '{}',
  featured_image TEXT NOT NULL,
  contact_phone TEXT,
  contact_email TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  terms_policies TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create property_images table
CREATE TABLE public.property_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create bookings table
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  guest_name TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  guest_phone TEXT NOT NULL,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  number_of_guests INTEGER NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS Policies for profiles
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Roles are viewable by the user themselves"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can insert roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update roles"
  ON public.user_roles FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for partners
CREATE POLICY "Partners are viewable by everyone"
  ON public.partners FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert partner applications"
  ON public.partners FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Partners can update their own data"
  ON public.partners FOR UPDATE
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- RLS Policies for properties
CREATE POLICY "Active properties are viewable by everyone"
  ON public.properties FOR SELECT
  USING (is_active = true OR EXISTS (
    SELECT 1 FROM public.partners
    WHERE partners.id = properties.partner_id
    AND partners.user_id = auth.uid()
  ) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Partners can insert their own properties"
  ON public.properties FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.partners
    WHERE partners.id = partner_id
    AND partners.user_id = auth.uid()
    AND partners.status = 'active'
  ));

CREATE POLICY "Partners can update their own properties"
  ON public.properties FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.partners
    WHERE partners.id = properties.partner_id
    AND partners.user_id = auth.uid()
  ) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Partners can delete their own properties"
  ON public.properties FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.partners
    WHERE partners.id = properties.partner_id
    AND partners.user_id = auth.uid()
  ) OR public.has_role(auth.uid(), 'admin'));

-- RLS Policies for property_images
CREATE POLICY "Property images are viewable by everyone"
  ON public.property_images FOR SELECT
  USING (true);

CREATE POLICY "Partners can manage their property images"
  ON public.property_images FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.properties
    JOIN public.partners ON properties.partner_id = partners.id
    WHERE properties.id = property_images.property_id
    AND partners.user_id = auth.uid()
  ) OR public.has_role(auth.uid(), 'admin'));

-- RLS Policies for bookings
CREATE POLICY "Partners can view bookings for their properties"
  ON public.bookings FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.properties
    JOIN public.partners ON properties.partner_id = partners.id
    WHERE properties.id = bookings.property_id
    AND partners.user_id = auth.uid()
  ) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can create bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Partners can update bookings for their properties"
  ON public.bookings FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.properties
    JOIN public.partners ON properties.partner_id = partners.id
    WHERE properties.id = bookings.property_id
    AND partners.user_id = auth.uid()
  ) OR public.has_role(auth.uid(), 'admin'));

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_partners_updated_at
  BEFORE UPDATE ON public.partners
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone_number)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone_number', '')
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();