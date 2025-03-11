
-- First drop the profiles table if it exists
DROP TABLE IF EXISTS bets;
DROP TABLE IF EXISTS game_results;
DROP TABLE IF EXISTS profiles;

-- Create profiles table with is_admin column
CREATE TABLE profiles (
    id UUID REFERENCES auth.users PRIMARY KEY,
    name TEXT,
    email TEXT UNIQUE,
    wallet_balance BIGINT DEFAULT 0,
    is_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create bets table
CREATE TABLE bets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id),
    game_id TEXT NOT NULL,
    round_number INTEGER NOT NULL,
    type TEXT NOT NULL,
    number TEXT,
    combination TEXT,
    amount BIGINT NOT NULL,
    win_rate NUMERIC,
    result TEXT,
    win_amount BIGINT,
    status TEXT DEFAULT 'Pending',
    played_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create game_results table
CREATE TABLE game_results (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    game_id TEXT NOT NULL,
    round_number INTEGER NOT NULL,
    result TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(game_id, round_number)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_results ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authentication service" ON profiles;
DROP POLICY IF EXISTS "Users can view own bets" ON bets;
DROP POLICY IF EXISTS "Users can create bets" ON bets;
DROP POLICY IF EXISTS "Anyone can view game results" ON game_results;

-- Create simplified policies for profiles
CREATE POLICY "Public profiles are viewable by everyone"
    ON profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Enable insert for authentication service"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Create simplified policies for bets
CREATE POLICY "Users can view own bets"
    ON bets FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can create own bets"
    ON bets FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Create simplified policies for game results
CREATE POLICY "Anyone can view game results"
    ON game_results FOR SELECT
    USING (true);

-- Set up functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updating timestamps
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Update wallet balance for specific user
UPDATE profiles 
SET wallet_balance = 500 
WHERE email = 'sealatun@gmail.com';
