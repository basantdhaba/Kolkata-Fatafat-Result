
-- First, drop existing policies
DROP POLICY IF EXISTS "Admins can manage games" ON games;

-- Create a more efficient admin check function
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

-- Create separate policies for different operations
CREATE POLICY "Admins can view games"
    ON games FOR SELECT
    TO authenticated
    USING (true);  -- Allow all authenticated users to view games

CREATE POLICY "Admins can insert games"
    ON games FOR INSERT
    TO authenticated
    WITH CHECK (is_admin());

CREATE POLICY "Admins can update games"
    ON games FOR UPDATE
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

CREATE POLICY "Admins can delete games"
    ON games FOR DELETE
    TO authenticated
    USING (is_admin());
