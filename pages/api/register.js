
import { supabase } from "../../src/lib/supabase";

export default async function handler(req, res) {
    if (req.method === "POST") {
        const { email, password, name } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        try {
            // Create auth user
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
            });

            if (authError) {
                return res.status(400).json({ error: authError.message });
            }

            // Create profile record
            const { error: profileError } = await supabase
                .from('profiles')
                .insert([
                    {
                        id: authData.user.id,
                        name,
                        email,
                        wallet_balance: 0
                    }
                ]);

            if (profileError) {
                console.error('Error creating profile:', profileError);
                return res.status(500).json({ error: "Error creating user profile" });
            }

            res.status(201).json({ message: "User registered successfully!" });
        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({ error: "Server error" });
        }
    } else {
        res.status(405).json({ error: "Method not allowed" });
    }
}
