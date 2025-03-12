const express = require('express');
const { Pool } = require('pg');
const admin = require('firebase-admin'); // Firebase Admin SDK for Authentication
require('dotenv').config();

// Initialize Firebase Admin with service account credentials
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'), // Important to replace newlines correctly
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  }),
});

const { auth } = admin;

// Initialize the database pool connection
const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
});

// Query function to interact with the database
const query = (text, params) => {
  return pool.query(text, params);
};

// Initialize Express app
const app = express();
app.use(express.json()); // Middleware to parse JSON bodies

// Middleware to verify Firebase Authentication
const verifyIdToken = async (req, res, next) => {
  const idToken = req.headers.authorization?.split('Bearer ')[1];

  if (!idToken) {
    return res.status(401).json({ error: 'Authorization token required' });
  }

  try {
    const decodedToken = await auth().verifyIdToken(idToken);
    req.user = decodedToken; // Attach the decoded user to the request object
    next(); // Pass to the next middleware or route handler
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

// Store game data (with Firebase Authentication user verification)
app.post('/store-game-data', verifyIdToken, async (req, res) => {
  const { game_data } = req.body;
  const user_id = req.user.uid; // Get UID from decoded token (Firebase Auth)

  // Example query to insert game data
  try {
    const text = 'INSERT INTO game_history(user_id, game_data) VALUES($1, $2)';
    const values = [user_id, game_data];
    
    await query(text, values);

    res.status(200).json({ success: true, message: 'Game data stored successfully!' });
  } catch (error) {
    console.error('Error storing game data:', error);
    res.status(500).json({ error: 'Error storing game data' });
  }
});

// Fetch game history for the authenticated user
app.get('/game-history', verifyIdToken, async (req, res) => {
  const user_id = req.user.uid; // Get UID from Firebase token

  try {
    const text = 'SELECT * FROM game_history WHERE user_id = $1 ORDER BY created_at DESC';
    const values = [user_id];

    const result = await query(text, values);
    res.status(200).json(result.rows); // Return the game history as a response
  } catch (error) {
    console.error('Error fetching game history:', error);
    res.status(500).json({ error: 'Error fetching game history' });
  }
});

// Store user wallet data (with Firebase Authentication user verification)
app.post('/store-wallet-data', verifyIdToken, async (req, res) => {
  const { wallet_data } = req.body;
  const user_id = req.user.uid; // Get UID from decoded token (Firebase Auth)

  // Example query to insert wallet data
  try {
    const text = 'INSERT INTO user_wallet(user_id, wallet_data) VALUES($1, $2)';
    const values = [user_id, wallet_data];
    
    await query(text, values);

    res.status(200).json({ success: true, message: 'Wallet data stored successfully!' });
  } catch (error) {
    console.error('Error storing wallet data:', error);
    res.status(500).json({ error: 'Error storing wallet data' });
  }
});

// Fetch user wallet data for the authenticated user
app.get('/wallet-data', verifyIdToken, async (req, res) => {
  const user_id = req.user.uid; // Get UID from Firebase token

  try {
    const text = 'SELECT * FROM user_wallet WHERE user_id = $1 ORDER BY created_at DESC';
    const values = [user_id];

    const result = await query(text, values);
    res.status(200).json(result.rows); // Return the wallet data as a response
  } catch (error) {
    console.error('Error fetching wallet data:', error);
    res.status(500).json({ error: 'Error fetching wallet data' });
  }
});

// Check Firebase connection
app.get('/check-firebase', async (req, res) => {
  try {
    const userRecord = await auth.getUserByEmail('test@example.com');
    res.status(200).json({ success: true, message: 'Firebase is connected', user: userRecord });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Firebase is not connected', error: error.message });
  }
});

// Check Neon (Postgres) connection
app.get('/check-database', async (req, res) => {
  try {
    const result = await query('SELECT NOW()');
    res.status(200).json({ success: true, message: 'Database is connected', time: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Database is not connected', error: error.message });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
