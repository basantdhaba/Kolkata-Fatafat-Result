
-- First, drop all existing policies to start fresh
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authentication service" ON profiles;
DROP POLICY IF EXISTS "Users can view own bets" ON bets;
DROP POLICY IF EXISTS "Users can create own bets" ON bets;
DROP POLICY IF EXISTS "Anyone can view game results" ON game_results;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Create a function to check if a user is an admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE id = auth.uid() 
    AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles table policies
CREATE POLICY "Users can insert their own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view their own profile"
    ON profiles FOR SELECT
    USING (
        id = auth.uid() OR
        is_admin() OR
        auth.role() = 'service_role'
    );

CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id OR is_admin())
    WITH CHECK (auth.uid() = id OR is_admin());

-- Bets table policies
CREATE POLICY "Users can view their own bets"
    ON bets FOR SELECT
    USING (
        user_id = auth.uid() OR
        is_admin() OR
        auth.role() = 'service_role'
    );

CREATE POLICY "Users can create their own bets"
    ON bets FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admin can update bets"
    ON bets FOR UPDATE
    USING (is_admin() OR auth.role() = 'service_role');

-- Game results policies
CREATE POLICY "Anyone can view game results"
    ON game_results FOR SELECT
    USING (true);

CREATE POLICY "Only admins can manage game results"
    ON game_results FOR ALL
    USING (is_admin() OR auth.role() = 'service_role');

-- Function for auto-creating profiles
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, wallet_balance, is_admin)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', new.email),
    new.email,
    0,
    CASE 
      WHEN new.email = 'bazi.coin.bazar@gmail.com' THEN true
      ELSE false
    END
  );
  RETURN new;
END;
$$ language plpgsql security definer;

-- Trigger for auto-creating profiles
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update specific user's wallet balance
DO $$ 
BEGIN 
  UPDATE profiles 
  SET wallet_balance = 500 
  WHERE email = 'sealatun@gmail.com';
END $$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
