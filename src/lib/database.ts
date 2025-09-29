import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'predictio.db');
const db = new Database(dbPath);

// Initialize database tables immediately
function initDatabase() {
  // Users table - create with is_admin column
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      is_admin BOOLEAN DEFAULT FALSE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Add is_admin column if it doesn't exist (for existing databases)
  try {
    db.exec(`ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE`);
    console.log('Added is_admin column to users table');
  } catch {
    // Column already exists, that's fine
  }

  // Matches are now stored in JSON file, not database

  // Predictions table (match_id references JSON file matches)
  db.exec(`
    CREATE TABLE IF NOT EXISTS predictions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      match_id TEXT NOT NULL,
      prediction TEXT NOT NULL, -- '1', 'X', '2'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id),
      UNIQUE(user_id, match_id)
    )
  `);

  // Reactions table for reactions on predictions
  db.exec(`
    CREATE TABLE IF NOT EXISTS reactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      target_user_id INTEGER NOT NULL,
      match_id TEXT NOT NULL,
      reaction TEXT NOT NULL, -- 'like', 'dislike', 'laugh', 'wow', 'love', 'angry'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (target_user_id) REFERENCES users (id),
      UNIQUE(user_id, target_user_id, match_id)
    )
  `);

  // Player boosts table - each player can choose one match to boost
  db.exec(`
    CREATE TABLE IF NOT EXISTS player_boosts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      match_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id),
      UNIQUE(user_id)
    )
  `);

  console.log('Database initialized');
}

// Initialize database on module load
initDatabase();

// User operations
export const createUser = db.prepare(`
  INSERT INTO users (name, is_admin) VALUES (?, ?)
`);

export const getUserByName = db.prepare(`
  SELECT * FROM users WHERE name = ?
`);

export const getAllUsers = db.prepare(`
  SELECT * FROM users ORDER BY created_at
`);

// Clear all predictions (when needed)
export const clearAllPredictions = db.prepare(`
  DELETE FROM predictions
`);

// Prediction operations
export const insertPrediction = db.prepare(`
  INSERT INTO predictions (user_id, match_id, prediction)
  VALUES (?, ?, ?)
`);

// Check if user already has a prediction for a match
export const getUserPrediction = db.prepare(`
  SELECT * FROM predictions WHERE user_id = ? AND match_id = ?
`);

export const getAllPredictions = db.prepare(`
  SELECT p.*, u.name as user_name
  FROM predictions p
  JOIN users u ON p.user_id = u.id
`);

export const getPredictionsByUser = db.prepare(`
  SELECT p.*
  FROM predictions p
  WHERE p.user_id = ?
`);

// Admin operations
export const makeUserAdmin = db.prepare(`
  UPDATE users SET is_admin = 1 WHERE name = ?
`);

export const removeUserAdmin = db.prepare(`
  UPDATE users SET is_admin = 0 WHERE name = ?
`);

// Delete all users and predictions
export const clearAllUsers = db.prepare(`
  DELETE FROM users
`);

// Admin-specific prediction operations
export const updatePrediction = db.prepare(`
  UPDATE predictions SET prediction = ? WHERE user_id = ? AND match_id = ?
`);

export const deletePrediction = db.prepare(`
  DELETE FROM predictions WHERE user_id = ? AND match_id = ?
`);

export const upsertPrediction = db.prepare(`
  INSERT INTO predictions (user_id, match_id, prediction)
  VALUES (?, ?, ?)
  ON CONFLICT(user_id, match_id) DO UPDATE SET
    prediction = excluded.prediction
`);

// Reaction operations
export const addReaction = db.prepare(`
  INSERT OR REPLACE INTO reactions (user_id, target_user_id, match_id, reaction)
  VALUES (?, ?, ?, ?)
`);

export const removeReaction = db.prepare(`
  DELETE FROM reactions WHERE user_id = ? AND target_user_id = ? AND match_id = ?
`);

export const getReactionsByMatch = db.prepare(`
  SELECT r.*, u.name as user_name 
  FROM reactions r
  JOIN users u ON r.user_id = u.id
  WHERE r.match_id = ?
`);

export const getAllReactions = db.prepare(`
  SELECT r.*, u.name as user_name, tu.name as target_user_name
  FROM reactions r
  JOIN users u ON r.user_id = u.id
  JOIN users tu ON r.target_user_id = tu.id
`);

export const clearAllReactions = db.prepare(`
  DELETE FROM reactions
`);

// Player boost operations
export const setPlayerBoost = db.prepare(`
  INSERT OR REPLACE INTO player_boosts (user_id, match_id)
  VALUES (?, ?)
`);

export const removePlayerBoost = db.prepare(`
  DELETE FROM player_boosts WHERE user_id = ?
`);

export const getPlayerBoost = db.prepare(`
  SELECT * FROM player_boosts WHERE user_id = ?
`);

export const getAllPlayerBoosts = db.prepare(`
  SELECT pb.*, u.name as user_name
  FROM player_boosts pb
  JOIN users u ON pb.user_id = u.id
`);

export const clearAllPlayerBoosts = db.prepare(`
  DELETE FROM player_boosts
`);

export const resetDatabase = () => {
  // Clear all data
  clearAllUsers.run();
  clearAllPredictions.run();
  clearAllReactions.run();
  clearAllPlayerBoosts.run();
  console.log('🗑️ All users, predictions, reactions and boosts cleared');
};

export default db;
