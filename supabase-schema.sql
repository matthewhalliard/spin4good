-- Create tables for Charity Slot application

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    selected_charity_id UUID,
    credits INTEGER DEFAULT 0 CHECK (credits >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Charities table
CREATE TABLE public.charities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    logo_url TEXT,
    approved BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Global state table (single row)
CREATE TABLE public.global_state (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- Ensures single row
    pot_total_cents INTEGER DEFAULT 0 CHECK (pot_total_cents >= 0),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Spins table
CREATE TABLE public.spins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    bet_amount INTEGER NOT NULL CHECK (bet_amount > 0),
    result_grid JSONB NOT NULL,
    won BOOLEAN NOT NULL DEFAULT false,
    pot_amount_won INTEGER DEFAULT 0 CHECK (pot_amount_won >= 0),
    charity_id UUID REFERENCES public.charities(id),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Donations table (tracks all charity donations)
CREATE TABLE public.donations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    charity_id UUID NOT NULL REFERENCES public.charities(id),
    amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Credit purchases table
CREATE TABLE public.credit_purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    stripe_payment_intent_id TEXT UNIQUE,
    credits_purchased INTEGER NOT NULL CHECK (credits_purchased > 0),
    amount_paid_cents INTEGER NOT NULL CHECK (amount_paid_cents > 0),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraint after tables are created
ALTER TABLE public.users 
    ADD CONSTRAINT fk_users_charity 
    FOREIGN KEY (selected_charity_id) 
    REFERENCES public.charities(id);

-- Create indexes for better performance
CREATE INDEX idx_spins_user_id ON public.spins(user_id);
CREATE INDEX idx_spins_timestamp ON public.spins(timestamp DESC);
CREATE INDEX idx_donations_user_id ON public.donations(user_id);
CREATE INDEX idx_donations_charity_id ON public.donations(charity_id);
CREATE INDEX idx_credit_purchases_user_id ON public.credit_purchases(user_id);
CREATE INDEX idx_credit_purchases_stripe_id ON public.credit_purchases(stripe_payment_intent_id);

-- Initialize global state
INSERT INTO public.global_state (pot_total_cents) VALUES (0);

-- Create update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for users table
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for global_state table
CREATE TRIGGER update_global_state_updated_at BEFORE UPDATE ON public.global_state
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.charities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_purchases ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable insert for authenticated users only" ON public.users
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = id);

-- Charities table policies (public read, admin write)
CREATE POLICY "Anyone can view approved charities" ON public.charities
    FOR SELECT USING (approved = true);

CREATE POLICY "Service role can manage charities" ON public.charities
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- Global state policies (public read, service role write)
CREATE POLICY "Anyone can view global state" ON public.global_state
    FOR SELECT USING (true);

CREATE POLICY "Service role can update global state" ON public.global_state
    FOR UPDATE TO service_role
    USING (true)
    WITH CHECK (true);

-- Spins table policies
CREATE POLICY "Users can view their own spins" ON public.spins
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert spins" ON public.spins
    FOR INSERT TO service_role
    WITH CHECK (true);

CREATE POLICY "Anyone can view recent winning spins" ON public.spins
    FOR SELECT USING (won = true AND timestamp > NOW() - INTERVAL '24 hours');

-- Donations table policies
CREATE POLICY "Users can view their own donations" ON public.donations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert donations" ON public.donations
    FOR INSERT TO service_role
    WITH CHECK (true);

CREATE POLICY "Anyone can view recent donations" ON public.donations
    FOR SELECT USING (timestamp > NOW() - INTERVAL '24 hours');

-- Credit purchases table policies
CREATE POLICY "Users can view their own purchases" ON public.credit_purchases
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage credit purchases" ON public.credit_purchases
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- Insert some sample charities
INSERT INTO public.charities (name, description, logo_url, approved) VALUES
    ('Ocean Conservation Alliance', 'Protecting marine ecosystems worldwide', '/charities/ocean.jpg', true),
    ('Rainforest Trust', 'Preserving rainforests and endangered species', '/charities/rainforest.jpg', true),
    ('Clean Water Project', 'Bringing clean water to communities in need', '/charities/water.jpg', true),
    ('Gaza Medical Relief', 'Emergency medical aid for Gaza', '/charities/medical.jpg', true),
    ('World Wildlife Fund', 'Conservation of nature and endangered species', '/charities/wwf.jpg', true),
    ('Red Cross', 'Humanitarian aid in times of crisis', '/charities/redcross.jpg', true);

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, credits)
    VALUES (NEW.id, NEW.email, 20); -- Give 20 free credits to start
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user(); 